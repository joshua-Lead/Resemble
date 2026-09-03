@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing production dependencies...
  npm install
)
if not exist .env.local (
  copy /Y .env.example .env.local >nul
)
echo Starting RESEMBLE v40...
node --env-file=.env.local server.js
pause
