"""
╔══════════════════════════════════════════════════════════════════════╗
║         ADVANCED ML PIPELINE — ALL 6 ALGORITHMS                     ║
║                                                                      ║
║  Dataset : Urban Micro-Stress Indicators (2,160 rows, 8 features)    ║
║  Target  : Stress Index — High / Med / Low  (3-class)                ║
║                                                                      ║
║  Features:                                                           ║
║   crosswalk_wait_sec, litter_density_per_100m2, midnight_noise_db,  ║
║   atm_queue_length, vacant_storefronts_pct,                          ║
║   dog_walk_freq_per_hr, graffiti_turnover_days                       ║
╚══════════════════════════════════════════════════════════════════════╝
"""

import os
import time
import warnings
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import joblib

from sklearn.model_selection  import train_test_split, cross_val_score
from sklearn.preprocessing    import StandardScaler, LabelEncoder
from sklearn.metrics          import (accuracy_score, classification_report,
                                      confusion_matrix, ConfusionMatrixDisplay)
from sklearn.svm              import SVC
from sklearn.cluster          import KMeans
from sklearn.tree             import DecisionTreeClassifier, export_text
from sklearn.linear_model     import LogisticRegression

warnings.filterwarnings("ignore")
np.random.seed(42)

# ═══════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════

DATASET_CSV = "urban_micro_stress_dataset.csv"

SELECTED_FEATURES = [
    "crosswalk_wait_sec",
    "litter_density_per_100m2",
    "midnight_noise_db",
    "atm_queue_length",
    "vacant_storefronts_pct",
    "dog_walk_freq_per_hr",
    "graffiti_turnover_days",
]

TARGET_COL    = "stress_index"          # values: High / Med / Low
CLASS_LABELS  = ["Low", "Med", "High"]  # ordered Low→High for display

# Ordinal encoding for target (Low=0, Med=1, High=2)
STRESS_MAP    = {"Low": 0, "Med": 1, "High": 2}
STRESS_LABELS = {0: "Low", 1: "Med", 2: "High"}

# ═══════════════════════════════════════════════════════════════════════
# SECTION 1 — LOAD & PREPARE DATASET
# ═══════════════════════════════════════════════════════════════════════

def load_dataset(csv_path: str) -> pd.DataFrame:
    print(f"  [1/7] Loading dataset from '{csv_path}'...")

    if not os.path.exists(csv_path):
        raise FileNotFoundError(
            f"\n  ✗ File not found: '{csv_path}'\n"
            f"  → Place the generated urban_micro_stress_dataset.csv in the same folder.\n"
        )

    df = pd.read_csv(csv_path)
    print(f"      ✓ Raw dataset loaded: {len(df)} rows × {len(df.columns)} columns")

    needed = SELECTED_FEATURES + [TARGET_COL]
    missing = [c for c in needed if c not in df.columns]
    if missing:
        raise ValueError(f"  ✗ Missing columns: {missing}")

    # Drop non-feature columns (month, day, neighborhood are metadata)
    df = df[SELECTED_FEATURES + [TARGET_COL]].copy()
    df.dropna(inplace=True)

    # Encode target
    df[TARGET_COL] = df[TARGET_COL].map(STRESS_MAP)

    counts = df[TARGET_COL].value_counts().sort_index()
    for code, label in STRESS_LABELS.items():
        n = counts.get(code, 0)
        print(f"      ✓ {label:4s}: {n} rows ({n/len(df)*100:.1f}%)")

    print(f"      ✓ Total rows: {len(df)} | Features: {len(SELECTED_FEATURES)} | Classes: 3 (Low/Med/High)")
    return df


# ═══════════════════════════════════════════════════════════════════════
# SECTION 2 — PREPROCESSING
# ═══════════════════════════════════════════════════════════════════════

def preprocess(df: pd.DataFrame):
    print("\n  [2/7] Preprocessing data...")

    X = df[SELECTED_FEATURES].values
    y = df[TARGET_COL].values

    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler  = StandardScaler()
    X_train = scaler.fit_transform(X_train_raw)
    X_test  = scaler.transform(X_test_raw)

    print(f"      ✓ Train: {X_train.shape[0]} samples | Test: {X_test.shape[0]} samples")
    print(f"      ✓ Features: {X_train.shape[1]}")
    return X_train, X_test, y_train, y_test, scaler, SELECTED_FEATURES


