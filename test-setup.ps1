# test-setup.ps1
Write-Host "🔍 Testing E-Health System Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Test backend structure
Write-Host "`n📁 Checking Backend Structure..." -ForegroundColor Yellow
$backendFiles = @(
    "backend\src\server.js",
    "backend\src\services\fingerprintSensor.js",
    "backend\package.json",
    "backend\.env"
)

foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file" -ForegroundColor Red
    }
}

# Test frontend structure
Write-Host "`n📁 Checking Frontend Structure..." -ForegroundColor Yellow
$frontendFiles = @(
    "frontend\src\index.js",
    "frontend\src\App.js",
    "frontend\public\index.html",
    "frontend\package.json",
    "frontend\.env"
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file" -ForegroundColor Red
    }
}

# Check for sensor connection (if connected)
Write-Host "`n🔌 Checking USB/Fingerprint Sensor..." -ForegroundColor Yellow
$comPorts = [System.IO.Ports.SerialPort]::getportnames()
if ($comPorts.Count -gt 0) {
    Write-Host "  ✅ Available COM ports: $($comPorts -join ', ')" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  No COM ports found. Connect your fingerprint sensor first." -ForegroundColor Yellow
}

Write-Host "`n=================================" -ForegroundColor Cyan