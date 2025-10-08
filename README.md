# Sistema de Gestión Universitaria (SGU) - Microservicios

Este proyecto implementa un sistema de gestión universitaria utilizando una arquitectura de microservicios con patrones de diseño avanzados, donde cada servicio es responsable de una funcionalidad específica del sistema.

## 🎯 Características Principales

- ✅ **Arquitectura de Microservicios** completa con Docker
- ✅ **Patrones de Diseño** implementados: DDD, Factory Method, Strategy, Decorator
- ✅ **CI/CD Pipeline** con GitHub Actions
- ✅ **Monitoreo** con Prometheus y Grafana
- ✅ **API Gateway** con balanceador de carga
- ✅ **Frontend Moderno** con Astro y Tailwind CSS
- ✅ **Testing Completo** con Jest y cobertura de código
- ✅ **Documentación** detallada de patrones implementados

## 📋 Arquitectura del Sistema

El sistema está compuesto por los siguientes microservicios:

### 🔐 Auth Service

- **Responsabilidad**: Autenticación y autorización de usuarios
- **Tecnología**: Node.js + Express + JWT + SQLite
- **Patrones**: Decorator Pattern para middleware de autenticación
- **Endpoints**: Login, registro, validación de tokens, gestión de roles
- **Puerto**: 3001

### 📚 Courses Service

- **Responsabilidad**: Gestión de cursos y materias
- **Tecnología**: Node.js + Express + SQLite
- **Patrones**: Factory Method para creación de cursos
- **Endpoints**: CRUD de cursos, búsqueda, filtrado, gestión de prerequisitos
- **Puerto**: 3002

### 📝 Enrollment Service

- **Responsabilidad**: Gestión de inscripciones de estudiantes
- **Tecnología**: Node.js + Express + SQLite
- **Patrones**: Domain-Driven Design (DDD) + Strategy Pattern para validaciones
- **Endpoints**: Inscripción, retiro, consulta de horarios, gestión de cupos
- **Puerto**: 3003

### 💳 Payments Service

- **Responsabilidad**: Procesamiento de pagos y gestión financiera
- **Tecnología**: Node.js + Express + SQLite + Redis
- **Patrones**: Factory Method para diferentes tipos de pagos
- **Endpoints**: Procesamiento de pagos, consulta de estados, reembolsos
- **Puerto**: 3004

### 🔔 Notifications Service

- **Responsabilidad**: Envío de notificaciones y comunicaciones
- **Tecnología**: Node.js + Express + MongoDB + Redis
- **Patrones**: Factory Method para diferentes tipos de notificaciones
- **Endpoints**: Envío de emails, SMS, notificaciones push
- **Puerto**: 3006

### 🌐 API Gateway

- **Responsabilidad**: Punto de entrada único y balanceador de carga
- **Tecnología**: Node.js + Express + Redis
- **Patrones**: Decorator Pattern para middleware y logging
- **Funcionalidades**: Routing, autenticación, rate limiting, logging
- **Puerto**: 3000

### 🎨 Frontend SPA

- **Responsabilidad**: Interfaz de usuario del sistema
- **Tecnología**: Astro + TypeScript + Tailwind CSS
- **Funcionalidades**: Dashboard, gestión de cursos, pagos, notificaciones
- **Puerto**: 3005

### 🏗️ Infrastructure

- **Responsabilidad**: Configuración de infraestructura y deployment
- **Tecnología**: Docker + Docker Compose + Nginx + Prometheus + Grafana
- **Componentes**: Contenedores, balanceador, monitoreo, SSL
- **Monitoreo**: Prometheus (9090) + Grafana (3007)

## 🚀 Tecnologías Utilizadas

- **Backend**: Node.js (v18+), Express.js, JavaScript/TypeScript
- **Frontend**: Astro, TypeScript, Tailwind CSS
- **Base de Datos**: PostgreSQL, MongoDB, SQLite, Redis
- **Autenticación**: JWT (JSON Web Tokens)
- **Containerización**: Docker, Docker Compose
- **Comunicación**: REST APIs, Redis (Message Queue)
- **Monitoreo**: Prometheus, Grafana, Logs centralizados
- **Testing**: Jest, ESLint, Prettier
- **CI/CD**: GitHub Actions
- **Patrones de Diseño**: DDD, Factory Method, Strategy, Decorator

## 📁 Estructura del Proyecto

