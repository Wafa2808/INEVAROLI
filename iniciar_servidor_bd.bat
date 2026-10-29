@echo off
setlocal enabledelayedexpansion
title INVERANOLI - Servidor de Base de Datos (Node.js o Python)
color 0E
cls

:: Fijar directorio de trabajo
cd /d "%~dp0"

echo ========================================================
echo        INVERANOLI JOYERIA - SERVIDOR DE BASE DE DATOS
echo ========================================================
echo Compatible con Windows 7, 8, 10, 11 (x32 y x64)
echo.
echo Detectando entorno de ejecucion (Node.js o Python)...

:: 1. Prioridad: Node.js si esta instalado (servidor_database.js en puerto 3001)
node --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Node.js detectado correctamente.
    echo Levantando servidor de Base de Datos con Node.js en puerto 3001...
    echo.
    node servidor_database.js
    goto :fin
)

:: 2. Si no hay Node.js, probar con Python (servidor_database.py en puerto 3001)
python --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Python detectado en PATH.
    echo Levantando servidor de Base de Datos en puerto 3001...
    echo.
    python servidor_database.py
    goto :fin
)

:: 3. Probar lanzador 'py'
py --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Lanzador 'py' detectado.
    echo Levantando servidor de Base de Datos en puerto 3001...
    echo.
    py servidor_database.py
    goto :fin
)

:: 4. Probar rutas directas estandar de Python x32 / x64
for %%P in (
    "C:\Python36\python.exe"
    "C:\Python36-32\python.exe"
    "C:\Python35\python.exe"
    "C:\Python35-32\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python36\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python36-32\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python35\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python35-32\python.exe"
    "%USERPROFILE%\AppData\Local\Programs\Python\Python36\python.exe"
    "%USERPROFILE%\AppData\Local\Programs\Python\Python36-32\python.exe"
    "%ProgramFiles%\Python36\python.exe"
    "%ProgramFiles%\Python35\python.exe"
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

echo.
echo [AVISO] No se encontro ni Node.js ni Python en el equipo.
echo Instala Node.js o Python (desde version 3.5 en adelante).
echo.
pause

:fin