# ═══════════════════════════════════════════════════════════════════════
# SECTION 3 — MODEL 1: LOCALLY WEIGHTED REGRESSION (LWR)
# ═══════════════════════════════════════════════════════════════════════

class LocallyWeightedRegression:
    """
    Custom Locally Weighted Regression (lazy learner) — adapted for
    3-class output by rounding the continuous prediction to 0/1/2.

    NOTE: LWR has no fit() method. Both X_train and y_train must be
    passed to predict(). Cannot be serialised as a standalone model.
    """

    def __init__(self, tau: float = 0.8, max_train_samples: int = 1000):
        self.tau = tau
        self.max_train_samples = max_train_samples

    def _gaussian_weights(self, X_train, x_query):
        diff      = X_train - x_query
        distances = np.sum(diff ** 2, axis=1)
        return np.exp(-distances / (2 * self.tau ** 2))

    def _add_bias(self, X):
        return np.c_[np.ones((X.shape[0], 1)), X]

    def predict(self, X_train, y_train, X_test):
        if len(X_train) > self.max_train_samples:
            idx     = np.random.choice(len(X_train), self.max_train_samples, replace=False)
            X_train = X_train[idx]
            y_train = y_train[idx]

        X_train_b = self._add_bias(X_train)
        X_test_b  = self._add_bias(X_test)
        preds     = []

        for i in range(X_test.shape[0]):
            w     = self._gaussian_weights(X_train, X_test[i])
            W     = np.diag(w)
            theta = np.linalg.pinv(X_train_b.T @ W @ X_train_b) @ (X_train_b.T @ W @ y_train)
            raw   = X_test_b[i] @ theta
            # Clip and round to nearest class (0=Low, 1=Med, 2=High)
            preds.append(int(np.clip(np.round(raw), 0, 2)))

        return np.array(preds)


# ═══════════════════════════════════════════════════════════════════════
# SECTION 4 — MODEL 2: WEIGHTED REGRESSION (distance-weighted KNN style)
# ═══════════════════════════════════════════════════════════════════════

class WeightedRegression:
    """
    Distance-weighted nearest-neighbour regression adapted for
    multi-class by predicting weighted-average class and rounding.
    """

    def __init__(self, strategy: str = "distance", k: int = 15):
        self.strategy = strategy
        self.k        = k
        self.X_train  = None
        self.y_train  = None

    def fit(self, X, y):
        self.X_train = X
        self.y_train = y
        return self

    def predict(self, X_test):
        preds = []
        for x in X_test:
            dists = np.sqrt(np.sum((self.X_train - x) ** 2, axis=1))
            k_idx = np.argsort(dists)[:self.k]
            k_dist = dists[k_idx]
            k_labels = self.y_train[k_idx]

            if self.strategy == "distance":
                weights = 1.0 / (k_dist + 1e-8)
            else:
                weights = np.ones(self.k)

            weights /= weights.sum()
            raw = np.dot(weights, k_labels)
            preds.append(int(np.clip(np.round(raw), 0, 2)))
        return np.array(preds)

    def score(self, X, y):
        return accuracy_score(y, self.predict(X))


# ═══════════════════════════════════════════════════════════════════════
# SECTION 5 — MODEL 3: SVM CLASSIFIER
# ═══════════════════════════════════════════════════════════════════════

class SVMClassifier:
    """
    SVM with auto kernel selection (RBF, Linear, Poly).
    Uses 5-fold CV to pick the best kernel — natively supports multi-class.
    """

    def __init__(self):
        self.best_kernel   = None
        self.best_model    = None
        self.kernel_scores = {}

    def fit_best(self, X_train, y_train, X_test, y_test):
        for kernel in ["rbf", "linear", "poly"]:
            clf = SVC(kernel=kernel, C=1.0, gamma="scale",
                      probability=True, random_state=42, decision_function_shape="ovr")
            cv  = cross_val_score(clf, X_train, y_train, cv=5, scoring="accuracy")
            self.kernel_scores[kernel] = cv.mean()
            print(f"        SVM {kernel:6s} CV accuracy: {cv.mean()*100:.2f}%")

        self.best_kernel = max(self.kernel_scores, key=self.kernel_scores.get)
        self.best_model  = SVC(
            kernel=self.best_kernel, C=1.0, gamma="scale",
            probability=True, random_state=42, decision_function_shape="ovr"
        )
        self.best_model.fit(X_train, y_train)
        return self

    def predict(self, X):
        return self.best_model.predict(X)

    def score(self, X, y):
        return accuracy_score(y, self.predict(X))


