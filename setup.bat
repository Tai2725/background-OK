@echo off
echo ========================================
echo BACKGROUND GENERATOR - SETUP SCRIPT
echo ========================================
echo.

echo [1/4] Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo [2/4] Checking Yarn version...
yarn --version
if %errorlevel% neq 0 (
    echo Yarn not found. Installing Yarn globally...
    npm install -g yarn
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Yarn
        pause
        exit /b 1
    )
)

echo.
echo [3/4] Installing dependencies with Yarn...
yarn install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies with Yarn
    echo Trying with npm...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies with npm
        pause
        exit /b 1
    )
)

echo.
echo [4/4] Verifying installation...
if exist "node_modules" (
    echo ✅ Dependencies installed successfully!
) else (
    echo ❌ Dependencies installation failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo SETUP COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Next steps:
echo 1. Complete .env.local configuration:
echo    - Add SUPABASE_SERVICE_ROLE_KEY
echo    - Add RUNWARE_API_KEY  
echo    - Add NEXT_PUBLIC_GOOGLE_CLIENT_ID
echo.
echo 2. Run the development server:
echo    yarn dev
echo.
echo 3. Open http://localhost:3032 in your browser
echo.
pause
