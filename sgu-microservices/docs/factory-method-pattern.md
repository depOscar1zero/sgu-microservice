# Patrón Factory Method - Documentación

## 📋 Resumen

El **Factory Method Pattern** es un patrón de diseño creacional que proporciona una interfaz para crear objetos en una superclase, pero permite a las subclases alterar el tipo de objetos que se crearán. Este patrón se ha implementado en el Sistema de Gestión Universitaria (SGU) para mejorar la flexibilidad y mantenibilidad del código.

## 🎯 Objetivos del Patrón

- **Encapsulación de la creación de objetos**: Centralizar la lógica de creación de objetos complejos
- **Flexibilidad**: Permitir la creación de diferentes tipos de objetos sin modificar el código cliente
- **Extensibilidad**: Facilitar la adición de nuevos tipos de objetos
- **Separación de responsabilidades**: Separar la lógica de creación de la lógica de negocio

## 🏗️ Arquitectura del Patrón

### Estructura General

```
AbstractFactory
├── ConcreteFactoryA
├── ConcreteFactoryB
└── ConcreteFactoryC

AbstractProduct
├── ConcreteProductA
├── ConcreteProductB
└── ConcreteProductC
```

### Componentes Principales

1. **Abstract Factory**: Define la interfaz para crear productos
2. **Concrete Factory**: Implementa la creación de productos específicos
3. **Abstract Product**: Define la interfaz de los productos
4. **Concrete Product**: Implementación específica del producto
5. **Factory Manager**: Gestiona y coordina los factories

## 🔧 Implementaciones en SGU

### 1. Notification Factory

**Ubicación**: `notifications-service/src/factories/NotificationFactory.js`

**Propósito**: Crear diferentes tipos de notificaciones según el contexto.

**Factories Implementados**:
- `WelcomeNotificationFactory`: Notificaciones de bienvenida
- `EnrollmentNotificationFactory`: Notificaciones de inscripción
- `PaymentNotificationFactory`: Notificaciones de pago
- `SystemNotificationFactory`: Notificaciones del sistema

**Ejemplo de Uso**:
```javascript
const notificationFactoryManager = require('./factories/NotificationFactory').notificationFactoryManager;

// Crear notificación de bienvenida
const welcomeNotification = notificationFactoryManager.createNotification('welcome', {
  user: { id: 'user-123', firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com' },
  studentId: 'STU-001'
});

// Crear notificación de pago
const paymentNotification = notificationFactoryManager.createNotification('payment', {
  user: { id: 'user-123', firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com' },
  payment: { id: 'payment-456', amount: 150.00, dueDate: '2024-01-15' },
  type: 'reminder'
});
```

### 2. Payment Factory

**Ubicación**: `payments-service/src/factories/PaymentFactory.js`

**Propósito**: Crear diferentes tipos de pagos según el método de pago.

**Factories Implementados**:
- `CreditCardPaymentFactory`: Pagos con tarjeta de crédito
- `DebitCardPaymentFactory`: Pagos con tarjeta de débito
- `BankTransferPaymentFactory`: Transferencias bancarias
- `CashPaymentFactory`: Pagos en efectivo
- `StripePaymentFactory`: Pagos con Stripe
- `TuitionPaymentFactory`: Pagos de matrícula
- `MaterialsPaymentFactory`: Pagos de materiales

**Ejemplo de Uso**:
```javascript
const paymentFactoryManager = require('./factories/PaymentFactory').paymentFactoryManager;

// Crear pago con tarjeta de crédito
const creditCardPayment = paymentFactoryManager.createPayment('credit_card', {
  enrollmentId: 'enrollment-123',
  userId: 'user-456',
  amount: 100.00,
  currency: 'USD',
  cardDetails: {
    cardType: 'Visa',
    last4: '4242',
    brand: 'visa',
    expiryMonth: 12,
    expiryYear: 2025
  }
});

// Crear pago de matrícula
const tuitionPayment = paymentFactoryManager.createTuitionPayment({
  enrollmentId: 'enrollment-123',
  userId: 'user-456',
  amount: 500.00,
  currency: 'USD',
  semester: 'Fall 2024',
  academicYear: '2024-2025'
});
```

### 3. Validator Factory

**Ubicación**: `enrollment-service/src/factories/ValidatorFactory.js`

**Propósito**: Crear diferentes tipos de validadores para el proceso de inscripción.

**Factories Implementados**:
- `CapacityValidatorFactory`: Validador de disponibilidad de cupos
- `PrerequisitesValidatorFactory`: Validador de prerequisitos
- `ScheduleValidatorFactory`: Validador de horarios
- `AcademicStatusValidatorFactory`: Validador de estado académico
- `PaymentValidatorFactory`: Validador de pagos pendientes
- `DeadlineValidatorFactory`: Validador de fechas límite

**Ejemplo de Uso**:
```javascript
const validatorFactoryManager = require('./factories/ValidatorFactory').validatorFactoryManager;

// Crear validador de capacidad
const capacityValidator = validatorFactoryManager.createValidator('capacity', {
  maxCapacity: 30,
  currentEnrollments: 25
});

// Crear conjunto de validadores para inscripción
const enrollmentValidators = validatorFactoryManager.createEnrollmentValidators({
  courseCapacity: 30,
  currentEnrollments: 25,
  requiredCourses: ['MATH-101'],
  studentCompletedCourses: ['MATH-101'],
  studentGPA: 3.2,
  minGPA: 2.0,
  studentStatus: 'active'
});
```

