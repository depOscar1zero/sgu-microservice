/**
 * Strategy Pattern - Validation Strategy
 *
 * Este patrón Strategy permite definir diferentes algoritmos de validación
 * para el proceso de inscripción, permitiendo intercambiarlos dinámicamente
 * sin modificar el código cliente.
 */

/**
 * Interfaz base para estrategias de validación
 * Define el contrato que todas las estrategias deben implementar
 */
class ValidationStrategy {
  /**
   * Método de validación que debe ser implementado por las estrategias concretas
   * @param {Object} data - Datos a validar
   * @returns {Object} - Resultado de la validación
   */
  validate(data) {
    throw new Error('validate debe ser implementado por subclases');
  }

  /**
   * Obtener el nombre de la estrategia
   * @returns {string} - Nombre de la estrategia
   */
  getStrategyName() {
    return this.constructor.name;
  }

  /**
   * Verificar si la estrategia es aplicable para el contexto dado
   * @param {Object} context - Contexto de validación
   * @returns {boolean} - True si es aplicable
   */
  isApplicable(context) {
    return true; // Por defecto, todas las estrategias son aplicables
  }

  /**
   * Obtener la prioridad de la estrategia (menor número = mayor prioridad)
   * @returns {number} - Prioridad de la estrategia
   */
  getPriority() {
    return 100; // Prioridad por defecto
  }
}

/**
 * Estrategia de validación de prerequisitos
 * Valida que el estudiante cumpla con los prerequisitos del curso
 */
class PrerequisitesValidationStrategy extends ValidationStrategy {
  constructor(config = {}) {
    super();
    this.requiredCourses = config.requiredCourses || [];
    this.studentCompletedCourses = config.studentCompletedCourses || [];
    this.minGPA = config.minGPA || 2.0;
    this.studentGPA = config.studentGPA || 0;
  }

  validate(data) {
    const { studentId, courseId } = data;

    const missingPrerequisites = this.requiredCourses.filter(
      prereq => !this.studentCompletedCourses.includes(prereq)
    );

    const errors = [];

    if (missingPrerequisites.length > 0) {
      errors.push(`Faltan prerequisitos: ${missingPrerequisites.join(', ')}`);
    }

    if (this.studentGPA < this.minGPA) {
      errors.push(
        `GPA insuficiente. Requerido: ${this.minGPA}, Actual: ${this.studentGPA}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      strategy: this.getStrategyName(),
      details: {
        requiredCourses: this.requiredCourses,
        completedCourses: this.studentCompletedCourses,
        missingPrerequisites,
        studentGPA: this.studentGPA,
        minGPA: this.minGPA,
      },
    };
  }

  getPriority() {
    return 10; // Alta prioridad - prerequisitos son fundamentales
  }

  isApplicable(context) {
    return context.hasPrerequisites || this.requiredCourses.length > 0;
  }
}

/**
 * Estrategia de validación de capacidad
 * Valida que haya cupos disponibles para el curso
 */
class CapacityValidationStrategy extends ValidationStrategy {
  constructor(config = {}) {
    super();
    this.maxCapacity = config.maxCapacity || 30;
    this.currentEnrollments = config.currentEnrollments || 0;
    this.requestedSeats = config.requestedSeats || 1;
  }

  validate(data) {
    const { courseId, requestedSeats = 1 } = data;

    const availableSeats = this.maxCapacity - this.currentEnrollments;
    const errors = [];

    if (requestedSeats > availableSeats) {
      errors.push(
        `No hay suficientes cupos disponibles. Disponibles: ${availableSeats}, Solicitados: ${requestedSeats}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      strategy: this.getStrategyName(),
      details: {
        maxCapacity: this.maxCapacity,
        currentEnrollments: this.currentEnrollments,
        availableSeats,
        requestedSeats,
      },
    };
  }

  getPriority() {
    return 20; // Alta prioridad - capacidad es crítica
  }

  isApplicable(context) {
    return context.hasCapacityLimit || this.maxCapacity > 0;
  }
}

/**
 * Estrategia de validación de horarios
 * Valida que no haya conflictos de horario
 */
class ScheduleValidationStrategy extends ValidationStrategy {
  constructor(config = {}) {
    super();
    this.courseSchedule = config.courseSchedule || {};
    this.studentSchedule = config.studentSchedule || [];
  }