# ═══════════════════════════════════════════════════════════════════════
# SECTION 6 — MODEL 4: CLUSTERING (KMeans)
# ═══════════════════════════════════════════════════════════════════════

class ClusteringClassifier:
    """
    KMeans clustering adapted for 3-class classification.
    Each cluster is assigned the majority class of its training members.
    """

    def __init__(self, n_clusters: int = 12):
        self.n_clusters    = n_clusters
        self.kmeans        = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        self.cluster_label = {}

    def fit(self, X, y):
        self.kmeans.fit(X)
        cluster_ids = self.kmeans.labels_
        for c in range(self.n_clusters):
            mask = (cluster_ids == c)
            if mask.sum() > 0:
                vals, counts = np.unique(y[mask], return_counts=True)
                self.cluster_label[c] = int(vals[np.argmax(counts)])
            else:
                self.cluster_label[c] = 1  # default Med
        return self

    def predict(self, X):
        cluster_ids = self.kmeans.predict(X)
        return np.array([self.cluster_label[c] for c in cluster_ids])

    def score(self, X, y):
        return accuracy_score(y, self.predict(X))


# ═══════════════════════════════════════════════════════════════════════
# SECTION 7 — MODEL 5: DECISION TREE RULE LEARNING
# ═══════════════════════════════════════════════════════════════════════

class DecisionTreeRuleLearner:
    """Decision Tree with Gini criterion — multi-class, extracts IF-THEN rules."""

    def __init__(self, max_depth: int = 6):
        self.tree = DecisionTreeClassifier(
            max_depth=max_depth,
            min_samples_split=20,
            min_samples_leaf=10,
            criterion="gini",
            random_state=42
        )
        self.feature_names = None

    def fit(self, X, y, feature_names):
        self.feature_names = list(feature_names)
        self.tree.fit(X, y)
        return self

    def predict(self, X):
        return self.tree.predict(X)

    def score(self, X, y):
        return accuracy_score(y, self.predict(X))

    def get_rules(self):
        return export_text(self.tree, feature_names=self.feature_names)

    def feature_importance_dict(self):
        return dict(zip(self.feature_names, self.tree.feature_importances_))


# ═══════════════════════════════════════════════════════════════════════
# SECTION 8 — MODEL 6: RULE-BASED CLASSIFIER (RIPPER-style)
# ═══════════════════════════════════════════════════════════════════════

