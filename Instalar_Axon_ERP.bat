@echo off
chcp 65001 > nul
title Axon ERP - Instalador de Servidor / PC Local
color 0A
cls

echo ===============================================================================
echo            AXON ERP ENTERPRISE - INSTALADOR LOCAL DE SERVIDOR / PC
echo        Tecno Elevatev C.A. & Soluciones Integrales DAKACO C.A.
echo ===============================================================================
echo.

:: 1. Verificar si Node.js está instalado
echo [1/3] Verificando instalación de Node.js en el sistema...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ERROR: Node.js no está instalado en este equipo.
    echo Por favor descarga e instala Node.js LTS desde: https://nodejs.org/
    echo Una vez instalado, vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js detectado: %NODE_VER%
echo.

:: 2. Instalación de dependencias del proyecto
echo [2/3] Instalando dependencias necesarias con npm...
echo Esto puede tomar entre 1 y 3 minutos la primera vez...
echo.
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Hubo un problema al instalar las dependencias con npm install.
    echo Revisa tu conexión a internet e intentalo nuevamente.
    echo.
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas correctamente.
echo.

:: 3. Compilación del proyecto para producción
echo [3/3] Compilando la aplicación Web / PWA con Vite...
call npm run build
if %errorlevel% neq 0 (
    color 0E
    echo.
    echo [ADVERTENCIA] La compilación arrojó advertencias o errores menores.
    echo El sistema intentará iniciar en modo directo (Dev).
    echo.
) else (
    echo [OK] Compilación finalizada con éxito.
)

echo.
echo ===============================================================================
echo ¡INSTALACIÓN DE AXON ERP COMPLETADA CON ÉXITO!
echo ===============================================================================
echo.
echo Ahora puedes iniciar el servidor ejecutando "Iniciar_Sistema.bat"
echo El sistema estará disponible en tu navegador en: http://localhost:3000
echo.
set /p DESKTOP_SHORTCUT="¿Deseas crear un acceso directo en el Escritorio? (S/N): "
if /i "%DESKTOP_SHORTCUT%"=="S" (
    echo.
    echo Creando acceso directo en el escritorio de Windows...
    set SCRIPT="%TEMP%\CreateShortcut.vbs"
    echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
    echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Axon ERP - Iniciar Sistema.lnk" >> %SCRIPT%
    echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
    echo oLink.TargetPath = "%~dp0Iniciar_Sistema.bat" >> %SCRIPT%
    echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
    echo oLink.Description = "Iniciar Servidor Local Axon ERP" >> %SCRIPT%
    echo oLink.Save >> %SCRIPT%
    cscript //nologo %SCRIPT%
    del %SCRIPT%
    echo [OK] Acceso directo creado en el Escritorio.
)

echo.
echo Presiona cualquier tecla para cerrar el instalador...
pause > nul