  validate(data) {
    const { courseId, studentId } = data;

    const courseTimeSlots = this.courseSchedule.timeSlots || [];
    const studentTimeSlots = this.studentSchedule
      .map(enrollment => enrollment.timeSlots)
      .flat();

    const conflicts = this.findScheduleConflicts(
      courseTimeSlots,
      studentTimeSlots
    );
    const errors = [];

    if (conflicts.length > 0) {
      errors.push(`Conflicto de horarios: ${conflicts.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      strategy: this.getStrategyName(),
      details: {
        courseTimeSlots,
        studentTimeSlots,
        conflicts,
      },
    };
  }

  findScheduleConflicts(courseSlots, studentSlots) {
    const conflicts = [];

    for (const courseSlot of courseSlots) {
      for (const studentSlot of studentSlots) {
        if (this.slotsOverlap(courseSlot, studentSlot)) {
          conflicts.push(
            `${courseSlot.day} ${courseSlot.startTime}-${courseSlot.endTime}`
          );
        }
      }
    }

    return conflicts;
  }

  slotsOverlap(slot1, slot2) {
    return (
      slot1.day === slot2.day &&
      slot1.startTime < slot2.endTime &&
      slot2.startTime < slot1.endTime
    );
  }

  getPriority() {
    return 30; // Prioridad media
  }

  isApplicable(context) {
    return (
      context.hasSchedule ||
      (this.courseSchedule.timeSlots &&
        this.courseSchedule.timeSlots.length > 0)
    );
  }
}

/**
 * Estrategia de validación de pagos
 * Valida que no haya pagos pendientes
 */
class PaymentValidationStrategy extends ValidationStrategy {
  constructor(config = {}) {
    super();
    this.allowEnrollmentWithPendingPayments =
      config.allowEnrollmentWithPendingPayments || false;
    this.studentPendingPayments = config.studentPendingPayments || [];
  }

  validate(data) {
    const { studentId } = data;

    const errors = [];

    if (
      !this.allowEnrollmentWithPendingPayments &&
      this.studentPendingPayments.length > 0
    ) {
      errors.push('No se puede inscribir con pagos pendientes');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strategy: this.getStrategyName(),
      details: {
        pendingPayments: this.studentPendingPayments,
        allowWithPending: this.allowEnrollmentWithPendingPayments,
      },
    };
  }

  getPriority() {
    return 40; // Prioridad media-baja
  }

  isApplicable(context) {
    return (
      context.hasPaymentValidation || this.studentPendingPayments.length > 0
    );
  }
}

/**
 * Estrategia de validación de fechas límite
 * Valida que la inscripción esté dentro del período permitido
 */
class DeadlineValidationStrategy extends ValidationStrategy {
  constructor(config = {}) {
    super();
    this.enrollmentDeadline = config.enrollmentDeadline || new Date();
    this.currentDate = config.currentDate || new Date();
  }

  validate(data) {
    const { courseId } = data;

    const errors = [];

    if (this.currentDate > this.enrollmentDeadline) {
      errors.push(
        `Fecha límite de inscripción vencida. Límite: ${this.enrollmentDeadline.toLocaleDateString()}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      strategy: this.getStrategyName(),
      details: {
        enrollmentDeadline: this.enrollmentDeadline,
        currentDate: this.currentDate,
        isExpired: this.currentDate > this.enrollmentDeadline,
      },
    };
  }

  getPriority() {
    return 50; // Prioridad baja
  }

  isApplicable(context) {
    return context.hasDeadline || this.enrollmentDeadline;
  }
}

/**
 * Context para manejar las estrategias de validación
 * Implementa el patrón Strategy permitiendo cambiar estrategias dinámicamente
 */
class ValidationContext {
  constructor() {
    this.strategies = [];
    this.results = [];
  }

  /**
   * Agregar una estrategia al contexto
   * @param {ValidationStrategy} strategy - Estrategia a agregar
   */
  addStrategy(strategy) {
    if (!(strategy instanceof ValidationStrategy)) {
      throw new Error('La estrategia debe extender de ValidationStrategy');
    }
    this.strategies.push(strategy);
    // Ordenar por prioridad
    this.strategies.sort((a, b) => a.getPriority() - b.getPriority());
  }

  /**
   * Remover una estrategia del contexto
   * @param {string} strategyName - Nombre de la estrategia a remover
   */
  removeStrategy(strategyName) {
    this.strategies = this.strategies.filter(
      strategy => strategy.getStrategyName() !== strategyName
    );
  }

  /**
   * Ejecutar todas las estrategias aplicables
   * @param {Object} data - Datos a validar
   * @param {Object} context - Contexto de validación
   * @returns {Object} - Resultado consolidado de todas las validaciones
   */
  executeValidation(data, context = {}) {
    this.results = [];
    const applicableStrategies = this.strategies.filter(strategy =>
      strategy.isApplicable(context)
    );

    let allValid = true;
    const allErrors = [];

    for (const strategy of applicableStrategies) {
      try {
        const result = strategy.validate(data);
        this.results.push(result);

        if (!result.isValid) {
          allValid = false;
          allErrors.push(...result.errors);
        }
      } catch (error) {
        console.error(
          `Error en estrategia ${strategy.getStrategyName()}:`,
          error
        );
        allValid = false;
        allErrors.push(`Error en validación: ${error.message}`);
      }
    }

    return {
      isValid: allValid,
      errors: allErrors,
      results: this.results,
      strategiesUsed: applicableStrategies.map(s => s.getStrategyName()),
      summary: {
        totalStrategies: applicableStrategies.length,
        validStrategies: this.results.filter(r => r.isValid).length,
        invalidStrategies: this.results.filter(r => !r.isValid).length,
      },
    };
  }

  /**
   * Ejecutar validación con una estrategia específica
   * @param {string} strategyName - Nombre de la estrategia
   * @param {Object} data - Datos a validar
   * @returns {Object} - Resultado de la validación
   */
  executeSpecificStrategy(strategyName, data) {
    const strategy = this.strategies.find(
      s => s.getStrategyName() === strategyName
    );
    if (!strategy) {
      throw new Error(`Estrategia '${strategyName}' no encontrada`);
    }
    return strategy.validate(data);
  }

  /**
   * Obtener estrategias disponibles
   * @returns {Array<string>} - Nombres de las estrategias
   */
  getAvailableStrategies() {
    return this.strategies.map(s => s.getStrategyName());
  }

  /**
   * Limpiar todas las estrategias
   */
  clearStrategies() {
    this.strategies = [];
    this.results = [];
  }
}

module.exports = {
  ValidationStrategy,
  PrerequisitesValidationStrategy,
  CapacityValidationStrategy,
  ScheduleValidationStrategy,
  PaymentValidationStrategy,
  DeadlineValidationStrategy,
  ValidationContext,
};
