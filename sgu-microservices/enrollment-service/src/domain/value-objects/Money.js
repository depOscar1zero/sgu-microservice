/**
 * Value Object: Money
 * Representa una cantidad de dinero con moneda
 * Aplicando principios de Domain-Driven Design (DDD)
 */

class Money {
  constructor(amount, currency = "USD") {
    if (typeof amount !== "number") {
      throw new Error("Amount debe ser un número");
    }

    if (isNaN(amount)) {
      throw new Error("Amount no puede ser NaN");
    }

    if (amount < 0) {
      throw new Error("Amount no puede ser negativo");
    }

    if (typeof currency !== "string") {
      throw new Error("Currency debe ser una cadena de texto");
    }

    if (currency.trim().length === 0) {
      throw new Error("Currency no puede ser una cadena vacía");
    }

    this._amount = Math.round(amount * 100) / 100; // Redondear a 2 decimales
    this._currency = currency.trim().toUpperCase();
  }

  /**
   * Obtiene el monto
   * @returns {number}
   */
  get amount() {
    return this._amount;
  }

  /**
   * Obtiene la moneda
   * @returns {string}
   */
  get currency() {
    return this._currency;
  }

  /**
   * Suma dos cantidades de dinero
   * @param {Money} other - Otra cantidad de dinero
   * @returns {Money}
   */
  add(other) {
    if (!(other instanceof Money)) {
      throw new Error("Solo se pueden sumar objetos Money");
    }

    if (this._currency !== other._currency) {
      throw new Error("No se pueden sumar cantidades de diferentes monedas");
    }

    return new Money(this._amount + other._amount, this._currency);
  }

  /**
   * Resta dos cantidades de dinero
   * @param {Money} other - Otra cantidad de dinero
   * @returns {Money}
   */
  subtract(other) {
    if (!(other instanceof Money)) {
      throw new Error("Solo se pueden restar objetos Money");
    }

    if (this._currency !== other._currency) {
      throw new Error("No se pueden restar cantidades de diferentes monedas");
    }

    const result = this._amount - other._amount;
    if (result < 0) {
      throw new Error("El resultado no puede ser negativo");
    }

    return new Money(result, this._currency);
  }

  /**
   * Multiplica una cantidad de dinero por un factor
   * @param {number} factor - Factor de multiplicación
   * @returns {Money}
   */
  multiply(factor) {
    if (typeof factor !== "number") {
      throw new Error("Factor debe ser un número");
    }

    if (factor < 0) {
      throw new Error("Factor no puede ser negativo");
    }

    return new Money(this._amount * factor, this._currency);
  }

  /**
   * Compara dos cantidades de dinero
   * @param {Money} other - Otra cantidad de dinero
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof Money)) {
      return false;
    }
    return this._amount === other._amount && this._currency === other._currency;
  }

  /**
   * Verifica si esta cantidad es mayor que otra
   * @param {Money} other - Otra cantidad de dinero
   * @returns {boolean}
   */
  isGreaterThan(other) {
    if (!(other instanceof Money)) {
      throw new Error("Solo se pueden comparar objetos Money");
    }

    if (this._currency !== other._currency) {
      throw new Error("No se pueden comparar cantidades de diferentes monedas");
    }

    return this._amount > other._amount;
  }

  /**
   * Verifica si esta cantidad es menor que otra
   * @param {Money} other - Otra cantidad de dinero
   * @returns {boolean}
   */
  isLessThan(other) {
    if (!(other instanceof Money)) {
      throw new Error("Solo se pueden comparar objetos Money");
    }

    if (this._currency !== other._currency) {
      throw new Error("No se pueden comparar cantidades de diferentes monedas");
    }

    return this._amount < other._amount;
  }

  /**
   * Verifica si esta cantidad es cero
   * @returns {boolean}
   */
  isZero() {
    return this._amount === 0;
  }

  /**
   * Convierte a string
   * @returns {string}
   */
  toString() {
    return `${this._amount} ${this._currency}`;
  }

  /**
   * Crea una cantidad de dinero desde un valor
   * @param {number} amount - Monto
   * @param {string} currency - Moneda
   * @returns {Money}
   */
  static create(amount, currency = "USD") {
    return new Money(amount, currency);
  }

  /**
   * Crea una cantidad de dinero en cero
   * @param {string} currency - Moneda
   * @returns {Money}
   */
  static zero(currency = "USD") {
    return new Money(0, currency);
  }

  /**
   * Verifica si un valor es una cantidad de dinero válida
   * @param {number} amount - Monto a verificar
   * @param {string} currency - Moneda a verificar
   * @returns {boolean}
   */
  static isValid(amount, currency = "USD") {
    try {
      new Money(amount, currency);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = Money;
