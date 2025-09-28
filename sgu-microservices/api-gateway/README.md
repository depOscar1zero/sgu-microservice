# 🌐 API Gateway - SGU

API Gateway para el Sistema de Gestión Universitaria (SGU). Proporciona enrutamiento, autenticación, rate limiting, monitoreo y balanceo de carga para todos los microservicios.

## 🚀 Características

- **🔄 Proxy Inteligente**: Enrutamiento automático a microservicios
- **🔐 Autenticación Centralizada**: JWT y API Keys
- **⚡ Rate Limiting**: Límites por IP, usuario y endpoint
- **🛡️ Circuit Breaker**: Protección contra fallos de servicios
- **📊 Monitoreo**: Métricas Prometheus y health checks
- **⚖️ Load Balancing**: Distribución de carga inteligente
- **📚 Documentación**: Swagger/OpenAPI integrado
- **🔒 Seguridad**: CORS, Helmet, validación de entrada

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **http-proxy-middleware** - Proxy HTTP
- **Redis** - Cache y rate limiting
- **Prometheus** - Métricas y monitoreo
- **JWT** - Autenticación
- **Swagger** - Documentación de API
- **Jest** - Testing

## 📦 Instalación

### Prerrequisitos

- Node.js 18+
- Redis (opcional, para rate limiting)
- Microservicios SGU ejecutándose

### Instalación Local

```bash
# Clonar repositorio
git clone <repository-url>
cd sgu-microservices/api-gateway

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus configuraciones

# Iniciar en modo desarrollo
npm run dev
```

### Docker

```bash
# Construir imagen
docker build -t sgu-api-gateway .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env sgu-api-gateway
```

## ⚙️ Configuración

### Variables de Entorno

```env
# Servidor
NODE_ENV=development
PORT=3000

# Servicios
AUTH_SERVICE_URL=http://localhost:3001
COURSES_SERVICE_URL=http://localhost:3002
ENROLLMENT_SERVICE_URL=http://localhost:3003
PAYMENTS_SERVICE_URL=http://localhost:3004
NOTIFICATIONS_SERVICE_URL=http://localhost:3005

# Autenticación
JWT_SECRET=your-secret-key
API_KEYS=key1,key2,key3

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Monitoreo
MONITORING_ENABLED=true
PROMETHEUS_ENABLED=true
```

## 📚 API Endpoints

### Gateway

```http
GET    /                    # Información del gateway
GET    /health              # Health check
GET    /metrics             # Métricas Prometheus
GET    /api-docs            # Documentación Swagger
```

### Servicios (Proxy)

```http
# Auth Service
POST   /api/auth/login      # Iniciar sesión
POST   /api/auth/register   # Registro
GET    /api/auth/profile    # Perfil de usuario

# Courses Service
GET    /api/courses         # Listar cursos
POST   /api/courses         # Crear curso
GET    /api/courses/:id     # Obtener curso

# Enrollment Service
GET    /api/enrollments     # Listar inscripciones
POST   /api/enrollments     # Inscribirse en curso
DELETE /api/enrollments/:id # Cancelar inscripción

# Payments Service
GET    /api/payments        # Listar pagos
POST   /api/payments        # Crear pago
POST   /api/payments/:id/process # Procesar pago

# Notifications Service
GET    /api/notifications   # Listar notificaciones
POST   /api/notifications   # Crear notificación
```

## 🔐 Autenticación

### JWT Token

```javascript
// Headers
Authorization: Bearer <jwt-token>
```

### API Key

```javascript
// Headers
X-API-Key: <api-key>
```

## ⚡ Rate Limiting

### Límites por Defecto

- **Global**: 1000 requests/15min
- **Auth**: 100 requests/15min
- **Payments**: 50 requests/15min
- **User**: 100 requests/15min
- **IP**: 200 requests/15min

### Headers de Rate Limit

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 🛡️ Circuit Breaker

### Estados

- **Closed**: Funcionamiento normal
- **Open**: Servicio no disponible
- **Half-Open**: Probando recuperación

### Configuración

```env
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60000
```

## 📊 Monitoreo

### Métricas Prometheus

```http
GET /metrics
```

### Métricas Disponibles

- `http_requests_total` - Total de requests HTTP
- `http_request_duration_seconds` - Duración de requests
- `service_health` - Salud de servicios
- `service_response_time_seconds` - Tiempo de respuesta
- `auth_attempts_total` - Intentos de autenticación
- `rate_limit_hits_total` - Hits de rate limiting
- `circuit_breaker_state` - Estado de circuit breakers

### Health Checks

```http
GET /health
```

Respuesta:

```json
{
  "success": true,
  "service": "API Gateway",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con cobertura
npm run test:coverage
```

## 🔧 Desarrollo

### Estructura del Proyecto

```
api-gateway/
├── src/
│   ├── config/             # Configuración del gateway
│   ├── services/           # Servicios (proxy, auth, rate limit)
│   ├── utils/              # Utilidades y logger
│   ├── app.js              # Aplicación Express
│   └── server.js           # Servidor principal
├── tests/                  # Tests
├── logs/                   # Logs de aplicación
├── Dockerfile              # Imagen Docker
└── package.json           # Dependencias
```

### Agregar Nuevo Servicio

1. **Configurar servicio** en `src/config/gateway.js`
2. **Agregar ruta** en `src/app.js`
3. **Configurar rate limiting** si es necesario
4. **Agregar tests** en `tests/`

### Agregar Nuevo Rate Limiter

```javascript
const rateLimitService = require("./services/rateLimitService");

// Crear limiter personalizado
const customLimiter = rateLimitService.createCustomLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests
  message: "Límite excedido",
  keyGenerator: (req) => req.user?.id || req.ip,
});
```

## 🚨 Troubleshooting

### Problemas Comunes

#### Servicio No Disponible

```bash
# Verificar que el servicio esté ejecutándose
curl http://localhost:3001/health
```

#### Rate Limit Excedido

```bash
# Verificar headers de rate limit
curl -I http://localhost:3000/api/courses
```

#### Circuit Breaker Abierto

```bash
# Verificar métricas
curl http://localhost:3000/metrics | grep circuit_breaker
```

#### Redis Connection Error

```bash
# Verificar que Redis esté ejecutándose
redis-cli ping
```

### Logs

```bash
# Ver logs en tiempo real
tail -f logs/gateway-combined.log

# Ver solo errores
tail -f logs/gateway-error.log
```

## 📈 Performance

### Optimizaciones

- **Connection Pooling**: Reutilizar conexiones HTTP
- **Caching**: Cache de respuestas frecuentes
- **Compression**: Compresión gzip
- **Keep-Alive**: Conexiones persistentes
- **Load Balancing**: Distribución de carga

### Métricas Importantes

- **Throughput**: Requests por segundo
- **Latency**: Tiempo de respuesta
- **Error Rate**: Porcentaje de errores
- **Circuit Breaker**: Estado de servicios

## 🔒 Seguridad

### Headers de Seguridad

- **Helmet**: Headers de seguridad
- **CORS**: Control de origen
- **Rate Limiting**: Protección contra abuso
- **JWT**: Autenticación segura
- **API Keys**: Autenticación alternativa

### Validación

- **Input Validation**: Validación de entrada
- **Sanitization**: Limpieza de datos
- **Rate Limiting**: Límites por usuario/IP
- **Authentication**: Verificación de tokens

## 🤝 Contribuir

1. Fork el repositorio
2. Crear feature branch (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico:

- **Email**: dev@sgu.edu
- **Slack**: #api-gateway
- **Issues**: GitHub Issues

---

**SGU API Gateway** - Sistema de Gestión Universitaria
