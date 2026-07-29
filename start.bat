@echo off
setlocal

rem Resolve the repo root as the directory this script lives in (strip trailing backslash).
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
cd /d "%ROOT%"

echo ============================================
echo  Life Manager
echo ============================================
echo.

rem --- First-time setup: install dependencies (skip if already installed) ---
if not exist "%ROOT%\node_modules\.package-lock.json" (
    echo [1/2] Installing dependencies, this only happens once...
    call npm install
    if errorlevel 1 (
        echo.
        echo npm install failed. Fix the error above and re-run this script.
        pause
        exit /b 1
    )
) else (
    echo [1/2] Dependencies already installed, skipping npm install.
)

rem --- First-time setup: create and seed the database (skip if it already exists) ---
set "DB_FILE=%ROOT%\packages\backend\data\life-manager.db"
if not exist "%DB_FILE%" (
    echo [2/2] Setting up the database, this only happens once...
    call npm run db:migrate --workspace=@life-manager/backend
    if errorlevel 1 (
        echo.
        echo Database migration failed. Fix the error above and re-run this script.
        pause
        exit /b 1
    )
    call npm run db:seed --workspace=@life-manager/backend
    if errorlevel 1 (
        echo.
        echo Database seed failed. Fix the error above and re-run this script.
        pause
        exit /b 1
    )
) else (
    echo [2/2] Database already exists, skipping migrate/seed.
)

echo.
echo Starting backend and frontend in separate windows...
start "Life Manager - Backend"  /D "%ROOT%\packages\backend"  cmd /k npm run dev
start "Life Manager - Frontend" /D "%ROOT%\packages\frontend" cmd /k npm run dev

echo.
echo Backend:  http://127.0.0.1:4000
echo Frontend: http://127.0.0.1:5173
echo.
echo Once both windows report they're ready, open http://127.0.0.1:5173 in your browser.
echo Close this window any time - the two server windows will keep running.
echo To stop everything, close the "Life Manager - Backend" and "Life Manager - Frontend" windows.
echo.
pause
