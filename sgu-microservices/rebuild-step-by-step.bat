@echo off
echo 🔧 REBUILD PASO A PASO DEL SISTEMA SGU
echo =====================================
echo.

echo 🔍 PASO 1: Verificando Docker Desktop...
docker info
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop no está funcionando
    echo 💡 Abre Docker Desktop y espera a que esté listo
    pause
    exit /b 1
)
echo ✅ Docker Desktop funcionando
echo.

echo 🔍 PASO 2: Limpiando sistema Docker...
docker container prune -f
docker image prune -a -f
docker volume prune -f
docker network prune -f
echo ✅ Sistema limpiado
echo.

echo 🔍 PASO 3: Rebuild de servicios...
echo 🔨 Rebuild API Gateway...
docker-compose build api-gateway
echo 🔨 Rebuild Auth Service...
docker-compose build auth-service
echo 🔨 Rebuild Courses Service...
docker-compose build courses-service
echo 🔨 Rebuild Enrollment Service...
docker-compose build enrollment-service
echo 🔨 Rebuild Payments Service...
docker-compose build payments-service
echo 🔨 Rebuild Notifications Service...
docker-compose build notifications-service
echo 🔨 Rebuild Frontend SPA...
docker-compose build frontend-spa
echo ✅ Todos los servicios rebuilded
echo.

echo 🔍 PASO 4: Iniciando sistema...
docker-compose up -d
echo ✅ Sistema iniciado
echo.

echo 🔍 PASO 5: Verificando estado...
docker-compose ps
echo.

echo 🎉 ¡REBUILD COMPLETO EXITOSO!
echo.
echo 🔗 URLs DEL SISTEMA:
echo    🌐 Frontend: http://localhost:3005
echo    🔧 API Gateway: http://localhost:3000
echo    🔐 Auth Service: http://localhost:3001
echo    📚 Courses Service: http://localhost:3002
echo    📋 Enrollment Service: http://localhost:3003
echo    💳 Payments Service: http://localhost:3004
echo    📧 Notifications Service: http://localhost:3006
echo    📊 Prometheus: http://localhost:9090
echo    📈 Grafana: http://localhost:3007
echo.
pause