class RuleBasedClassifier:
    """
    Extracts IF-THEN rules from a shallow decision tree (RIPPER-style).
    First matching rule wins; default = majority class.
    Uses tree_clf.classes_[argmax] for safe multi-class label mapping.
    """

    def __init__(self):
        self.rules         = []
        self.default       = 1   # default Med
        self.feature_names = None

    def _extract_rules(self, tree_clf, feature_names):
        t     = tree_clf.tree_
        rules = []

        def recurse(node, conditions):
            if t.feature[node] == -2:
                leaf_class = tree_clf.classes_[np.argmax(t.value[node])]
                rules.append((list(conditions), int(leaf_class)))
                return
            feat = t.feature[node]
            thr  = t.threshold[node]
            recurse(t.children_left[node],  conditions + [(feat, thr, "left")])
            recurse(t.children_right[node], conditions + [(feat, thr, "right")])

        recurse(0, [])
        return rules

    def fit(self, X, y, feature_names):
        self.feature_names = list(feature_names)
        base = DecisionTreeClassifier(max_depth=4, min_samples_leaf=15, random_state=42)
        base.fit(X, y)

        raw_rules = self._extract_rules(base, feature_names)
        scored    = []
        for conditions, label in raw_rules:
            mask = np.ones(X.shape[0], dtype=bool)
            for feat, thr, direction in conditions:
                if direction == "left":  mask &= X[:, feat] <= thr
                else:                    mask &= X[:, feat] > thr
            n_covered = mask.sum()
            if n_covered >= 10:
                n_correct  = (y[mask] == label).sum()
                confidence = n_correct / n_covered
                scored.append((confidence, n_covered, conditions, label))

        scored.sort(key=lambda x: (-x[0], -x[1]))
        self.rules   = [(cond, lbl) for _, _, cond, lbl in scored[:20]]
        vals, counts = np.unique(y, return_counts=True)
        self.default = int(vals[np.argmax(counts)])
        return self

    def _apply_rule(self, x, conditions):
        for feat, thr, direction in conditions:
            if direction == "left"  and x[feat] > thr:  return False
            if direction == "right" and x[feat] <= thr: return False
        return True

    def predict(self, X):
        preds = []
        for x in X:
            matched = False
            for conditions, label in self.rules:
                if self._apply_rule(x, conditions):
                    preds.append(label)
                    matched = True
                    break
            if not matched:
                preds.append(self.default)
        return np.array(preds)

    def score(self, X, y):
        return accuracy_score(y, self.predict(X))

    def print_top_rules(self, n=5):
        label_name = lambda l: STRESS_LABELS.get(l, str(l))
        print(f"\n  ── Top {n} Rules (Rule-Based Classifier) ──")
        for i, (conditions, label) in enumerate(self.rules[:n]):
            parts = []
            for feat, thr, direction in conditions:
                fname = self.feature_names[feat] if self.feature_names else f"F{feat}"
                op    = "<=" if direction == "left" else ">"
                parts.append(f"{fname} {op} {thr:.2f}")
            print(f"  Rule {i+1}: IF {' AND '.join(parts)} → {label_name(label)}")


# ═══════════════════════════════════════════════════════════════════════
# SECTION 9 — TRAINING PIPELINE
# ═══════════════════════════════════════════════════════════════════════

_LWR_KEY = "Locally Weighted\nRegression"

def train_all_models(X_train, X_test, y_train, y_test, feature_names):
    print("\n  [3/7] Training all 6 models...\n")
    report = {}

    # Model 1: LWR
    print("  ▶ Model 1/6 : Locally Weighted Regression (LWR)")
    t0        = time.time()
    lwr       = LocallyWeightedRegression(tau=0.8, max_train_samples=1000)
    preds_lwr = lwr.predict(X_train, y_train, X_test)
    acc_lwr   = accuracy_score(y_test, preds_lwr)
    t1        = time.time()
    print(f"      ✓ Accuracy: {acc_lwr*100:.2f}%  |  Time: {t1-t0:.1f}s")
    report[_LWR_KEY] = {
        "accuracy": acc_lwr, "time": round(t1-t0, 2),
        "model": lwr, "preds": preds_lwr,
        "lwr_train_data": (X_train, y_train),
    }

    # Model 2: Weighted Regression
    print("  ▶ Model 2/6 : Weighted Regression (distance-weighted KNN)")
    t0       = time.time()
    wr       = WeightedRegression(strategy="distance", k=15)
    wr.fit(X_train, y_train)
    preds_wr = wr.predict(X_test)
    acc_wr   = accuracy_score(y_test, preds_wr)
    t1       = time.time()
    print(f"      ✓ Accuracy: {acc_wr*100:.2f}%  |  Time: {t1-t0:.2f}s")
    report["Weighted\nRegression"] = {"accuracy": acc_wr, "time": round(t1-t0, 2), "model": wr, "preds": preds_wr}

    # Model 3: SVM
    print("  ▶ Model 3/6 : SVM Classifier (auto kernel selection)")
    t0        = time.time()
    svm       = SVMClassifier()
    svm.fit_best(X_train, y_train, X_test, y_test)
    preds_svm = svm.predict(X_test)
    acc_svm   = svm.score(X_test, y_test)
    t1        = time.time()
    print(f"      ✓ Best kernel: {svm.best_kernel} | Accuracy: {acc_svm*100:.2f}%  |  Time: {t1-t0:.2f}s")
    report["SVM\nClassifier"] = {"accuracy": acc_svm, "time": round(t1-t0, 2), "model": svm, "preds": preds_svm}

    # Model 4: Clustering
    print("  ▶ Model 4/6 : Clustering (KMeans → majority label)")
    t0         = time.time()
    clst       = ClusteringClassifier(n_clusters=12)
    clst.fit(X_train, y_train)
    preds_clst = clst.predict(X_test)
    acc_clst   = clst.score(X_test, y_test)
    t1         = time.time()
    print(f"      ✓ Accuracy: {acc_clst*100:.2f}%  |  Time: {t1-t0:.2f}s")
    report["Clustering\n(KMeans)"] = {"accuracy": acc_clst, "time": round(t1-t0, 2), "model": clst, "preds": preds_clst}

    # Model 5: Decision Tree
    print("  ▶ Model 5/6 : Decision Tree Rule Learning")
    t0       = time.time()
    dt       = DecisionTreeRuleLearner(max_depth=6)
    dt.fit(X_train, y_train, feature_names)
    preds_dt = dt.predict(X_test)
    acc_dt   = dt.score(X_test, y_test)
    t1       = time.time()
    print(f"      ✓ Accuracy: {acc_dt*100:.2f}%  |  Time: {t1-t0:.2f}s")
    report["Decision Tree\nRule Learning"] = {"accuracy": acc_dt, "time": round(t1-t0, 2), "model": dt, "preds": preds_dt}

    # Model 6: Rule-Based
    print("  ▶ Model 6/6 : Rule-Based Classifier (RIPPER-style)")
    t0        = time.time()
    rbc       = RuleBasedClassifier()
    rbc.fit(X_train, y_train, feature_names)
    preds_rbc = rbc.predict(X_test)
    acc_rbc   = rbc.score(X_test, y_test)
    t1        = time.time()
    print(f"      ✓ Accuracy: {acc_rbc*100:.2f}%  |  Time: {t1-t0:.2f}s")
    rbc.print_top_rules(n=5)
    report["Rule-Based\nClassifier"] = {"accuracy": acc_rbc, "time": round(t1-t0, 2), "model": rbc, "preds": preds_rbc}

    return report


