# Script de inicio para API Gateway
# PowerShell script para Windows

Write-Host "🚀 Iniciando SGU API Gateway..." -ForegroundColor Green

# Establecer variables de entorno
$env:JWT_SECRET = "your-super-secret-jwt-key-here"
$env:PORT = "3000"
$env:AUTH_SERVICE_URL = "http://localhost:3001"
$env:COURSES_SERVICE_URL = "http://localhost:3002"
$env:ENROLLMENT_SERVICE_URL = "http://localhost:3003"
$env:PAYMENTS_SERVICE_URL = "http://localhost:3004"
$env:NOTIFICATIONS_SERVICE_URL = "http://localhost:3005"
$env:NODE_ENV = "development"

Write-Host "✅ Variables de entorno configuradas" -ForegroundColor Green

# Verificar que el archivo server.js existe
if (Test-Path "src/server.js") {
    Write-Host "✅ Archivo server.js encontrado" -ForegroundColor Green
    Write-Host "🌐 Iniciando servidor en puerto 3000..." -ForegroundColor Yellow
    node src/server.js
} else {
    Write-Host "❌ Error: No se encontró src/server.js" -ForegroundColor Red
    Write-Host "Verifica que estés en el directorio correcto del API Gateway" -ForegroundColor Red
}
