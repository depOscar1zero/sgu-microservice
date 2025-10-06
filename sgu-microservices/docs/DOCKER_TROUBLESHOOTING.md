# 🛠️ Docker Troubleshooting para SGU

## 🚨 Problemas Comunes y Soluciones

### **1. Docker Desktop no está ejecutándose**

#### **Síntomas:**

```
error during connect: Head "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/_ping":
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

#### **Solución:**

1. **Iniciar Docker Desktop:**

   - Buscar "Docker Desktop" en el menú de inicio
   - Hacer clic en "Docker Desktop"
   - Esperar a que aparezca el ícono en la bandeja del sistema
   - Verificar que el ícono esté en color (no gris)

2. **Verificar que Docker esté funcionando:**
   ```bash
   docker --version
   docker ps
   ```

### **2. Docker Desktop no se inicia**

#### **Posibles causas:**

- Docker Desktop no está instalado
- Servicios de Windows no están habilitados
- Problemas de permisos
- Conflicto con otros virtualizadores

#### **Soluciones:**

1. **Reinstalar Docker Desktop:**

   - Descargar desde: https://www.docker.com/products/docker-desktop/
   - Ejecutar como administrador
   - Reiniciar el sistema

2. **Habilitar virtualización:**

   - Verificar que la virtualización esté habilitada en BIOS
   - Deshabilitar Hyper-V si está causando conflictos

3. **Ejecutar como administrador:**
   - Clic derecho en Docker Desktop
   - "Ejecutar como administrador"

### **3. Problemas de permisos**

#### **Síntomas:**

```
Access denied
Permission denied
```

#### **Solución:**

1. **Ejecutar PowerShell como administrador**
2. **Verificar permisos de Docker:**
   ```bash
   docker run hello-world
   ```

### **4. Puertos en uso**

#### **Síntomas:**

```
Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use
```

#### **Solución:**

1. **Verificar puertos en uso:**

   ```bash
   netstat -an | findstr :3000
   ```

2. **Detener procesos que usan los puertos:**

   ```bash
   # Encontrar proceso
   netstat -ano | findstr :3000

   # Terminar proceso (reemplazar PID)
   taskkill /PID 1234 /F
   ```

3. **Cambiar puertos en docker-compose.yml:**
   ```yaml
   ports:
     - "3001:3000" # Puerto externo:puerto interno
   ```

### **5. Problemas de memoria**

#### **Síntomas:**

```
Container killed
Out of memory
```

#### **Solución:**

1. **Aumentar memoria en Docker Desktop:**

   - Abrir Docker Desktop
   - Settings → Resources → Memory
   - Aumentar a 4GB o más

2. **Limpiar recursos:**
   ```bash
   docker system prune -a
   docker volume prune
   ```

### **6. Problemas de red**

#### **Síntomas:**

```
Network not found
Cannot connect to service
```

#### **Solución:**

1. **Recrear red:**

   ```bash
   docker network prune
   docker-compose down
   docker-compose up -d
   ```

2. **Verificar red:**
   ```bash
   docker network ls
   docker network inspect sgu-microservices_sgu-network
   ```

### **7. Problemas de volúmenes**

#### **Síntomas:**

```
Volume not found
Permission denied on volume
```

#### **Solución:**

1. **Recrear volúmenes:**

   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

2. **Verificar volúmenes:**
   ```bash
   docker volume ls
   docker volume inspect sgu-microservices_postgres_data
   ```

## 🔧 Comandos de Diagnóstico

### **Verificar estado general:**

```bash
# Estado de Docker
docker --version
docker info

# Estado de contenedores
docker ps -a
docker-compose ps

# Estado de imágenes
docker images
docker-compose images

# Estado de redes
docker network ls
docker network inspect sgu-microservices_sgu-network

# Estado de volúmenes
docker volume ls
docker volume inspect sgu-microservices_postgres_data
```

### **Verificar logs:**

```bash
# Logs de todos los servicios
docker-compose logs

# Logs de un servicio específico
docker-compose logs auth-service
docker-compose logs postgres

# Logs en tiempo real
docker-compose logs -f auth-service
```

### **Limpiar sistema:**

```bash
# Detener todos los servicios
docker-compose down

# Limpiar contenedores
docker container prune

# Limpiar imágenes
docker image prune -a

# Limpiar volúmenes
docker volume prune

# Limpiar redes
docker network prune

# Limpieza completa
docker system prune -a
```

## 🚀 Proceso de Inicio Recomendado

### **1. Verificar Docker Desktop:**

```bash
docker --version
docker ps
```

### **2. Limpiar sistema (si es necesario):**

```bash
docker-compose down
docker system prune -f
```

### **3. Construir imágenes:**

```bash
docker-compose build --no-cache
```

### **4. Iniciar servicios:**

```bash
docker-compose up -d
```

### **5. Verificar estado:**

```bash
docker-compose ps
```

### **6. Probar sistema:**

```bash
node test-docker-system.js
```

## 📞 Soporte Adicional

### **Recursos útiles:**

- [Docker Desktop Documentation](https://docs.docker.com/desktop/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Troubleshooting](https://docs.docker.com/desktop/troubleshoot/)

### **Comandos de emergencia:**

```bash
# Reiniciar Docker Desktop
# Cerrar Docker Desktop completamente
# Abrir Docker Desktop nuevamente

# Reiniciar servicios de Windows
# Abrir Services.msc
# Reiniciar "Docker Desktop Service"

# Limpieza completa
docker-compose down -v
docker system prune -a --volumes
```

## 🎯 Verificación Final

Una vez que Docker esté funcionando, ejecuta:

```bash
# Verificar estado
node check-docker-status.js

# Probar sistema
node test-docker-system.js
```

Si ambos scripts funcionan correctamente, el sistema SGU estará listo para usar.
