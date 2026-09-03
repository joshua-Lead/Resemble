@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18+ is required to run RESEMBLE.
  pause
  exit /b 1
)
set NODE_ENV=production
if not exist .env (
  echo WARNING: .env not found. Copy .env.production.example to .env and fill it before live use.
)
node server.js
endlocal
