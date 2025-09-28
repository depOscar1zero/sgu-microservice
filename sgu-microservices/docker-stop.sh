#!/bin/bash

# Script de parada para SGU con Docker
echo "🛑 Deteniendo Sistema de Gestión Universitaria (SGU)..."

# Detener todos los servicios
echo "🛑 Deteniendo servicios..."
docker-compose down

# Limpiar volúmenes (opcional)
read -p "¿Deseas eliminar los volúmenes de datos? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Eliminando volúmenes de datos..."
    docker-compose down -v
    echo "✅ Volúmenes eliminados"
else
    echo "💾 Volúmenes de datos conservados"
fi

# Limpiar imágenes (opcional)
read -p "¿Deseas eliminar las imágenes de Docker? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Eliminando imágenes..."
    docker-compose down --rmi all
    echo "✅ Imágenes eliminadas"
else
    echo "💾 Imágenes conservadas"
fi

echo ""
echo "✅ Sistema SGU detenido correctamente"
echo "🔄 Para reiniciar: ./docker-start.sh"
