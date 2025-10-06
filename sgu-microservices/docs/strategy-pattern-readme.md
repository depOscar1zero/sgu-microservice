# 🎯 Patrón Strategy - Guía de Uso

## 📖 Introducción

El **patrón Strategy** ha sido implementado en el microservicio de inscripciones del SGU para modularizar las validaciones de inscripción. Esta implementación permite agregar, modificar o eliminar validaciones de manera independiente sin afectar el resto del sistema.

## 🚀 Inicio Rápido

### **1. Verificar que el sistema esté funcionando**
```bash
# Verificar contenedores Docker
docker ps

# Probar patrón Strategy
npm run test:docker-strategy
```

### **2. Ejecutar tests del patrón Strategy**
```bash
cd enrollment-service
npm test tests/strategies-simple.test.js
```

### **3. Probar en el microservicio**
```bash
# Iniciar microservicio
npm run dev

# Probar endpoint
curl -X POST http://localhost:3003/api/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"courseId": 1, "userId": 123, "semester": "2025-1"}'
```

## 🏗️ Arquitectura

### **Componentes Principales**

1. **ValidationStrategy** (Clase Base)
   - Interfaz abstracta para todas las estrategias
   - Define el contrato común
   - Implementa sistema de prioridades

2. **Estrategias Concretas**
   - `AvailabilityValidationStrategy`: Validación de disponibilidad
   - `PrerequisitesValidationStrategy`: Validación de prerrequisitos
   - `EnrollmentLimitValidationStrategy`: Validación de límites
   - `DuplicateEnrollmentValidationStrategy`: Validación de duplicados

3. **EnrollmentValidationContext** (Coordinador)
   - Gestiona la ejecución de estrategias
   - Ordena por prioridad
   - Coordina el flujo de validación

## 🔧 Uso del Patrón

### **Agregar una Nueva Estrategia**

```javascript
// 1. Crear la nueva estrategia
class PaymentValidationStrategy extends ValidationStrategy {
  constructor() {
    super(5); // Prioridad 5
  }

  async validate(enrollmentData, context) {
    const { userId } = enrollmentData;
    
    // Lógica de validación de pago
    const canPay = await this.checkPaymentCapability(userId);
    
    if (!canPay) {
      return {
        isValid: false,
        message: "No tienes capacidad de pago suficiente",
        statusCode: 400,
        details: { timestamp: new Date().toISOString() }
      };
    }

    return { isValid: true };
  }

  async checkPaymentCapability(userId) {
    // Implementar lógica de validación de pago
    return true;
  }
}

// 2. Registrar en el contexto
const paymentStrategy = new PaymentValidationStrategy();
validationContext.addStrategy(paymentStrategy);
```

### **Modificar una Estrategia Existente**

```javascript
// Modificar AvailabilityValidationStrategy
class AvailabilityValidationStrategy extends ValidationStrategy {
  async validate(enrollmentData, context) {
    const { courseId } = enrollmentData;
    
    // Agregar nueva validación
    const courseResult = await CoursesServiceClient.checkCourseAvailability(courseId);
    const scheduleResult = await this.checkScheduleConflicts(courseId);
    
    if (!courseResult.success || !scheduleResult.success) {
      return {
        isValid: false,
        message: "El curso no está disponible o tiene conflictos de horario",
        statusCode: 400,
        details: { 
          course: courseResult.data,
          schedule: scheduleResult.data,
          timestamp: new Date().toISOString() 
        }
      };
    }

    context.course = courseResult.data;
    return { isValid: true };
  }

  async checkScheduleConflicts(courseId) {
    // Nueva lógica de validación
    return { success: true, data: {} };
  }
}
```

### **Eliminar una Estrategia**

```javascript
// Remover estrategia del contexto
validationContext.clearStrategies();

// Agregar solo las estrategias deseadas
validationContext.addStrategy(new AvailabilityValidationStrategy());
validationContext.addStrategy(new PrerequisitesValidationStrategy());
// No agregar EnrollmentLimitValidationStrategy
```

## 🧪 Testing

### **Ejecutar Tests**

```bash
# Tests del patrón Strategy
npm test tests/strategies-simple.test.js

# Tests del microservicio
npm test

# Tests de integración Docker
npm run test:docker-strategy
```

### **Crear Tests para Nueva Estrategia**

```javascript
// tests/strategies/payment-validation.test.js
const PaymentValidationStrategy = require('../../src/strategies/PaymentValidationStrategy');

describe('PaymentValidationStrategy', () => {
  test('debe validar correctamente cuando el usuario puede pagar', async () => {
    const strategy = new PaymentValidationStrategy();
    const result = await strategy.validate({ userId: 123 }, {});
    expect(result.isValid).toBe(true);
  });

  test('debe fallar cuando el usuario no puede pagar', async () => {
    const strategy = new PaymentValidationStrategy();
    const result = await strategy.validate({ userId: 456 }, {});
    expect(result.isValid).toBe(false);
    expect(result.statusCode).toBe(400);
  });

  test('debe tener prioridad 5', () => {
    const strategy = new PaymentValidationStrategy();
    expect(strategy.getPriority()).toBe(5);
  });
});
```

## 📊 Monitoreo y Debugging

### **Logs de Validación**

```javascript
// Agregar logging a las estrategias
class AvailabilityValidationStrategy extends ValidationStrategy {
  async validate(enrollmentData, context) {
    console.log(`[${this.constructor.name}] Validando disponibilidad para curso ${enrollmentData.courseId}`);
    
    const result = await this.performValidation(enrollmentData, context);
    
    console.log(`[${this.constructor.name}] Resultado: ${result.isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
    
    return result;
  }
}
```

### **Métricas de Performance**

```javascript
// Agregar métricas de tiempo
class ValidationStrategy {
  async validate(enrollmentData, context) {
    const startTime = Date.now();
    
    const result = await this.performValidation(enrollmentData, context);
    
    const duration = Date.now() - startTime;
    console.log(`[${this.constructor.name}] Tiempo de validación: ${duration}ms`);
    
    return result;
  }
}
```

## 🔍 Troubleshooting

### **Problemas Comunes**

1. **Estrategia no se ejecuta**
   - Verificar que esté agregada al contexto
   - Verificar prioridad (debe ser > 0)
   - Verificar que extienda ValidationStrategy

2. **Validación falla inesperadamente**
   - Revisar logs de la estrategia
   - Verificar datos de entrada
   - Verificar dependencias externas

3. **Performance lenta**
   - Revisar tiempo de ejecución de cada estrategia
   - Considerar caché para validaciones costosas
   - Optimizar consultas a base de datos

### **Debugging**

```javascript
// Habilitar debug mode
const validationContext = new EnrollmentValidationContext();
validationContext.debug = true;

// Ver estrategias registradas
console.log('Estrategias registradas:', validationContext.strategies.map(s => s.constructor.name));

// Ver orden de ejecución
console.log('Orden de ejecución:', validationContext.strategies.map(s => ({
  name: s.constructor.name,
  priority: s.getPriority()
})));
```

## 📚 Recursos Adicionales

- [Documentación completa del patrón Strategy](./strategy-pattern-implementation.md)
- [ADR-001: Decisión de Arquitectura](./adr-001-strategy-pattern-enrollment-validation.md)
- [Tests de integración](../enrollment-service/tests/)
- [Demos del patrón Strategy](../enrollment-service/src/demo/)

---

**Última actualización**: 6 de Octubre de 2025  
**Versión**: 1.0.0  
**Estado**: ✅ PRODUCCIÓN
