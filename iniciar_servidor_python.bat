@echo off
setlocal enabledelayedexpansion
title INVERANOLI - Servidor Python Universal (Windows 7 / 8 / 10 / 11)
color 0E
cls

:: 1. Fijar siempre el directorio de trabajo a la carpeta del proyecto
cd /d "%~dp0"

echo ========================================================
echo        INVERANOLI JOYERIA - SERVIDOR PYTHON
echo ========================================================
echo Compatible con Windows 7, 8, 10, 11 (Python 3.6 en adelante)
echo Cero dependencias externas (Sin pip, sin node)
echo ========================================================
echo.
echo Buscando instalacion de Python en el equipo...

set "PYTHON_EXE="

:: Probar 1: Comando 'python' en variable PATH
python --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PYTHON_EXE=python"
    goto :lanzar
)

:: Probar 2: Lanzador oficial 'py' con Python 3.6 especifico
py -3.6 --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PYTHON_EXE=py -3.6"
    goto :lanzar
)

:: Probar 3: Lanzador 'py' con cualquier Python 3
py -3 --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PYTHON_EXE=py -3"
    goto :lanzar
)

:: Probar 4: Lanzador 'py' generico
py --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PYTHON_EXE=py"
    goto :lanzar
)

:: Probar 5: Rutas estandar de instalacion de Python 3.6 en Windows 7
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
    "C:\Python37-32\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python37\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python37-32\python.exe"
    "C:\Python38\python.exe"
    "C:\Python38-32\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python38\python.exe"
    "C:\Python39\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python39\python.exe"
    "C:\Python310\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
    "C:\Python311\python.exe"
    "%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    "C:\Python312\python.exe"
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
echo 1. Si instalaste Python 3.6, asegurate de haber marcado:
echo    "Add Python 3.6 to PATH" durante la instalacion.
echo 2. Puedes descargar Python 3.6 para Windows 7 desde:
echo    https://www.python.org/downloads/release/python-368/
echo 3. Como alternativa, puedes abrir la tienda directamente haciendo
echo    doble clic en: public\index.html
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
    echo [AVISO] El servidor se detuvo con codigo %ERRORLEVEL%.
    echo Recuerda que tambien puedes abrir la tienda directamente haciendo doble clic en:
    echo public\index.html
    echo.
    pause
)

:fin
