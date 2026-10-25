@echo off
cd /d "%~dp0"
node node_modules\expo\bin\cli start > expo.log 2>&1
