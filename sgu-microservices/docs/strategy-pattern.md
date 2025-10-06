# Patrón Strategy - Documentación

## 📋 Resumen

El **Strategy Pattern** es un patrón de diseño de comportamiento que permite definir una familia de algoritmos, encapsularlos y hacerlos intercambiables. Este patrón se ha implementado en el Sistema de Gestión Universitaria (SGU) para manejar diferentes estrategias de validación de inscripciones de manera flexible y extensible.

## 🎯 Objetivos del Patrón

- **Flexibilidad**: Permitir cambiar algoritmos de validación en tiempo de ejecución
- **Extensibilidad**: Facilitar la adición de nuevas estrategias sin modificar código existente
- **Desacoplamiento**: Separar la lógica de validación del código cliente
- **Cumplimiento de OCP**: Principio Abierto/Cerrado - abierto para extensión, cerrado para modificación

## 🏗️ Arquitectura del Patrón

### Estructura General

```
Strategy (Interface)
├── ConcreteStrategyA
├── ConcreteStrategyB
└── ConcreteStrategyC

Context
├── Strategy strategy
├── setStrategy()
└── executeStrategy()
```

### Componentes Principales

1. **Strategy (Interfaz)**: Define el contrato para todas las estrategias
2. **Concrete Strategy**: Implementación específica de cada algoritmo
3. **Context**: Mantiene referencia a la estrategia y delega la ejecución
4. **Client**: Utiliza el contexto para ejecutar estrategias

## 🔧 Implementación en SGU

### 1. Estrategias de Validación

**Ubicación**: `enrollment-service/src/strategies/ValidationStrategy.js`

**Estrategias Implementadas**:
- `PrerequisitesValidationStrategy`: Validación de prerequisitos académicos
- `CapacityValidationStrategy`: Validación de disponibilidad de cupos
- `ScheduleValidationStrategy`: Validación de conflictos de horarios
- `PaymentValidationStrategy`: Validación de pagos pendientes
- `DeadlineValidationStrategy`: Validación de fechas límite

**Ejemplo de Uso**:
```javascript
const { ValidationContext, PrerequisitesValidationStrategy } = require('./strategies/ValidationStrategy');

// Crear contexto de validación
const context = new ValidationContext();

// Agregar estrategia de prerequisitos
const prerequisitesStrategy = new PrerequisitesValidationStrategy({
  requiredCourses: ['MATH-101', 'PHYS-101'],
  studentCompletedCourses: ['MATH-101', 'PHYS-101'],
  minGPA: 2.5,
  studentGPA: 3.2
});

context.addStrategy(prerequisitesStrategy);

// Ejecutar validación
const result = context.executeValidation(
  { studentId: 'student-123', courseId: 'course-456' },
  { hasPrerequisites: true }
);
```

### 2. Servicio de Validación

**Ubicación**: `enrollment-service/src/services/EnrollmentValidationService.js`

**Funcionalidades**:
- Configuración automática de estrategias según el contexto
- Validación completa de inscripciones
- Validación con estrategias específicas
- Manejo de errores y estadísticas

**Ejemplo de Uso**:
```javascript
const { enrollmentValidationService } = require('./services/EnrollmentValidationService');

// Validación completa de inscripción
const enrollmentData = {
  studentId: 'student-123',
  courseId: 'course-456',
  requestedSeats: 1
};

const courseConfig = {
  requiredCourses: ['MATH-101'],
  studentCompletedCourses: ['MATH-101'],
  minGPA: 2.0,
  studentGPA: 3.0,
  maxCapacity: 30,
  currentEnrollments: 25
};

const result = await enrollmentValidationService.validateEnrollment(
  enrollmentData, 
  courseConfig
);
```

### 3. Integración con Factory Method

El patrón Strategy se integra perfectamente con el Factory Method implementado anteriormente:

```javascript
// Usar ValidatorFactory para crear validadores
const validators = validatorFactoryManager.createEnrollmentValidators(courseConfig);

// Usar Strategy para validación flexible
const validationResult = await enrollmentValidationService.validateEnrollment(
  enrollmentData, 
  courseConfig
);
```

## 🧪 Testing

### Estructura de Tests

- `tests/strategies/ValidationStrategy.test.js` - Tests de estrategias individuales
- `tests/services/EnrollmentValidationService.test.js` - Tests de integración

