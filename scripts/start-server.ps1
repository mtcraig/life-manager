# Launches `npm run dev` in a minimized console window and records its PID.
#
# WINDOWTITLE-based taskkill was tried first and is unreliable here: once
# npm/tsx/vite attach to the console, something downstream resets the title
# `start "Title" ...` set, so `taskkill /FI "WINDOWTITLE eq ..."` can't find
# the window later. A PID captured directly from Start-Process doesn't have
# that problem - `taskkill /T /PID <this>` kills the whole tree regardless of
# what the window title has drifted to.
param(
    [Parameter(Mandatory)][string]$WorkingDirectory,
    [Parameter(Mandatory)][string]$PidFile
)

$process = Start-Process -FilePath 'cmd' -ArgumentList '/k', 'npm run dev' `
    -WorkingDirectory $WorkingDirectory -WindowStyle Minimized -PassThru
Set-Content -Path $PidFile -Value $process.Id -NoNewline
