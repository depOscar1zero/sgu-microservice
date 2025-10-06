/**
 * Domain Events para el contexto de Inscripciones
 * Aplicando principios de Domain-Driven Design (DDD)
 */

/**
 * Evento base para todos los eventos de dominio
 */
class DomainEvent {
  constructor(eventId, occurredOn = new Date()) {
    this._eventId = eventId;
    this._occurredOn = occurredOn;
  }

  get eventId() {
    return this._eventId;
  }
  get occurredOn() {
    return this._occurredOn;
  }
}

/**
 * Evento: Estudiante inscrito
 */
class StudentEnrolled extends DomainEvent {
  constructor(
    enrollmentId,
    studentId,
    courseId,
    courseCode,
    courseName,
    amount,
    currency
  ) {
    super(`student-enrolled-${enrollmentId}-${Date.now()}`);
    this._enrollmentId = enrollmentId;
    this._studentId = studentId;
    this._courseId = courseId;
    this._courseCode = courseCode;
    this._courseName = courseName;
    this._amount = amount;
    this._currency = currency;
  }

  get enrollmentId() {
    return this._enrollmentId;
  }
  get studentId() {
    return this._studentId;
  }
  get courseId() {
    return this._courseId;
  }
  get courseCode() {
    return this._courseCode;
  }
  get courseName() {
    return this._courseName;
  }
  get amount() {
    return this._amount;
  }
  get currency() {
    return this._currency;
  }
}

/**
 * Evento: Inscripción confirmada
 */
class EnrollmentConfirmed extends DomainEvent {
  constructor(enrollmentId, studentId, courseId, confirmedAt) {
    super(`enrollment-confirmed-${enrollmentId}-${Date.now()}`);
    this._enrollmentId = enrollmentId;
    this._studentId = studentId;
    this._courseId = courseId;
    this._confirmedAt = confirmedAt;
  }

  get enrollmentId() {
    return this._enrollmentId;
  }
  get studentId() {
    return this._studentId;
  }
  get courseId() {
    return this._courseId;
  }
  get confirmedAt() {
    return this._confirmedAt;
  }
}

/**
 * Evento: Inscripción pagada
 */
class EnrollmentPaid extends DomainEvent {
  constructor(
    enrollmentId,
    studentId,
    courseId,
    paymentId,
    amount,
    currency,
    paidAt
  ) {
    super(`enrollment-paid-${enrollmentId}-${Date.now()}`);
    this._enrollmentId = enrollmentId;
    this._studentId = studentId;
    this._courseId = courseId;
    this._paymentId = paymentId;
    this._amount = amount;
    this._currency = currency;
    this._paidAt = paidAt;
  }

  get enrollmentId() {
    return this._enrollmentId;
  }
  get studentId() {
    return this._studentId;
  }
  get courseId() {
    return this._courseId;
  }
  get paymentId() {
    return this._paymentId;
  }
  get amount() {
    return this._amount;
  }
  get currency() {
    return this._currency;
  }
  get paidAt() {
    return this._paidAt;
  }
}

/**
 * Evento: Inscripción cancelada
 */
class EnrollmentCancelled extends DomainEvent {
  constructor(
    enrollmentId,
    studentId,
    courseId,
    reason,
    cancelledBy,
    cancelledAt
  ) {
    super(`enrollment-cancelled-${enrollmentId}-${Date.now()}`);
    this._enrollmentId = enrollmentId;
    this._studentId = studentId;
    this._courseId = courseId;
    this._reason = reason;
    this._cancelledBy = cancelledBy;
    this._cancelledAt = cancelledAt;
  }

  get enrollmentId() {
    return this._enrollmentId;
  }
  get studentId() {
    return this._studentId;
  }
  get courseId() {
    return this._courseId;
  }
  get reason() {
    return this._reason;
  }
  get cancelledBy() {
    return this._cancelledBy;
  }
  get cancelledAt() {
    return this._cancelledAt;
  }
}

/**
 * Evento: Inscripción completada
 */
class EnrollmentCompleted extends DomainEvent {
  constructor(
    enrollmentId,
    studentId,
    courseId,
    grade,
    attendancePercentage,
    completedAt
  ) {
    super(`enrollment-completed-${enrollmentId}-${Date.now()}`);
    this._enrollmentId = enrollmentId;
    this._studentId = studentId;
    this._courseId = courseId;
    this._grade = grade;
    this._attendancePercentage = attendancePercentage;
    this._completedAt = completedAt;
  }

  get enrollmentId() {
    return this._enrollmentId;
  }
  get studentId() {
    return this._studentId;
  }
  get courseId() {
    return this._courseId;
  }
  get grade() {
    return this._grade;
  }
  get attendancePercentage() {
    return this._attendancePercentage;
  }
  get completedAt() {
    return this._completedAt;
  }
}

/**
 * Evento: Prerrequisitos no cumplidos
 */
class PrerequisitesNotMet extends DomainEvent {
  constructor(enrollmentId, studentId, courseId, missingPrerequisites) {
    super(`prerequisites-not-met-${enrollmentId}-${Date.now()}`);
    this._enrollmentId = enrollmentId;
    this._studentId = studentId;
    this._courseId = courseId;
    this._missingPrerequisites = missingPrerequisites;
  }

  get enrollmentId() {
    return this._enrollmentId;
  }
  get studentId() {
    return this._studentId;
  }
  get courseId() {
    return this._courseId;
  }
  get missingPrerequisites() {
    return this._missingPrerequisites;
  }
}

/**
 * Evento: Curso lleno
 */
class CourseFull extends DomainEvent {
  constructor(
    enrollmentId,
    studentId,
    courseId,
    courseCode,
    currentEnrollments,
    capacity
  ) {
    super(`course-full-${enrollmentId}-${Date.now()}`);
    this._enrollmentId = enrollmentId;
    this._studentId = studentId;
    this._courseId = courseId;
    this._courseCode = courseCode;
    this._currentEnrollments = currentEnrollments;
    this._capacity = capacity;
  }

  get enrollmentId() {
    return this._enrollmentId;
  }
  get studentId() {
    return this._studentId;
  }
  get courseId() {
    return this._courseId;
  }
  get courseCode() {
    return this._courseCode;
  }
  get currentEnrollments() {
    return this._currentEnrollments;
  }
  get capacity() {
    return this._capacity;
  }
}

/**
 * Evento: Límite de inscripciones alcanzado
 */
class EnrollmentLimitReached extends DomainEvent {
  constructor(enrollmentId, studentId, currentEnrollments, maxEnrollments) {
    super(`enrollment-limit-reached-${enrollmentId}-${Date.now()}`);
    this._enrollmentId = enrollmentId;
    this._studentId = studentId;
    this._currentEnrollments = currentEnrollments;
    this._maxEnrollments = maxEnrollments;
  }

  get enrollmentId() {
    return this._enrollmentId;
  }
  get studentId() {
    return this._studentId;
  }
  get currentEnrollments() {
    return this._currentEnrollments;
  }
  get maxEnrollments() {
    return this._maxEnrollments;
  }
}

module.exports = {
  DomainEvent,
  StudentEnrolled,
  EnrollmentConfirmed,
  EnrollmentPaid,
  EnrollmentCancelled,
  EnrollmentCompleted,
  PrerequisitesNotMet,
  CourseFull,
  EnrollmentLimitReached,
};
