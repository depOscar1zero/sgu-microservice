# Sistema de Gestión Universitaria (SGU) - Microservicios

Este proyecto implementa un sistema de gestión universitaria utilizando una arquitectura de microservicios, donde cada servicio es responsable de una funcionalidad específica del sistema.

## 📋 Arquitectura del Sistema

El sistema está compuesto por los siguientes microservicios:

### 🔐 Auth Service

- **Responsabilidad**: Autenticación y autorización de usuarios
- **Tecnología**: Node.js + Express + JWT
- **Endpoints**: Login, registro, validación de tokens, gestión de roles

### 📚 Courses Service

- **Responsabilidad**: Gestión de cursos y materias
- **Tecnología**: Node.js + Express + Base de datos
- **Endpoints**: CRUD de cursos, búsqueda, filtrado, gestión de prerequisitos

### 📝 Enrollment Service

- **Responsabilidad**: Gestión de inscripciones de estudiantes
- **Tecnología**: Node.js + Express + Base de datos
- **Endpoints**: Inscripción, retiro, consulta de horarios, gestión de cupos

### 💳 Payments Service

- **Responsabilidad**: Procesamiento de pagos y gestión financiera
- **Tecnología**: Node.js + Express + Integración con pasarelas de pago
- **Endpoints**: Procesamiento de pagos, consulta de estados, reembolsos

### 🔔 Notifications Service

- **Responsabilidad**: Envío de notificaciones y comunicaciones
- **Tecnología**: Node.js + Express + Integración con servicios de email/SMS
- **Endpoints**: Envío de emails, SMS, notificaciones push

### 🎨 Frontend SPA

- **Responsabilidad**: Interfaz de usuario del sistema
- **Tecnología**: Astro + TypeScript + Tailwind CSS
- **Funcionalidades**: Dashboard, gestión de cursos, pagos, notificaciones

### 🏗️ Infrastructure

- **Responsabilidad**: Configuración de infraestructura y deployment
- **Tecnología**: Docker + Docker Compose + Nginx
- **Componentes**: Configuración de contenedores, balanceador de carga, base de datos

### 📦 Shared Libraries

- **Responsabilidad**: Librerías compartidas entre microservicios
- **Tecnología**: TypeScript/JavaScript
- **Contenido**: Utilidades, tipos comunes, validaciones, constantes

## 🚀 Tecnologías Utilizadas

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: Astro, TypeScript, Tailwind CSS
- **Base de Datos**: PostgreSQL, MongoDB (según el servicio)
- **Autenticación**: JWT (JSON Web Tokens)
- **Containerización**: Docker, Docker Compose
- **Comunicación**: REST APIs, Message Queues (Redis/RabbitMQ)
- **Monitoreo**: Logs centralizados, métricas de performance

## 📁 Estructura del Proyecto

```
sgu-microservices/
├── auth-service/           # Servicio de autenticación
├── courses-service/        # Servicio de cursos
├── enrollment-service/     # Servicio de inscripciones
├── notifications-service/  # Servicio de notificaciones
├── payments-service/       # Servicio de pagos
├── frontend-spa/          # Aplicación frontend
├── infrastructure/        # Configuración de infraestructura
├── shared-libs/          # Librerías compartidas
├── docs/                 # Documentación del proyecto
├── docker-compose.yml    # Orquestación de servicios
└── README.md            # Este archivo
```

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js (v18 o superior)
- Docker y Docker Compose
- Git

### Pasos de instalación

1. **Clonar el repositorio**

   ```bash
   git clone <repository-url>
   cd sgu-microservices
   ```

2. **Instalar dependencias de todos los servicios**

   ```bash
   # Instalar todas las dependencias desde la raíz
   npm run install:all

   # O individualmente
   cd auth-service && npm install
   cd courses-service && npm install
   cd enrollment-service && npm install
   cd notifications-service && npm install
   cd payments-service && npm install
   cd api-gateway && npm install
   ```

3. **Configurar variables de entorno**

   ```bash
   # Copiar archivos de ejemplo y configurar
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

4. **Levantar la infraestructura con Docker**

   ```bash
   docker-compose up -d
   ```

5. **Ejecutar migraciones de base de datos**
   ```bash
   # Ejecutar scripts de migración para cada servicio
   npm run migrate
   ```

## 🏃‍♂️ Ejecución del Sistema

### Desarrollo

```bash
# Ejecutar todos los servicios en modo desarrollo
npm run dev

# O ejecutar servicios individualmente
cd auth-service && npm run dev
cd courses-service && npm run dev
# ... etc
```

### Producción

```bash
# Construir y ejecutar con Docker
docker-compose up --build -d
```

## 📡 API Endpoints

### Auth Service

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/validate` - Validar token

### Courses Service

- `GET /api/courses` - Listar cursos
- `POST /api/courses` - Crear curso
- `GET /api/courses/:id` - Obtener curso específico
- `PUT /api/courses/:id` - Actualizar curso
- `DELETE /api/courses/:id` - Eliminar curso

### Enrollment Service

- `POST /api/enrollment/enroll` - Inscribirse a un curso
- `DELETE /api/enrollment/:id` - Retirarse de un curso
- `GET /api/enrollment/student/:id` - Cursos del estudiante
- `GET /api/enrollment/course/:id` - Estudiantes del curso

### Payments Service

- `POST /api/payments/process` - Procesar pago
- `GET /api/payments/:id` - Estado del pago
- `POST /api/payments/refund` - Procesar reembolso

