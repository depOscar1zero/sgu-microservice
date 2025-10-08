/**
 * Servicio de Validación de Inscripciones
 *
 * Integra el patrón Strategy con el sistema existente para proporcionar
 * validación flexible y extensible de inscripciones.
 */

const {
  ValidationContext,
  PrerequisitesValidationStrategy,
  CapacityValidationStrategy,
  ScheduleValidationStrategy,
  PaymentValidationStrategy,
  DeadlineValidationStrategy,
} = require('../strategies/ValidationStrategy');

/**
 * Servicio principal para validación de inscripciones
 * Utiliza el patrón Strategy para manejar diferentes tipos de validación
 */
class EnrollmentValidationService {
  constructor() {
    this.validationContext = new ValidationContext();
    this.initializeDefaultStrategies();
  }

  /**
   * Inicializar estrategias por defecto
   */
  initializeDefaultStrategies() {
    // Las estrategias se configurarán dinámicamente según el contexto
    // No agregamos estrategias por defecto para mayor flexibilidad
  }

  /**
   * Configurar estrategias para un curso específico
   * @param {Object} courseConfig - Configuración del curso
   */
  configureStrategiesForCourse(courseConfig) {
    this.validationContext.clearStrategies();

    // Agregar estrategia de prerequisitos si es necesario
    if (
      courseConfig &&
      courseConfig.requiredCourses &&
      courseConfig.requiredCourses.length > 0
    ) {
      const prerequisitesStrategy = new PrerequisitesValidationStrategy({
        requiredCourses: courseConfig.requiredCourses,
        studentCompletedCourses: courseConfig.studentCompletedCourses || [],
        minGPA: courseConfig.minGPA || 2.0,
        studentGPA: courseConfig.studentGPA || 0,
      });
      this.validationContext.addStrategy(prerequisitesStrategy);
    }

    // Agregar estrategia de capacidad si es necesario
    if (
      courseConfig &&
      courseConfig.maxCapacity &&
      courseConfig.maxCapacity > 0
    ) {
      const capacityStrategy = new CapacityValidationStrategy({
        maxCapacity: courseConfig.maxCapacity,
        currentEnrollments: courseConfig.currentEnrollments || 0,
        requestedSeats: courseConfig.requestedSeats || 1,
      });
      this.validationContext.addStrategy(capacityStrategy);
    }

    // Agregar estrategia de horarios si es necesario
    if (
      courseConfig &&
      courseConfig.courseSchedule &&
      courseConfig.courseSchedule.timeSlots
    ) {
      const scheduleStrategy = new ScheduleValidationStrategy({
        courseSchedule: courseConfig.courseSchedule,
        studentSchedule: courseConfig.studentSchedule || [],
      });
      this.validationContext.addStrategy(scheduleStrategy);
    }

    // Agregar estrategia de pagos si es necesario
    if (courseConfig && courseConfig.studentPendingPayments !== undefined) {
      const paymentStrategy = new PaymentValidationStrategy({
        allowEnrollmentWithPendingPayments:
          courseConfig.allowEnrollmentWithPendingPayments || false,
        studentPendingPayments: courseConfig.studentPendingPayments || [],
      });
      this.validationContext.addStrategy(paymentStrategy);
    }

    // Agregar estrategia de fechas límite si es necesario
    if (courseConfig.enrollmentDeadline) {
      const deadlineStrategy = new DeadlineValidationStrategy({
        enrollmentDeadline: courseConfig.enrollmentDeadline,
        currentDate: courseConfig.currentDate || new Date(),
      });
      this.validationContext.addStrategy(deadlineStrategy);
    }
  }

  /**
   * Validar inscripción completa
   * @param {Object} enrollmentData - Datos de la inscripción
   * @param {Object} courseConfig - Configuración del curso
   * @returns {Object} - Resultado de la validación
   */
  async validateEnrollment(enrollmentData, courseConfig) {
    try {
      // Configurar estrategias según el curso
      this.configureStrategiesForCourse(courseConfig);

      // Crear contexto de validación
      const validationContext = {
        hasPrerequisites:
          courseConfig.requiredCourses &&
          courseConfig.requiredCourses.length > 0,
        hasCapacityLimit:
          courseConfig.maxCapacity && courseConfig.maxCapacity > 0,
        hasSchedule:
          courseConfig.courseSchedule && courseConfig.courseSchedule.timeSlots,
        hasPaymentValidation: courseConfig.studentPendingPayments !== undefined,
        hasDeadline: !!courseConfig.enrollmentDeadline,
      };

      // Ejecutar validación
      const result = this.validationContext.executeValidation(
        enrollmentData,
        validationContext
      );

      // Agregar metadatos adicionales
      result.enrollmentData = enrollmentData;
      result.courseConfig = courseConfig;
      result.timestamp = new Date();
      result.validationId = this.generateValidationId();

      return result;
    } catch (error) {
      console.error('Error en validación de inscripción:', error);
      return {
        isValid: false,
        errors: [`Error interno de validación: ${error.message}`],
        results: [],
        strategiesUsed: [],
        summary: {
          totalStrategies: 0,
          validStrategies: 0,
          invalidStrategies: 0,
        },
        enrollmentData,
        courseConfig,
        timestamp: new Date(),
        validationId: this.generateValidationId(),
      };
    }
  }

