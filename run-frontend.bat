@echo off
title AskAnything - Frontend Dev Server
echo ========================================================
echo  Starting AskAnything Frontend Server (Vite + React)
echo ========================================================
cd /d "%~dp0frontend"
npm run dev
pause
