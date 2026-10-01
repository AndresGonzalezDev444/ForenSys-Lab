@echo off
title ForenSys Lab V1
cd /d "%~dp0"
echo.
echo  =============================================
echo      ForenSys Lab V1 - Iniciando...
echo  =============================================
echo.
call venv\Scripts\python main.py
pause