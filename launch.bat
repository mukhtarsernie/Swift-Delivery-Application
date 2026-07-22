@echo off
cd /d "C:\Users\MUKHTAR\Desktop\MSI Global Ventures\delivery-app"
start /min "" cmd /c "npm.cmd run dev"
echo Server starting on http://localhost:3000
timeout /t 10 >nul
start http://localhost:3000
