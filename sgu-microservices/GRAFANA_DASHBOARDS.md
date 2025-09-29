# 📊 Grafana Dashboards - Sistema SGU

## 🎯 Descripción

Este documento describe los dashboards configurados en Grafana para monitorear el sistema SGU (Sistema de Gestión Universitaria) con arquitectura de microservicios.

## 🔗 Acceso a Grafana

- **URL:** `http://localhost:3007`
- **Usuario:** `admin`
- **Contraseña:** `admin`

## 📈 Dashboards Configurados

### 1. SGU System Overview

**Descripción:** Vista general del sistema SGU con métricas principales.

**Métricas incluidas:**

- ✅ **System Health Overview** - Estado de todos los servicios
- ✅ **API Gateway Metrics** - Requests/sec y duración
- ✅ **Database Connections** - PostgreSQL, MongoDB, Redis
- ✅ **Service Response Times** - Percentiles 50 y 95
- ✅ **Error Rates** - Errores 4xx y 5xx

### 2. SGU Microservices Detailed

**Descripción:** Métricas detalladas de cada microservicio.

**Servicios monitoreados:**

- ✅ **Auth Service** - Autenticación y autorización
- ✅ **Courses Service** - Gestión de cursos
- ✅ **Enrollment Service** - Inscripciones
- ✅ **Payments Service** - Procesamiento de pagos
- ✅ **Notifications Service** - Sistema de notificaciones
- ✅ **Frontend SPA** - Interfaz de usuario

### 3. SGU Database Monitoring

**Descripción:** Monitoreo completo de las bases de datos.

**Bases de datos monitoreadas:**

- ✅ **PostgreSQL** - Conexiones, transacciones
- ✅ **MongoDB** - Operaciones, rendimiento
- ✅ **Redis** - Memoria, conexiones
- ✅ **Database Health Status** - Estado general

## 🔧 Configuración Técnica

### Prometheus Targets

```yaml
# Servicios principales
- api-gateway:3000/metrics
- auth-service:3001/metrics
- courses-service:3002/metrics
- enrollment-service:3003/metrics
- payments-service:3004/metrics
- notifications-service:3006/metrics
- frontend-spa:3000/metrics

# Bases de datos
- postgres:5432
- mongodb:27017
- redis:6379
```

### Métricas Principales

- **`up`** - Estado de servicios (0=down, 1=up)
- **`http_requests_total`** - Total de requests HTTP
- **`http_request_duration_seconds`** - Duración de requests
- **`pg_stat_database_*`** - Estadísticas de PostgreSQL
- **`mongodb_*`** - Métricas de MongoDB
- **`redis_*`** - Métricas de Redis

## 📊 Paneles de Dashboard

### System Health Overview

- **Tipo:** Stat panels
- **Métrica:** `up{job=~"api-gateway|auth-service|..."}`
- **Umbrales:** Rojo (0), Verde (1)

### API Gateway Metrics

- **Tipo:** Graph
- **Métricas:**
  - `rate(http_requests_total{job="api-gateway"}[5m])`
  - `rate(http_request_duration_seconds{job="api-gateway"}[5m])`

### Database Connections

- **Tipo:** Graph
- **Métricas:**
  - `pg_stat_database_numbackends{job="postgres"}`
  - `mongodb_connections{job="mongodb"}`
  - `redis_connected_clients{job="redis"}`

### Service Response Times

- **Tipo:** Graph
- **Métricas:**
  - `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{...}[5m]))`
  - `histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{...}[5m]))`

### Error Rates

- **Tipo:** Graph
- **Métricas:**
  - `rate(http_requests_total{...,code=~"5.."}[5m])`
  - `rate(http_requests_total{...,code=~"4.."}[5m])`

## 🎨 Configuración Visual

### Estilo

- **Tema:** Dark
- **Timezone:** Browser
- **Refresh:** 30 segundos
- **Time Range:** Última hora

### Colores

- **Verde:** Servicios funcionando
- **Rojo:** Servicios con problemas
- **Amarillo:** Advertencias
- **Azul:** Métricas normales

## 🔍 Navegación

### Acceso a Dashboards

1. Abrir `http://localhost:3007`
2. Login con `admin/admin`
3. Ir a "Dashboards" en el menú lateral
4. Buscar dashboards con tag "sgu"

### Filtros Disponibles

- **Time Range:** Última hora, día, semana
- **Refresh:** 5s, 30s, 1m, 5m
- **Variables:** Servicios, bases de datos

## 📈 Alertas Configuradas

### Alertas de Sistema

- **Service Down:** Cuando `up == 0`
- **High Error Rate:** Cuando errores > 10%
- **High Response Time:** Cuando p95 > 1s
- **Database Connection Issues:** Cuando conexiones > 80%

### Canales de Notificación

- **Email:** Configurado para administradores
- **Slack:** Canal #sgu-alerts
- **Webhook:** Para integración con sistemas externos

## 🛠️ Comandos Útiles

### Verificar Estado

```bash
# Verificar Prometheus
curl http://localhost:9090/api/v1/targets

# Verificar Grafana
curl http://localhost:3007/api/health

# Verificar métricas
curl http://localhost:9090/api/v1/query?query=up
```

### Reiniciar Servicios

```bash
# Reiniciar Prometheus
docker-compose restart prometheus

# Reiniciar Grafana
docker-compose restart grafana

# Reiniciar todo el monitoreo
docker-compose restart prometheus grafana
```

## 📚 Recursos Adicionales

### Documentación

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [SGU System Status](./SYSTEM_STATUS.md)

### URLs Importantes

- **Prometheus:** `http://localhost:9090`
- **Grafana:** `http://localhost:3007`
- **API Gateway:** `http://localhost:3000`
- **Frontend SPA:** `http://localhost:3005`

---

**🎯 Estado:** Dashboards configurados y funcionando  
**📅 Última actualización:** 29 de Septiembre, 2025  
**👨‍💻 Desarrollado por:** Equipo SGU Development
