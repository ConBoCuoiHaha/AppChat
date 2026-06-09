@echo off
title Backend - Hung-SieuNhan
cd /d "%~dp0Moji_RealtimeChatApp\backend"

:loop
echo.
echo [%date% %time%] Khoi dong backend (cong 5001)...
echo ---------------------------------------------------
call npm start
echo.
echo [!] Backend da dung hoac bi loi. Khoi dong lai sau 5 giay...
echo     (Nhan Ctrl+C roi Y de thoat han)
timeout /t 5 /nobreak >nul
goto loop
