# 🔔 Notifications Service - SGU

Servicio de notificaciones para el Sistema de Gestión Universitaria (SGU). Maneja el envío de emails, SMS, push notifications y notificaciones in-app.

## 🚀 Características

- **📧 Email Notifications**: Envío de emails con templates personalizables
- **📱 SMS Notifications**: Envío de SMS via Twilio
- **🔔 Push Notifications**: Notificaciones push via Firebase
- **📋 In-App Notifications**: Notificaciones dentro de la aplicación
- **⏰ Scheduled Notifications**: Notificaciones programadas
- **🔄 Queue System**: Sistema de colas con Redis y Bull
- **📊 Templates**: Sistema de templates reutilizables
- **📈 Analytics**: Estadísticas y métricas de notificaciones

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Redis** - Cache y colas
- **Bull** - Sistema de colas
- **Nodemailer** - Envío de emails
- **Twilio** - Envío de SMS
- **Firebase Admin** - Push notifications
- **JWT** - Autenticación
- **Jest** - Testing

## 📦 Instalación

### Prerrequisitos

- Node.js 18+
- MongoDB
- Redis
- Cuenta de Twilio (para SMS)
- Proyecto de Firebase (para push notifications)

### Instalación Local

```bash
# Clonar repositorio
git clone <repository-url>
cd sgu-microservices/notifications-service

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
docker build -t sgu-notifications-service .

# Ejecutar contenedor
docker run -p 3005:3005 --env-file .env sgu-notifications-service
```

## ⚙️ Configuración

### Variables de Entorno

```env
# Servidor
NODE_ENV=development
PORT=3005

# Base de datos
MONGODB_URI=mongodb://localhost:27017/sgu_notifications

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Autenticación
JWT_SECRET=your-secret-key
AUTH_SERVICE_URL=http://localhost:3001

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Push (Firebase)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## 📚 API Endpoints

### Notificaciones

```http
POST   /api/notifications                    # Crear notificación
GET    /api/notifications/user/:userId       # Obtener notificaciones de usuario
GET    /api/notifications/:id                # Obtener notificación por ID
PATCH  /api/notifications/:id/read           # Marcar como leída
PATCH  /api/notifications/:id/cancel         # Cancelar notificación
POST   /api/notifications/:id/resend         # Reenviar notificación
GET    /api/notifications/stats              # Obtener estadísticas
POST   /api/notifications/send-immediate     # Enviar notificación inmediata
```

### Templates

```http
POST   /api/notifications/templates                    # Crear template
GET    /api/notifications/templates                    # Obtener templates
GET    /api/notifications/templates/:id               # Obtener template por ID
PUT    /api/notifications/templates/:id                # Actualizar template
DELETE /api/notifications/templates/:id                # Eliminar template
POST   /api/notifications/templates/:id/render        # Renderizar template
GET    /api/notifications/templates/category/:category # Templates por categoría
GET    /api/notifications/templates/type/:type        # Templates por tipo
POST   /api/notifications/templates/:id/duplicate     # Duplicar template
```

## 💡 Ejemplos de Uso

### Crear Notificación

```javascript
const response = await fetch("/api/notifications", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer your-token",
  },
  body: JSON.stringify({
    userId: "user-123",
    type: "email",
    subject: "Bienvenido al SGU",
    message: "Tu cuenta ha sido creada exitosamente",
    recipient: {
      email: "user@example.com",
      name: "Juan Pérez",
    },
    priority: "normal",
  }),
});
```

### Crear Template

```javascript
const response = await fetch("/api/notifications/templates", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer your-token",
  },
  body: JSON.stringify({
    name: "welcome-email",
    type: "email",
    category: "welcome",
    subject: "Bienvenido {{firstName}}",
    content: "Hola {{firstName}}, bienvenido al SGU",
    variables: [
      {
        name: "firstName",
        description: "Nombre del usuario",
        required: true,
      },
    ],
  }),
});
```

### Enviar Notificación Inmediata

```javascript
const response = await fetch("/api/notifications/send-immediate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer your-token",
  },
  body: JSON.stringify({
    userId: "user-123",
    type: "email",
    subject: "Notificación Urgente",
    message: "Este es un mensaje urgente",
    recipient: {
      email: "user@example.com",
    },
  }),
});
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

## 📊 Monitoreo

### Health Check

```http
GET /health
```

Respuesta:

```json
{
  "success": true,
  "service": "Notifications Service",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Métricas de Cola

```javascript
const queueService = require("./src/services/queueService");
const stats = await queueService.getQueueStats();
console.log(stats);
```

## 🔧 Desarrollo

### Estructura del Proyecto

```
notifications-service/
├── src/
│   ├── controllers/          # Controladores
│   ├── models/              # Modelos de MongoDB
│   ├── services/            # Servicios (email, SMS, push)
│   ├── middleware/          # Middleware personalizado
│   ├── routes/             # Rutas de la API
│   ├── utils/              # Utilidades
│   ├── config/             # Configuración
│   ├── app.js              # Aplicación Express
│   └── server.js           # Servidor principal
├── tests/                  # Tests
├── logs/                   # Logs de aplicación
├── Dockerfile              # Imagen Docker
└── package.json           # Dependencias
```

### Agregar Nuevo Tipo de Notificación

1. **Crear servicio** en `src/services/`
2. **Actualizar modelo** en `src/models/Notification.js`
3. **Agregar procesador** en `src/services/queueService.js`
4. **Actualizar validaciones** en `src/middleware/validationMiddleware.js`

### Agregar Nuevo Template

1. **Crear template** via API o directamente en MongoDB
2. **Definir variables** requeridas
3. **Configurar settings** (prioridad, reintentos, etc.)

## 🚨 Troubleshooting

### Problemas Comunes

#### Redis Connection Error

```bash
# Verificar que Redis esté ejecutándose
redis-cli ping
# Debe responder: PONG
```

#### MongoDB Connection Error

```bash
# Verificar conexión a MongoDB
mongosh "mongodb://localhost:27017/sgu_notifications"
```

#### SMTP Authentication Failed

- Verificar credenciales SMTP
- Usar contraseñas de aplicación para Gmail
- Verificar configuración de 2FA

#### Twilio SMS Failed

- Verificar credenciales de Twilio
- Verificar número de teléfono verificado
- Verificar saldo de cuenta

#### Firebase Push Failed

- Verificar configuración de Firebase
- Verificar que el token del dispositivo sea válido
- Verificar permisos de Firebase Admin SDK

### Logs

```bash
# Ver logs en tiempo real
tail -f logs/combined.log

# Ver solo errores
tail -f logs/error.log
```

## 📈 Performance

### Optimizaciones

- **Connection Pooling**: MongoDB y Redis
- **Queue Concurrency**: Configurar workers
- **Rate Limiting**: Limitar requests por IP
- **Caching**: Cache de templates frecuentes
- **Batch Processing**: Procesar notificaciones en lotes

### Métricas Importantes

- **Throughput**: Notificaciones por minuto
- **Latency**: Tiempo de procesamiento
- **Error Rate**: Porcentaje de fallos
- **Queue Length**: Notificaciones pendientes

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
- **Slack**: #notifications-service
- **Issues**: GitHub Issues

---

**SGU Notifications Service** - Sistema de Gestión Universitaria
