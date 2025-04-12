@echo off
echo Starting StockVision Application...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js version 14 or higher.
    exit /b 1
)

REM Check Node.js version
for /f "tokens=2 delims=v" %%a in ('node -v') do set NODE_VERSION=%%a
for /f "tokens=1 delims=." %%a in ("%NODE_VERSION%") do set NODE_MAJOR_VERSION=%%a
if %NODE_MAJOR_VERSION% LSS 14 (
    echo Node.js version 14 or higher is required. Your version is: %NODE_VERSION%
    exit /b 1
)

echo Installing backend dependencies...
cd backend
call npm install

echo Starting backend server...
start /B npm start

echo Waiting for backend server to start...
timeout /T 5 /NOBREAK >nul

echo Opening StockVision Dashboard in your browser...
start "" "../dashboard.html"

echo.
echo StockVision is now running!
echo The backend server is running in a separate window.
echo To stop the application, close both this window and the Node.js server window.
echo.

pause 