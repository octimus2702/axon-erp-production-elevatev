@echo off
chcp 65001 > nul
title Axon ERP - Servidor Local en Ejecucion
color 0B
cls

echo ===============================================================================
echo            AXON ERP ENTERPRISE - SERVIDOR LOCAL OPERATIVO
echo        Tecno Elevatev C.A. & Soluciones Integrales DAKACO C.A.
echo ===============================================================================
echo.
echo  Iniciando servidor de aplicación Axon ERP...
echo  Puerto asignado: 3000
echo.

:: Abrir el navegador predeterminado en http://localhost:3000 tras 2 segundos de espera
start "" "http://localhost:3000"

echo -------------------------------------------------------------------------------
echo  Acceso Local (PC actual):  http://localhost:3000
echo  Acceso Red Local (LAN/WiFi): Usa la IP de esta PC (Ej: http://192.168.1.X:3000)
echo -------------------------------------------------------------------------------
echo.
echo [INFO] Para detener el servidor, cierra esta ventana o presiona Ctrl + C.
echo.

:: Ejecutar el servidor Vite / Node
npm run dev

pause
