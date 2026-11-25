@echo off
title AskAnything - Backend Server
echo ========================================================
echo  Starting AskAnything Backend Server (Flask + Groq)
echo ========================================================
cd /d "%~dp0backend"
venv\Scripts\python.exe app.py
pause
