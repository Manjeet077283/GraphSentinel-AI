# GraphSentinel AI - FastAPI Backend Production Dockerfile
FROM python:3.12-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000

WORKDIR /app

# Install curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend application code and data
COPY backend /app/backend

# Create a non-privileged user and configure permissions
RUN adduser --disabled-password --gecos "" appuser && \
    mkdir -p /app/backend/data && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Healthcheck probe using the live health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Start Uvicorn in production mode (honoring PORT injection from cloud providers)
CMD exec uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}
