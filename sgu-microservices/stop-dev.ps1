# Script para detener el sistema de desarrollo - SGU Microservices

Write-Host "🛑 Deteniendo Sistema de Gestión Universitaria (SGU) - Microservicios" -ForegroundColor Red
Write-Host ""

# Detener todos los servicios
Write-Host "📋 Deteniendo servicios..." -ForegroundColor Yellow
docker-compose down

# Opcional: Limpiar volúmenes (descomenta si quieres limpiar datos)
# Write-Host "🧹 Limpiando volúmenes..." -ForegroundColor Yellow
# docker-compose down -v

Write-Host ""
Write-Host "✅ Sistema SGU detenido correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Para limpiar completamente (incluyendo datos):" -ForegroundColor Cyan
Write-Host "   docker-compose down -v" -ForegroundColor White
