# ADR-003: Decorator Pattern para Funcionalidades Transversales

## Status

**Aceptado** - 2025-01-06

## Context

El API Gateway del Sistema de Gestión Universitaria (SGU) requiere funcionalidades transversales como logging, métricas, caching y seguridad. Estas funcionalidades deben ser aplicadas de forma modular y configurable sin modificar el código base de los componentes existentes.

### Problemas Identificados

1. **Acoplamiento Fuerte**: Las funcionalidades transversales estaban mezcladas con la lógica de negocio
2. **Duplicación de Código**: Misma funcionalidad implementada múltiples veces
3. **Difícil Mantenimiento**: Cambios en funcionalidades transversales requerían modificar múltiples archivos
4. **Falta de Flexibilidad**: No era posible configurar funcionalidades por tipo de ruta
5. **Testing Complejo**: Difícil testear funcionalidades mezcladas

### Requisitos

- **Modularidad**: Separar responsabilidades en componentes independientes
- **Flexibilidad**: Agregar/quitar funcionalidades sin modificar código existente
- **Configurabilidad**: Diferentes configuraciones por tipo de ruta
- **Reutilización**: Aplicar las mismas funcionalidades a diferentes componentes
- **Testabilidad**: Probar funcionalidades de forma independiente

## Decision

Implementar el **Decorator Pattern** para manejar funcionalidades transversales en el API Gateway.

### Patrón Seleccionado: Decorator Pattern

**Justificación**:

- Permite agregar funcionalidades de forma dinámica
- Mantiene la interfaz original del componente
- Facilita la composición de funcionalidades
- Sigue el principio de responsabilidad única (SRP)

### Arquitectura Propuesta

```
BaseDecorator (Abstract)
├── LoggingDecorator
├── MetricsDecorator
├── CachingDecorator
├── SecurityDecorator
└── DecoratorFactory
```

## Consequences

### ✅ Beneficios

1. **Modularidad**: Cada decorador tiene una responsabilidad específica
2. **Flexibilidad**: Agregar/quitar funcionalidades sin modificar código existente
3. **Reutilización**: Aplicar los mismos decoradores a diferentes componentes
4. **Configurabilidad**: Personalizar comportamiento por tipo de ruta
5. **Testabilidad**: Probar decoradores de forma independiente
6. **Mantenibilidad**: Cambios en funcionalidades transversales son localizados

### ⚠️ Desventajas

1. **Complejidad**: Aumenta la complejidad del código
2. **Performance**: Cada decorador añade overhead
3. **Debugging**: Puede ser difícil debuggear cadenas largas de decoradores
4. **Orden**: El orden de los decoradores puede afectar el comportamiento
5. **Curva de Aprendizaje**: Requiere entender el patrón para nuevos desarrolladores

### 🔄 Alternativas Consideradas

#### 1. Middleware Tradicional

**Pros**: Simple, familiar
**Contras**: Acoplamiento fuerte, difícil reutilización

#### 2. Aspect-Oriented Programming (AOP)

**Pros**: Separación clara de concerns
**Contras**: Complejidad adicional, no nativo en JavaScript

#### 3. Chain of Responsibility

**Pros**: Flexibilidad en el orden de procesamiento
**Contras**: Menos control sobre el flujo

#### 4. Observer Pattern

**Pros**: Desacoplamiento total
**Contras**: Complejidad en la gestión de eventos

## Implementation

### Estructura de Archivos

```
api-gateway/src/decorators/
├── BaseDecorator.js           # Clase base abstracta
├── LoggingDecorator.js        # Decorador de logging
├── MetricsDecorator.js        # Decorador de métricas
├── CachingDecorator.js        # Decorador de cache
├── SecurityDecorator.js       # Decorador de seguridad
└── DecoratorFactory.js        # Factory para crear decoradores
```

### Ejemplo de Uso

```javascript
// Crear componente decorado
const decorated = DecoratorFactory.createDecoratedComponent(component, {
  decorators: [
    { type: "logging", config: { logLevel: "info" } },
    { type: "metrics", config: { collectResponseTime: true } },
    { type: "security", config: { enableRequestValidation: true } },
  ],
});
```

### Configuraciones por Defecto

```javascript
// Diferentes configuraciones por tipo de ruta
const authConfig = DecoratorFactory.getDefaultConfig("auth");
const coursesConfig = DecoratorFactory.getDefaultConfig("courses");
const paymentsConfig = DecoratorFactory.getDefaultConfig("payments");
```

## Metrics

### Métricas de Implementación

- **Cobertura de Tests**: > 90%
- **Performance Impact**: < 5ms overhead por decorador
- **Memory Usage**: < 10MB adicionales
- **Code Reusability**: > 80% de reutilización

### Métricas de Negocio

- **Time to Market**: Reducción del 40% en tiempo de desarrollo
- **Bug Reduction**: Reducción del 60% en bugs relacionados con funcionalidades transversales
- **Maintenance Cost**: Reducción del 50% en costos de mantenimiento

## Monitoring

### Métricas a Monitorear

1. **Performance**: Tiempo de respuesta por decorador
2. **Memory**: Uso de memoria de decoradores
3. **Errors**: Errores en decoradores
4. **Usage**: Frecuencia de uso de cada decorador

### Alertas

- **High Latency**: Tiempo de respuesta > 100ms
- **Memory Leak**: Uso de memoria > 100MB
- **Error Rate**: Tasa de error > 5%
- **Cache Miss**: Tasa de aciertos < 80%

## Rollback Plan

En caso de problemas con el Decorator Pattern:

1. **Fase 1**: Deshabilitar decoradores problemáticos
2. **Fase 2**: Revertir a middleware tradicional
3. **Fase 3**: Implementar solución alternativa

### Criterios de Rollback

- **Performance**: Degradación > 20%
- **Errors**: Aumento > 10% en tasa de errores
- **Memory**: Aumento > 50% en uso de memoria
- **Stability**: Más de 3 incidentes críticos en 24h

## Future Considerations

### Mejoras Planificadas

1. **Decoradores Personalizados**: Permitir decoradores específicos del dominio
2. **Cache Distribuido**: Migrar a Redis para cache distribuido
3. **Métricas Avanzadas**: Integrar con Prometheus/Grafana
4. **A/B Testing**: Soporte para testing de decoradores
5. **Hot Reloading**: Recargar decoradores sin reiniciar el servicio

### Escalabilidad

- **Horizontal**: Decoradores pueden ser distribuidos
- **Vertical**: Optimización de performance por decorador
- **Load Balancing**: Distribución de carga entre decoradores

## References

- [Decorator Pattern - Design Patterns](https://refactoring.guru/design-patterns/decorator)
- [Express.js Middleware](https://expressjs.com/en/guide/using-middleware.html)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [ADR-001: Strategy Pattern](adr-001-strategy-pattern.md)
- [ADR-002: Domain-Driven Design](adr-002-domain-driven-design.md)

## Approval

**Aprobado por**: Equipo de Arquitectura SGU  
**Fecha**: 2025-01-06  
**Revisión**: v1.0

---

_Este ADR documenta la decisión de implementar el Decorator Pattern para funcionalidades transversales en el API Gateway del SGU._
