@echo off
title Askio - Backend Server
echo ========================================================
echo  Starting Askio Backend Server (Flask + Groq)
echo ========================================================
cd /d "%~dp0backend"
venv\Scripts\python.exe app.py
pause
