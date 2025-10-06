/**
 * Value Object: AcademicPeriod
 * Representa un período académico (semestre, trimestre, etc.)
 * Aplicando principios de Domain-Driven Design (DDD)
 */

class AcademicPeriod {
  constructor(value) {
    if (!value) {
      throw new Error("AcademicPeriod no puede ser nulo o vacío");
    }

    if (typeof value !== "string") {
      throw new Error("AcademicPeriod debe ser una cadena de texto");
    }

    if (value.trim().length === 0) {
      throw new Error("AcademicPeriod no puede ser una cadena vacía");
    }

    this._value = value.trim();
  }

  /**
   * Obtiene el valor del AcademicPeriod
   * @returns {string}
   */
  get value() {
    return this._value;
  }

  /**
   * Compara dos AcademicPeriod
   * @param {AcademicPeriod} other - Otro AcademicPeriod
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof AcademicPeriod)) {
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
   * Crea un AcademicPeriod desde un valor
   * @param {string} value - Valor del AcademicPeriod
   * @returns {AcademicPeriod}
   */
  static create(value) {
    return new AcademicPeriod(value);
  }

  /**
   * Verifica si un valor es un AcademicPeriod válido
   * @param {string} value - Valor a verificar
   * @returns {boolean}
   */
  static isValid(value) {
    try {
      new AcademicPeriod(value);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Crea un período académico para el semestre actual
   * @param {number} year - Año
   * @param {string} semester - Semestre (1, 2, 3, 4)
   * @returns {AcademicPeriod}
   */
  static createCurrent(year = new Date().getFullYear(), semester = "1") {
    const period = `${year}-${semester}`;
    return new AcademicPeriod(period);
  }

  /**
   * Obtiene el año del período académico
   * @returns {number}
   */
  getYear() {
    const parts = this._value.split("-");
    return parseInt(parts[0]) || new Date().getFullYear();
  }

  /**
   * Obtiene el semestre del período académico
   * @returns {string}
   */
  getSemester() {
    const parts = this._value.split("-");
    return parts[1] || "1";
  }
}

module.exports = AcademicPeriod;