  /**
   * Validar con una estrategia específica
   * @param {string} strategyName - Nombre de la estrategia
   * @param {Object} enrollmentData - Datos de la inscripción
   * @param {Object} strategyConfig - Configuración de la estrategia
   * @returns {Object} - Resultado de la validación
   */
  async validateWithSpecificStrategy(
    strategyName,
    enrollmentData,
    strategyConfig
  ) {
    try {
      // Crear estrategia específica
      let strategy;
      switch (strategyName) {
        case 'PrerequisitesValidationStrategy':
          strategy = new PrerequisitesValidationStrategy(strategyConfig);
          break;
        case 'CapacityValidationStrategy':
          strategy = new CapacityValidationStrategy(strategyConfig);
          break;
        case 'ScheduleValidationStrategy':
          strategy = new ScheduleValidationStrategy(strategyConfig);
          break;
        case 'PaymentValidationStrategy':
          strategy = new PaymentValidationStrategy(strategyConfig);
          break;
        case 'DeadlineValidationStrategy':
          strategy = new DeadlineValidationStrategy(strategyConfig);
          break;
        default:
          throw new Error(`Estrategia '${strategyName}' no soportada`);
      }

      // Ejecutar validación
      const result = strategy.validate(enrollmentData);

      return {
        ...result,
        enrollmentData,
        strategyConfig,
        timestamp: new Date(),
        validationId: this.generateValidationId(),
      };
    } catch (error) {
      console.error(
        `Error en validación con estrategia ${strategyName}:`,
        error
      );
      return {
        isValid: false,
        errors: [`Error en estrategia ${strategyName}: ${error.message}`],
        strategy: strategyName,
        enrollmentData,
        strategyConfig,
        timestamp: new Date(),
        validationId: this.generateValidationId(),
      };
    }
  }

  /**
   * Obtener estadísticas de validación
   * @returns {Object} - Estadísticas del servicio
   */
  getValidationStats() {
    return {
      availableStrategies: this.validationContext.getAvailableStrategies(),
      totalStrategies: this.validationContext.strategies.length,
      serviceStatus: 'active',
      lastValidation: new Date(),
    };
  }

  /**
   * Generar ID único para validación
   * @returns {string} - ID de validación
   */
  generateValidationId() {
    return `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validar prerequisitos específicos
   * @param {Object} studentData - Datos del estudiante
   * @param {Object} courseData - Datos del curso
   * @returns {Object} - Resultado de validación de prerequisitos
   */
  async validatePrerequisites(studentData, courseData) {
    const strategyConfig = {
      requiredCourses: courseData.requiredCourses || [],
      studentCompletedCourses: studentData.completedCourses || [],
      minGPA: courseData.minGPA || 2.0,
      studentGPA: studentData.gpa || 0,
    };

    return await this.validateWithSpecificStrategy(
      'PrerequisitesValidationStrategy',
      { studentId: studentData.id, courseId: courseData.id },
      strategyConfig
    );
  }

  /**
   * Validar capacidad específica
   * @param {Object} courseData - Datos del curso
   * @param {number} requestedSeats - Cupos solicitados
   * @returns {Object} - Resultado de validación de capacidad
   */
  async validateCapacity(courseData, requestedSeats = 1) {
    const strategyConfig = {
      maxCapacity: courseData.maxCapacity || 30,
      currentEnrollments: courseData.currentEnrollments || 0,
      requestedSeats,
    };

    return await this.validateWithSpecificStrategy(
      'CapacityValidationStrategy',
      { courseId: courseData.id, requestedSeats },
      strategyConfig
    );
  }

  /**
   * Validar horarios específicos
   * @param {Object} courseData - Datos del curso
   * @param {Object} studentData - Datos del estudiante
   * @returns {Object} - Resultado de validación de horarios
   */
  async validateSchedule(courseData, studentData) {
    const strategyConfig = {
      courseSchedule: courseData.schedule || {},
      studentSchedule: studentData.currentEnrollments || [],
    };

    return await this.validateWithSpecificStrategy(
      'ScheduleValidationStrategy',
      { courseId: courseData.id, studentId: studentData.id },
      strategyConfig
    );
  }
}

// Instancia singleton del servicio
const enrollmentValidationService = new EnrollmentValidationService();

module.exports = {
  EnrollmentValidationService,
  enrollmentValidationService,
};
