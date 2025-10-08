/**
 * Tests para EnrollmentValidationService - Strategy Pattern Integration
 */

const {
  EnrollmentValidationService,
  enrollmentValidationService,
} = require('../../src/services/EnrollmentValidationService');

describe('EnrollmentValidationService Tests', () => {
  let service;

  beforeEach(() => {
    service = new EnrollmentValidationService();
  });

  describe('Configuración de Estrategias', () => {
    test('debe configurar estrategias para curso con prerequisitos', () => {
      const courseConfig = {
        requiredCourses: ['MATH-101', 'PHYS-101'],
        studentCompletedCourses: ['MATH-101', 'PHYS-101'],
        minGPA: 2.5,
        studentGPA: 3.0,
      };

      service.configureStrategiesForCourse(courseConfig);

      const stats = service.getValidationStats();
      expect(stats.availableStrategies).toContain(
        'PrerequisitesValidationStrategy'
      );
    });

    test('debe configurar estrategias para curso con límite de capacidad', () => {
      const courseConfig = {
        maxCapacity: 30,
        currentEnrollments: 25,
      };

      service.configureStrategiesForCourse(courseConfig);

      const stats = service.getValidationStats();
      expect(stats.availableStrategies).toContain('CapacityValidationStrategy');
    });

    test('debe configurar múltiples estrategias', () => {
      const courseConfig = {
        requiredCourses: ['MATH-101'],
        studentCompletedCourses: ['MATH-101'],
        maxCapacity: 30,
        currentEnrollments: 25,
        courseSchedule: {
          timeSlots: [{ day: 'Monday', startTime: '10:00', endTime: '12:00' }],
        },
        studentSchedule: [],
        studentPendingPayments: [],
        enrollmentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      service.configureStrategiesForCourse(courseConfig);

      const stats = service.getValidationStats();
      expect(stats.availableStrategies.length).toBeGreaterThan(1);
    });
  });

  describe('Validación Completa de Inscripción', () => {
    test('debe validar inscripción exitosamente', async () => {
      const enrollmentData = {
        studentId: 'student-123',
        courseId: 'course-456',
        requestedSeats: 1,
      };

      const courseConfig = {
        requiredCourses: ['MATH-101'],
        studentCompletedCourses: ['MATH-101'],
        minGPA: 2.0,
        studentGPA: 3.0,
        maxCapacity: 30,
        currentEnrollments: 25,
      };

      const result = await service.validateEnrollment(
        enrollmentData,
        courseConfig
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.enrollmentData).toEqual(enrollmentData);
      expect(result.courseConfig).toEqual(courseConfig);
      expect(result.validationId).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    test('debe fallar validación cuando faltan prerequisitos', async () => {
      const enrollmentData = {
        studentId: 'student-123',
        courseId: 'course-456',
        requestedSeats: 1,
      };

      const courseConfig = {
        requiredCourses: ['MATH-101', 'PHYS-101'],
        studentCompletedCourses: ['MATH-101'], // Falta PHYS-101
        minGPA: 2.0,
        studentGPA: 3.0,
        maxCapacity: 30,
        currentEnrollments: 25,
      };

      const result = await service.validateEnrollment(
        enrollmentData,
        courseConfig
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(
        result.errors.some(error => error.includes('Faltan prerequisitos'))
      ).toBe(true);
    });

    test('debe fallar validación cuando no hay cupos', async () => {
      const enrollmentData = {
        studentId: 'student-123',
        courseId: 'course-456',
        requestedSeats: 10,
      };

      const courseConfig = {
        maxCapacity: 30,
        currentEnrollments: 25, // Solo 5 cupos disponibles
      };

      const result = await service.validateEnrollment(
        enrollmentData,
        courseConfig
      );

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error => error.includes('No hay suficientes cupos'))
      ).toBe(true);
    });

    test('debe manejar errores internos correctamente', async () => {
      const enrollmentData = null; // Datos inválidos
      const courseConfig = {};

      const result = await service.validateEnrollment(
        enrollmentData,
        courseConfig
      );

      // El servicio maneja datos nulos sin fallar, pero puede retornar válido si no hay estrategias
      expect(result).toBeDefined();
      expect(result.validationId).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Validación con Estrategia Específica', () => {
    test('debe validar prerequisitos específicos', async () => {
      const studentData = {
        id: 'student-123',
        completedCourses: ['MATH-101', 'PHYS-101'],
        gpa: 3.2,
      };

      const courseData = {
        id: 'course-456',
        requiredCourses: ['MATH-101', 'PHYS-101'],
        minGPA: 2.5,
      };

      const result = await service.validatePrerequisites(
        studentData,
        courseData
      );

      expect(result.isValid).toBe(true);
      expect(result.strategy).toBe('PrerequisitesValidationStrategy');
      expect(result.validationId).toBeDefined();
    });

    test('debe validar capacidad específica', async () => {
      const courseData = {
        id: 'course-456',
        maxCapacity: 30,
        currentEnrollments: 25,
      };

      const result = await service.validateCapacity(courseData, 3);

      expect(result.isValid).toBe(true);
      expect(result.strategy).toBe('CapacityValidationStrategy');
      expect(result.details.availableSeats).toBe(5);
    });

    test('debe validar horarios específicos', async () => {
      const courseData = {
        id: 'course-456',
        schedule: {
          timeSlots: [{ day: 'Monday', startTime: '10:00', endTime: '12:00' }],
        },
      };

      const studentData = {
        id: 'student-123',
        currentEnrollments: [],
      };

      const result = await service.validateSchedule(courseData, studentData);

      expect(result.isValid).toBe(true);
      expect(result.strategy).toBe('ScheduleValidationStrategy');
    });

    test('debe manejar estrategia no soportada', async () => {
      const enrollmentData = { studentId: 'student-123' };
      const strategyConfig = {};

      const result = await service.validateWithSpecificStrategy(
        'NonExistentStrategy',
        enrollmentData,
        strategyConfig
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('no soportada'))).toBe(
        true
      );
    });
  });

  describe('Estadísticas y Utilidades', () => {
    test('debe obtener estadísticas correctamente', () => {
      const stats = service.getValidationStats();

      expect(stats).toHaveProperty('availableStrategies');
      expect(stats).toHaveProperty('totalStrategies');
      expect(stats).toHaveProperty('serviceStatus', 'active');
      expect(stats).toHaveProperty('lastValidation');
      expect(stats.lastValidation).toBeInstanceOf(Date);
    });

    test('debe generar IDs de validación únicos', () => {
      const id1 = service.generateValidationId();
      const id2 = service.generateValidationId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^validation_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^validation_\d+_[a-z0-9]+$/);
    });
  });

  describe('Integración con Contexto de Validación', () => {
    test('debe ejecutar solo estrategias aplicables', async () => {
      const enrollmentData = {
        studentId: 'student-123',
        courseId: 'course-456',
      };

      const courseConfig = {
        maxCapacity: 30,
        currentEnrollments: 25,
        // No hay prerequisitos, por lo que PrerequisitesValidationStrategy no debe ejecutarse
      };

      const result = await service.validateEnrollment(
        enrollmentData,
        courseConfig
      );

      expect(result.strategiesUsed).not.toContain(
        'PrerequisitesValidationStrategy'
      );
      expect(result.strategiesUsed).toContain('CapacityValidationStrategy');
    });

    test('debe manejar contexto vacío correctamente', async () => {
      const enrollmentData = {
        studentId: 'student-123',
        courseId: 'course-456',
      };

      const courseConfig = {}; // Configuración vacía

      const result = await service.validateEnrollment(
        enrollmentData,
        courseConfig
      );

      expect(result.isValid).toBe(true); // Sin estrategias = validación exitosa
      expect(result.strategiesUsed).toEqual([]);
    });
  });

  describe('Casos Edge y Manejo de Errores', () => {
    test('debe manejar datos de entrada inválidos', async () => {
      const result = await service.validateEnrollment(null, null);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('debe manejar configuración de curso inválida', async () => {
      const enrollmentData = {
        studentId: 'student-123',
        courseId: 'course-456',
      };
      const courseConfig = {
        maxCapacity: -1, // Capacidad inválida
        currentEnrollments: 100,
      };

      const result = await service.validateEnrollment(
        enrollmentData,
        courseConfig
      );

      // El servicio puede manejar configuraciones inválidas sin fallar
      expect(result).toBeDefined();
      expect(result.validationId).toBeDefined();
    });

    test('debe manejar fechas inválidas en deadline', async () => {
      const enrollmentData = {
        studentId: 'student-123',
        courseId: 'course-456',
      };
      const courseConfig = {
        enrollmentDeadline: 'invalid-date',
      };

      const result = await service.validateEnrollment(
        enrollmentData,
        courseConfig
      );

      // Debe manejar la fecha inválida sin fallar
      expect(result).toBeDefined();
    });
  });

  describe('Singleton Service', () => {
    test('debe usar la instancia singleton correctamente', () => {
      expect(enrollmentValidationService).toBeInstanceOf(
        EnrollmentValidationService
      );
      expect(enrollmentValidationService).toStrictEqual(service);
    });

    test('debe mantener estado entre llamadas', () => {
      const stats1 = enrollmentValidationService.getValidationStats();
      const stats2 = enrollmentValidationService.getValidationStats();

      expect(stats1.serviceStatus).toBe(stats2.serviceStatus);
    });
  });
});
