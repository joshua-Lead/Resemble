@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies...
  npm install --omit=dev
)
if not exist .env.local if exist .env.example copy /Y .env.example .env.local >nul
if not exist .env.local (
  echo Missing .env.local. Copy .env.example to .env.local and fill values.
  pause
  exit /b 1
)
echo Starting RESEMBLE v41 production server...
node --env-file=.env.local server.js
pause