```
sgu-microservices/
├── api-gateway/           # API Gateway con Decorator Pattern
├── auth-service/          # Servicio de autenticación
├── courses-service/       # Servicio de cursos
├── enrollment-service/    # Servicio de inscripciones (DDD + Strategy)
├── notifications-service/ # Servicio de notificaciones
├── payments-service/      # Servicio de pagos
├── frontend-spa/         # Aplicación frontend (Astro)
├── infrastructure/       # Configuración de infraestructura
│   ├── nginx/           # Configuración de Nginx
│   ├── prometheus/      # Configuración de Prometheus
│   └── grafana/         # Configuración de Grafana
├── docs/                # Documentación del proyecto
│   ├── adr-*.md         # Architecture Decision Records
│   ├── *-pattern.md     # Documentación de patrones
│   └── DOCKER_*.md      # Guías de Docker
├── scripts/             # Scripts de automatización
├── tests/               # Tests de integración
├── docker-compose.yml   # Orquestación completa
├── docker-compose.simple.yml # Orquestación simplificada
├── env.example          # Variables de entorno de ejemplo
├── package.json         # Scripts de gestión del proyecto
└── README.md           # Este archivo
```

## 🛠️ Instalación y Configuración

### 📋 Prerrequisitos

#### Para Windows:

