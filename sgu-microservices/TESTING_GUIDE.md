# 🧪 Guía de Pruebas - Sistema SGU

## 📋 Descripción

Esta guía describe cómo probar el sistema SGU completo con arquitectura de microservicios, incluyendo pruebas unitarias, de integración y end-to-end.

## 🎯 Tipos de Pruebas

### 1. Pruebas de Salud (Health Checks)

**Script:** `test-docker-system.js`

```bash
node test-docker-system.js
```

**Verifica:**

- ✅ Estado de todos los servicios
- ✅ Conectividad de red
- ✅ Respuesta de endpoints de salud

### 2. Pruebas de Integración

**Script:** `test-simple-flow.js`

```bash
node test-simple-flow.js
```

**Verifica:**

- ✅ API Gateway funcionando
- ✅ Todos los microservicios respondiendo
- ✅ Frontend SPA accesible
- ✅ Prometheus y Grafana operativos

### 3. Pruebas End-to-End

**Script:** `test-end-to-end.js`

```bash
node test-end-to-end.js
```

**Flujo completo:**

1. Registro de usuario
2. Inicio de sesión
3. Creación de curso
4. Inscripción al curso
5. Procesamiento de pago
6. Verificación de notificaciones

## 🔧 Configuración de Pruebas

### Requisitos Previos

```bash
# Instalar dependencias
npm install axios

# Verificar que Docker esté ejecutándose
docker-compose ps

# Iniciar todos los servicios
docker-compose up -d
```

### Variables de Entorno

```bash
# URLs de servicios
API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3005
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3007
```

## 📊 Servicios a Probar

### Microservicios Core

| Servicio                  | Puerto | Endpoint de Salud           | Descripción               |
| ------------------------- | ------ | --------------------------- | ------------------------- |
| **API Gateway**           | 3000   | `/health`                   | Proxy centralizado        |
| **Auth Service**          | 3001   | `/health`                   | Autenticación JWT         |
| **Courses Service**       | 3002   | `/health`                   | Gestión de cursos         |
| **Enrollment Service**    | 3003   | `/health`                   | Inscripciones             |
| **Payments Service**      | 3004   | `/health`                   | Procesamiento de pagos    |
| **Notifications Service** | 3006   | `/api/notifications/health` | Sistema de notificaciones |

### Frontend y Monitoreo

| Servicio         | Puerto | Endpoint | Descripción                |
| ---------------- | ------ | -------- | -------------------------- |
| **Frontend SPA** | 3005   | `/`      | Interfaz de usuario        |
| **Prometheus**   | 9090   | `/`      | Métricas y monitoreo       |
| **Grafana**      | 3007   | `/`      | Dashboards y visualización |

## 🧪 Casos de Prueba

### 1. Prueba de Conectividad

```javascript
// Verificar que todos los servicios respondan
const services = [
  { name: "API Gateway", url: "http://localhost:3000/health" },
  { name: "Auth Service", url: "http://localhost:3001/health" },
  { name: "Courses Service", url: "http://localhost:3002/health" },
  { name: "Enrollment Service", url: "http://localhost:3003/health" },
  { name: "Payments Service", url: "http://localhost:3004/health" },
  {
    name: "Notifications Service",
    url: "http://localhost:3006/api/notifications/health",
  },
  { name: "Frontend SPA", url: "http://localhost:3005/" },
  { name: "Prometheus", url: "http://localhost:9090/" },
  { name: "Grafana", url: "http://localhost:3007/" },
];
```

### 2. Prueba de Autenticación

```javascript
// Registrar usuario
const user = {
  firstName: "Juan",
  lastName: "Pérez",
  email: "juan.perez@test.com",
  password: "TestPassword123!",
  studentId: "STU001",
  department: "Computer Science",
};

const registerResponse = await axios.post(
  `${API_BASE_URL}/api/auth/register`,
  user
);

// Iniciar sesión
const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
  email: user.email,
  password: user.password,
});

const token = loginResponse.data.token;
```

