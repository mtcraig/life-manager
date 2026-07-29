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
echo Starting backend and frontend in separate minimized windows...
set "RUNDIR=%ROOT%\.run"
if not exist "%RUNDIR%" mkdir "%RUNDIR%"
rem The Exit button (backend /api/system/shutdown) reads these PID files to
rem know what to taskkill, so it can close the windows this script opens.
set "LIFE_MANAGER_RUN_DIR=%RUNDIR%"

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\start-server.ps1" -WorkingDirectory "%ROOT%\packages\backend"  -PidFile "%RUNDIR%\backend.pid"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\start-server.ps1" -WorkingDirectory "%ROOT%\packages\frontend" -PidFile "%RUNDIR%\frontend.pid"

echo.
echo Backend:  http://127.0.0.1:4000
echo Frontend: http://127.0.0.1:5173
echo.
echo Waiting for the frontend to be ready...
powershell -NoProfile -Command "$deadline = (Get-Date).AddSeconds(60); while ((Get-Date) -lt $deadline) { try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch {} Start-Sleep -Milliseconds 500 }; exit 1"
if errorlevel 1 (
    echo Frontend did not respond within 60 seconds - open http://127.0.0.1:5173 manually.
) else (
    start "" http://127.0.0.1:5173
)

echo.
echo The backend and frontend are running minimized in the taskbar.
echo Use the Exit button in the app sidebar to stop both servers - it closes their windows for you.
echo Close this window any time - the two server windows will keep running.
echo.
pause