# ═══════════════════════════════════════════════════════════════════════
# SECTION 10 — PRINT DECISION TREE RULES
# ═══════════════════════════════════════════════════════════════════════

def print_decision_rules(report):
    dt_key = "Decision Tree\nRule Learning"
    if dt_key in report:
        print("\n  [5/7] Decision Tree Rules (first 40 lines):\n")
        rules_text = report[dt_key]["model"].get_rules()
        for line in rules_text.split("\n")[:40]:
            print("  " + line)
        print("  ... (truncated)")


# ═══════════════════════════════════════════════════════════════════════
# SECTION 11 — SAVE BEST MODEL
#   Selection: highest accuracy; tie-break = fastest time.
#   LWR excluded (lazy learner — no standalone predict API).
# ═══════════════════════════════════════════════════════════════════════

def save_best_model(report, scaler):
    print("\n  [7/7] Saving best model...")

    eligible = {k: v for k, v in report.items() if k != _LWR_KEY}
    if not eligible:
        print("      ⚠ No eligible models to save.")
        return None, None

    # Primary: highest accuracy | Tie-break: lowest training time
    best_name = max(eligible, key=lambda k: (eligible[k]["accuracy"], -eligible[k]["time"]))
    best_data = eligible[best_name]

    if "Locally Weighted" in best_name:
        raise RuntimeError("LWR slipped through the eligibility filter.")

    bundle = {
        "model_name"   : best_name.replace("\n", " "),
        "accuracy"     : best_data["accuracy"],
        "model"        : best_data["model"],
        "scaler"       : scaler,
        "features"     : SELECTED_FEATURES,
        "labels"       : STRESS_LABELS,          # {0:"Low", 1:"Med", 2:"High"}
        "dataset"      : "Urban Micro-Stress Indicators",
        "target"       : TARGET_COL,
        "lwr_excluded" : "LWR excluded — lazy learner, no standalone predict(X) API.",
    }

    joblib.dump(bundle, "best_model.pkl")
    print(f"      ✓ Best model  : {best_name.replace(chr(10), ' ')}")
    print(f"      ✓ Accuracy    : {best_data['accuracy']*100:.2f}%")
    print(f"      ✓ Saved to    : best_model.pkl")
    print(f"      ℹ LWR excluded from selection (lazy learner).")
    return best_name, best_data["accuracy"]


