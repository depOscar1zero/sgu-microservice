const ValidationStrategy = require("./ValidationStrategy");
const { CoursesServiceClient } = require("../services/externalServices");

/**
 * Estrategia para validar la disponibilidad del curso
 * Verifica que el curso esté disponible para inscripción
 */
class AvailabilityValidationStrategy extends ValidationStrategy {
  constructor() {
    super();
  }

  getPriority() {
    return 1; // Alta prioridad - debe ejecutarse primero
  }

  async validate(context) {
    const { courseId } = context;

    try {
      // Verificar que el curso existe y está disponible
      const courseResult = await CoursesServiceClient.checkCourseAvailability(
        courseId
      );

      if (!courseResult.success) {
        return {
          isValid: false,
          error: courseResult.error,
          strategy: this.getName(),
        };
      }

      const course = courseResult.data;

      if (!course.canEnroll) {
        return {
          isValid: false,
          error: "El curso no está disponible para inscripción",
          details: {
            status: course.status,
            availableSlots: course.availableSlots,
            reason: course.reason || "Curso no disponible",
          },
          strategy: this.getName(),
        };
      }

      return {
        isValid: true,
        data: {
          course: course,
          availableSlots: course.availableSlots,
        },
        strategy: this.getName(),
      };
    } catch (error) {
      return {
        isValid: false,
        error: "Error verificando disponibilidad del curso",
        details: error.message,
        strategy: this.getName(),
      };
    }
  }
}

module.exports = AvailabilityValidationStrategy;
