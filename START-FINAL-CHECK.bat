@echo off
setlocal
cd /d "%~dp0"
python tools\check-production-env.py
if errorlevel 1 pause & exit /b %errorlevel%
node tools\backup-db.js
npm start
