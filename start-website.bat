@echo off
cd /d "%~dp0"

REM Chi mo 2 cua so: Backend + Tunnel (da bo cua so Launcher va KeepAwake).
start "Backend - Hung-SieuNhan" cmd /c "%~dp0run-backend.bat"
start "Tunnel - Hung-SieuNhan" cmd /c "%~dp0run-tunnel.bat"

REM Tu dong cua so launcher nay, khong giu lai.
exit
