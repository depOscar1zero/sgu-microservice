/**
 * Value Object: StudentId
 * Representa el identificador único de un estudiante
 * Aplicando principios de Domain-Driven Design (DDD)
 */

class StudentId {
  constructor(value) {
    if (!value) {
      throw new Error("StudentId no puede ser nulo o vacío");
    }

    if (typeof value !== "string") {
      throw new Error("StudentId debe ser una cadena de texto");
    }

    if (value.trim().length === 0) {
      throw new Error("StudentId no puede ser una cadena vacía");
    }

    this._value = value.trim();
  }

  /**
   * Obtiene el valor del StudentId
   * @returns {string}
   */
  get value() {
    return this._value;
  }

  /**
   * Compara dos StudentId
   * @param {StudentId} other - Otro StudentId
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof StudentId)) {
      return false;
    }
    return this._value === other._value;
  }

  /**
   * Convierte a string
   * @returns {string}
   */
  toString() {
    return this._value;
  }

  /**
   * Crea un StudentId desde un valor
   * @param {string} value - Valor del StudentId
   * @returns {StudentId}
   */
  static create(value) {
    return new StudentId(value);
  }

  /**
   * Verifica si un valor es un StudentId válido
   * @param {string} value - Valor a verificar
   * @returns {boolean}
   */
  static isValid(value) {
    try {
      new StudentId(value);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = StudentId;
