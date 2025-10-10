@echo off
echo 🔧 Fixing CSS MIME type issues...

REM Clear Next.js cache
echo Clearing Next.js cache...
if exist .next rmdir /s /q .next

REM Clear node_modules cache if needed
if "%1"=="--deep" (
    echo Clearing node_modules cache...
    if exist node_modules\.cache rmdir /s /q node_modules\.cache
)

REM Restart development server
echo Starting development server...
npm run dev

echo ✅ Development server restarted with CSS MIME type fixes!
