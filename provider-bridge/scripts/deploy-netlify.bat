@echo off
setlocal

:: Provider Bridge — Netlify Deployment Script (Windows)
:: ══════════════════════════════════════════════════

echo 🚀 Starting Netlify Deployment...

:: 1. Verification
if not exist "package.json" (
    echo ❌ Error: package.json not found. Run this from the root of provider-bridge.
    exit /b 1
)

:: 2. Install
echo 📦 Installing dependencies...
call npm install

:: 3. Build
echo 🛠️ Building project (TypeScript)...
call npm run build

:: 4. Deploy
echo ☁️ Deploying to Netlify (Production)...
:: Note: Assumes netlify-cli is available and user is logged in
call npx netlify deploy --prod --dir=public

if %ERRORLEVEL% equ 0 (
    echo ✅ Deployment successful!
) else (
    echo ❌ Deployment failed.
    exit /b 1
)

endlocal
