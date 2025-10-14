# Investigación sobre Arquitectura de Software para el Sistema de Gestión Universitaria (SGU)

**Alumna:** Fátima Avelino Celis

---

## Introducción

El Sistema de Gestión Universitaria (SGU) es una plataforma diseñada para gestionar procesos académicos y administrativos en instituciones educativas. Este documento presenta un análisis de patrones de diseño, anti-patrones y prácticas de CI/CD aplicables al desarrollo del SGU, con el objetivo de garantizar un sistema escalable, mantenible y de alta calidad.

---

## Patrones de Diseño para el SGU

### Patrones Creacionales

#### Singleton
**Descripción:** Garantiza una única instancia de una clase y proporciona un punto de acceso global a ella.

**Ventajas:**
- Controla el acceso a recursos compartidos
- Útil para servicios como logging o conexiones a base de datos

**Precauciones:**
- Puede dificultar las pruebas unitarias
- Debe usarse con moderación para evitar acoplamiento global

**Aplicación en SGU:**
- LoggerService para centralizar logs
- DatabaseConnection para manejar conexiones a la base de datos

---

### Patrones Estructurales

#### Adapter
**Descripción:** Permite que objetos con interfaces incompatibles trabajen juntos.

**Ventajas:**
- Facilita la integración con sistemas externos
- Mantiene el principio de responsabilidad única

**Aplicación en SGU:**
- Adaptar pasarelas de pago externas al sistema interno
- Convertir formatos de datos entre sistemas (XML a JSON)

#### Decorator
**Descripción:** Añade responsabilidades a objetos de manera dinámica.

**Ventajas:**
- Favorece la composición sobre la herencia
- Permite añadir comportamientos transversales

**Aplicación en SGU:**
- Añadir logging a operaciones de base de datos
- Implementar reintentos automáticos en llamadas a APIs

#### Facade
**Descripción:** Proporciona una interfaz simplificada para un subsistema complejo.

**Ventajas:**
- Oculta la complejidad del subsistema
- Reduce el acoplamiento entre componentes

**Aplicación en SGU:**
- Simplificar el proceso de facturación
- Orquestar el proceso de inscripción

---

### Patrones de Comportamiento

#### Strategy
**Descripción:** Encapsula algoritmos intercambiables.

**Ventajas:**
- Permite cambiar algoritmos en tiempo de ejecución
- Elimina condicionales complejos

**Aplicación en SGU:**
- Diferentes estrategias de descuento
- Validaciones de inscripción según diversas reglas

#### Observer
**Descripción:** Define una dependencia uno-a-muchos entre objetos.

**Ventajas:**
- Desacopla el sujeto de los observadores
- Permite notificaciones en tiempo real

**Aplicación en SGU:**
- Notificaciones cuando se confirma una inscripción
- Registro de auditoría para cambios en el sistema

---

## Patrones Arquitectónicos Modernos

### MVC (Model-View-Controller)
**Aplicación en SGU:**
- Separación clara entre lógica de negocio, presentación y control
- Facilita el mantenimiento y las pruebas

### DDD (Domain-Driven Design)
**Aplicación en SGU:**
- Enfoque en el dominio del negocio
- Lenguaje ubicuo entre desarrolladores y expertos
- Bounded contexts bien definidos

---

## Anti-patrones: Qué Evitar

### God Object
**Problema:** Un objeto que hace demasiado, violando el principio de responsabilidad única.

**Solución:**
- Dividir en clases más pequeñas con responsabilidades específicas
- Aplicar principios SOLID

### Spaghetti Code
**Problema:** Código sin estructura clara con dependencias circulares.

**Solución:**
- Modularizar el código en funciones/clases pequeñas
- Usar patrones de diseño apropiados

---

## CI/CD: Automatización para la Calidad

### Herramientas Recomendadas
- GitHub Actions: Automatización de builds, pruebas y despliegues
- Docker: Contenerización de microservicios
- Kubernetes: Orquestación de contenedores
- SonarQube: Análisis de calidad de código

### Pipeline Típico
1. Build: Compilación y gestión de dependencias
2. Test: Ejecución de pruebas unitarias e integración
3. Security Scan: Análisis de vulnerabilidades
4. Deploy Staging: Despliegue en entorno de pruebas
5. Deploy Production: Despliegue en producción

### Beneficios
- Feedback inmediato sobre errores
- Mayor calidad del código
- Despliegues más rápidos y seguros
- Reducción de errores humanos

---

## Aplicación Práctica en SGU

### Patrones Seleccionados

| Tipo               | Patrón          | Aplicación en SGU                                                                 |
|--------------------|-----------------|-----------------------------------------------------------------------------------|
| Creacional         | Singleton       | LoggerService y DatabaseConnection para recursos compartidos                   |
| Estructural        | Adapter         | Integración con pasarelas de pago externas y conversión de formatos de datos    |
| Estructural        | Decorator       | Añadir logging y reintentos a operaciones de base de datos y llamadas a APIs     |
| Estructural        | Facade          | Simplificar procesos complejos como facturación y inscripciones                |
| Comportamiento     | Strategy        | Diferentes estrategias de descuento y validación                                |
| Comportamiento     | Observer        | Notificaciones y registro                                         |
| Arquitectónico      | MVC             | Separación clara entre lógica, presentación y control                          |
| Arquitectónico      | DDD             | Organización del dominio en bounded contexts                                     |

---

## Conclusiones

Esta investigación ha establecido una base sólida para el desarrollo del Sistema de Gestión Universitaria (SGU), garantizando:

1. Una arquitectura modular basada en microservicios independientes que facilita el mantenimiento y la escalabilidad del sistema.

2. Código de alta calidad gracias a la aplicación de patrones de diseño adecuados que promueven la reutilización, la testabilidad y la mantenibilidad.

3. Procesos automatizados de integración y despliegue continuo que aseguran la calidad del software y reducen los errores humanos.

4. Documentación clara de las decisiones arquitectónicas que servirá como referencia para futuras mejoras y extensiones del sistema.

El SGU está ahora preparado para evolucionar de manera sostenible, adaptándose a las necesidades cambiantes del entorno académico y manteniendo altos estándares de calidad en su desarrollo.
