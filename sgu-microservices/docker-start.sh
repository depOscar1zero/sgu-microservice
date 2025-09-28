#!/bin/bash

# Script de inicio para SGU con Docker
echo "🚀 Iniciando Sistema de Gestión Universitaria (SGU) con Docker..."

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor, instala Docker primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor, instala Docker Compose primero."
    exit 1
fi

# Crear directorios necesarios
echo "📁 Creando directorios necesarios..."
mkdir -p infrastructure/ssl
mkdir -p logs

# Construir todas las imágenes
echo "🔨 Construyendo imágenes de Docker..."
docker-compose build

# Iniciar servicios
echo "🚀 Iniciando servicios..."
docker-compose up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado de los servicios
echo "🔍 Verificando estado de los servicios..."
docker-compose ps

echo ""
echo "🎉 ¡Sistema SGU iniciado correctamente!"
echo ""
echo "📋 Servicios disponibles:"
echo "   🌐 Frontend: http://localhost:3005"
echo "   🔗 API Gateway: http://localhost:3000"
echo "   🔐 Auth Service: http://localhost:3001"
echo "   📚 Courses Service: http://localhost:3002"
echo "   📝 Enrollment Service: http://localhost:3003"
echo "   💳 Payments Service: http://localhost:3004"
echo "   📧 Notifications Service: http://localhost:3006"
echo "   📊 Prometheus: http://localhost:9090"
echo "   📈 Grafana: http://localhost:3001 (admin/admin)"
echo ""
echo "🛑 Para detener todos los servicios: docker-compose down"
echo "📊 Para ver logs: docker-compose logs -f [servicio]"
echo "🔧 Para reconstruir: docker-compose build --no-cache"
