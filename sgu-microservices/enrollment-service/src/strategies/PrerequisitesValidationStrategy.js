const { ValidationStrategy } = require("./ValidationStrategy");
const { CoursesServiceClient } = require("../services/externalServices");

/**
 * Estrategia para validar prerrequisitos del curso
 * Verifica que el estudiante cumple con los prerrequisitos necesarios
 */
class PrerequisitesValidationStrategy extends ValidationStrategy {
  constructor() {
    super();
  }

  getPriority() {
    return 2; // Segunda prioridad - después de disponibilidad
  }

  async validate(context) {
    const { courseId, userId, authToken } = context;

    try {
      // Verificar prerrequisitos
      const prerequisitesResult = await CoursesServiceClient.checkPrerequisites(
        courseId,
        userId,
        authToken
      );

      if (!prerequisitesResult.success) {
        return {
          isValid: false,
          error: "Error verificando prerrequisitos",
          details: prerequisitesResult.error,
          strategy: this.getStrategyName(),
        };
      }

      if (!prerequisitesResult.data.canEnroll) {
        return {
          isValid: false,
          error: "No cumples con los prerrequisitos para este curso",
          details: {
            missingPrerequisites: prerequisitesResult.data.missingPrerequisites,
            requiredPrerequisites:
              prerequisitesResult.data.requiredPrerequisites,
          },
          strategy: this.getStrategyName(),
        };
      }

      return {
        isValid: true,
        data: {
          prerequisites: prerequisitesResult.data.requiredPrerequisites,
          completedPrerequisites:
            prerequisitesResult.data.completedPrerequisites,
        },
        strategy: this.getStrategyName(),
      };
    } catch (error) {
      return {
        isValid: false,
        error: "Error verificando prerrequisitos",
        details: error.message,
        strategy: this.getStrategyName(),
      };
    }
  }
}

module.exports = PrerequisitesValidationStrategy;
