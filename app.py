import tkinter as tk
from tkinter import messagebox
import numpy as np
import joblib
import os

# Required so joblib can deserialise the custom model classes
from ml_pipeline_urban import (SVMClassifier, WeightedRegression,
    ClusteringClassifier, DecisionTreeRuleLearner, RuleBasedClassifier)

# ── Load model bundle ──────────────────────────────────────────────────
if not os.path.exists("best_model.pkl"):
    raise FileNotFoundError("best_model.pkl not found. Run ml_pipeline_urban.py first.")

bundle     = joblib.load("best_model.pkl")
model      = bundle["model"]
scaler     = bundle["scaler"]
labels     = bundle["labels"]       # {0:"Low", 1:"Med", 2:"High"}
model_name = bundle["model_name"]
accuracy   = bundle["accuracy"]

# ── GUI ────────────────────────────────────────────────────────────────
root = tk.Tk()
root.title("Urban Micro-Stress Predictor")
root.resizable(False, False)
root.configure(bg="#F0F4F8")

FIELDS = [
    ("Crosswalk Wait (sec)",        0.0,  120.0, 35.0),
    ("Litter Density (per 100m²)",  0.0,   25.0,  5.0),
    ("Midnight Noise (dB)",        30.0,   90.0, 58.0),
    ("ATM Queue Length",            0.0,   10.0,  2.0),
    ("Vacant Storefronts (%)",      0.0,   50.0, 10.0),
    ("Dog Walk Freq (per hr)",      0.0,    5.0,  1.0),
    ("Graffiti Turnover (days)",    0.0,   60.0, 10.0),
]

COLOR = {"Low": "#2ECC71", "Med": "#F39C12", "High": "#E74C3C"}

# ── Header ─────────────────────────────────────────────────────────────
tk.Label(root, text="🏙  Urban Micro-Stress Index Predictor",
         font=("Helvetica", 15, "bold"), bg="#F0F4F8", fg="#1A237E").grid(
         row=0, column=0, columnspan=2, pady=(18, 2), padx=20)

tk.Label(root, text=f"Model: {model_name}  |  Accuracy: {accuracy*100:.2f}%",
         font=("Helvetica", 9), bg="#F0F4F8", fg="#555").grid(
         row=1, column=0, columnspan=2, pady=(0, 12))

# ── Input fields ───────────────────────────────────────────────────────
entries = []
for i, (label_text, lo, hi, default) in enumerate(FIELDS):
    tk.Label(root, text=label_text, font=("Helvetica", 10),
             bg="#F0F4F8", anchor="w", width=26).grid(
             row=i+2, column=0, padx=(20, 6), pady=5, sticky="w")

    var = tk.StringVar(value=str(default))
    e = tk.Entry(root, textvariable=var, font=("Helvetica", 10),
                 width=12, relief="solid", bd=1)
    e.grid(row=i+2, column=1, padx=(0, 20), pady=5)
    entries.append((var, lo, hi, label_text))

# ── Result label ───────────────────────────────────────────────────────
result_var = tk.StringVar(value="")
result_lbl = tk.Label(root, textvariable=result_var,
                      font=("Helvetica", 13, "bold"),
                      bg="#F0F4F8", width=30)
result_lbl.grid(row=len(FIELDS)+3, column=0, columnspan=2, pady=(10, 4))

# ── Predict function ───────────────────────────────────────────────────
def predict():
    values = []
    for var, lo, hi, name in entries:
        try:
            v = float(var.get())
        except ValueError:
            messagebox.showerror("Invalid Input", f"'{name}' must be a number.")
            return
        if not (lo <= v <= hi):
            messagebox.showerror("Out of Range", f"'{name}' must be between {lo} and {hi}.")
            return
        values.append(v)

    features = np.array([values])
    scaled   = scaler.transform(features)
    pred     = model.predict(scaled)[0]
    label    = labels[int(pred)]

    result_var.set(f"Predicted Stress Index:  {label}")
    result_lbl.config(fg=COLOR[label])

    msgs = {
        "Low":  "✅ Low stress — healthy urban indicators.",
        "Med":  "⚠️  Medium stress — some indicators need attention.",
        "High": "🚨 High stress — multiple stress factors are elevated.",
    }
    info_var.set(msgs[label])

info_var = tk.StringVar(value="")
tk.Label(root, textvariable=info_var, font=("Helvetica", 9),
         bg="#F0F4F8", fg="#444", wraplength=320).grid(
         row=len(FIELDS)+4, column=0, columnspan=2, pady=(0, 6))

# ── Predict button ─────────────────────────────────────────────────────
tk.Button(root, text="🔍  Predict", font=("Helvetica", 11, "bold"),
          bg="#1A237E", fg="white", activebackground="#3949AB",
          relief="flat", padx=20, pady=6, cursor="hand2",
          command=predict).grid(
          row=len(FIELDS)+2, column=0, columnspan=2, pady=(14, 4))

root.mainloop()
