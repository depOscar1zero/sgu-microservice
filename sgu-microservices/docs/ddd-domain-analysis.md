# 🎯 Domain-Driven Design (DDD) - Análisis del Dominio SGU

## 📋 Resumen Ejecutivo

Este documento presenta el análisis del dominio universitario del Sistema de Gestión Universitaria (SGU) aplicando los principios de Domain-Driven Design (DDD).

## 🏗️ Bounded Contexts Identificados

### 1. 🔐 **Identity & Access Context** (auth-service)

**Responsabilidad**: Gestión de identidad y acceso de usuarios

**Entidades Principales**:

- **User** (Usuario)
  - Propiedades: id, firstName, lastName, email, password, role, isActive
  - Comportamiento: autenticación, autorización, verificación de email

**Value Objects**:

- **Email**: Validación de formato y unicidad
- **Password**: Encriptación y validación de seguridad
- **Role**: Enum (student, admin)

**Reglas de Negocio**:

- Un usuario debe tener email único
- Las contraseñas deben cumplir criterios de seguridad
- Los roles determinan permisos de acceso

### 2. 📚 **Academic Context** (courses-service)

**Responsabilidad**: Gestión del catálogo académico

**Entidades Principales**:

- **Course** (Curso)
  - Propiedades: code, name, description, department, credits, capacity, price, professor
  - Comportamiento: verificación de disponibilidad, gestión de cupos

**Value Objects**:

- **CourseCode**: Código único del curso (ej: "CS101")
- **Credits**: Número de créditos académicos
- **Department**: Departamento académico
- **Price**: Costo del curso

**Reglas de Negocio**:

- Cada curso tiene un código único
- La capacidad no puede ser menor que estudiantes inscritos
- Los cursos pueden estar activos o inactivos

### 3. 📝 **Enrollment Context** (enrollment-service)

**Responsabilidad**: Gestión de inscripciones estudiantiles

**Entidades Principales**:

- **Enrollment** (Inscripción)
  - Propiedades: userId, courseId, status, paymentStatus, amount, enrollmentDate
  - Comportamiento: confirmación, pago, cancelación, finalización

**Value Objects**:

- **EnrollmentStatus**: Enum (Pending, Confirmed, Paid, Cancelled, Completed, Failed)
- **PaymentStatus**: Enum (Pending, Paid, Failed, Refunded)
- **AcademicPeriod**: Semestre académico
- **Amount**: Monto de pago con moneda

**Reglas de Negocio**:

- Un estudiante no puede inscribirse dos veces al mismo curso
- Las inscripciones tienen estados transicionales
- Los pagos son requeridos para confirmar inscripciones

### 4. 💳 **Payment Context** (payments-service)

**Responsabilidad**: Procesamiento de transacciones financieras

**Entidades Principales**:

- **Payment** (Pago)
  - Propiedades: id, amount, currency, method, status, transactionId
  - Comportamiento: procesamiento, reembolso, validación

**Value Objects**:

- **Amount**: Monto con precisión decimal
- **Currency**: Código de moneda (USD, EUR, etc.)
- **PaymentMethod**: Método de pago (card, transfer, etc.)

**Reglas de Negocio**:

- Los pagos deben ser procesados de forma segura
- Los reembolsos siguen políticas específicas
- Las transacciones deben ser auditables

### 5. 🔔 **Notification Context** (notifications-service)

**Responsabilidad**: Comunicación y notificaciones

**Entidades Principales**:

- **Notification** (Notificación)
  - Propiedades: id, userId, type, message, channel, status, sentAt
  - Comportamiento: envío, programación, tracking

**Value Objects**:

- **NotificationType**: Tipo de notificación (email, sms, push)
- **Priority**: Nivel de prioridad (low, medium, high, urgent)
- **Channel**: Canal de comunicación

**Reglas de Negocio**:

- Las notificaciones deben ser entregadas de forma confiable
- Diferentes canales tienen diferentes restricciones
- El tracking es obligatorio para auditoría

## 🗣️ Ubiquitous Language

### Términos del Dominio Universitario