# ═══════════════════════════════════════════════════════════════════════
# SECTION 12 — FINAL REPORT
# ═══════════════════════════════════════════════════════════════════════

def print_final_report(report):
    print("\n" + "═" * 65)
    print("  FINAL MODEL PERFORMANCE REPORT — Urban Micro-Stress Dataset")
    print("═" * 65)
    print(f"  {'Algorithm':<32} {'Accuracy':>10}  {'Time':>8}  {'Saveable':>8}")
    print("  " + "─" * 65)
    sorted_items = sorted(report.items(), key=lambda x: (-x[1]["accuracy"], x[1]["time"]))
    for i, (name, data) in enumerate(sorted_items):
        star     = " ← BEST ★" if i == 0 else ""
        saveable = "No (LWR)" if name == _LWR_KEY else "Yes"
        print(f"  {name.replace(chr(10), ' '):<32} {data['accuracy']*100:>9.2f}%  {data['time']:>6.2f}s  {saveable:>8}{star}")
    print("═" * 65)


# ═══════════════════════════════════════════════════════════════════════
# SECTION 13 — VISUALIZATION DASHBOARD
# ═══════════════════════════════════════════════════════════════════════

def visualize_results(report, y_test, feature_names):
    print("\n  [6/7] Generating visualizations...")

    names    = list(report.keys())
    accs     = [v["accuracy"] * 100 for v in report.values()]
    times    = [v["time"] for v in report.values()]

    sorted_items = sorted(report.items(), key=lambda x: (-x[1]["accuracy"], x[1]["time"]))
    best_name    = sorted_items[0][0]
    best_idx     = names.index(best_name)
    colors       = ["#4CAF50" if i == best_idx else "#5B9BD5" for i in range(len(names))]

    fig = plt.figure(figsize=(20, 15))
    fig.patch.set_facecolor("#F7F9FC")
    gs  = gridspec.GridSpec(3, 3, figure=fig, hspace=0.58, wspace=0.42)

    # ── Accuracy bar chart ──
    ax1  = fig.add_subplot(gs[0, :2])
    bars = ax1.bar(names, accs, color=colors, edgecolor="white", linewidth=1.2, zorder=3)
    ax1.set_ylim(0, 115)
    ax1.set_ylabel("Accuracy (%)", fontsize=12)
    ax1.set_title("Model Accuracy Comparison — 6 Algorithms on Urban Micro-Stress Dataset",
                  fontsize=13, fontweight="bold")
    ax1.axhline(y=max(accs), color="#4CAF50", linestyle="--", linewidth=1.2, alpha=0.6)
    ax1.grid(axis="y", alpha=0.4, zorder=0)
    ax1.set_facecolor("#FAFBFC")
    for bar, acc in zip(bars, accs):
        ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1.5,
                 f"{acc:.1f}%", ha="center", va="bottom", fontsize=10, fontweight="bold")
    ax1.text(0.98, 0.95, f"★ Best: {best_name.replace(chr(10), ' ')}",
             transform=ax1.transAxes, ha="right", va="top",
             fontsize=10, color="#4CAF50", fontweight="bold")
    ax1.tick_params(axis="x", labelsize=9)

    # ── Training time ──
    ax2 = fig.add_subplot(gs[0, 2])
    ax2.barh(names, times, color="#FF8C00", alpha=0.85, edgecolor="white")
    ax2.set_xlabel("Time (seconds)", fontsize=11)
    ax2.set_title("Training Time", fontsize=12, fontweight="bold")
    ax2.set_facecolor("#FAFBFC")
    ax2.grid(axis="x", alpha=0.4)
    ax2.tick_params(axis="y", labelsize=8)

    # ── Confusion matrices for top 3 models ──
    disp_labels = [STRESS_LABELS[i] for i in sorted(STRESS_LABELS)]
    for idx, (name, data) in enumerate(sorted_items[:3]):
        ax = fig.add_subplot(gs[1, idx])
        cm   = confusion_matrix(y_test, data["preds"], labels=[0, 1, 2])
        disp = ConfusionMatrixDisplay(cm, display_labels=disp_labels)
        disp.plot(ax=ax, colorbar=False, cmap="Blues")
        ax.set_title(f"{name.replace(chr(10), ' ')}\nAcc: {data['accuracy']*100:.1f}%",
                     fontsize=10, fontweight="bold")
        ax.set_xlabel("Predicted", fontsize=9)
        ax.set_ylabel("Actual", fontsize=9)

    # ── Feature importances (Decision Tree) ──
    dt_key = "Decision Tree\nRule Learning"
    if dt_key in report:
        ax6 = fig.add_subplot(gs[2, :2])
        imp  = report[dt_key]["model"].feature_importance_dict()
        sorted_pairs = sorted(zip(imp.values(), imp.keys()), reverse=True)
        feat_vals_s, feat_names_s = zip(*sorted_pairs)
        colors_fi = plt.cm.RdYlGn(np.linspace(0.3, 0.9, len(feat_names_s)))
        bars_fi   = ax6.barh(feat_names_s, feat_vals_s, color=colors_fi, edgecolor="white")
        ax6.set_title("Feature Importances — Decision Tree (Urban Micro-Stress Features)",
                      fontsize=12, fontweight="bold")
        ax6.set_xlabel("Importance Score", fontsize=11)
        ax6.set_facecolor("#FAFBFC")
        ax6.grid(axis="x", alpha=0.4)
        for bar, val in zip(bars_fi, feat_vals_s):
            ax6.text(bar.get_width() + 0.002, bar.get_y() + bar.get_height()/2,
                     f"{val:.3f}", va="center", fontsize=9)

    # ── Summary table ──
    ax7 = fig.add_subplot(gs[2, 2])
    ax7.axis("off")
    lines = [("Algorithm", "Accuracy", "Time(s)"), ("─"*14, "─"*8, "─"*6)]
    for name, data in sorted_items:
        lines.append((name.replace("\n", " "), f"{data['accuracy']*100:.1f}%", f"{data['time']:.2f}s"))
    table_text = "\n".join(f"{a:<28} {b:<10} {c}" for a, b, c in lines)
    ax7.text(0.05, 0.95, "Summary Table", transform=ax7.transAxes,
             fontsize=11, fontweight="bold", va="top")
    ax7.text(0.05, 0.82, table_text, transform=ax7.transAxes, fontsize=8.5, va="top",
             fontfamily="monospace",
             bbox=dict(boxstyle="round,pad=0.4", facecolor="#EEF2FF", alpha=0.8))

    plt.suptitle(
        "Urban Micro-Stress Indicators (Chennai, 2,160 rows) — ML Model Comparison\n"
        "Target: stress_index → Low / Med / High  |  7 environmental features",
        fontsize=13, fontweight="bold", y=1.01, color="#1A237E"
    )

    out_path = "ml_results_dashboard.png"
    plt.savefig(out_path, dpi=150, bbox_inches="tight", facecolor="#F7F9FC")
    print(f"      ✓ Dashboard saved → {out_path}")
    plt.show()


