@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies...
  npm install
)
echo.
echo Starting JM Enterprises...
echo Open http://localhost:3000
echo.
npm run dev
