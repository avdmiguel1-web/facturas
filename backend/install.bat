@echo off
REM Script de instalación del Backend para Windows

echo Instalando dependencias del Backend...
echo.

REM Instalar dependencias principales
pip install -r requirements.txt

echo.
echo Instalando emergentintegrations (Gemini AI)...
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

echo.
echo Instalacion completada!
echo.
echo Proximo paso: Configura tu .env con tu GEMINI_API_KEY
pause
