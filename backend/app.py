from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import sys
import os
from supabase_config import SupabaseManager

# Make custom classes resolvable by pickle
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from ml_pipeline_urban import (SVMClassifier, WeightedRegression,
    ClusteringClassifier, DecisionTreeRuleLearner, RuleBasedClassifier)

app = Flask(__name__)
CORS(app)

# Initialize Supabase
try:
    supabase_manager = SupabaseManager()
except Exception as e:
    print(f"Warning: Supabase not configured - {e}")
    supabase_manager = None

bundle     = joblib.load(os.path.join(os.path.dirname(__file__), "..", "best_model.pkl"))
model      = bundle["model"]
scaler     = bundle["scaler"]
labels     = bundle["labels"]       # {0:"Low", 1:"Med", 2:"High"}
model_name = bundle["model_name"]
accuracy   = bundle["accuracy"]

FEATURES = [
    "crosswalk_wait_sec",
    "litter_density_per_100m2",
    "midnight_noise_db",
    "atm_queue_length",
    "vacant_storefronts_pct",
    "dog_walk_freq_per_hr",
    "graffiti_turnover_days",
]

@app.route("/info", methods=["GET"])
def info():
    return jsonify({"model_name": model_name, "accuracy": round(accuracy * 100, 2)})

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    try:
        values = [float(data[f]) for f in FEATURES]
    except (KeyError, TypeError, ValueError) as e:
        return jsonify({"error": f"Invalid input: {e}"}), 400

    features = np.array([values])
    scaled   = scaler.transform(features)
    pred     = int(model.predict(scaled)[0])
    label    = labels[pred]

    messages = {
        "Low":  "Healthy urban indicators — low environmental stress.",
        "Med":  "Some indicators need attention — moderate stress detected.",
        "High": "Multiple stress factors elevated — high urban stress.",
    }

    # Log prediction to Supabase
    if supabase_manager:
        model_info = {"model_name": model_name, "accuracy": accuracy}
        supabase_manager.log_prediction(data, label, model_info)

    return jsonify({"prediction": label, "message": messages[label]})

@app.route("/stats", methods=["GET"])
def get_stats():
    """Get prediction statistics from Supabase"""
    if not supabase_manager:
        return jsonify({"error": "Supabase not configured"}), 500
    
    stats = supabase_manager.get_prediction_stats()
    if stats:
        return jsonify(stats)
    else:
        return jsonify({"error": "Failed to get stats"}), 500

@app.route("/recent", methods=["GET"])
def get_recent():
    """Get recent predictions from Supabase"""
    if not supabase_manager:
        return jsonify({"error": "Supabase not configured"}), 500
    
    limit = request.args.get('limit', 10, type=int)
    recent = supabase_manager.get_recent_predictions(limit)
    return jsonify(recent)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
