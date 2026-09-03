@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18+ is required to run RESEMBLE.
  echo Install Node.js from https://nodejs.org/
  pause
  exit /b 1
)
set NODE_ENV=development
set HOST=127.0.0.1
start "RESEMBLE API" cmd /k "node server.js"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:8787/
endlocal
