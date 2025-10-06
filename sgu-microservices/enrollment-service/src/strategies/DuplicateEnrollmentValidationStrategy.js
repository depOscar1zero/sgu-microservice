const ValidationStrategy = require("./ValidationStrategy");
const Enrollment = require("../models/Enrollment");

/**
 * Estrategia para validar inscripciones duplicadas
 * Verifica que el estudiante no esté ya inscrito en el curso
 */
class DuplicateEnrollmentValidationStrategy extends ValidationStrategy {
  constructor() {
    super();
  }

  getPriority() {
    return 4; // Cuarta prioridad
  }

  async validate(context) {
    const { userId, courseId } = context;

    try {
      // Verificar que el estudiante no esté ya inscrito
      const existingEnrollment = await Enrollment.findOne({
        where: {
          userId,
          courseId,
          status: ["Pending", "Confirmed", "Paid", "Completed"],
        },
      });

      if (existingEnrollment) {
        return {
          isValid: false,
          error: "Ya estás inscrito en este curso",
          details: {
            existingEnrollment: existingEnrollment.toPublicJSON(),
            currentStatus: existingEnrollment.status,
            enrollmentDate: existingEnrollment.enrollmentDate,
          },
          strategy: this.getName(),
        };
      }

      return {
        isValid: true,
        data: {
          message: "No hay inscripción duplicada",
        },
        strategy: this.getName(),
      };
    } catch (error) {
      return {
        isValid: false,
        error: "Error verificando inscripciones duplicadas",
        details: error.message,
        strategy: this.getName(),
      };
    }
  }
}

module.exports = DuplicateEnrollmentValidationStrategy;
