@echo off
cd /d "%~dp0"
if not exist .env.production (
  copy /Y .env.production.example .env.production >nul
  echo Created .env.production. Edit it before using live payments.
)
docker compose up --build
pause
