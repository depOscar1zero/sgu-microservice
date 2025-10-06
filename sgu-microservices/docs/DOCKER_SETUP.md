# 🐳 Docker Setup para Sistema de Gestión Universitaria (SGU)

## 📋 Descripción

Este documento describe cómo configurar y ejecutar el Sistema de Gestión Universitaria usando Docker y Docker Compose.

## 🏗️ Arquitectura

### **Servicios Principales:**

- **Frontend SPA** (Astro) - Puerto 3005
- **API Gateway** - Puerto 3000
- **Auth Service** - Puerto 3001
- **Courses Service** - Puerto 3002
- **Enrollment Service** - Puerto 3003
- **Payments Service** - Puerto 3004
- **Notifications Service** - Puerto 3006

### **Bases de Datos:**

- **PostgreSQL** - Puerto 5432
- **MongoDB** - Puerto 27017
- **Redis** - Puerto 6379

### **Monitoreo:**

- **Prometheus** - Puerto 9090
- **Grafana** - Puerto 3001

## 🚀 Inicio Rápido

### **1. Prerrequisitos**

```bash
# Verificar Docker
docker --version
docker-compose --version
```

### **2. Iniciar el Sistema**

```bash
# Opción 1: Script automático
./docker-start.sh

# Opción 2: Comandos manuales
docker-compose up -d
```

### **3. Verificar Servicios**

```bash
# Ver estado de todos los servicios
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs -f auth-service
```

## 🔧 Comandos Útiles

### **Gestión de Servicios**

```bash
# Iniciar todos los servicios
docker-compose up -d

# Detener todos los servicios
docker-compose down

# Reiniciar un servicio específico
docker-compose restart auth-service

# Ver logs en tiempo real
docker-compose logs -f
```

### **Construcción de Imágenes**

```bash
# Construir todas las imágenes
docker-compose build

# Construir una imagen específica
docker-compose build auth-service

# Reconstruir sin caché
docker-compose build --no-cache
```

### **Limpieza**

```bash
# Detener y eliminar contenedores
docker-compose down

# Eliminar volúmenes
docker-compose down -v

# Eliminar imágenes
docker-compose down --rmi all

# Limpieza completa
docker system prune -a
```

## 📊 Monitoreo

### **Prometheus**

- **URL:** http://localhost:9090
- **Métricas:** Todos los servicios exponen métricas en `/metrics`

### **Grafana**

- **URL:** http://localhost:3001
- **Usuario:** admin
- **Contraseña:** admin
- **Datasource:** Prometheus (http://prometheus:9090)

## 🔍 Troubleshooting

### **Problemas Comunes**

#### **1. Puerto en uso**

```bash
# Verificar puertos en uso
netstat -tulpn | grep :3000

# Cambiar puertos en docker-compose.yml
```

#### **2. Servicio no inicia**

```bash
# Ver logs del servicio
docker-compose logs auth-service

# Verificar configuración
docker-compose config
```

#### **3. Base de datos no conecta**

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres
```

#### **4. Permisos de archivos**

```bash
# Dar permisos de ejecución a scripts
chmod +x docker-start.sh
chmod +x docker-stop.sh
```

## 📁 Estructura de Archivos

```
sgu-microservices/
├── docker-compose.yml          # Configuración principal
├── docker-start.sh            # Script de inicio
├── docker-stop.sh             # Script de parada
├── infrastructure/             # Configuraciones de infraestructura
│   ├── nginx/                  # Configuración de Nginx
│   ├── prometheus/             # Configuración de Prometheus
│   └── grafana/               # Configuración de Grafana
├── auth-service/
│   └── Dockerfile
├── courses-service/
│   └── Dockerfile
├── enrollment-service/
│   └── Dockerfile
├── payments-service/
│   └── Dockerfile
├── notifications-service/
│   └── Dockerfile
├── api-gateway/
│   └── Dockerfile
└── frontend-spa/
    └── Dockerfile
```

## 🔒 Variables de Entorno

### **Configuración de Producción**

```bash
# Crear archivo .env en la raíz del proyecto
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### **Configuración de Desarrollo**

```bash
# Usar archivos .env individuales en cada servicio
# Los archivos .env se montan como volúmenes
```

## 📈 Escalabilidad

### **Escalar Servicios**

```bash
# Escalar un servicio específico
docker-compose up -d --scale auth-service=3

# Escalar múltiples servicios
docker-compose up -d --scale auth-service=2 --scale courses-service=2
```

### **Load Balancing**

- Nginx actúa como load balancer
- Configurado en `infrastructure/nginx/nginx.conf`

## 🛡️ Seguridad

### **Mejores Prácticas**

1. **Cambiar contraseñas por defecto**
2. **Usar HTTPS en producción**
3. **Configurar firewall**
4. **Monitorear logs**
5. **Actualizar imágenes regularmente**

### **Configuración HTTPS**

```bash
# Colocar certificados SSL en
infrastructure/ssl/
├── cert.pem
└── key.pem
```

## 📚 Recursos Adicionales

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