### 3. Prueba de Cursos

```javascript
// Crear curso
const course = {
  code: "CS101",
  name: "Introduction to Programming",
  description: "Basic programming concepts using Python",
  credits: 4,
  department: "Computer Science",
  professor: "Dr. John Smith",
  capacity: 40,
  semester: "Fall",
  year: 2024,
  price: 500.0,
};

const courseResponse = await axios.post(`${API_BASE_URL}/api/courses`, course, {
  headers: { Authorization: `Bearer ${token}` },
});
```

### 4. Prueba de Inscripciones

```javascript
// Inscribirse al curso
const enrollment = {
  courseId: courseId,
  studentId: user.studentId,
};

const enrollmentResponse = await axios.post(
  `${API_BASE_URL}/api/enrollments`,
  enrollment,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);
```

### 5. Prueba de Pagos

```javascript
// Procesar pago
const payment = {
  enrollmentId: enrollmentId,
  amount: course.price,
  currency: "USD",
  paymentMethod: "card",
};

const paymentResponse = await axios.post(
  `${API_BASE_URL}/api/payments`,
  payment,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);
```

## 🔍 Verificación de Resultados

### Códigos de Estado Esperados

- **200 OK** - Operación exitosa
- **201 Created** - Recurso creado
- **400 Bad Request** - Datos inválidos
- **401 Unauthorized** - Token inválido
- **404 Not Found** - Recurso no encontrado
- **500 Internal Server Error** - Error del servidor

### Respuestas Esperadas

```json
// Health Check
{
  "status": "OK",
  "service": "Service Name",
  "timestamp": "2025-09-29T05:41:50.357Z",
  "version": "1.0.0"
}

// Login Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  }
}

// Course Response
{
  "id": "course_id",
  "code": "CS101",
  "name": "Introduction to Programming",
  "credits": 4,
  "price": 500.00
}
```

## 🐛 Troubleshooting

### Problemas Comunes

#### 1. Servicio No Disponible

```bash
# Verificar estado de Docker
docker-compose ps

# Ver logs del servicio
docker-compose logs [service-name]

# Reiniciar servicio
docker-compose restart [service-name]
```

#### 2. Error de Conexión

```bash
# Verificar puertos
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :3002

# Verificar firewall
# Windows: Windows Defender Firewall
# Linux: ufw status
```

#### 3. Error de Autenticación

```bash
# Verificar JWT_SECRET
docker-compose logs auth-service

# Verificar token
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/auth/profile
```

#### 4. Error de Base de Datos

```bash
# Verificar PostgreSQL
docker-compose logs postgres

# Verificar conexiones
docker exec sgu-postgres psql -U sgu_user -d sgu_db -c "SELECT 1;"
```

## 📈 Métricas de Pruebas

### Tiempos de Respuesta Esperados

- **API Gateway:** < 100ms
- **Auth Service:** < 200ms
- **Courses Service:** < 150ms
- **Enrollment Service:** < 200ms
- **Payments Service:** < 500ms
- **Notifications Service:** < 300ms

### Throughput Esperado

- **Requests/sec:** > 100
- **Concurrent Users:** > 50
- **Database Connections:** < 80% del pool

## 🎯 Próximos Pasos

### Pruebas Automatizadas

1. **Jest** - Pruebas unitarias
2. **Supertest** - Pruebas de API
3. **Puppeteer** - Pruebas E2E
4. **GitHub Actions** - CI/CD

### Monitoreo Continuo

1. **Prometheus** - Métricas en tiempo real
2. **Grafana** - Dashboards y alertas
3. **Logs** - Análisis de errores
4. **Health Checks** - Verificación automática

---

**🎯 Estado:** Sistema completamente probado y funcionando  
**📅 Última actualización:** 29 de Septiembre, 2025  
**👨‍💻 Desarrollado por:** Equipo SGU Development
