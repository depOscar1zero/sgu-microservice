/**
 * Factory Method Pattern - Validator Factory
 *
 * Este factory se encarga de crear diferentes tipos de validadores
 * según el contexto de validación especificado, siguiendo el patrón Factory Method.
 */

/**
 * Clase base abstracta para validadores
 */
class Validator {
  /**
   * Método de validación abstracto
   * @param {Object} data - Datos a validar
   * @returns {Object} - Resultado de la validación
   */
  validate(data) {
    throw new Error('validate debe ser implementado por subclases');
  }

  /**
   * Método template para el proceso de validación
   * @param {Object} data - Datos a validar
   * @returns {Object} - Resultado de la validación
   */
  performValidation(data) {
    this.preValidate(data);
    const result = this.validate(data);
    this.postValidate(result);
    return result;
  }

  /**
   * Pre-validación (hook)
   * @param {Object} data - Datos a validar
   */
  preValidate(data) {
    // Implementación por defecto - las subclases pueden sobrescribir
  }

  /**
   * Post-validación (hook)
   * @param {Object} result - Resultado de la validación
   */
  postValidate(result) {
    // Implementación por defecto - las subclases pueden sobrescribir
  }
}

/**
 * Clase base abstracta para factories de validadores
 */
class ValidatorFactory {
  /**
   * Método factory abstracto - debe ser implementado por subclases
   * @param {Object} config - Configuración del validador
   * @returns {Validator} - Instancia del validador
   */
  createValidator(config) {
    throw new Error('createValidator debe ser implementado por subclases');
  }

  /**
   * Método template para el proceso de creación
   * @param {Object} config - Configuración del validador
   * @returns {Validator} - Validador creado
   */
  buildValidator(config) {
    const validator = this.createValidator(config);
    this.validateValidator(validator);
    this.configureValidator(validator, config);
    return validator;
  }

  /**
   * Validar el validador creado
   * @param {Validator} validator - Validador a validar
   */
  validateValidator(validator) {
    if (!(validator instanceof Validator)) {
      throw new Error('Validador debe extender de Validator');
    }
  }

  /**
   * Configurar el validador
   * @param {Validator} validator - Validador a configurar
   * @param {Object} config - Configuración
   */
  configureValidator(validator, config) {
    // Implementación base - las subclases pueden sobrescribir
  }
}

/**
 * Validador de disponibilidad de cupos
 */
class CapacityValidator extends Validator {
  constructor(config = {}) {
    super();
    this.maxCapacity = config.maxCapacity || 30;
    this.currentEnrollments = config.currentEnrollments || 0;
  }

  validate(data) {
    const { courseId, requestedSeats = 1 } = data;

    const availableSeats = this.maxCapacity - this.currentEnrollments;

    if (requestedSeats > availableSeats) {
      return {
        isValid: false,
        errors: [
          `No hay suficientes cupos disponibles. Disponibles: ${availableSeats}, Solicitados: ${requestedSeats}`,
        ],
        availableSeats,
        requestedSeats,
      };
    }

    return {
      isValid: true,
      availableSeats,
      requestedSeats,
    };
  }
}

/**
 * Validador de prerequisitos
 */
class PrerequisitesValidator extends Validator {
  constructor(config = {}) {
    super();
    this.requiredCourses = config.requiredCourses || [];
    this.studentCompletedCourses = config.studentCompletedCourses || [];
  }

  validate(data) {
    const { studentId, courseId } = data;

    const missingPrerequisites = this.requiredCourses.filter(
      prereq => !this.studentCompletedCourses.includes(prereq)
    );

    if (missingPrerequisites.length > 0) {
      return {
        isValid: false,
        errors: [`Faltan prerequisitos: ${missingPrerequisites.join(', ')}`],
        missingPrerequisites,
        requiredCourses: this.requiredCourses,
        completedCourses: this.studentCompletedCourses,
      };
    }

    return {
      isValid: true,
      requiredCourses: this.requiredCourses,
      completedCourses: this.studentCompletedCourses,
    };
  }
}

/**
 * Validador de horarios
 */
class ScheduleValidator extends Validator {
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

    if (conflicts.length > 0) {
      return {
        isValid: false,
        errors: [`Conflicto de horarios: ${conflicts.join(', ')}`],
        conflicts,
        courseTimeSlots,
        studentTimeSlots,
      };
    }

