const ValidationStrategy = require("./ValidationStrategy");

/**
 * Contexto que orquesta las estrategias de validación de inscripción
 * Patrón Strategy - Coordina la ejecución de múltiples validaciones
 */
class EnrollmentValidationContext {
  constructor() {
    this.strategies = [];
  }

  /**
   * Agrega una estrategia de validación
   * @param {ValidationStrategy} strategy - Estrategia a agregar
   */
  addStrategy(strategy) {
    if (!(strategy instanceof ValidationStrategy)) {
      throw new Error("La estrategia debe extender de ValidationStrategy");
    }

    this.strategies.push(strategy);
    // Ordenar por prioridad (menor número = mayor prioridad)
    this.strategies.sort((a, b) => a.getPriority() - b.getPriority());
  }

  /**
   * Ejecuta todas las validaciones en orden de prioridad
   * @param {Object} context - Contexto de la inscripción
   * @returns {Promise<Object>} - Resultado de todas las validaciones
   */
  async validateAll(context) {
    const results = {
      isValid: true,
      validations: [],
      errors: [],
      warnings: [],
    };

    for (const strategy of this.strategies) {
      try {
        const result = await strategy.validate(context);
        results.validations.push(result);

        if (!result.isValid) {
          results.isValid = false;
          results.errors.push({
            strategy: result.strategy,
            error: result.error,
            details: result.details,
          });
        }
      } catch (error) {
        results.isValid = false;
        results.errors.push({
          strategy: strategy.getName(),
          error: "Error ejecutando validación",
          details: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Ejecuta validaciones hasta encontrar el primer error
   * @param {Object} context - Contexto de la inscripción
   * @returns {Promise<Object>} - Resultado de la primera validación que falle
   */
  async validateUntilFirstError(context) {
    for (const strategy of this.strategies) {
      try {
        const result = await strategy.validate(context);

        if (!result.isValid) {
          return {
            isValid: false,
            firstError: result,
            strategy: result.strategy,
          };
        }
      } catch (error) {
        return {
          isValid: false,
          firstError: {
            error: "Error ejecutando validación",
            details: error.message,
            strategy: strategy.getName(),
          },
          strategy: strategy.getName(),
        };
      }
    }

    return {
      isValid: true,
      message: "Todas las validaciones pasaron exitosamente",
    };
  }

  /**
   * Obtiene las estrategias registradas
   * @returns {Array<ValidationStrategy>} - Lista de estrategias
   */
  getStrategies() {
    return [...this.strategies];
  }

  /**
   * Limpia todas las estrategias
   */
  clearStrategies() {
    this.strategies = [];
  }
}

module.exports = EnrollmentValidationContext;
