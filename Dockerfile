# 🏙️ Urban Stress ML Model - Production Dockerfile
FROM python:3.9-slim

LABEL maintainer="Urban Stress ML Team"
LABEL description="Urban Micro-Stress Index Predictor API"
LABEL version="1.0"

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY ml_pipeline_urban.py .
COPY best_model.pkl .
COPY urban_micro_stress_dataset.csv .

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/info || exit 1

# Expose port
EXPOSE 5000

# Run the application
CMD ["python", "backend/app.py"]