### Ejecutar Tests

```bash
# Tests de estrategias
cd enrollment-service
npm test -- tests/strategies/ValidationStrategy.test.js

# Tests de servicio
npm test -- tests/services/EnrollmentValidationService.test.js
```

## 📊 Ventajas del Patrón

### ✅ Beneficios

1. **Flexibilidad**: Cambio dinámico de algoritmos sin modificar código
2. **Extensibilidad**: Fácil adición de nuevas estrategias
3. **Mantenibilidad**: Código más organizado y fácil de mantener
4. **Testabilidad**: Cada estrategia puede ser testeada independientemente
5. **Cumplimiento de SOLID**: Especialmente SRP y OCP

### 🔄 Flujo de Trabajo

1. **Cliente** solicita validación
2. **Context** selecciona estrategias aplicables
3. **Strategy** ejecuta algoritmo específico
4. **Resultado** consolidado es retornado

## 🚀 Casos de Uso en SGU

### 1. Validación de Inscripciones

- **Prerequisitos**: Verificar cursos completados y GPA
- **Capacidad**: Validar disponibilidad de cupos
- **Horarios**: Detectar conflictos de horario
- **Pagos**: Verificar estado de pagos pendientes
- **Fechas**: Validar períodos de inscripción

### 2. Configuración Flexible

- **Por Curso**: Diferentes reglas según el tipo de curso
- **Por Estudiante**: Validaciones específicas según el perfil
- **Por Período**: Reglas que cambian según el semestre

### 3. Extensibilidad

- **Nuevas Estrategias**: Fácil adición de validaciones
- **Reglas Personalizadas**: Validaciones específicas por institución
- **Integración**: Compatible con otros patrones

## 🔧 Configuración y Uso

### Instalación de Dependencias

```bash
cd enrollment-service
npm install
```

### Variables de Entorno

```env
# Enrollment Service
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/sgu_enrollment
```

### Ejemplo de Integración

```javascript
// En un controlador
const { enrollmentValidationService } = require('../services/EnrollmentValidationService');

app.post('/api/enrollments/validate', async (req, res) => {
  try {
    const { enrollmentData, courseConfig } = req.body;
    
    const result = await enrollmentValidationService.validateEnrollment(
      enrollmentData, 
      courseConfig
    );
    
    res.json({
      success: result.isValid,
      errors: result.errors,
      details: result.results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📈 Métricas y Monitoreo

### Métricas Implementadas

- **Estrategias Utilizadas**: Tracking de qué estrategias se ejecutan
- **Tiempo de Validación**: Medición del tiempo de ejecución
- **Tasa de Éxito**: Porcentaje de validaciones exitosas
- **Errores por Estrategia**: Análisis de fallos por tipo

### Logging

```javascript
// Ejemplo de logging en estrategias
console.log(`Estrategia ${this.getStrategyName()} ejecutada para ${data.studentId}`);
console.log(`Resultado: ${result.isValid ? 'Válido' : 'Inválido'}`);
```

## 🔮 Futuras Mejoras

### Roadmap

1. **Strategy Registry**: Registro dinámico de estrategias
2. **Caching**: Cache de resultados de validación
3. **Async Strategies**: Soporte para estrategias asíncronas
4. **Strategy Chains**: Encadenamiento de estrategias
5. **Metrics Dashboard**: Dashboard de métricas en tiempo real

### Extensiones Propuestas

- **Notification Strategy**: Diferentes tipos de notificaciones
- **Payment Strategy**: Múltiples métodos de pago
- **Report Strategy**: Diferentes formatos de reportes
- **Authentication Strategy**: Múltiples métodos de autenticación

## 📚 Referencias

- [Design Patterns: Elements of Reusable Object-Oriented Software](https://en.wikipedia.org/wiki/Design_Patterns)
- [Strategy Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/strategy)
- [JavaScript Design Patterns](https://www.patterns.dev/posts/classic-design-patterns/)

## 🤝 Contribución

Para contribuir al patrón Strategy:

1. Crear nueva estrategia siguiendo la interfaz base
2. Implementar tests correspondientes
3. Actualizar documentación
4. Seguir las convenciones de código establecidas

---

**Versión**: 1.0.0  
**Última Actualización**: Diciembre 2024  
**Mantenido por**: Equipo de Desarrollo SGU