## 🧪 Testing

### Estructura de Tests

Cada factory tiene su conjunto de tests correspondiente:

- `notifications-service/tests/factories/NotificationFactory.test.js`
- `payments-service/tests/factories/PaymentFactory.test.js`
- `enrollment-service/tests/factories/ValidatorFactory.test.js`

### Ejecutar Tests

```bash
# Tests de notificaciones
cd notifications-service
npm test -- tests/factories/NotificationFactory.test.js

# Tests de pagos
cd payments-service
npm test -- tests/factories/PaymentFactory.test.js

# Tests de validadores
cd enrollment-service
npm test -- tests/factories/ValidatorFactory.test.js
```

## 📊 Ventajas del Patrón

### ✅ Beneficios

1. **Flexibilidad**: Fácil adición de nuevos tipos de objetos
2. **Mantenibilidad**: Código más organizado y fácil de mantener
3. **Reutilización**: Lógica de creación centralizada y reutilizable
4. **Testabilidad**: Fácil testing de cada factory por separado
5. **Extensibilidad**: Nuevos factories pueden ser agregados sin modificar código existente

### 🔄 Flujo de Trabajo

1. **Cliente** solicita creación de objeto
2. **Factory Manager** identifica el tipo requerido
3. **Concrete Factory** crea el objeto específico
4. **Product** es retornado al cliente

## 🚀 Casos de Uso en SGU

### 1. Sistema de Notificaciones

- **Bienvenida**: Nuevos usuarios reciben notificaciones personalizadas
- **Inscripción**: Confirmaciones automáticas de inscripción
- **Pagos**: Recordatorios y confirmaciones de pagos
- **Sistema**: Notificaciones de mantenimiento y actualizaciones

### 2. Procesamiento de Pagos

- **Múltiples Métodos**: Soporte para diferentes métodos de pago
- **Cálculo de Fees**: Fees automáticos según el método de pago
- **Tipos Específicos**: Matrícula, materiales, etc.

### 3. Validación de Inscripciones

- **Validaciones Múltiples**: Capacidad, prerequisitos, horarios, etc.
- **Configuración Flexible**: Diferentes reglas según el contexto
- **Validación Completa**: Conjunto de validadores para inscripción

## 🔧 Configuración y Uso

### Instalación de Dependencias

```bash
# En cada servicio
npm install
```

### Variables de Entorno

```env
# Notifications Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Payments Service
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

### Ejemplo de Integración

```javascript
// En un controlador
const { notificationFactoryManager } = require('../factories/NotificationFactory');
const { paymentFactoryManager } = require('../factories/PaymentFactory');
const { validatorFactoryManager } = require('../factories/ValidatorFactory');

// Crear notificación
const notification = notificationFactoryManager.createNotification('welcome', userData);

// Crear pago
const payment = paymentFactoryManager.createPayment('credit_card', paymentData);

// Crear validadores
const validators = validatorFactoryManager.createEnrollmentValidators(enrollmentConfig);
```

## 📈 Métricas y Monitoreo

### Métricas Implementadas

- **Tiempo de Creación**: Medición del tiempo de creación de objetos
- **Tasa de Éxito**: Porcentaje de objetos creados exitosamente
- **Uso por Tipo**: Estadísticas de uso de cada factory
- **Errores**: Tracking de errores en la creación de objetos

### Logging

```javascript
// Ejemplo de logging en factories
console.log(`Factory ${this.constructor.name} creando objeto de tipo ${type}`);
console.log(`Objeto creado exitosamente: ${JSON.stringify(result)}`);
```

## 🔮 Futuras Mejoras

### Roadmap

1. **Factory Registry**: Registro dinámico de factories
2. **Caching**: Cache de objetos creados frecuentemente
3. **Async Factories**: Soporte para creación asíncrona
4. **Factory Chains**: Encadenamiento de factories
5. **Metrics Dashboard**: Dashboard de métricas en tiempo real

### Extensiones Propuestas

- **Email Template Factory**: Para diferentes plantillas de email
- **Report Factory**: Para diferentes tipos de reportes
- **User Factory**: Para diferentes tipos de usuarios
- **Course Factory**: Para diferentes tipos de cursos

## 📚 Referencias

- [Design Patterns: Elements of Reusable Object-Oriented Software](https://en.wikipedia.org/wiki/Design_Patterns)
- [Factory Method Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/factory-method)
- [JavaScript Design Patterns](https://www.patterns.dev/posts/classic-design-patterns/)

## 🤝 Contribución

Para contribuir al patrón Factory Method:

1. Crear nuevo factory siguiendo la estructura base
2. Implementar tests correspondientes
3. Actualizar documentación
4. Seguir las convenciones de código establecidas

---

**Versión**: 1.0.0  
**Última Actualización**: Diciembre 2024  
**Mantenido por**: Equipo de Desarrollo SGU
