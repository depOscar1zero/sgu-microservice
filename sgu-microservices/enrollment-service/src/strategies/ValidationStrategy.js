/**
 * Interfaz base para estrategias de validación de inscripción
 * Patrón Strategy - Define el contrato común para todas las validaciones
 */
class ValidationStrategy {
  /**
   * Valida una condición específica para la inscripción
   * @param {Object} context - Contexto de la inscripción (usuario, curso, etc.)
   * @returns {Promise<Object>} - Resultado de la validación
   */
  async validate(context) {
    throw new Error(
      "Método validate debe ser implementado por las clases hijas"
    );
  }

  /**
   * Obtiene el nombre de la estrategia
   * @returns {string} - Nombre de la estrategia
   */
  getName() {
    return this.constructor.name;
  }

  /**
   * Obtiene la prioridad de la estrategia (menor número = mayor prioridad)
   * @returns {number} - Prioridad de la estrategia
   */
  getPriority() {
    return 100; // Prioridad por defecto
  }
}

module.exports = ValidationStrategy;
