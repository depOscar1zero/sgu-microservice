/**
 * Tests para ValidationStrategy - Strategy Pattern
 */

const {
  ValidationStrategy,
  PrerequisitesValidationStrategy,
  CapacityValidationStrategy,
  ScheduleValidationStrategy,
  PaymentValidationStrategy,
  DeadlineValidationStrategy,
  ValidationContext,
} = require('../../src/strategies/ValidationStrategy');

describe('ValidationStrategy Tests', () => {
  describe('PrerequisitesValidationStrategy', () => {
    let strategy;

    beforeEach(() => {
      strategy = new PrerequisitesValidationStrategy({
        requiredCourses: ['MATH-101', 'PHYS-101'],
        studentCompletedCourses: ['MATH-101', 'PHYS-101', 'CHEM-101'],
        minGPA: 2.5,
        studentGPA: 3.2,
      });
    });

    test('debe validar cuando todos los prerequisitos están completados', () => {
      const data = { studentId: 'student-123', courseId: 'course-456' };
      const result = strategy.validate(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.strategy).toBe('PrerequisitesValidationStrategy');
      expect(result.details.requiredCourses).toEqual(['MATH-101', 'PHYS-101']);
      expect(result.details.completedCourses).toEqual([
        'MATH-101',
        'PHYS-101',
        'CHEM-101',
      ]);
    });

    test('debe fallar cuando faltan prerequisitos', () => {
      const strategyWithMissing = new PrerequisitesValidationStrategy({
        requiredCourses: ['MATH-101', 'PHYS-101', 'ENG-101'],
        studentCompletedCourses: ['MATH-101', 'PHYS-101'],
        minGPA: 2.5,
        studentGPA: 3.2,
      });

      const data = { studentId: 'student-123', courseId: 'course-456' };
      const result = strategyWithMissing.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Faltan prerequisitos: ENG-101');
      expect(result.details.missingPrerequisites).toEqual(['ENG-101']);
    });

    test('debe fallar cuando el GPA es insuficiente', () => {
      const strategyLowGPA = new PrerequisitesValidationStrategy({
        requiredCourses: ['MATH-101'],
        studentCompletedCourses: ['MATH-101'],
        minGPA: 3.0,
        studentGPA: 2.5,
      });

      const data = { studentId: 'student-123', courseId: 'course-456' };
      const result = strategyLowGPA.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'GPA insuficiente. Requerido: 3, Actual: 2.5'
      );
    });

    test('debe tener alta prioridad', () => {
      expect(strategy.getPriority()).toBe(10);
    });

    test('debe ser aplicable cuando hay prerequisitos', () => {
      const context = { hasPrerequisites: true };
      expect(strategy.isApplicable(context)).toBe(true);
    });
  });

  describe('CapacityValidationStrategy', () => {
    let strategy;

    beforeEach(() => {
      strategy = new CapacityValidationStrategy({
        maxCapacity: 30,
        currentEnrollments: 25,
        requestedSeats: 1,
      });
    });

    test('debe validar cuando hay cupos disponibles', () => {
      const data = { courseId: 'course-123', requestedSeats: 3 };
      const result = strategy.validate(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.details.availableSeats).toBe(5);
      expect(result.details.requestedSeats).toBe(3);
    });

    test('debe fallar cuando no hay suficientes cupos', () => {
      const data = { courseId: 'course-123', requestedSeats: 10 };
      const result = strategy.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'No hay suficientes cupos disponibles. Disponibles: 5, Solicitados: 10'
      );
    });

    test('debe tener alta prioridad', () => {
      expect(strategy.getPriority()).toBe(20);
    });

    test('debe ser aplicable cuando hay límite de capacidad', () => {
      const context = { hasCapacityLimit: true };
      expect(strategy.isApplicable(context)).toBe(true);
    });
  });

  describe('ScheduleValidationStrategy', () => {
    let strategy;

    beforeEach(() => {
      strategy = new ScheduleValidationStrategy({
        courseSchedule: {
          timeSlots: [
            { day: 'Monday', startTime: '10:00', endTime: '12:00' },
            { day: 'Wednesday', startTime: '10:00', endTime: '12:00' },
          ],
        },
        studentSchedule: [
          {
            timeSlots: [
              { day: 'Tuesday', startTime: '09:00', endTime: '11:00' },
              { day: 'Thursday', startTime: '14:00', endTime: '16:00' },
            ],
          },
        ],
      });
    });

    test('debe validar cuando no hay conflictos de horario', () => {
      const data = { courseId: 'course-123', studentId: 'student-456' };
      const result = strategy.validate(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.details.conflicts).toEqual([]);
    });

    test('debe fallar cuando hay conflictos de horario', () => {
      const strategyWithConflict = new ScheduleValidationStrategy({
        courseSchedule: {
          timeSlots: [{ day: 'Monday', startTime: '10:00', endTime: '12:00' }],
        },
        studentSchedule: [
          {
            timeSlots: [
              { day: 'Monday', startTime: '11:00', endTime: '13:00' },
            ],
          },
        ],
      });

      const data = { courseId: 'course-123', studentId: 'student-456' };
      const result = strategyWithConflict.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Conflicto de horarios');
      expect(result.details.conflicts.length).toBeGreaterThan(0);
    });

    test('debe tener prioridad media', () => {
      expect(strategy.getPriority()).toBe(30);
    });

    test('debe ser aplicable cuando hay horarios', () => {
      const context = { hasSchedule: true };
      expect(strategy.isApplicable(context)).toBe(true);
    });
  });

  describe('PaymentValidationStrategy', () => {
    let strategy;

    beforeEach(() => {
      strategy = new PaymentValidationStrategy({
        allowEnrollmentWithPendingPayments: false,
        studentPendingPayments: [],
      });
    });

    test('debe validar cuando no hay pagos pendientes', () => {
      const data = { studentId: 'student-123' };
      const result = strategy.validate(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('debe fallar cuando hay pagos pendientes y no se permite inscripción', () => {
      const strategyWithPending = new PaymentValidationStrategy({
        allowEnrollmentWithPendingPayments: false,
        studentPendingPayments: [
          { id: 'payment-1', amount: 100.0, dueDate: '2024-01-15' },
        ],
      });

      const data = { studentId: 'student-123' };
      const result = strategyWithPending.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'No se puede inscribir con pagos pendientes'
      );
    });

    test('debe permitir inscripción con pagos pendientes cuando está configurado', () => {
      const strategyAllowPending = new PaymentValidationStrategy({
        allowEnrollmentWithPendingPayments: true,
        studentPendingPayments: [
          { id: 'payment-1', amount: 100.0, dueDate: '2024-01-15' },
        ],
      });

      const data = { studentId: 'student-123' };
      const result = strategyAllowPending.validate(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('debe tener prioridad media-baja', () => {
      expect(strategy.getPriority()).toBe(40);
    });
  });

  describe('DeadlineValidationStrategy', () => {
    let strategy;

    beforeEach(() => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      strategy = new DeadlineValidationStrategy({
        enrollmentDeadline: futureDate,
        currentDate: new Date(),
      });
    });

    test('debe validar cuando la fecha actual está antes del límite', () => {
      const data = { courseId: 'course-123' };
      const result = strategy.validate(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('debe fallar cuando la fecha actual está después del límite', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const strategyExpired = new DeadlineValidationStrategy({
        enrollmentDeadline: pastDate,
        currentDate: new Date(),
      });

      const data = { courseId: 'course-123' };
      const result = strategyExpired.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Fecha límite de inscripción vencida');
    });

    test('debe tener prioridad baja', () => {
      expect(strategy.getPriority()).toBe(50);
    });

    test('debe ser aplicable cuando hay fecha límite', () => {
      const context = { hasDeadline: true };
      expect(strategy.isApplicable(context)).toBe(true);
    });
  });

  describe('ValidationContext', () => {
    let context;
    let prerequisitesStrategy;
    let capacityStrategy;

    beforeEach(() => {
      context = new ValidationContext();
      prerequisitesStrategy = new PrerequisitesValidationStrategy({
        requiredCourses: ['MATH-101'],
        studentCompletedCourses: ['MATH-101'],
        minGPA: 2.0,
        studentGPA: 3.0,
      });
      capacityStrategy = new CapacityValidationStrategy({
        maxCapacity: 30,
        currentEnrollments: 25,
        requestedSeats: 1,
      });
    });

    test('debe agregar estrategias correctamente', () => {
      context.addStrategy(prerequisitesStrategy);
      context.addStrategy(capacityStrategy);

      expect(context.getAvailableStrategies()).toContain(
        'PrerequisitesValidationStrategy'
      );
      expect(context.getAvailableStrategies()).toContain(
        'CapacityValidationStrategy'
      );
    });

    test('debe ordenar estrategias por prioridad', () => {
      context.addStrategy(capacityStrategy); // Prioridad 20
      context.addStrategy(prerequisitesStrategy); // Prioridad 10

      const strategies = context.strategies;
      expect(strategies[0].getPriority()).toBe(10); // Prerequisites primero
      expect(strategies[1].getPriority()).toBe(20); // Capacity segundo
    });

    test('debe ejecutar validación con todas las estrategias aplicables', () => {
      context.addStrategy(prerequisitesStrategy);
      context.addStrategy(capacityStrategy);

      const data = {
        studentId: 'student-123',
        courseId: 'course-456',
        requestedSeats: 3,
      };
      const validationContext = {
        hasPrerequisites: true,
        hasCapacityLimit: true,
      };

      const result = context.executeValidation(data, validationContext);

      expect(result.isValid).toBe(true);
      expect(result.strategiesUsed).toContain(
        'PrerequisitesValidationStrategy'
      );
      expect(result.strategiesUsed).toContain('CapacityValidationStrategy');
      expect(result.summary.totalStrategies).toBe(2);
      expect(result.summary.validStrategies).toBe(2);
    });

    test('debe fallar cuando alguna estrategia falla', () => {
      const failingStrategy = new CapacityValidationStrategy({
        maxCapacity: 30,
        currentEnrollments: 25,
        requestedSeats: 1,
      });

      context.addStrategy(failingStrategy);

      const data = {
        studentId: 'student-123',
        courseId: 'course-456',
        requestedSeats: 10,
      };
      const validationContext = { hasCapacityLimit: true };

      const result = context.executeValidation(data, validationContext);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.summary.invalidStrategies).toBe(1);
    });

    test('debe ejecutar estrategia específica', () => {
      context.addStrategy(prerequisitesStrategy);

      const data = { studentId: 'student-123', courseId: 'course-456' };
      const result = context.executeSpecificStrategy(
        'PrerequisitesValidationStrategy',
        data
      );

      expect(result.isValid).toBe(true);
      expect(result.strategy).toBe('PrerequisitesValidationStrategy');
    });

    test('debe lanzar error para estrategia no encontrada', () => {
      const data = { studentId: 'student-123', courseId: 'course-456' };

      expect(() => {
        context.executeSpecificStrategy('NonExistentStrategy', data);
      }).toThrow("Estrategia 'NonExistentStrategy' no encontrada");
    });

    test('debe remover estrategia correctamente', () => {
      context.addStrategy(prerequisitesStrategy);
      context.addStrategy(capacityStrategy);

      expect(context.getAvailableStrategies()).toHaveLength(2);

      context.removeStrategy('PrerequisitesValidationStrategy');

      expect(context.getAvailableStrategies()).toHaveLength(1);
      expect(context.getAvailableStrategies()).not.toContain(
        'PrerequisitesValidationStrategy'
      );
    });

    test('debe limpiar todas las estrategias', () => {
      context.addStrategy(prerequisitesStrategy);
      context.addStrategy(capacityStrategy);

      expect(context.getAvailableStrategies()).toHaveLength(2);

      context.clearStrategies();

      expect(context.getAvailableStrategies()).toHaveLength(0);
    });

    test('debe lanzar error al agregar estrategia inválida', () => {
      expect(() => {
        context.addStrategy({});
      }).toThrow('La estrategia debe extender de ValidationStrategy');
    });
  });

  describe('Validaciones de Strategy Base', () => {
    test('debe lanzar error al llamar validate en clase base', () => {
      const strategy = new ValidationStrategy();

      expect(() => {
        strategy.validate({});
      }).toThrow('validate debe ser implementado por subclases');
    });

    test('debe retornar nombre de estrategia correctamente', () => {
      const strategy = new PrerequisitesValidationStrategy({});
      expect(strategy.getStrategyName()).toBe(
        'PrerequisitesValidationStrategy'
      );
    });

    test('debe retornar prioridad por defecto', () => {
      const strategy = new ValidationStrategy();
      expect(strategy.getPriority()).toBe(100);
    });

    test('debe ser aplicable por defecto', () => {
      const strategy = new ValidationStrategy();
      expect(strategy.isApplicable({})).toBe(true);
    });
  });
});
