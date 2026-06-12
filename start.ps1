$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$ScriptDir\backend'; npm run dev`""
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$ScriptDir\frontend'; npm run dev`""
Write-Host "Started backend and frontend in separate windows. Open http://localhost:5173 to view the app."
