@echo off
title INVERANOLI - Servidor de Base de Datos y Web (Python)
color 0E
cls
echo ========================================================
echo        INVERANOLI JOYERIA - SERVIDOR PYTHON UNIVERSAL
echo ========================================================
echo.
echo Detectando version de Python en el equipo...

REM Intentar con comando 'python'
python --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Python detectado correctamente.
    echo Levantando servidor integrado (Web 3000 y BD 3001)...
    echo.
    python servidor_completo.py
    goto fin
)

REM Si no encontro 'python', intentar con comando 'py' (lanzador estandar de Windows)
py --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Lanzador 'py' detectado correctamente.
    echo Levantando servidor integrado (Web 3000 y BD 3001)...
    echo.
    py servidor_completo.py
    goto fin
)

REM Si no encontro Python, avisar amablemente
echo [AVISO] No se encontro Python en la variable PATH del sistema.
echo.
echo No te preocupes: puedes abrir el proyecto directamente haciendo
echo doble clic en la carpeta: public\index.html
echo.
echo Si tienes Node.js instalado, puedes usar: node servidor_database.js
echo.
pause
exit /b 1

:fin
pause
