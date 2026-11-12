# SoleFit Footwear Retail ERP Launcher
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Starting SoleFit Footwear Retail ERP Suite" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start PostgreSQL if not already running on port 5433
$pgRunning = Get-Process -Name postgres -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*footwear-erp*" }
if (-not $pgRunning) {
    Write-Host "[1/3] Starting PostgreSQL cluster on port 5433..." -ForegroundColor Yellow
    Start-Process -FilePath "C:\Program Files\PostgreSQL\17\bin\postgres.exe" -ArgumentList "-D `"$baseDir\pgdata`"" -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "[1/3] PostgreSQL cluster already running on port 5433." -ForegroundColor Green
}

# 2. Start Backend API Server
Write-Host "[2/3] Starting Express Backend API on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$baseDir\backend`"; npm start"

# 3. Start Frontend Dev Server
Write-Host "[3/3] Starting React Vite Frontend on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$baseDir\frontend`"; npm run dev -- --host"

Start-Sleep -Seconds 3
Write-Host "`n✅ SoleFit ERP is running!" -ForegroundColor Green
Write-Host "🌐 Application URL: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔗 Backend Health: http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host "`nDemo Credentials:" -ForegroundColor White
Write-Host "  Management:      admin@solefit.com / admin123" -ForegroundColor White
Write-Host "  Sales Executive: rajesh@solefit.com / sales123" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan
