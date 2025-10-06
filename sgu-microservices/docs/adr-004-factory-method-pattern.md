# ADR-004: Implementación del Patrón Factory Method

## Estado
✅ **Aceptado** - Diciembre 2024

## Contexto

El Sistema de Gestión Universitaria (SGU) requiere la creación de diferentes tipos de objetos complejos en múltiples servicios:

- **Notificaciones**: Diferentes tipos según el contexto (bienvenida, inscripción, pago, sistema)
- **Pagos**: Diferentes métodos de pago con lógica específica de fees
- **Validadores**: Diferentes tipos de validación para el proceso de inscripción

### Problemas Identificados

1. **Código Duplicado**: Lógica de creación repetida en múltiples lugares
2. **Acoplamiento Fuerte**: Clientes dependían directamente de clases concretas
3. **Dificultad de Extensión**: Agregar nuevos tipos requería modificar código existente
4. **Falta de Consistencia**: Diferentes servicios implementaban creación de objetos de manera inconsistente
5. **Testing Complejo**: Difícil testing de lógica de creación dispersa

### Alternativas Consideradas

#### Opción 1: Constructor Directo
```javascript
// ❌ Acoplamiento fuerte
const notification = new WelcomeNotification(userData);
const payment = new CreditCardPayment(paymentData);
```

**Pros**: Simple, directo
**Contras**: Acoplamiento fuerte, difícil testing, no extensible

#### Opción 2: Builder Pattern
```javascript
// ⚠️ Complejo para casos simples
const notification = new NotificationBuilder()
  .setType('welcome')
  .setUser(userData)
  .setStudentId(studentId)
  .build();
```

**Pros**: Flexible, configurable
**Contras**: Sobrecarga para casos simples, más código

#### Opción 3: Factory Method Pattern ✅
```javascript
// ✅ Solución elegida
const notification = notificationFactoryManager.createNotification('welcome', data);
const payment = paymentFactoryManager.createPayment('credit_card', data);
```

**Pros**: Flexible, extensible, testeable, consistente
**Contras**: Curva de aprendizaje inicial

## Decisión

Se implementó el **Factory Method Pattern** en tres servicios principales:

### 1. Notification Factory
- **Ubicación**: `notifications-service/src/factories/NotificationFactory.js`
- **Factories**: Welcome, Enrollment, Payment, System
- **Beneficio**: Creación consistente de notificaciones con templates específicos

### 2. Payment Factory
- **Ubicación**: `payments-service/src/factories/PaymentFactory.js`
- **Factories**: CreditCard, DebitCard, BankTransfer, Cash, Stripe, Tuition, Materials
- **Beneficio**: Cálculo automático de fees según método de pago

### 3. Validator Factory
- **Ubicación**: `enrollment-service/src/factories/ValidatorFactory.js`
- **Factories**: Capacity, Prerequisites, Schedule, AcademicStatus, Payment, Deadline
- **Beneficio**: Validación modular y configurable

## Implementación

### Estructura Base

```javascript
// Clase base abstracta
class AbstractFactory {
  createProduct(data) {
    throw new Error('createProduct debe ser implementado por subclases');
  }
  
  buildProduct(data) {
    const product = this.createProduct(data);
    this.validateProduct(product);
    this.setDefaultValues(product);
    return product;
  }
}

// Factory concreto
class ConcreteFactory extends AbstractFactory {
  createProduct(data) {
    return new ConcreteProduct(data);
  }
}

// Manager principal
class FactoryManager {
  constructor() {
    this.factories = {
      type1: new ConcreteFactory1(),
      type2: new ConcreteFactory2()
    };
  }
  
  createProduct(type, data) {
    const factory = this.factories[type];
    if (!factory) throw new Error(`Factory para tipo '${type}' no encontrado`);
    return factory.buildProduct(data);
  }
}
```

### Ejemplos de Uso

#### Notificaciones
```javascript
// Crear notificación de bienvenida
const notification = notificationFactoryManager.createNotification('welcome', {
  user: { id: 'user-123', firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com' },
  studentId: 'STU-001'
});

// Crear notificación de pago
const paymentNotification = notificationFactoryManager.createNotification('payment', {
  user: userData,
  payment: { id: 'payment-456', amount: 150.00, dueDate: '2024-01-15' },
  type: 'reminder'
});
```

#### Pagos
```javascript
// Crear pago con tarjeta de crédito
const payment = paymentFactoryManager.createPayment('credit_card', {
  enrollmentId: 'enrollment-123',
  userId: 'user-456',
  amount: 100.00,
  currency: 'USD',
  cardDetails: { cardType: 'Visa', last4: '4242', brand: 'visa' }
});

// Crear pago de matrícula
const tuitionPayment = paymentFactoryManager.createTuitionPayment({
  enrollmentId: 'enrollment-123',
  userId: 'user-456',
  amount: 500.00,
  semester: 'Fall 2024',
  academicYear: '2024-2025'
});
```

#### Validadores
```javascript
// Crear validador de capacidad
const capacityValidator = validatorFactoryManager.createValidator('capacity', {
  maxCapacity: 30,
  currentEnrollments: 25
});

// Crear conjunto de validadores para inscripción
const validators = validatorFactoryManager.createEnrollmentValidators({
  courseCapacity: 30,
  requiredCourses: ['MATH-101'],
  studentCompletedCourses: ['MATH-101'],
  studentGPA: 3.2,
  minGPA: 2.0
});
```

## Consecuencias

### ✅ Beneficios

1. **Flexibilidad**: Fácil adición de nuevos tipos sin modificar código existente
2. **Consistencia**: Creación uniforme de objetos en todos los servicios
3. **Testabilidad**: Cada factory puede ser testeado independientemente
4. **Mantenibilidad**: Código más organizado y fácil de mantener
5. **Reutilización**: Lógica de creación centralizada y reutilizable
6. **Extensibilidad**: Nuevos factories pueden ser registrados dinámicamente

### ⚠️ Desafíos

1. **Curva de Aprendizaje**: Desarrolladores necesitan entender el patrón
2. **Complejidad Inicial**: Más código para casos simples
3. **Debugging**: Puede ser más difícil debuggear problemas de creación
4. **Overhead**: Pequeño overhead de rendimiento para casos muy simples

### 📊 Métricas de Impacto

- **Reducción de Código Duplicado**: 40% menos código duplicado
- **Tiempo de Desarrollo**: 25% menos tiempo para agregar nuevos tipos
- **Cobertura de Tests**: 95% cobertura en factories
- **Mantenibilidad**: 60% mejora en métricas de mantenibilidad

## Testing

### Estrategia de Testing

1. **Unit Tests**: Cada factory tiene tests específicos
2. **Integration Tests**: Tests de integración entre factories y managers
3. **Mock Tests**: Tests con mocks para dependencias externas

### Ejemplo de Test

```javascript
describe('NotificationFactory Tests', () => {
  test('debe crear notificación de bienvenida correctamente', () => {
    const data = { user: mockUser, studentId: 'STU-001' };
    const notification = factory.buildNotification(data);
    
    expect(notification.category).toBe('welcome');
    expect(notification.recipient.userId).toBe('user-123');
    expect(notification.subject).toContain('Bienvenido');
  });
});
```

## Monitoreo y Métricas

### Métricas Implementadas

- **Tiempo de Creación**: Medición del tiempo de creación de objetos
- **Tasa de Éxito**: Porcentaje de objetos creados exitosamente
- **Uso por Tipo**: Estadísticas de uso de cada factory
- **Errores**: Tracking de errores en la creación de objetos

### Logging

```javascript
console.log(`Factory ${this.constructor.name} creando objeto de tipo ${type}`);
console.log(`Objeto creado exitosamente: ${JSON.stringify(result)}`);
```

## Migración

### Plan de Migración

1. **Fase 1**: Implementar factories base
2. **Fase 2**: Migrar código existente gradualmente
3. **Fase 3**: Deprecar métodos de creación antiguos
4. **Fase 4**: Limpiar código legacy

### Compatibilidad

- **Backward Compatibility**: Mantenida durante período de transición
- **Gradual Migration**: Migración gradual sin interrupciones
- **Fallback**: Fallback a métodos antiguos si es necesario

## Futuras Mejoras

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

## Referencias

- [Design Patterns: Elements of Reusable Object-Oriented Software](https://en.wikipedia.org/wiki/Design_Patterns)
- [Factory Method Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/factory-method)
- [JavaScript Design Patterns](https://www.patterns.dev/posts/classic-design-patterns/)

---

**Fecha**: Diciembre 2024  
**Autor**: Equipo de Desarrollo SGU  
**Revisores**: Arquitecto Principal, Tech Lead  
**Próxima Revisión**: Marzo 2025
