@echo off
echo Starting IRIS ML API Service...
echo Using Python: 
python --version

REM Check if requirements are installed
echo Checking for required libraries...
python -c "import flask, tensorflow, cv2" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Missing dependencies. Please run: pip install flask tensorflow opencv-python
    pause
    exit /b
)

echo [SUCCESS] Dependencies found.
echo Server starting on http://localhost:5000
python app.py
pause
