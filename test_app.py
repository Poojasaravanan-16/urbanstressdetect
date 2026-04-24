import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from backend.app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_info_endpoint(client):
    response = client.get('/info')
    assert response.status_code == 200
    data = response.get_json()
    assert 'model_name' in data
    assert 'accuracy' in data

def test_predict_endpoint(client):
    test_data = {
        "crosswalk_wait_sec": 35.0,
        "litter_density_per_100m2": 5.0,
        "midnight_noise_db": 58.0,
        "atm_queue_length": 2.0,
        "vacant_storefronts_pct": 10.0,
        "dog_walk_freq_per_hr": 1.0,
        "graffiti_turnover_days": 10.0
    }
    response = client.post('/predict', json=test_data)
    assert response.status_code == 200
    data = response.get_json()
    assert 'prediction' in data
    assert 'message' in data