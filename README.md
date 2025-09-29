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

2. **Instalar dependencias de cada servicio**

   ```bash
   # Para cada servicio
   cd auth-service && npm install
   cd courses-service && npm install
   cd enrollment-service && npm install
   cd notifications-service && npm install
   cd payments-service && npm install
   cd frontend-spa && npm install
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
# 
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

- [Documentos y diagramas](./docs)



## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Equipo de Desarrollo

- **Desarrollador Principal**: [Oscar Landeta
- **Arquitecto de Software**: Carlos Olaya
- **DevOps Engineer**: Jose Alverto Herrera
-**Desarrolladora**: Fatima Avelino

## 📞 Contacto

Para preguntas o soporte, contactar a: col2804040204@gmail.com
