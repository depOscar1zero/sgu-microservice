/**
 * Domain Entity: Enrollment
 * Representa una inscripción de un estudiante a un curso
 * Aplicando principios de Domain-Driven Design (DDD)
 */

const {
  EnrollmentStatus,
  PaymentStatus,
} = require('../value-objects/EnrollmentStatus');

class Enrollment {
  constructor({
    id,
    studentId,
    courseId,
    studentEmail,
    studentName,
    courseCode,
    courseName,
    courseCredits,
    academicPeriod,
    amount,
    currency = 'USD',
    status = EnrollmentStatus.PENDING,
    paymentStatus = PaymentStatus.PENDING,
    enrollmentDate = new Date(),
    notes = null,
  }) {
    this._id = id;
    this._studentId = studentId;
    this._courseId = courseId;
    this._studentEmail = studentEmail;
    this._studentName = studentName;
    this._courseCode = courseCode;
    this._courseName = courseName;
    this._courseCredits = courseCredits;
    this._academicPeriod = academicPeriod;
    this._amount = amount;
    this._currency = currency;
    this._status = status;
    this._paymentStatus = paymentStatus;
    this._enrollmentDate = enrollmentDate;
    this._confirmationDate = null;
    this._paymentDate = null;
    this._cancellationDate = null;
    this._cancellationReason = null;
    this._paymentId = null;
    this._grade = null;
    this._attendancePercentage = null;
    this._notes = notes;
    this._enrolledBy = null;
  }

  // Getters
  get id() {
    return this._id;
  }
  get studentId() {
    return this._studentId;
  }
  get courseId() {
    return this._courseId;
  }
  get studentEmail() {
    return this._studentEmail;
  }
  get studentName() {
    return this._studentName;
  }
  get courseCode() {
    return this._courseCode;
  }
  get courseName() {
    return this._courseName;
  }
  get courseCredits() {
    return this._courseCredits;
  }
  get academicPeriod() {
    return this._academicPeriod;
  }
  get amount() {
    return this._amount;
  }
  get currency() {
    return this._currency;
  }
  get status() {
    return this._status;
  }
  get paymentStatus() {
    return this._paymentStatus;
  }
  get enrollmentDate() {
    return this._enrollmentDate;
  }
  get confirmationDate() {
    return this._confirmationDate;
  }
  get paymentDate() {
    return this._paymentDate;
  }
  get cancellationDate() {
    return this._cancellationDate;
  }
  get cancellationReason() {
    return this._cancellationReason;
  }
  get paymentId() {
    return this._paymentId;
  }
  get grade() {
    return this._grade;
  }
  get attendancePercentage() {
    return this._attendancePercentage;
  }
  get notes() {
    return this._notes;
  }
  get enrolledBy() {
    return this._enrolledBy;
  }

  // Domain Methods

  /**
   * Confirma la inscripción
   * @param {Date} confirmationDate - Fecha de confirmación
   */
  confirm(confirmationDate = new Date()) {
    if (this._status !== EnrollmentStatus.PENDING) {
      throw new Error('Solo se pueden confirmar inscripciones pendientes');
    }

    this._status = EnrollmentStatus.CONFIRMED;
    this._confirmationDate = confirmationDate;
  }

  /**
   * Marca la inscripción como pagada
   * @param {string} paymentId - ID de la transacción de pago
   * @param {Date} paymentDate - Fecha del pago
   */
  markAsPaid(paymentId, paymentDate = new Date()) {
    if (this._status !== EnrollmentStatus.CONFIRMED) {
      throw new Error('Solo se pueden pagar inscripciones confirmadas');
    }

    this._status = EnrollmentStatus.PAID;
    this._paymentStatus = PaymentStatus.PAID;
    this._paymentId = paymentId;
    this._paymentDate = paymentDate;
  }

  /**
   * Cancela la inscripción
   * @param {string} reason - Razón de la cancelación
   * @param {string} cancelledBy - ID del usuario que cancela
   * @param {Date} cancellationDate - Fecha de cancelación
   */
  cancel(reason, cancelledBy = null, cancellationDate = new Date()) {
    if (!this.canBeCancelled()) {
      throw new Error('Esta inscripción no puede ser cancelada');
    }

    this._status = EnrollmentStatus.CANCELLED;
    this._cancellationDate = cancellationDate;
    this._cancellationReason = reason;
    this._enrolledBy = cancelledBy;
  }