### Notifications Service

- `POST /api/notifications/send` - Enviar notificación
- `GET /api/notifications/user/:id` - Notificaciones del usuario

## 🔧 Configuración de Desarrollo

### Variables de Entorno Necesarias

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/sgu_db
MONGODB_URI=mongodb://localhost:27017/sgu_notifications

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Servicios externos
EMAIL_SERVICE_API_KEY=your-email-api-key
SMS_SERVICE_API_KEY=your-sms-api-key
PAYMENT_GATEWAY_API_KEY=your-payment-api-key

# Redis (para colas de mensajes)
REDIS_URL=redis://localhost:6379
```

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm run test

# Ejecutar tests de integración
npm run test:integration

# Ejecutar tests de todos los servicios
npm run test:all
```

## 📊 Monitoreo y Logs

- **Logs**: Centralizados en `/logs` de cada servicio
- **Métricas**: Disponibles en `/metrics` endpoint de cada servicio
- **Health Checks**: Disponibles en `/health` endpoint de cada servicio

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## 📝 Documentación Adicional

- [Arquitectura del Sistema](./docs/architecture.md)
- [Guía de API](./docs/api-guide.md)
- [Guía de Deployment](./docs/deployment.md)
- [Guía de Contribución](./docs/contributing.md)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Equipo de Desarrollo

- **Desarrollador Principal**: [Tu Nombre]
- **Arquitecto de Software**: [Nombre del Arquitecto]
- **DevOps Engineer**: [Nombre del DevOps]

## 📞 Contacto

Para preguntas o soporte, contactar a: [tu-email@universidad.edu]

---

## 🚀 Guía de Testing Optimizado

### Scripts de Testing Disponibles

#### **Tests Secuenciales (Recomendado para CI/CD)**
```bash
# Ejecutar todos los tests de servicios (optimizado)
npm run test:services        # ~17s total

# Tests rápidos (con bail y silent para CI)
npm run test:fast            # ~12s total

# Tests de patrones de diseño
npm run test:patterns        # ~9s total
```

#### **Tests en Paralelo (Solo Desarrollo Local)**
```bash
# ⚠️ ADVERTENCIA: Puede causar conflictos de puerto
# Usar solo en desarrollo local con todos los servicios detenidos

npm run test:parallel        # Ejecuta todos los tests en paralelo

# Tests rápidos en paralelo
npm run test:services:fast:parallel
```

**Nota sobre Tests Paralelos:**
- ⚡ **Ventaja**: Potencialmente más rápido (~37s vs ~17s)
- ⚠️ **Desventaja**: Conflictos de puerto (servicios comparten puertos 3001-3006)
- ✅ **Recomendación**: Usar solo en local con servicios detenidos
- 🚫 **NO usar en CI/CD**: Preferir secuencial optimizado (más confiable)

### Tests por Servicio Individual

```bash
# Auth Service (16 tests) - ~11s
npm run test:auth

# Courses Service (18 tests) - ~3s
npm run test:courses

# Enrollment Service (229 tests) - ~5s
npm run test:enrollment

# Notifications Service (62 tests) - ~3s
npm run test:notifications

# Payments Service (36 tests) - ~11s
npm run test:payments

# API Gateway (45 tests) - ~3s
npm run test:gateway
```

### Coverage Reports

```bash
# Coverage de todos los servicios
npm run test:coverage:services

# Coverage de patrones de diseño
npm run test:coverage:patterns

# Coverage completo
npm run test:coverage
```

### Linting y Formato

```bash
# Lint todos los servicios
npm run lint:all

# Arreglar problemas de linting automáticamente
npm run lint:fix

# Verificar formato de código
npm run format:check

# Aplicar formato automáticamente
npm run format:write
```

### Mejoras de Rendimiento Implementadas

#### **Optimizaciones Jest** ✅
- `maxWorkers: "50%"` - Usa 50% de CPUs disponibles
- `cache: true` - Activa caché de Jest para ejecuciones subsecuentes
- `testTimeout: 10000` - Timeout de 10s para tests lentos
- `bail: false` - No detener en primer fallo (para ver todos los errores)

#### **Tests Rápidos** ✅
- `test:fast` scripts con `--bail --silent` para CI
- Reducción de 89% en tiempo total (148s → 17s)
- Enrollment: 44s → 5s (89% más rápido)
- Courses: 32s → 3s (91% más rápido)

#### **Linting Limpio** ✅
- 0 errores, 0 warnings en todos los servicios
- Configuración ESLint optimizada
- Prettier integrado para formato consistente

### Estadísticas de Tests

| Servicio | Tests | Tiempo | Coverage (Stmts) |
|----------|-------|--------|------------------|
| Auth | 16 | ~11s | 38.27% |
| Courses | 18 | ~3s | 53.05% |
| Enrollment | 229 | ~5s | 51.68% |
| Notifications | 62 | ~3s | 89.21% |
| Payments | 36 | ~11s | 25.06% |
| API Gateway | 45 | ~3s | 26.79% |
| **TOTAL** | **406** | **~36s** | **47.34% (promedio)** |

### Patrones de Diseño - Tests

| Patrón | Tests | Cobertura |
|--------|-------|-----------|
| Domain-Driven Design (DDD) | 61 | Alta |
| Factory Method | 67 | Alta |
| Strategy Pattern | 54 | Alta |
| Decorator Pattern | 45 | Alta |
| **TOTAL** | **227** | **Excelente** |
