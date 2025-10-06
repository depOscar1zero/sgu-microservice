# ADR-001: Implementación del Patrón Strategy para Validaciones de Inscripción

## Estado

Aceptado

## Contexto

El Sistema de Gestión Universitaria (SGU) requiere un sistema robusto de validaciones para el proceso de inscripción de estudiantes a cursos. Actualmente, el `enrollmentController.js` contiene múltiples validaciones complejas que están acopladas directamente en el controlador:

- Verificación de disponibilidad del curso
- Validación de prerrequisitos
- Verificación de límites de inscripción del estudiante
- Validación de inscripciones duplicadas

### Problemas Identificados

1. **Violación del Principio de Responsabilidad Única (SRP)**: El controlador maneja tanto la lógica de negocio como la coordinación de validaciones
2. **Difícil mantenimiento**: Agregar nuevas validaciones requiere modificar el controlador existente
3. **Violación del Principio Abierto/Cerrado (OCP)**: El código no está abierto para extensión sin modificación
4. **Acoplamiento alto**: Las validaciones están fuertemente acopladas al controlador
5. **Difícil testing**: Las validaciones individuales no pueden ser probadas de forma aislada

## Decisión

Implementar el **Patrón Strategy** para encapsular las diferentes validaciones de inscripción en estrategias independientes y reutilizables.

### Arquitectura Propuesta

```
src/strategies/
├── ValidationStrategy.js                    # Interfaz base
├── AvailabilityValidationStrategy.js         # Validación de disponibilidad
├── PrerequisitesValidationStrategy.js       # Validación de prerrequisitos
├── EnrollmentLimitValidationStrategy.js      # Validación de límites
├── DuplicateEnrollmentValidationStrategy.js # Validación de duplicados
└── EnrollmentValidationContext.js           # Contexto coordinador
```

### Componentes Implementados

#### 1. ValidationStrategy (Interfaz Base)

```javascript
class ValidationStrategy {
  async validate(context) {
    /* implementar */
  }
  getName() {
    /* implementar */
  }
  getPriority() {
    /* implementar */
  }
}
```

#### 2. Estrategias Específicas

- **AvailabilityValidationStrategy**: Verifica disponibilidad del curso
- **PrerequisitesValidationStrategy**: Valida prerrequisitos
- **EnrollmentLimitValidationStrategy**: Verifica límites de inscripción
- **DuplicateEnrollmentValidationStrategy**: Previene inscripciones duplicadas

#### 3. EnrollmentValidationContext (Coordinador)

```javascript
class EnrollmentValidationContext {
  addStrategy(strategy) {
    /* agregar estrategia */
  }
  async validateUntilFirstError(context) {
    /* ejecutar validaciones */
  }
  async validateAll(context) {
    /* ejecutar todas */
  }
}
```

## Consecuencias

### Ventajas ✅

1. **Principio de Responsabilidad Única (SRP)**: Cada estrategia tiene una única responsabilidad
2. **Principio Abierto/Cerrado (OCP)**: Fácil agregar nuevas validaciones sin modificar código existente
3. **Bajo acoplamiento**: Las estrategias son independientes entre sí
4. **Alta cohesión**: Cada estrategia se enfoca en un aspecto específico
5. **Testabilidad**: Cada estrategia puede ser probada independientemente
6. **Reutilización**: Las estrategias pueden ser reutilizadas en otros contextos
7. **Flexibilidad**: Fácil cambiar el orden de ejecución mediante prioridades
8. **Mantenibilidad**: Modificaciones a una validación no afectan otras

### Desventajas Aceptadas ⚠️

1. **Complejidad inicial**: Requiere más clases y abstracciones
2. **Curva de aprendizaje**: Los desarrolladores deben entender el patrón
3. **Overhead**: Ligeramente más código para casos simples
4. **Debugging**: Puede ser más difícil rastrear el flujo de ejecución

### Trade-offs Aceptados

- **Complejidad vs Flexibilidad**: Aceptamos mayor complejidad inicial para obtener flexibilidad a largo plazo
- **Performance vs Mantenibilidad**: Mínimo overhead de performance por mejor mantenibilidad
- **Abstracción vs Simplicidad**: Mayor abstracción para mejor extensibilidad

## Implementación

### Ejemplo de Uso

```javascript
// Configurar contexto de validación
const validationContext = new EnrollmentValidationContext();
validationContext.addStrategy(new AvailabilityValidationStrategy());
validationContext.addStrategy(new PrerequisitesValidationStrategy());
validationContext.addStrategy(new EnrollmentLimitValidationStrategy());
validationContext.addStrategy(new DuplicateEnrollmentValidationStrategy());

// Ejecutar validaciones
const result = await validationContext.validateUntilFirstError({
  courseId: 1,
  userId: 1,
  authToken: "token123",
});

if (!result.isValid) {
  return res.status(400).json({
    success: false,
    message: result.firstError.error,
    details: result.firstError.details,
    validationStrategy: result.strategy,
  });
}
```

### Prioridades de Ejecución

1. **AvailabilityValidationStrategy** (Prioridad 1): Verificar disponibilidad primero
2. **PrerequisitesValidationStrategy** (Prioridad 2): Validar prerrequisitos
3. **EnrollmentLimitValidationStrategy** (Prioridad 3): Verificar límites del estudiante
4. **DuplicateEnrollmentValidationStrategy** (Prioridad 4): Verificar duplicados al final

## Testing

### Estrategias de Testing Implementadas

1. **Unit Tests**: Cada estrategia probada independientemente
2. **Integration Tests**: Contexto coordinador probado con múltiples estrategias
3. **Mocking**: Servicios externos mockeados para testing aislado
4. **Edge Cases**: Casos límite y errores manejados

### Cobertura de Tests

- ✅ Validación de disponibilidad (éxito y fallo)
- ✅ Validación de prerrequisitos (cumplidos y faltantes)
- ✅ Validación de límites (dentro y excedido)
- ✅ Validación de duplicados (sin duplicados y con duplicados)
- ✅ Coordinación de múltiples estrategias
- ✅ Manejo de errores y excepciones

## Métricas de Éxito

### Métricas Técnicas

- **Cobertura de tests**: > 90%
- **Complejidad ciclomática**: Reducida en 40%
- **Acoplamiento**: Reducido significativamente
- **Cohesión**: Aumentada por estrategia

### Métricas de Negocio

- **Tiempo de desarrollo**: Reducido para nuevas validaciones
- **Mantenibilidad**: Mejorada significativamente
- **Extensibilidad**: Fácil agregar nuevas reglas de negocio

## Alternativas Consideradas

### 1. Chain of Responsibility

- **Pros**: Flujo secuencial natural
- **Contras**: Menos flexible para validaciones independientes
- **Decisión**: Strategy es más apropiado para validaciones independientes

### 2. Template Method

- **Pros**: Estructura común para validaciones
- **Contras**: Menos flexible para diferentes tipos de validación
- **Decisión**: Strategy ofrece más flexibilidad

### 3. Validator Pattern

- **Pros**: Enfoque específico para validaciones
- **Contras**: Menos reutilizable en otros contextos
- **Decisión**: Strategy es más genérico y reutilizable

## Referencias

- [Strategy Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/strategy)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## Fecha de Decisión

2024-12-19

## Revisión

- **Revisado por**: Equipo de Arquitectura SGU
- **Próxima revisión**: 2025-03-19
- **Estado**: Implementado y en producción
