@echo off
setlocal enabledelayedexpansion

:: Bot Monitor Enhanced Batch Script
:: This script provides better error handling, logging, and restart capabilities

:: Set title
title Bot Monitor - Enhanced

:: Check for command line arguments
set "RESTART_MODE="
if "%1"=="--restart" set "RESTART_MODE=1"
if "%1"=="--help" goto :help

:start
echo.
echo ========================================
echo           BOT MONITOR STARTING
echo ========================================
echo.
echo [%date% %time%] 🚀 Starting Bot Monitor...
echo [%date% %time%] 📁 Working Directory: %CD%
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [%date% %time%] ❌ ERROR: Node.js is not installed or not in PATH
    echo [%date% %time%] 💡 Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Get Node.js version
for /f "tokens=*" %%i in ('node --version 2^>nul') do set "NODE_VERSION=%%i"
echo [%date% %time%] ✅ Node.js Version: %NODE_VERSION%

:: Check if package.json exists and install dependencies if needed
if exist "package.json" (
    if not exist "node_modules" (
        echo [%date% %time%] 📦 Installing dependencies...
        npm install
        if errorlevel 1 (
            echo [%date% %time%] ❌ ERROR: Failed to install dependencies
            pause
            exit /b 1
        )
    )
)

:: Start the server
echo [%date% %time%] 🎯 Starting server.js...
echo [%date% %time%] ========================================
echo.

node app/server.js

:: Check if the process exited with an error
if errorlevel 1 (
    echo.
    echo [%date% %time%] ❌ Bot Monitor crashed with exit code: %errorlevel%
    
    if defined RESTART_MODE (
        echo [%date% %time%] 🔄 Auto-restart mode enabled. Restarting in 5 seconds...
        echo [%date% %time%] 💡 Press Ctrl+C to stop auto-restart
        timeout /t 5 /nobreak >nul
        goto :start
    ) else (
        echo [%date% %time%] 💡 To enable auto-restart, run: %0 --restart
        echo [%date% %time%] 💡 Press any key to exit...
        pause >nul
        exit /b 1
    )
) else (
    echo.
    echo [%date% %time%] ✅ Bot Monitor exited normally
    pause
)

exit /b 0

:help
echo.
echo Bot Monitor Enhanced Batch Script
echo Usage: %0 [options]
echo.
echo Options:
echo   --restart    Restart the bot monitor if it crashes
echo   --help       Show this help message
echo.
echo Examples:
echo   %0              # Start the bot monitor
echo   %0 --restart    # Start with auto-restart on crash
echo.
pause
exit /b 0
