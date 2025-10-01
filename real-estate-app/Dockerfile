# Multi-stage build for production
FROM node:18-alpine AS frontend-build

# Set working directory for frontend
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ ./
RUN npm run build

# Python backend stage
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY app/ ./app/
COPY backend/ ./backend/
COPY *.py ./

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/dist ./static

# Create necessary directories
RUN mkdir -p backend/static/images/{original,suumo,homes,instagram,flyer}

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]