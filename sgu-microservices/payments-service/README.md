# Payments Service - SGU Microservices

Microservicio de pagos para el Sistema de Gestión Universitaria (SGU).

## 🚀 Características

- **Procesamiento de pagos** con múltiples métodos (tarjeta, transferencia, efectivo)
- **Integración con Stripe** para pagos con tarjeta
- **Gestión de reembolsos** automática y manual
- **Validación de pagos** con verificación de inscripciones
- **Notificaciones** de estado de pago
- **Logging completo** de transacciones
- **API REST** completa y documentada

## 📋 Endpoints

### Pagos

- `POST /api/payments` - Crear nuevo pago
- `POST /api/payments/intent` - Crear Payment Intent (Stripe)
- `GET /api/payments` - Obtener pagos del usuario
- `GET /api/payments/:id` - Obtener pago por ID
- `GET /api/payments/enrollment/:id` - Obtener pagos por inscripción
- `POST /api/payments/:id/refund` - Procesar reembolso

### Administración

- `GET /api/payments/stats` - Estadísticas de pagos (admin)
- `GET /health` - Health check

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18+
- SQLite (desarrollo) o PostgreSQL (producción)
- Cuenta de Stripe (opcional para desarrollo)

### Configuración

1. **Instalar dependencias**

```bash
npm install
```

2. **Configurar variables de entorno**

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Variables de entorno importantes**

```env
# Servidor
PORT=3004
NODE_ENV=development

# Base de datos
DB_STORAGE=./payments.sqlite

# Servicios externos
AUTH_SERVICE_URL=http://localhost:3001
ENROLLMENT_SERVICE_URL=http://localhost:3003

# Stripe (opcional para desarrollo)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

4. **Iniciar el servicio**

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📊 Uso de la API

### Crear un pago

```bash
curl -X POST http://localhost:3004/api/payments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollmentId": "enrollment-uuid",
    "amount": 1500.00,
    "paymentMethod": "credit_card",
    "paymentMethodDetails": {
      "cardNumber": "4242424242424242",
      "expMonth": 12,
      "expYear": 2025,
      "cvc": "123"
    }
  }'
```

### Crear Payment Intent (Stripe)

```bash
curl -X POST http://localhost:3004/api/payments/intent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollmentId": "enrollment-uuid",
    "amount": 1500.00
  }'
```

### Obtener pagos del usuario

```bash
curl -X GET "http://localhost:3004/api/payments?status=completed&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Procesar reembolso

```bash
curl -X POST http://localhost:3004/api/payments/payment-uuid/refund \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500.00,
    "reason": "Cancelación de curso"
  }'
```

## 🔧 Configuración de Stripe

### Desarrollo

Para desarrollo, el servicio funciona sin configuración real de Stripe usando datos simulados.

### Producción

1. Crear cuenta en [Stripe](https://stripe.com)
2. Obtener claves de API
3. Configurar webhooks (opcional)
4. Actualizar variables de entorno

```env
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 🧪 Testing

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar con coverage
npm run test:coverage

# Modo watch
npm run test:watch
```

## 📝 Logs

Los logs se guardan en la carpeta `logs/`:

- `payments.log` - Logs generales
- `payments-error.log` - Solo errores
- `payments-debug.log` - Logs de debug (desarrollo)

```bash
# Ver logs en tiempo real
npm run logs

# Ver solo errores
npm run logs:error
```

## 🔒 Seguridad

- **Autenticación JWT** requerida para todas las rutas
- **Validación de entrada** estricta
- **Rate limiting** configurable
- **Logging de seguridad** para auditoría
- **Sanitización** de datos de entrada

## 📈 Monitoreo

### Health Check

```bash
curl http://localhost:3004/health
```

### Métricas

- Total de pagos procesados
- Tasa de éxito/fallo
- Tiempo promedio de procesamiento
- Estadísticas por método de pago

## 🚨 Troubleshooting

### Error: "No se puede conectar a la base de datos"

- Verificar que SQLite esté instalado
- Verificar permisos de escritura en el directorio

### Error: "Auth Service no disponible"

- Verificar que el Auth Service esté ejecutándose
- Verificar la URL en `AUTH_SERVICE_URL`

### Error: "Stripe error"

- Verificar claves de Stripe
- Verificar conexión a internet
- Revisar logs para detalles específicos

## 📚 Estructura del Proyecto

```
src/
├── config/          # Configuración
├── controllers/      # Controladores
├── middleware/       # Middleware personalizado
├── models/          # Modelos de base de datos
├── routes/          # Definición de rutas
├── services/        # Servicios externos
├── utils/           # Utilidades
├── app.js           # Aplicación Express
└── server.js        # Servidor principal
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles.
