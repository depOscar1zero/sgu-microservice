const { ValidationStrategy } = require('./ValidationStrategy');
const Enrollment = require('../models/Enrollment');

/**
 * Estrategia para validar límites de inscripción del estudiante
 * Verifica que el estudiante no haya excedido el límite de inscripciones activas
 */
class EnrollmentLimitValidationStrategy extends ValidationStrategy {
  constructor() {
    super();
  }

  getPriority() {
    return 3; // Tercera prioridad
  }

  async validate(context) {
    const { userId } = context;

    try {
      // Obtener inscripciones activas del estudiante
      const activeEnrollments = await Enrollment.findActiveByUser(userId);
      const maxEnrollments =
        parseInt(process.env.MAX_ENROLLMENTS_PER_STUDENT) || 8;

      if (activeEnrollments.length >= maxEnrollments) {
        return {
          isValid: false,
          error: `Has alcanzado el límite máximo de ${maxEnrollments} inscripciones activas`,
          details: {
            currentEnrollments: activeEnrollments.length,
            maxEnrollments: maxEnrollments,
            activeEnrollments: activeEnrollments.map(e => ({
              id: e.id,
              courseCode: e.courseCode,
              courseName: e.courseName,
              status: e.status,
            })),
          },
          strategy: this.getStrategyName(),
        };
      }

      return {
        isValid: true,
        data: {
          currentEnrollments: activeEnrollments.length,
          maxEnrollments: maxEnrollments,
          remainingSlots: maxEnrollments - activeEnrollments.length,
        },
        strategy: this.getStrategyName(),
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Error verificando límites de inscripción',
        details: error.message,
        strategy: this.getStrategyName(),
      };
    }
  }
}

module.exports = EnrollmentLimitValidationStrategy;
