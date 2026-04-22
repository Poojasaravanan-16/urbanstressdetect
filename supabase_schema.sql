-- Urban Stress ML Prediction Logging Table
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS predictions (
    id BIGSERIAL PRIMARY KEY,
    input_features JSONB NOT NULL,
    prediction TEXT NOT NULL CHECK (prediction IN ('Low', 'Med', 'High')),
    model_name TEXT NOT NULL,
    model_accuracy DECIMAL(5,4),
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_predictions_prediction ON predictions(prediction);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_model_name ON predictions(model_name);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_predictions_updated_at 
    BEFORE UPDATE ON predictions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON predictions
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policy to allow read access for anonymous users (for public stats)
CREATE POLICY "Allow read access for anonymous users" ON predictions
    FOR SELECT USING (true);

-- Optional: Create a view for public statistics
CREATE OR REPLACE VIEW prediction_stats AS
SELECT 
    COUNT(*) as total_predictions,
    COUNT(CASE WHEN prediction = 'Low' THEN 1 END) as low_stress_count,
    COUNT(CASE WHEN prediction = 'Med' THEN 1 END) as med_stress_count,
    COUNT(CASE WHEN prediction = 'High' THEN 1 END) as high_stress_count,
    ROUND(AVG(model_accuracy), 4) as avg_model_accuracy,
    DATE_TRUNC('day', created_at) as prediction_date
FROM predictions
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY prediction_date DESC;