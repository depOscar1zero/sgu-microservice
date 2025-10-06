/**
 * Value Objects para Estados de Inscripción
 * Aplicando principios de Domain-Driven Design (DDD)
 */

/**
 * Estados de Inscripción
 */
class EnrollmentStatus {
  static PENDING = "Pending";
  static CONFIRMED = "Confirmed";
  static PAID = "Paid";
  static CANCELLED = "Cancelled";
  static COMPLETED = "Completed";
  static FAILED = "Failed";

  /**
   * Verifica si un estado es válido
   * @param {string} status - Estado a verificar
   * @returns {boolean}
   */
  static isValid(status) {
    return Object.values(EnrollmentStatus).includes(status);
  }

  /**
   * Obtiene todos los estados válidos
   * @returns {string[]}
   */
  static getAll() {
    return [
      EnrollmentStatus.PENDING,
      EnrollmentStatus.CONFIRMED,
      EnrollmentStatus.PAID,
      EnrollmentStatus.CANCELLED,
      EnrollmentStatus.COMPLETED,
      EnrollmentStatus.FAILED,
    ];
  }

  /**
   * Obtiene estados activos
   * @returns {string[]}
   */
  static getActive() {
    return [
      EnrollmentStatus.PENDING,
      EnrollmentStatus.CONFIRMED,
      EnrollmentStatus.PAID,
    ];
  }

  /**
   * Obtiene estados finales
   * @returns {string[]}
   */
  static getFinal() {
    return [
      EnrollmentStatus.CANCELLED,
      EnrollmentStatus.COMPLETED,
      EnrollmentStatus.FAILED,
    ];
  }
}

/**
 * Estados de Pago
 */
class PaymentStatus {
  static PENDING = "Pending";
  static PAID = "Paid";
  static FAILED = "Failed";
  static REFUNDED = "Refunded";

  /**
   * Verifica si un estado de pago es válido
   * @param {string} status - Estado a verificar
   * @returns {boolean}
   */
  static isValid(status) {
    return Object.values(PaymentStatus).includes(status);
  }

  /**
   * Obtiene todos los estados de pago válidos
   * @returns {string[]}
   */
  static getAll() {
    return [
      PaymentStatus.PENDING,
      PaymentStatus.PAID,
      PaymentStatus.FAILED,
      PaymentStatus.REFUNDED,
    ];
  }
}

module.exports = { EnrollmentStatus, PaymentStatus };
