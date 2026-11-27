@echo off
REM Menjalankan uji alur admin tanpa perlu menulis kredensial di baris perintah.
REM
REM Kenapa file ini ada: "set VAR=nilai" di cmd.exe menyertakan spasi sebelum
REM tanda & ke dalam nilai, sehingga password terlihat benar tetapi ditolak.
REM Dengan "set /p" di bawah, yang tersimpan persis apa yang Anda ketik.
REM
REM Klik dua kali file ini, atau jalankan dari cmd:
REM   scripts\run-admin-flow.cmd

setlocal

cd /d "%~dp0.."

set "OPERATOR_EMAIL="
set /p OPERATOR_EMAIL=Email operator: 

REM Password akan terlihat saat diketik. cmd.exe tidak bisa menyembunyikannya
REM tanpa bantuan PowerShell, dan menyembunyikan input bukan tujuan skrip ini.
set "OPERATOR_PASSWORD="
set /p OPERATOR_PASSWORD=Password operator: 

if "%OPERATOR_EMAIL%"=="" (
  echo.
  echo Email kosong. Dibatalkan.
  exit /b 1
)
if "%OPERATOR_PASSWORD%"=="" (
  echo.
  echo Password kosong. Dibatalkan.
  exit /b 1
)

echo.
echo Menjalankan uji alur admin...
echo.

call bun scripts/admin-flow.mjs
set "CODE=%ERRORLEVEL%"

set "OPERATOR_EMAIL="
set "OPERATOR_PASSWORD="

echo.
if "%CODE%"=="0" (
  echo Selesai. Semua pemeriksaan lulus.
) else (
  echo Gagal. Baca pesan di atas, lalu kirimkan ke saya.
)
pause
exit /b %CODE%