# ═══════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════

def main():
    print("\n" + "═" * 65)
    print("  ML PIPELINE — Urban Micro-Stress Indicator Prediction")
    print(f"  Dataset  : {DATASET_CSV}")
    print(f"  Features : {len(SELECTED_FEATURES)} environmental indicators")
    print(f"  Target   : stress_index (Low / Med / High)")
    print("═" * 65 + "\n")

    df = load_dataset(DATASET_CSV)
    X_train, X_test, y_train, y_test, scaler, feature_names = preprocess(df)
    report = train_all_models(X_train, X_test, y_train, y_test, feature_names)

    print("\n  [4/7] Classification Reports (Top 3 Models):\n")
    sorted_items = sorted(report.items(), key=lambda x: (-x[1]["accuracy"], x[1]["time"]))
    for name, data in sorted_items[:3]:
        print(f"  ── {name.replace(chr(10), ' ')} ──")
        print(classification_report(
            y_test, data["preds"],
            target_names=[STRESS_LABELS[i] for i in sorted(STRESS_LABELS)],
            digits=3
        ))

    print_decision_rules(report)
    print_final_report(report)
    save_best_model(report, scaler)
    visualize_results(report, y_test, feature_names)

    print("\n  All done! Place 'best_model.pkl' alongside your app.py to launch the web app.\n")


if __name__ == "__main__":
    main()
