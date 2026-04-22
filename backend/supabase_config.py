import os
from supabase import create_client, Client
from datetime import datetime, timezone
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SupabaseManager:
    def __init__(self):
        self.url = os.getenv('SUPABASE_URL')
        self.key = os.getenv('SUPABASE_ANON_KEY')
        
        if not self.url or not self.key:
            raise ValueError("Supabase URL and ANON_KEY must be set in environment variables")
        
        self.supabase: Client = create_client(self.url, self.key)
    
    def log_prediction(self, input_data, prediction, model_info):
        """Log prediction to Supabase"""
        try:
            data = {
                'input_features': input_data,
                'prediction': prediction,
                'model_name': model_info.get('model_name'),
                'model_accuracy': model_info.get('accuracy'),
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            
            result = self.supabase.table('predictions').insert(data).execute()
            return result.data
        except Exception as e:
            print(f"Error logging prediction: {e}")
            return None
    
    def get_prediction_stats(self):
        """Get prediction statistics"""
        try:
            result = self.supabase.table('predictions').select('prediction').execute()
            predictions = [row['prediction'] for row in result.data]
            
            stats = {
                'total_predictions': len(predictions),
                'low_stress': predictions.count('Low'),
                'med_stress': predictions.count('Med'),
                'high_stress': predictions.count('High')
            }
            return stats
        except Exception as e:
            print(f"Error getting stats: {e}")
            return None
    
    def get_recent_predictions(self, limit=10):
        """Get recent predictions"""
        try:
            result = self.supabase.table('predictions')\
                .select('*')\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()
            return result.data
        except Exception as e:
            print(f"Error getting recent predictions: {e}")
            return []