    return {
      isValid: true,
      courseTimeSlots,
      studentTimeSlots,
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
}

/**
 * Validador de estado académico
 */
class AcademicStatusValidator extends Validator {
  constructor(config = {}) {
    super();
    this.minGPA = config.minGPA || 2.0;
    this.requiredStatus = config.requiredStatus || 'active';
    this.studentGPA = config.studentGPA || 0;
    this.studentStatus = config.studentStatus || 'inactive';
  }

  validate(data) {
    const { studentId } = data;

    const errors = [];

    if (this.studentGPA < this.minGPA) {
      errors.push(
        `GPA insuficiente. Requerido: ${this.minGPA}, Actual: ${this.studentGPA}`
      );
    }

    if (this.studentStatus !== this.requiredStatus) {
      errors.push(
        `Estado académico inválido. Requerido: ${this.requiredStatus}, Actual: ${this.studentStatus}`
      );
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        studentGPA: this.studentGPA,
        minGPA: this.minGPA,
        studentStatus: this.studentStatus,
        requiredStatus: this.requiredStatus,
      };
    }

    return {
      isValid: true,
      studentGPA: this.studentGPA,
      studentStatus: this.studentStatus,
    };
  }
}

/**
 * Validador de pagos pendientes
 */
class PaymentValidator extends Validator {
  constructor(config = {}) {
    super();
    this.allowEnrollmentWithPendingPayments =
      config.allowEnrollmentWithPendingPayments || false;
    this.studentPendingPayments = config.studentPendingPayments || [];
  }

  validate(data) {
    const { studentId } = data;

    if (this.allowEnrollmentWithPendingPayments) {
      return {
        isValid: true,
        pendingPayments: this.studentPendingPayments,
        warning: 'Hay pagos pendientes pero se permite la inscripción',
      };
    }

    if (this.studentPendingPayments.length > 0) {
      return {
        isValid: false,
        errors: ['No se puede inscribir con pagos pendientes'],
        pendingPayments: this.studentPendingPayments,
      };
    }

    return {
      isValid: true,
      pendingPayments: [],
    };
  }
}

/**
 * Validador de fechas límite
 */
class DeadlineValidator extends Validator {
  constructor(config = {}) {
    super();
    this.enrollmentDeadline = config.enrollmentDeadline || new Date();
    this.currentDate = config.currentDate || new Date();
  }

  validate(data) {
    const { courseId } = data;

    if (this.currentDate > this.enrollmentDeadline) {
      return {
        isValid: false,
        errors: [
          `Fecha límite de inscripción vencida. Límite: ${this.enrollmentDeadline.toLocaleDateString()}`,
        ],
        enrollmentDeadline: this.enrollmentDeadline,
        currentDate: this.currentDate,
      };
    }

    return {
      isValid: true,
      enrollmentDeadline: this.enrollmentDeadline,
      currentDate: this.currentDate,
    };
  }
}

/**
 * Factory para validadores de capacidad
 */
class CapacityValidatorFactory extends ValidatorFactory {
  createValidator(config) {
    return new CapacityValidator(config);
  }
}

/**
 * Factory para validadores de prerequisitos
 */
class PrerequisitesValidatorFactory extends ValidatorFactory {
  createValidator(config) {
    return new PrerequisitesValidator(config);
  }
}

/**
 * Factory para validadores de horarios
 */
class ScheduleValidatorFactory extends ValidatorFactory {
  createValidator(config) {
    return new ScheduleValidator(config);
  }
}

/**
 * Factory para validadores de estado académico
 */
class AcademicStatusValidatorFactory extends ValidatorFactory {
  createValidator(config) {
    return new AcademicStatusValidator(config);
  }
}

/**
 * Factory para validadores de pagos
 */
class PaymentValidatorFactory extends ValidatorFactory {
  createValidator(config) {
    return new PaymentValidator(config);
  }
}

/**
 * Factory para validadores de fechas límite
 */
class DeadlineValidatorFactory extends ValidatorFactory {
  createValidator(config) {
    return new DeadlineValidator(config);
  }
}

/**
 * Factory principal que maneja la creación de validadores
 * Implementa el patrón Factory Method
 */