  /**
   * Completa el curso
   * @param {number} grade - Calificación final
   * @param {number} attendancePercentage - Porcentaje de asistencia
   */
  complete(grade = null, attendancePercentage = null) {
    if (this._status !== EnrollmentStatus.PAID) {
      throw new Error('Solo se pueden completar inscripciones pagadas');
    }

    this._status = EnrollmentStatus.COMPLETED;
    if (grade !== null) this._grade = grade;
    if (attendancePercentage !== null)
      this._attendancePercentage = attendancePercentage;
  }

  /**
   * Verifica si la inscripción puede ser cancelada
   * @returns {boolean}
   */
  canBeCancelled() {
    return [
      EnrollmentStatus.PENDING,
      EnrollmentStatus.CONFIRMED,
      EnrollmentStatus.PAID,
    ].includes(this._status);
  }

  /**
   * Verifica si la inscripción requiere pago
   * @returns {boolean}
   */
  requiresPayment() {
    return (
      this._paymentStatus === PaymentStatus.PENDING &&
      [EnrollmentStatus.CONFIRMED, EnrollmentStatus.PENDING].includes(
        this._status
      )
    );
  }

  /**
   * Verifica si la inscripción está activa
   * @returns {boolean}
   */
  isActive() {
    return [
      EnrollmentStatus.PENDING,
      EnrollmentStatus.CONFIRMED,
      EnrollmentStatus.PAID,
    ].includes(this._status);
  }

  /**
   * Verifica si la inscripción está completada
   * @returns {boolean}
   */
  isCompleted() {
    return this._status === EnrollmentStatus.COMPLETED;
  }

  /**
   * Verifica si la inscripción está cancelada
   * @returns {boolean}
   */
  isCancelled() {
    return this._status === EnrollmentStatus.CANCELLED;
  }

  /**
   * Obtiene la información pública de la inscripción
   * @returns {Object}
   */
  toPublicJSON() {
    return {
      id: this._id,
      studentId: this._studentId,
      courseId: this._courseId,
      studentEmail: this._studentEmail,
      studentName: this._studentName,
      courseCode: this._courseCode,
      courseName: this._courseName,
      courseCredits: this._courseCredits,
      academicPeriod: this._academicPeriod,
      amount: this._amount,
      currency: this._currency,
      status: this._status,
      paymentStatus: this._paymentStatus,
      enrollmentDate: this._enrollmentDate,
      confirmationDate: this._confirmationDate,
      paymentDate: this._paymentDate,
      cancellationDate: this._cancellationDate,
      cancellationReason: this._cancellationReason,
      paymentId: this._paymentId,
      grade: this._grade,
      attendancePercentage: this._attendancePercentage,
      enrolledBy: this._enrolledBy,
    };
  }

  /**
   * Crea una nueva inscripción
   * @param {Object} enrollmentData - Datos de la inscripción
   * @returns {Enrollment}
   */
  static create(enrollmentData) {
    return new Enrollment(enrollmentData);
  }

  /**
   * Reconstruye una inscripción desde la base de datos
   * @param {Object} data - Datos de la base de datos
   * @returns {Enrollment}
   */
  static fromPersistence(data) {
    return new Enrollment({
      id: data.id,
      studentId: data.userId,
      courseId: data.courseId,
      studentEmail: data.studentEmail,
      studentName: data.studentName,
      courseCode: data.courseCode,
      courseName: data.courseName,
      courseCredits: data.courseCredits,
      academicPeriod: data.courseSemester,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      paymentStatus: data.paymentStatus,
      enrollmentDate: data.enrollmentDate,
      confirmationDate: data.confirmationDate,
      paymentDate: data.paymentDate,
      cancellationDate: data.cancellationDate,
      cancellationReason: data.cancellationReason,
      paymentId: data.paymentId,
      grade: data.grade,
      attendancePercentage: data.attendancePercentage,
      notes: data.notes,
      enrolledBy: data.enrolledBy,
    });
  }
}

module.exports = Enrollment;
