/**
 * Tests para ValidatorFactory - Factory Method Pattern
 */

const {
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
  validatorFactoryManager
} = require('../../src/factories/ValidatorFactory');

describe('ValidatorFactory Tests', () => {
  describe('CapacityValidator', () => {
    let factory;
    let validator;

    beforeEach(() => {
      factory = new CapacityValidatorFactory();
      validator = factory.buildValidator({
        maxCapacity: 30,
        currentEnrollments: 25
      });
    });

    test('debe validar cuando hay cupos disponibles', () => {
      const data = { courseId: 'course-123', requestedSeats: 3 };
      const result = validator.performValidation(data);

      expect(result.isValid).toBe(true);
      expect(result.availableSeats).toBe(5);
      expect(result.requestedSeats).toBe(3);
    });

    test('debe fallar cuando no hay suficientes cupos', () => {
      const data = { courseId: 'course-123', requestedSeats: 10 };
      const result = validator.performValidation(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No hay suficientes cupos disponibles. Disponibles: 5, Solicitados: 10');
      expect(result.availableSeats).toBe(5);
      expect(result.requestedSeats).toBe(10);
    });

    test('debe manejar solicitud de 1 cupo por defecto', () => {
      const data = { courseId: 'course-123' };
      const result = validator.performValidation(data);

      expect(result.isValid).toBe(true);
      expect(result.requestedSeats).toBe(1);
    });
  });

  describe('PrerequisitesValidator', () => {
    let factory;
    let validator;

    beforeEach(() => {
      factory = new PrerequisitesValidatorFactory();
      validator = factory.buildValidator({
        requiredCourses: ['MATH-101', 'PHYS-101'],
        studentCompletedCourses: ['MATH-101', 'PHYS-101', 'CHEM-101']
      });
    });

    test('debe validar cuando todos los prerequisitos están completados', () => {
      const data = { studentId: 'student-123', courseId: 'course-456' };
      const result = validator.performValidation(data);

      expect(result.isValid).toBe(true);
      expect(result.requiredCourses).toEqual(['MATH-101', 'PHYS-101']);
      expect(result.completedCourses).toEqual(['MATH-101', 'PHYS-101', 'CHEM-101']);
    });

    test('debe fallar cuando faltan prerequisitos', () => {
      const validatorWithMissing = factory.buildValidator({
        requiredCourses: ['MATH-101', 'PHYS-101', 'ENG-101'],
        studentCompletedCourses: ['MATH-101', 'PHYS-101']
      });

      const data = { studentId: 'student-123', courseId: 'course-456' };
      const result = validatorWithMissing.performValidation(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Faltan prerequisitos: ENG-101');
      expect(result.missingPrerequisites).toEqual(['ENG-101']);
    });

    test('debe manejar cuando no hay prerequisitos requeridos', () => {
      const validatorNoPrereqs = factory.buildValidator({
        requiredCourses: [],
        studentCompletedCourses: ['MATH-101']
      });

      const data = { studentId: 'student-123', courseId: 'course-456' };
      const result = validatorNoPrereqs.performValidation(data);

      expect(result.isValid).toBe(true);
    });
  });

  describe('ScheduleValidator', () => {
    let factory;
    let validator;

    beforeEach(() => {
      factory = new ScheduleValidatorFactory();
      validator = factory.buildValidator({
        courseSchedule: {
          timeSlots: [
            { day: 'Monday', startTime: '10:00', endTime: '12:00' },
            { day: 'Wednesday', startTime: '10:00', endTime: '12:00' }
          ]
        },
        studentSchedule: [
          {
            timeSlots: [
              { day: 'Tuesday', startTime: '09:00', endTime: '11:00' },
              { day: 'Thursday', startTime: '14:00', endTime: '16:00' }
            ]
          }
        ]
      });
    });

    test('debe validar cuando no hay conflictos de horario', () => {
      const data = { courseId: 'course-123', studentId: 'student-456' };
      const result = validator.performValidation(data);

      expect(result.isValid).toBe(true);
      expect(result.conflicts || []).toEqual([]);
    });

    test('debe fallar cuando hay conflictos de horario', () => {
      const validatorWithConflict = factory.buildValidator({
        courseSchedule: {
          timeSlots: [
            { day: 'Monday', startTime: '10:00', endTime: '12:00' }
          ]
        },
        studentSchedule: [
          {
            timeSlots: [
              { day: 'Monday', startTime: '11:00', endTime: '13:00' }
            ]
          }
        ]
      });

      const data = { courseId: 'course-123', studentId: 'student-456' };
      const result = validatorWithConflict.performValidation(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Conflicto de horarios: Monday 10:00-12:00');
      expect(result.conflicts).toContain('Monday 10:00-12:00');
    });
  });

  describe('AcademicStatusValidator', () => {
    let factory;
    let validator;

    beforeEach(() => {
      factory = new AcademicStatusValidatorFactory();
      validator = factory.buildValidator({
        minGPA: 2.0,
        requiredStatus: 'active',
        studentGPA: 3.2,
        studentStatus: 'active'
      });
    });

    test('debe validar cuando el estudiante cumple los requisitos académicos', () => {
      const data = { studentId: 'student-123' };
      const result = validator.performValidation(data);

      expect(result.isValid).toBe(true);
      expect(result.studentGPA).toBe(3.2);
      expect(result.studentStatus).toBe('active');
    });

    test('debe fallar cuando el GPA es insuficiente', () => {
      const validatorLowGPA = factory.buildValidator({
        minGPA: 2.5,
        requiredStatus: 'active',
        studentGPA: 2.0,
        studentStatus: 'active'
      });

      const data = { studentId: 'student-123' };
      const result = validatorLowGPA.performValidation(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('GPA insuficiente. Requerido: 2.5, Actual: 2');
    });

    test('debe fallar cuando el estado académico no es válido', () => {
      const validatorInvalidStatus = factory.buildValidator({
        minGPA: 2.0,
        requiredStatus: 'active',
        studentGPA: 3.2,
        studentStatus: 'suspended'
      });

      const data = { studentId: 'student-123' };
      const result = validatorInvalidStatus.performValidation(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Estado académico inválido. Requerido: active, Actual: suspended');
    });
  });

  describe('PaymentValidator', () => {
    let factory;
    let validator;

    beforeEach(() => {
      factory = new PaymentValidatorFactory();
      validator = factory.buildValidator({
        allowEnrollmentWithPendingPayments: false,
        studentPendingPayments: []
      });
    });

    test('debe validar cuando no hay pagos pendientes', () => {
      const data = { studentId: 'student-123' };
      const result = validator.performValidation(data);

      expect(result.isValid).toBe(true);
      expect(result.pendingPayments).toEqual([]);
    });

    test('debe fallar cuando hay pagos pendientes y no se permite inscripción', () => {
      const validatorWithPending = factory.buildValidator({
        allowEnrollmentWithPendingPayments: false,
        studentPendingPayments: [
          { id: 'payment-1', amount: 100.00, dueDate: '2024-01-15' }
        ]
      });

      const data = { studentId: 'student-123' };
      const result = validatorWithPending.performValidation(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No se puede inscribir con pagos pendientes');
      expect(result.pendingPayments).toHaveLength(1);
    });

    test('debe permitir inscripción con pagos pendientes cuando está configurado', () => {
      const validatorAllowPending = factory.buildValidator({
        allowEnrollmentWithPendingPayments: true,
        studentPendingPayments: [
          { id: 'payment-1', amount: 100.00, dueDate: '2024-01-15' }
        ]
      });

      const data = { studentId: 'student-123' };
      const result = validatorAllowPending.performValidation(data);

      expect(result.isValid).toBe(true);
      expect(result.warning).toBe('Hay pagos pendientes pero se permite la inscripción');
    });
  });

  describe('DeadlineValidator', () => {
    let factory;
    let validator;

    beforeEach(() => {
      factory = new DeadlineValidatorFactory();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      validator = factory.buildValidator({
        enrollmentDeadline: futureDate,
        currentDate: new Date()
      });
    });

    test('debe validar cuando la fecha actual está antes del límite', () => {
      const data = { courseId: 'course-123' };
      const result = validator.performValidation(data);

      expect(result.isValid).toBe(true);
    });

    test('debe fallar cuando la fecha actual está después del límite', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      
      const validatorExpired = factory.buildValidator({
        enrollmentDeadline: pastDate,
        currentDate: new Date()
      });

      const data = { courseId: 'course-123' };
      const result = validatorExpired.performValidation(data);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Fecha límite de inscripción vencida');
    });
  });

  describe('ValidatorFactoryManager', () => {
    test('debe crear validador usando el factory apropiado', () => {
      const config = {
        maxCapacity: 30,
        currentEnrollments: 25
      };

      const validator = validatorFactoryManager.createValidator('capacity', config);

      expect(validator).toBeInstanceOf(CapacityValidator);
    });

    test('debe crear múltiples validadores', () => {
      const validatorConfigs = [
        { type: 'capacity', config: { maxCapacity: 30, currentEnrollments: 25 } },
        { type: 'prerequisites', config: { requiredCourses: ['MATH-101'], studentCompletedCourses: ['MATH-101'] } }
      ];

      const validators = validatorFactoryManager.createMultipleValidators(validatorConfigs);

      expect(validators).toHaveLength(2);
      expect(validators[0]).toBeInstanceOf(CapacityValidator);
      expect(validators[1]).toBeInstanceOf(PrerequisitesValidator);
    });

    test('debe crear validadores para inscripción', () => {
      const enrollmentConfig = {
        courseCapacity: 30,
        currentEnrollments: 25,
        requiredCourses: ['MATH-101'],
        studentCompletedCourses: ['MATH-101'],
        courseSchedule: { timeSlots: [] },
        studentSchedule: [],
        studentGPA: 3.2,
        minGPA: 2.0,
        studentStatus: 'active',
        studentPendingPayments: [],
        enrollmentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const validators = validatorFactoryManager.createEnrollmentValidators(enrollmentConfig);

      expect(validators).toHaveLength(6); // Todos los validadores
      expect(validators.some(v => v instanceof CapacityValidator)).toBe(true);
      expect(validators.some(v => v instanceof PrerequisitesValidator)).toBe(true);
      expect(validators.some(v => v instanceof ScheduleValidator)).toBe(true);
      expect(validators.some(v => v instanceof AcademicStatusValidator)).toBe(true);
      expect(validators.some(v => v instanceof PaymentValidator)).toBe(true);
      expect(validators.some(v => v instanceof DeadlineValidator)).toBe(true);
    });

    test('debe lanzar error para tipo de factory no encontrado', () => {
      expect(() => {
        validatorFactoryManager.createValidator('invalid_type', {});
      }).toThrow("Factory para tipo 'invalid_type' no encontrado");
    });

    test('debe obtener tipos disponibles', () => {
      const types = validatorFactoryManager.getAvailableTypes();

      expect(types).toContain('capacity');
      expect(types).toContain('prerequisites');
      expect(types).toContain('schedule');
      expect(types).toContain('academic_status');
      expect(types).toContain('payment');
      expect(types).toContain('deadline');
    });

    test('debe registrar nuevo factory', () => {
      class CustomValidator extends Validator {
        validate(data) {
          return { isValid: true, custom: true };
        }
      }

      class CustomValidatorFactory extends ValidatorFactory {
        createValidator(config) {
          return new CustomValidator();
        }
      }

      validatorFactoryManager.registerFactory('custom', new CustomValidatorFactory());

      const validator = validatorFactoryManager.createValidator('custom', {});
      const result = validator.performValidation({});

      expect(result.isValid).toBe(true);
      expect(result.custom).toBe(true);
    });
  });

  describe('Validaciones de Factory Base', () => {
    test('debe validar que el validador extienda de Validator', () => {
      const factory = new CapacityValidatorFactory();

      expect(() => {
        factory.validateValidator({});
      }).toThrow('Validador debe extender de Validator');
    });

    test('debe configurar validador correctamente', () => {
      const factory = new CapacityValidatorFactory();
      const config = { maxCapacity: 30, currentEnrollments: 25 };
      
      const validator = factory.buildValidator(config);

      expect(validator.maxCapacity).toBe(30);
      expect(validator.currentEnrollments).toBe(25);
    });
  });
});