class ValidatorFactoryManager {
  constructor() {
    this.factories = {
      capacity: new CapacityValidatorFactory(),
      prerequisites: new PrerequisitesValidatorFactory(),
      schedule: new ScheduleValidatorFactory(),
      academic_status: new AcademicStatusValidatorFactory(),
      payment: new PaymentValidatorFactory(),
      deadline: new DeadlineValidatorFactory(),
    };
  }

  /**
   * Crear validador usando el factory apropiado
   * @param {string} type - Tipo de validador
   * @param {Object} config - Configuración del validador
   * @returns {Validator} - Validador creado
   */
  createValidator(type, config = {}) {
    const factory = this.factories[type];

    if (!factory) {
      throw new Error(`Factory para tipo '${type}' no encontrado`);
    }

    return factory.buildValidator(config);
  }

  /**
   * Crear múltiples validadores
   * @param {Array<Object>} validatorConfigs - Configuraciones de validadores
   * @returns {Array<Validator>} - Array de validadores creados
   */
  createMultipleValidators(validatorConfigs) {
    return validatorConfigs.map(({ type, config }) =>
      this.createValidator(type, config)
    );
  }

  /**
   * Crear conjunto de validadores para inscripción
   * @param {Object} enrollmentConfig - Configuración de inscripción
   * @returns {Array<Validator>} - Validadores para inscripción
   */
  createEnrollmentValidators(enrollmentConfig) {
    const validators = [];

    // Validador de capacidad
    if (enrollmentConfig.courseCapacity) {
      validators.push(
        this.createValidator('capacity', {
          maxCapacity: enrollmentConfig.courseCapacity,
          currentEnrollments: enrollmentConfig.currentEnrollments || 0,
        })
      );
    }

    // Validador de prerequisitos
    if (enrollmentConfig.requiredCourses) {
      validators.push(
        this.createValidator('prerequisites', {
          requiredCourses: enrollmentConfig.requiredCourses,
          studentCompletedCourses:
            enrollmentConfig.studentCompletedCourses || [],
        })
      );
    }

    // Validador de horarios
    if (enrollmentConfig.courseSchedule) {
      validators.push(
        this.createValidator('schedule', {
          courseSchedule: enrollmentConfig.courseSchedule,
          studentSchedule: enrollmentConfig.studentSchedule || [],
        })
      );
    }

    // Validador de estado académico
    if (enrollmentConfig.studentGPA !== undefined) {
      validators.push(
        this.createValidator('academic_status', {
          minGPA: enrollmentConfig.minGPA || 2.0,
          studentGPA: enrollmentConfig.studentGPA,
          studentStatus: enrollmentConfig.studentStatus || 'active',
        })
      );
    }

    // Validador de pagos
    if (enrollmentConfig.studentPendingPayments) {
      validators.push(
        this.createValidator('payment', {
          allowEnrollmentWithPendingPayments:
            enrollmentConfig.allowEnrollmentWithPendingPayments || false,
          studentPendingPayments: enrollmentConfig.studentPendingPayments,
        })
      );
    }

    // Validador de fechas límite
    if (enrollmentConfig.enrollmentDeadline) {
      validators.push(
        this.createValidator('deadline', {
          enrollmentDeadline: enrollmentConfig.enrollmentDeadline,
          currentDate: enrollmentConfig.currentDate || new Date(),
        })
      );
    }

    return validators;
  }

  /**
   * Obtener tipos de validadores disponibles
   * @returns {Array<string>} - Tipos disponibles
   */
  getAvailableTypes() {
    return Object.keys(this.factories);
  }

  /**
   * Registrar un nuevo factory
   * @param {string} type - Tipo de validador
   * @param {ValidatorFactory} factory - Factory a registrar
   */
  registerFactory(type, factory) {
    if (!(factory instanceof ValidatorFactory)) {
      throw new Error('Factory debe extender de ValidatorFactory');
    }
    this.factories[type] = factory;
  }
}

// Instancia singleton del manager
const validatorFactoryManager = new ValidatorFactoryManager();

module.exports = {
  Validator,
  ValidatorFactory,
  CapacityValidator,
  PrerequisitesValidator,
  ScheduleValidator,
  AcademicStatusValidator,
  PaymentValidator,
  DeadlineValidator,
  CapacityValidatorFactory,
  PrerequisitesValidatorFactory,
  ScheduleValidatorFactory,
  AcademicStatusValidatorFactory,
  PaymentValidatorFactory,
  DeadlineValidatorFactory,
  ValidatorFactoryManager,
  validatorFactoryManager,
};
