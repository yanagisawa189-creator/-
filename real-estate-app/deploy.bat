@echo off
REM Real Estate App Deployment Script for Windows

echo 🚀 Starting Real Estate App Deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Build and start the application
echo 📦 Building Docker images...
docker-compose build
if %errorlevel% neq 0 (
    echo ❌ Failed to build Docker images.
    pause
    exit /b 1
)

echo 🔧 Starting services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Failed to start services.
    pause
    exit /b 1
)

REM Wait for the application to start
echo ⏳ Waiting for application to start...
timeout /t 10 /nobreak >nul

REM Check if the application is running
curl -f http://localhost:8000/docs >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Application is running successfully!
    echo 🌐 Access the application at: http://localhost:8000
    echo 📚 API Documentation: http://localhost:8000/docs
) else (
    echo ❌ Application may not be fully ready yet. Check logs with: docker-compose logs
    echo ℹ️  You can still try accessing http://localhost:8000 in a few minutes.
)

echo 🎉 Deployment completed!
pause