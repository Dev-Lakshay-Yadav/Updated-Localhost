@echo off
cd /d "C:\Users\Tooth Sketch\Desktop\Updated-Localhost\client"
echo Starting Vite development server...

:: Open browser
start "" http://localhost:5173/

:: Start Vite
call npm run dev

:: Keep console open
pause
