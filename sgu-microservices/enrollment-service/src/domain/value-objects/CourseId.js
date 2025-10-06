/**
 * Value Object: CourseId
 * Representa el identificador único de un curso
 * Aplicando principios de Domain-Driven Design (DDD)
 */

class CourseId {
  constructor(value) {
    if (!value) {
      throw new Error("CourseId no puede ser nulo o vacío");
    }

    if (typeof value !== "string") {
      throw new Error("CourseId debe ser una cadena de texto");
    }

    if (value.trim().length === 0) {
      throw new Error("CourseId no puede ser una cadena vacía");
    }

    this._value = value.trim();
  }

  /**
   * Obtiene el valor del CourseId
   * @returns {string}
   */
  get value() {
    return this._value;
  }

  /**
   * Compara dos CourseId
   * @param {CourseId} other - Otro CourseId
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof CourseId)) {
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
   * Crea un CourseId desde un valor
   * @param {string} value - Valor del CourseId
   * @returns {CourseId}
   */
  static create(value) {
    return new CourseId(value);
  }

  /**
   * Verifica si un valor es un CourseId válido
   * @param {string} value - Valor a verificar
   * @returns {boolean}
   */
  static isValid(value) {
    try {
      new CourseId(value);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = CourseId;
