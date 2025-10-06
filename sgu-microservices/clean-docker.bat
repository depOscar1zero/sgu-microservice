@echo off
echo 🔧 LIMPIEZA COMPLETA DE DOCKER
echo =============================
echo.

echo 🧹 Eliminando contenedores detenidos...
docker container prune -f

echo 🧹 Eliminando imágenes no utilizadas...
docker image prune -a -f

echo 🧹 Eliminando volúmenes no utilizados...
docker volume prune -f

echo 🧹 Eliminando redes no utilizadas...
docker network prune -f

echo 🧹 Eliminando sistema completo...
docker system prune -a --volumes -f

echo.
echo ✅ Limpieza completa terminada
echo.
echo 🚀 Ahora ejecuta: docker-compose up -d
echo.
pause

