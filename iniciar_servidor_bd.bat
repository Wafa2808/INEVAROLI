@echo off
setlocal enabledelayedexpansion
title INVERANOLI - Servidor de Base de Datos (Puerto 3001)
color 0E
cls

:: Fijar directorio de trabajo
cd /d "%~dp0"

echo ========================================================
echo        INVERANOLI JOYERIA - SERVIDOR DE BASE DE DATOS
echo ========================================================
echo.
echo Detectando entorno de ejecucion (Python o Node.js)...

:: 1. Intentar con Python
python --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Levantando servidor de BD con Python en puerto 3001...
    echo.
    python servidor_database.py
    goto :fin
)

:: 2. Intentar con lanzador 'py'
py --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Levantando servidor de BD con lanzador 'py' en puerto 3001...
    echo.
    py servidor_database.py
    goto :fin
)

:: 3. Intentar rutas estandar de Python
for %%P in (
    "C:\Python36\python.exe"
    "C:\Python36-32\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python36\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python36-32\python.exe"
    "%USERPROFILE%\AppData\Local\Programs\Python\Python36\python.exe"
    "%USERPROFILE%\AppData\Local\Programs\Python\Python36-32\python.exe"
    "%ProgramFiles%\Python36\python.exe"
    "%ProgramFiles(x86)%\Python36\python.exe"
    "C:\Python37\python.exe"
    "C:\Python38\python.exe"
    "C:\Python39\python.exe"
    "C:\Python310\python.exe"
    "C:\Python311\python.exe"
    "C:\Python312\python.exe"
) do (
    if exist %%P (
        echo [OK] Levantando servidor de BD con %%~P...
        echo.
        %%P servidor_database.py
        goto :fin
    )
)

:: 4. Fallback a Node.js si esta instalado
node --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Levantando servidor de BD con Node.js en puerto 3001...
    echo.
    node servidor_database.js
    goto :fin
)

echo.
echo [AVISO] No se encontro ni Python ni Node.js en el sistema.
echo Para levantar el servidor completo, utiliza: iniciar_servidor_python.bat
echo o abre public\index.html directamente.
echo.
pause

:fin
