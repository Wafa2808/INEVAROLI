@echo off
setlocal enabledelayedexpansion
title INVERANOLI - Servidor Python (Windows 7 / 8 / 10 / 11 - x32 y x64)
color 0E
cls

:: Fijar siempre el directorio de trabajo a la carpeta del proyecto
cd /d "%~dp0"

echo ========================================================
echo        INVERANOLI JOYERIA - SERVIDOR PYTHON
echo ========================================================
echo Compatible con Windows 7, 8, 10, 11 (x32 y x64)
echo Python desde 3.5 hasta 3.14+ (Cero dependencias externas)
echo ========================================================
echo.
echo Buscando instalacion de Python en el equipo...

set "PYTHON_EXE="

:: 1. Probar comando 'python' en PATH
python --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PYTHON_EXE=python"
    goto :lanzar
)

:: 2. Probar lanzador 'py' para diferentes versiones de Python 3
for %%V in (-3.6 -3.5 -3.7 -3.8 -3.9 -3.10 -3.11 -3.12 -3.13 -3.14 -3 "") do (
    py %%~V --version >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        if "%%~V"=="" (
            set "PYTHON_EXE=py"
        ) else (
            set "PYTHON_EXE=py %%~V"
        )
        goto :lanzar
    )
)

:: 3. Probar rutas directas estandar para Windows de 32 bits (x32) y 64 bits (x64)
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
    "%USERPROFILE%\AppData\Local\Programs\Python\Python35\python.exe"
    "%USERPROFILE%\AppData\Local\Programs\Python\Python35-32\python.exe"
    "%ProgramFiles%\Python36\python.exe"
    "%ProgramFiles%\Python35\python.exe"
    "%ProgramFiles(x86)%\Python36\python.exe"
    "%ProgramFiles(x86)%\Python35\python.exe"
    "C:\Python37\python.exe"
    "C:\Python37-32\python.exe"
    "C:\Python38\python.exe"
    "C:\Python38-32\python.exe"
    "C:\Python39\python.exe"
    "C:\Python39-32\python.exe"
    "C:\Python310\python.exe"
    "C:\Python311\python.exe"
    "C:\Python312\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python37\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python37-32\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python38\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python38-32\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python39\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    "C:\Python27\python.exe"
) do (
    if exist %%P (
        set "PYTHON_EXE=%%~P"
        goto :lanzar
    )
)

:: Si no se encontro Python
echo.
echo [AVISO] No se encontro el ejecutable de Python automaticamente.
echo.
echo Posibles causas y soluciones:
echo 1. Si instalaste Python 3.5 o 3.6, asegurate de marcar
echo    "Add Python to PATH" durante la instalacion.
echo 2. Puedes usar iniciar_servidor_bd.bat (si tienes Node.js instalado).
echo.
pause
exit /b 1

:lanzar
echo.
echo [OK] Python detectado: %PYTHON_EXE%
echo Version:
%PYTHON_EXE% -V
echo.
echo Iniciando servidor integrado INVERANOLI...
echo.

%PYTHON_EXE% servidor_completo.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo [AVISO] El servidor finalizo con codigo %ERRORLEVEL%.
    pause
)

:fin
