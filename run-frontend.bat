@echo off
title Askio - Frontend Dev Server
echo ========================================================
echo  Starting Askio Frontend Server (Vite + React)
echo ========================================================
cd /d "%~dp0frontend"
npm run dev
pause
