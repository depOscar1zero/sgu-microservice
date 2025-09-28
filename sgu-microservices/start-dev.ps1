# Script de inicio para desarrollo - SGU Microservices
# Este script facilita el inicio del sistema en modo desarrollo

Write-Host "🚀 Iniciando Sistema de Gestión Universitaria (SGU) - Microservicios" -ForegroundColor Green
Write-Host ""

# Verificar que Docker esté ejecutándose
Write-Host "📋 Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker está disponible" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está disponible. Por favor instala Docker Desktop" -ForegroundColor Red
    exit 1
}

# Verificar que Docker Compose esté disponible
Write-Host "📋 Verificando Docker Compose..." -ForegroundColor Yellow
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose está disponible" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose no está disponible" -ForegroundColor Red
    exit 1
}

# Crear archivo .env si no existe
if (-not (Test-Path ".env")) {
    Write-Host "📋 Creando archivo .env desde env.example..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ Archivo .env creado. Por favor edita las variables según tu configuración." -ForegroundColor Green
}

# Construir y levantar servicios
Write-Host ""
Write-Host "🏗️ Construyendo y levantando servicios..." -ForegroundColor Yellow
Write-Host ""

# Construir imágenes
Write-Host "📦 Construyendo imágenes Docker..." -ForegroundColor Cyan
docker-compose build

# Levantar servicios en modo detached
Write-Host "🚀 Levantando servicios..." -ForegroundColor Cyan
docker-compose up -d

# Esperar un momento para que los servicios se inicialicen
Write-Host "⏳ Esperando que los servicios se inicialicen..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Mostrar estado de los servicios
Write-Host ""
Write-Host "📊 Estado de los servicios:" -ForegroundColor Green
docker-compose ps

Write-Host ""
Write-Host "🌐 Servicios disponibles:" -ForegroundColor Green
Write-Host "  • Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  • Auth API: http://localhost:3001" -ForegroundColor White
Write-Host "  • Courses API: http://localhost:3002" -ForegroundColor White
Write-Host "  • Enrollment API: http://localhost:3003" -ForegroundColor White
Write-Host "  • Payments API: http://localhost:3004" -ForegroundColor White
Write-Host "  • Notifications API: http://localhost:3005" -ForegroundColor White
Write-Host "  • Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "  • Grafana: http://localhost:3001" -ForegroundColor White

Write-Host ""
Write-Host "📝 Comandos útiles:" -ForegroundColor Green
Write-Host "  • Ver logs: docker-compose logs -f [servicio]" -ForegroundColor White
Write-Host "  • Parar servicios: docker-compose down" -ForegroundColor White
Write-Host "  • Reiniciar servicio: docker-compose restart [servicio]" -ForegroundColor White
Write-Host "  • Ver estado: docker-compose ps" -ForegroundColor White

Write-Host ""
Write-Host "✅ Sistema SGU iniciado correctamente!" -ForegroundColor Green
