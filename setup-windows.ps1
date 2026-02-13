# VidFlow Windows Setup & Build Script
# Run this in PowerShell as Administrator

Write-Host "Starting VidFlow Windows Build Automation..." -ForegroundColor Blue

# 1. Check for Node.js
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npm not found. Please install Node.js (https://nodejs.org/)" -ForegroundColor Red
    exit
}

# 2. Check for Rust
if (!(Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Rust..." -ForegroundColor Blue
    Invoke-WebRequest -Uri "https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe" -OutFile "rustup-init.exe"
    ./rustup-init.exe -y
    Remove-Item "rustup-init.exe"
    $env:Path += ";$env:USERPROFILE\.cargo\bin"
} else {
    Write-Host "Rust is already installed." -ForegroundColor Green
}

# 3. Build Tools for Visual Studio
Write-Host "Tip: Ensure 'Desktop development with C++' is installed in Visual Studio Build Tools." -ForegroundColor Yellow

# 4. Install Project Dependencies
Write-Host "Installing project dependencies..." -ForegroundColor Blue
npm install

# 5. Build Tauri App
Write-Host "Starting Tauri Build..." -ForegroundColor Blue
npm run tauri build

Write-Host "========================================" -ForegroundColor Green
Write-Host "BUILD COMPLETE!" -ForegroundColor Green
Write-Host "Final binaries (.msi / .exe) are in:" -ForegroundColor Green
Write-Host "src-tauri\target\release\bundle\" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Green
