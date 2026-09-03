@echo off
cd /d "%~dp0"
if not exist .env.production copy .env.production.example .env.production >nul
echo Starting RESEMBLE v39 with Docker...
docker compose up --build