| Término Técnico  | Término de Negocio | Contexto             |
| ---------------- | ------------------ | -------------------- |
| **User**         | Usuario            | Identity & Access    |
| **Student**      | Estudiante         | Enrollment, Academic |
| **Course**       | Curso              | Academic             |
| **Enrollment**   | Inscripción        | Enrollment           |
| **Payment**      | Pago               | Payment              |
| **Notification** | Notificación       | Notification         |
| **Credits**      | Créditos           | Academic             |
| **Semester**     | Semestre           | Academic, Enrollment |
| **Professor**    | Profesor           | Academic             |
| **Department**   | Departamento       | Academic             |

### Estados y Transiciones

#### Estados de Inscripción

```
Pending → Confirmed → Paid → Completed
   ↓         ↓         ↓
Cancelled  Cancelled  Cancelled
```

#### Estados de Pago

```
Pending → Paid
   ↓        ↓
Failed   Refunded
```

## 🎯 Domain Events Identificados

### Eventos del Dominio Académico

- **CourseCreated**: Curso creado
- **CourseUpdated**: Curso modificado
- **CourseCapacityChanged**: Capacidad del curso cambiada

### Eventos del Dominio de Inscripciones

- **StudentEnrolled**: Estudiante inscrito
- **EnrollmentConfirmed**: Inscripción confirmada
- **EnrollmentCancelled**: Inscripción cancelada
- **EnrollmentCompleted**: Inscripción completada

### Eventos del Dominio de Pagos

- **PaymentInitiated**: Pago iniciado
- **PaymentProcessed**: Pago procesado
- **PaymentFailed**: Pago fallido
- **PaymentRefunded**: Pago reembolsado

### Eventos del Dominio de Notificaciones

- **NotificationSent**: Notificación enviada
- **NotificationDelivered**: Notificación entregada
- **NotificationFailed**: Notificación fallida

## 🏛️ Agregados Identificados

### 1. **StudentEnrollment** (Enrollment Context)

- **Root Entity**: Enrollment
- **Invariantes**:
  - Un estudiante no puede inscribirse dos veces al mismo curso
  - El estado de la inscripción debe ser consistente
- **Límites**: Incluye información del estudiante y curso

### 2. **CourseCatalog** (Academic Context)

- **Root Entity**: Course
- **Invariantes**:
  - La capacidad debe ser mayor o igual a estudiantes inscritos
  - El código del curso debe ser único
- **Límites**: Incluye información académica del curso

### 3. **PaymentTransaction** (Payment Context)

- **Root Entity**: Payment
- **Invariantes**:
  - El monto debe ser positivo
  - El estado debe seguir transiciones válidas
- **Límites**: Incluye información de la transacción

## 🔗 Context Mapping

### Relaciones entre Contextos

```
Identity & Access ←→ Enrollment
     ↓                    ↓
Academic Context ←→ Payment Context
     ↓                    ↓
Notification Context ←→ All Contexts
```

### Integración entre Contextos

- **Identity & Access** → **Enrollment**: Autenticación de estudiantes
- **Academic** → **Enrollment**: Validación de cursos
- **Enrollment** → **Payment**: Procesamiento de pagos
- **All Contexts** → **Notification**: Envío de notificaciones

## 📊 Métricas del Dominio

### Complejidad por Contexto

- **Identity & Access**: Baja (1 entidad principal)
- **Academic**: Media (1 entidad, múltiples value objects)
- **Enrollment**: Alta (1 entidad compleja, múltiples estados)
- **Payment**: Media (1 entidad, integración externa)
- **Notification**: Media (1 entidad, múltiples canales)

### Reglas de Negocio por Contexto

- **Identity & Access**: 3 reglas principales
- **Academic**: 5 reglas principales
- **Enrollment**: 8 reglas principales (incluyendo Strategy Pattern)
- **Payment**: 6 reglas principales
- **Notification**: 4 reglas principales

## 🎯 Próximos Pasos

1. **Implementar Domain Models** en cada microservicio
2. **Crear Domain Events** para comunicación entre contextos
3. **Aplicar Repository Pattern** para persistencia
4. **Implementar Domain Services** para lógica compleja
5. **Crear Integration Tests** para validar el dominio

## 📚 Referencias

- [Domain-Driven Design Reference](https://domainlanguage.com/ddd/reference/)
- [Implementing Domain-Driven Design](https://vaughnvernon.com/implementing-domain-driven-design/)
- [Microservices Patterns](https://microservices.io/patterns/index.html)