- **Docker Desktop** ([Descargar aquí](https://www.docker.com/products/docker-desktop/))
- **Git** ([Descargar aquí](https://git-scm.com/download/win))
- **Node.js v18+** ([Descargar aquí](https://nodejs.org/))
- **PowerShell 5.1+** (incluido en Windows 10/11)

#### Para Linux/macOS:

- **Docker** y **Docker Compose**
- **Git**
- **Node.js v18+**
- **Bash** o **Zsh**

### 🚀 Instalación Rápida (Recomendada)

#### Opción 1: Con Docker (Más Fácil)

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/depOscar1zero/sgu-microservice.git
   cd sgu-microservice/sgu-microservices
   ```

2. **Configurar variables de entorno**

   ```bash
   # Copiar archivo de configuración
   cp env.example .env
   # Editar .env si necesitas cambiar configuraciones
   ```

3. **Ejecutar con Docker**

   **En Windows (PowerShell):**

   ```powershell
   .\start-dev.ps1
   ```

   **En Linux/macOS:**

   ```bash
   chmod +x docker-start.sh
   ./docker-start.sh
   ```

   **O manualmente:**

   ```bash
   docker-compose up -d --build
   ```

4. **Verificar que todo funciona**
   ```bash
   docker-compose ps
   ```

#### Opción 2: Instalación Manual

1. **Clonar y configurar**

   ```bash
   git clone https://github.com/depOscar1zero/sgu-microservice.git
   cd sgu-microservice/sgu-microservices
   cp env.example .env
   ```

2. **Instalar dependencias**

   ```bash
   npm run install:all
   ```

3. **Levantar servicios individuales**
   ```bash
   # En terminales separadas
   npm run dev:auth
   npm run dev:courses
   npm run dev:enrollment
   npm run dev:payments
   npm run dev:notifications
   npm run dev:gateway
   ```

### 🔧 Configuración Avanzada

#### Variables de Entorno Importantes

Edita el archivo `.env` según tus necesidades:

```env
# Base de datos
DATABASE_URL=postgresql://sgu_user:sgu_password@localhost:5432/sgu_db
MONGODB_URI=mongodb://sgu_admin:sgu_mongo_password@localhost:27017/sgu_notifications

# JWT
JWT_SECRET=tu-clave-secreta-muy-segura
JWT_EXPIRES_IN=24h

# URLs de servicios (no cambiar si usas Docker)
AUTH_SERVICE_URL=http://localhost:3001
COURSES_SERVICE_URL=http://localhost:3002
ENROLLMENT_SERVICE_URL=http://localhost:3003
PAYMENTS_SERVICE_URL=http://localhost:3004
NOTIFICATIONS_SERVICE_URL=http://localhost:3006
```

## 🏃‍♂️ Ejecución del Sistema

### 🚀 Inicio Rápido

Una vez instalado, puedes ejecutar el sistema de varias formas:

#### Con Docker (Recomendado)

```bash
# Opción 1: Script automatizado
.\start-dev.ps1  # Windows
./docker-start.sh  # Linux/macOS

# Opción 2: Manual
docker-compose up -d --build
```

#### Verificar que todo funciona

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f auth-service
```

### 🌐 Acceso a los Servicios

Una vez iniciado, los servicios estarán disponibles en:

| Servicio                     | URL                   | Descripción                    |
| ---------------------------- | --------------------- | ------------------------------ |
| 🌐 **Frontend**              | http://localhost:3005 | Interfaz principal del sistema |
| 🔗 **API Gateway**           | http://localhost:3000 | Punto de entrada único         |
| 🔐 **Auth Service**          | http://localhost:3001 | Autenticación y autorización   |
| 📚 **Courses Service**       | http://localhost:3002 | Gestión de cursos              |
| 📝 **Enrollment Service**    | http://localhost:3003 | Inscripciones de estudiantes   |
| 💳 **Payments Service**      | http://localhost:3004 | Procesamiento de pagos         |
| 🔔 **Notifications Service** | http://localhost:3006 | Notificaciones                 |
| 📊 **Prometheus**            | http://localhost:9090 | Métricas del sistema           |
| 📈 **Grafana**               | http://localhost:3007 | Dashboards (admin/admin)       |

### 🛠️ Comandos Útiles

#### Gestión de Docker

```bash
# Iniciar todos los servicios
docker-compose up -d

# Parar todos los servicios
docker-compose down

# Reiniciar un servicio específico
docker-compose restart auth-service

# Ver logs de todos los servicios
docker-compose logs -f

# Reconstruir imágenes
docker-compose build --no-cache

# Limpiar volúmenes (¡CUIDADO! Borra datos)
docker-compose down -v
```

#### Testing y Desarrollo

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests de patrones específicos
npm run test:ddd        # Domain-Driven Design
npm run test:factory    # Factory Method
npm run test:strategy   # Strategy Pattern
npm run test:decorator  # Decorator Pattern

# Linting
npm run lint

# Instalar dependencias de todos los servicios
npm run install:all
```

### 🔧 Modo Desarrollo

Para desarrollo activo, puedes ejecutar servicios individualmente:

```bash
# En terminales separadas
cd auth-service && npm run dev
cd courses-service && npm run dev
cd enrollment-service && npm run dev
cd payments-service && npm run dev
cd notifications-service && npm run dev
cd api-gateway && npm run dev
cd frontend-spa && npm run dev
```

## 📡 API Endpoints

### 🔗 API Gateway (Puerto 3000)

- Punto de entrada único para todos los servicios
- Autenticación centralizada
- Rate limiting y logging

### 🔐 Auth Service (Puerto 3001)

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/validate` - Validar token
- `GET /api/auth/profile` - Obtener perfil del usuario

### 📚 Courses Service (Puerto 3002)

- `GET /api/courses` - Listar todos los cursos
- `POST /api/courses` - Crear nuevo curso
- `GET /api/courses/:id` - Obtener curso específico
- `PUT /api/courses/:id` - Actualizar curso
- `DELETE /api/courses/:id` - Eliminar curso
- `GET /api/courses/search?q=` - Buscar cursos

### 📝 Enrollment Service (Puerto 3003)

- `POST /api/enrollment/enroll` - Inscribirse a un curso
- `DELETE /api/enrollment/:id` - Retirarse de un curso
- `GET /api/enrollment/student/:id` - Cursos del estudiante
- `GET /api/enrollment/course/:id` - Estudiantes del curso
- `GET /api/enrollment/schedule/:studentId` - Horario del estudiante
- `POST /api/enrollment/validate` - Validar elegibilidad

### 💳 Payments Service (Puerto 3004)

- `POST /api/payments/process` - Procesar pago
- `GET /api/payments/:id` - Estado del pago
- `POST /api/payments/refund` - Procesar reembolso
- `GET /api/payments/student/:id` - Historial de pagos
- `POST /api/payments/validate` - Validar método de pago

### 🔔 Notifications Service (Puerto 3006)

- `POST /api/notifications/send` - Enviar notificación
- `GET /api/notifications/user/:id` - Notificaciones del usuario
- `PUT /api/notifications/:id/read` - Marcar como leída
- `DELETE /api/notifications/:id` - Eliminar notificación
- `POST /api/notifications/bulk` - Envío masivo

### 📊 Monitoreo

- **Prometheus**: http://localhost:9090 - Métricas del sistema
- **Grafana**: http://localhost:3007 - Dashboards (admin/admin)

## 🔧 Configuración de Desarrollo

### Variables de Entorno Necesarias

El archivo `env.example` contiene todas las variables necesarias. Copia este archivo a `.env` y ajusta según tus necesidades:

```env
# Base de datos
DATABASE_URL=postgresql://sgu_user:sgu_password@localhost:5432/sgu_db
MONGODB_URI=mongodb://sgu_admin:sgu_mongo_password@localhost:27017/sgu_notifications

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# URLs de servicios
AUTH_SERVICE_URL=http://localhost:3001
COURSES_SERVICE_URL=http://localhost:3002
ENROLLMENT_SERVICE_URL=http://localhost:3003
PAYMENTS_SERVICE_URL=http://localhost:3004
NOTIFICATIONS_SERVICE_URL=http://localhost:3006

# Redis
REDIS_URL=redis://localhost:6379

# Servicios externos (opcionales para desarrollo)
EMAIL_SERVICE_API_KEY=your-email-api-key
SMS_SERVICE_API_KEY=your-sms-api-key
PAYMENT_GATEWAY_API_KEY=your-payment-api-key

# Monitoreo
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3007
```

## 🧪 Testing

El proyecto incluye una suite completa de tests para todos los servicios y patrones de diseño:

### Tests Unitarios

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura de código
npm run test:coverage

# Tests por servicio
npm run test:auth
npm run test:courses
npm run test:enrollment
npm run test:payments
npm run test:notifications
npm run test:gateway
```

### Tests de Patrones de Diseño

```bash
# Domain-Driven Design
npm run test:ddd

# Factory Method Pattern
npm run test:factory

# Strategy Pattern
npm run test:strategy

# Decorator Pattern
npm run test:decorator

# Resumen de patrones
npm run patterns:summary
```

### Tests de Integración

```bash
# Tests de integración completos
npm run test:integration

# Tests con Docker
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

### Cobertura de Código

```bash
# Generar reportes de cobertura
npm run test:coverage

# Ver reportes en navegador
# Los reportes se generan en cada servicio: ./coverage/lcov-report/index.html
```

## 📊 Monitoreo y Logs

El sistema incluye monitoreo completo con Prometheus y Grafana:

### Métricas y Monitoreo

- **Prometheus**: http://localhost:9090 - Recopila métricas del sistema
- **Grafana**: http://localhost:3007 - Dashboards visuales (admin/admin)
- **Logs**: Centralizados en `/logs` de cada servicio
- **Health Checks**: Disponibles en `/health` endpoint de cada servicio
- **Métricas**: Disponibles en `/metrics` endpoint de cada servicio

### Verificación de Salud

```bash
# Verificar estado de todos los servicios
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Courses Service
curl http://localhost:3003/health  # Enrollment Service
curl http://localhost:3004/health  # Payments Service
curl http://localhost:3006/health  # Notifications Service
curl http://localhost:3000/health  # API Gateway
```

### Logs en Tiempo Real

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f auth-service
docker-compose logs -f enrollment-service
```

## 🚨 Solución de Problemas

### Problemas Comunes

#### Docker no inicia

```bash
# Verificar que Docker Desktop esté ejecutándose
docker --version

# Reiniciar Docker Desktop
# En Windows: Clic derecho en Docker Desktop > Restart
```

#### Puerto ocupado

```bash
# Verificar puertos en uso
netstat -ano | findstr :3000  # Windows
lsof -i :3000  # Linux/macOS

# Cambiar puertos en docker-compose.yml si es necesario
```

#### Servicios no se comunican

```bash
# Verificar red de Docker
docker network ls
docker network inspect sgu-microservices_sgu-network
```

#### Base de datos no conecta

```bash
# Verificar contenedores de BD
docker-compose ps postgres
docker-compose ps mongodb
docker-compose ps redis

# Ver logs de BD
docker-compose logs postgres
docker-compose logs mongodb
```

### Reset Completo

Si necesitas empezar desde cero:

```bash
# Parar todo y limpiar volúmenes
docker-compose down -v

# Limpiar imágenes
docker system prune -a

# Reconstruir todo
docker-compose up -d --build
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

### Estándares de Código

- Seguir los patrones de diseño implementados
- Mantener cobertura de tests > 80%
- Ejecutar `npm run lint` antes de commit
- Documentar nuevos endpoints en este README

## 📝 Documentación Adicional

- [📁 Documentos y diagramas](./docs)
- [🏗️ Architecture Decision Records](./docs/adr-*.md)
- [🎨 Patrones de Diseño](./docs/*-pattern.md)
- [🐳 Guías de Docker](./docs/DOCKER_*.md)
- [🧪 Guía de Testing](./docs/testing-guide.md)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Equipo de Desarrollo

- **Arquitecto y Desarrollador Principal**: Oscar Landeta
- **Arquitecto de Software**: Carlos Olaya
- **DevOps Engineer**: Jose Alberto Herrera
- **Desarrolladora**: Fatima Avelino

## 📞 Contacto

Para preguntas o soporte, contactar a: oespinozalandeta@gmail.com || col2804040204@gmail.com

---

## 🎉 ¡Listo para Usar!

Con estas instrucciones, el sistema SGU debería funcionar perfectamente en cualquier PC. Si encuentras algún problema, revisa la sección de **Solución de Problemas** o contacta al equipo de desarrollo.

**¡Disfruta explorando los microservicios y patrones de diseño implementados!** 🚀
