@echo off
title Tunnel - Hung-SieuNhan
cd /d "%~dp0"

REM --- Tim devtunnel (PATH hoac thu muc cai dat WinGet) ---
set "DEVTUNNEL=devtunnel"
where devtunnel >nul 2>nul || set "DEVTUNNEL=%LOCALAPPDATA%\Microsoft\WinGet\Links\devtunnel.exe"

REM === Dang nhap Dev Tunnels MOI LAN CHAY ===
REM Token Dev Tunnels het han sau vai ngay -> dang nhap lai de tunnel hoat dong.
REM Trinh duyet se mo ra: chon tai khoan GitHub (ConBoCuoiHaha) -> Authorize.
echo ===================================================
echo  Dang nhap Dev Tunnels (trinh duyet se mo ra)...
echo  -> Chon tai khoan GitHub roi bam Authorize.
echo ===================================================
"%DEVTUNNEL%" user login -g

REM Doi backend kip khoi dong xong
timeout /t 5 /nobreak >nul

:loop
echo.
echo [%date% %time%] Dang host tunnel "hung-sieunhan"...
echo Tim dong "Connect via browser: https://..." ben duoi = LINK WEBSITE
echo ---------------------------------------------------
"%DEVTUNNEL%" host hung-sieunhan
echo.
echo [!] Tunnel da dung hoac loi. Ket noi lai sau 5 giay...
echo     (Nhan Ctrl+C roi Y de thoat han)
timeout /t 5 /nobreak >nul
goto loop
