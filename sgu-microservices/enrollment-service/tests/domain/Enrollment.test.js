/**
 * Tests para el Domain Model: Enrollment
 * Aplicando principios de Domain-Driven Design (DDD)
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const Enrollment = require('../../src/domain/entities/Enrollment');
const {
  EnrollmentStatus,
  PaymentStatus,
} = require('../../src/domain/value-objects/EnrollmentStatus');
const StudentId = require('../../src/domain/value-objects/StudentId');
const CourseId = require('../../src/domain/value-objects/CourseId');
const AcademicPeriod = require('../../src/domain/value-objects/AcademicPeriod');
const Money = require('../../src/domain/value-objects/Money');

describe('Domain Model: Enrollment', () => {
  let enrollment;
  let enrollmentData;

  beforeEach(() => {
    enrollmentData = {
      id: 'enrollment-123',
      studentId: 'student-456',
      courseId: 'course-789',
      studentEmail: 'student@university.edu',
      studentName: 'Juan Pérez',
      courseCode: 'CS101',
      courseName: 'Programación I',
      courseCredits: 3,
      academicPeriod: '2025-1',
      amount: 150.0,
      currency: 'USD',
    };
  });

  describe('Creación de Enrollment', () => {
    test('debe crear una inscripción con datos válidos', () => {
      enrollment = new Enrollment(enrollmentData);

      expect(enrollment.id).toBe('enrollment-123');
      expect(enrollment.studentId).toBe('student-456');
      expect(enrollment.courseId).toBe('course-789');
      expect(enrollment.status).toBe(EnrollmentStatus.PENDING);
      expect(enrollment.paymentStatus).toBe(PaymentStatus.PENDING);
    });

    test('debe crear una inscripción con estado personalizado', () => {
      enrollmentData.status = EnrollmentStatus.CONFIRMED;
      enrollment = new Enrollment(enrollmentData);

      expect(enrollment.status).toBe(EnrollmentStatus.CONFIRMED);
    });

    test('debe usar valores por defecto cuando no se proporcionan', () => {
      const minimalData = {
        id: 'enrollment-123',
        studentId: 'student-456',
        courseId: 'course-789',
        studentEmail: 'student@university.edu',
        studentName: 'Juan Pérez',
        courseCode: 'CS101',
        courseName: 'Programación I',
        courseCredits: 3,
        academicPeriod: '2025-1',
        amount: 150.0,
      };

      enrollment = new Enrollment(minimalData);

      expect(enrollment.status).toBe(EnrollmentStatus.PENDING);
      expect(enrollment.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(enrollment.currency).toBe('USD');
    });
  });

  describe('Métodos de Dominio', () => {
    beforeEach(() => {
      enrollment = new Enrollment(enrollmentData);
    });

    describe('confirm()', () => {
      test('debe confirmar una inscripción pendiente', () => {
        enrollment.confirm();

        expect(enrollment.status).toBe(EnrollmentStatus.CONFIRMED);
        expect(enrollment.confirmationDate).toBeInstanceOf(Date);
      });

      test('debe lanzar error si se intenta confirmar una inscripción no pendiente', () => {
        enrollment.confirm();

        expect(() => {
          enrollment.confirm();
        }).toThrow('Solo se pueden confirmar inscripciones pendientes');
      });

      test('debe usar fecha personalizada para confirmación', () => {
        const customDate = new Date('2025-01-15T10:00:00Z');
        enrollment.confirm(customDate);

        expect(enrollment.confirmationDate).toEqual(customDate);
      });
    });

    describe('markAsPaid()', () => {
      test('debe marcar como pagada una inscripción confirmada', () => {
        enrollment.confirm();
        enrollment.markAsPaid('payment-123');

        expect(enrollment.status).toBe(EnrollmentStatus.PAID);
        expect(enrollment.paymentStatus).toBe(PaymentStatus.PAID);
        expect(enrollment.paymentId).toBe('payment-123');
        expect(enrollment.paymentDate).toBeInstanceOf(Date);
      });

      test('debe lanzar error si se intenta pagar una inscripción no confirmada', () => {
        expect(() => {
          enrollment.markAsPaid('payment-123');
        }).toThrow('Solo se pueden pagar inscripciones confirmadas');
      });

      test('debe usar fecha personalizada para pago', () => {
        enrollment.confirm();
        const customDate = new Date('2025-01-15T12:00:00Z');
        enrollment.markAsPaid('payment-123', customDate);

        expect(enrollment.paymentDate).toEqual(customDate);
      });
    });

    describe('cancel()', () => {
      test('debe cancelar una inscripción pendiente', () => {
        enrollment.cancel('Cambio de horario');

        expect(enrollment.status).toBe(EnrollmentStatus.CANCELLED);
        expect(enrollment.cancellationReason).toBe('Cambio de horario');
        expect(enrollment.cancellationDate).toBeInstanceOf(Date);
      });

      test('debe cancelar una inscripción confirmada', () => {
        enrollment.confirm();
        enrollment.cancel('Cambio de horario');

        expect(enrollment.status).toBe(EnrollmentStatus.CANCELLED);
      });

      test('debe cancelar una inscripción pagada', () => {
        enrollment.confirm();
        enrollment.markAsPaid('payment-123');
        enrollment.cancel('Cambio de horario');

        expect(enrollment.status).toBe(EnrollmentStatus.CANCELLED);
      });

      test('debe lanzar error si se intenta cancelar una inscripción completada', () => {
        enrollment.confirm();
        enrollment.markAsPaid('payment-123');
        enrollment.complete();

        expect(() => {
          enrollment.cancel('Cambio de horario');
        }).toThrow('Esta inscripción no puede ser cancelada');
      });

      test('debe usar fecha personalizada para cancelación', () => {
        const customDate = new Date('2025-01-15T14:00:00Z');
        enrollment.cancel('Cambio de horario', null, customDate);

        expect(enrollment.cancellationDate).toEqual(customDate);
      });
    });

    describe('complete()', () => {
      test('debe completar una inscripción pagada', () => {
        enrollment.confirm();
        enrollment.markAsPaid('payment-123');
        enrollment.complete(85.5, 92.0);

        expect(enrollment.status).toBe(EnrollmentStatus.COMPLETED);
        expect(enrollment.grade).toBe(85.5);
        expect(enrollment.attendancePercentage).toBe(92.0);
      });

      test('debe completar sin calificación ni asistencia', () => {
        enrollment.confirm();
        enrollment.markAsPaid('payment-123');
        enrollment.complete();

        expect(enrollment.status).toBe(EnrollmentStatus.COMPLETED);
        expect(enrollment.grade).toBeNull();
        expect(enrollment.attendancePercentage).toBeNull();
      });

      test('debe lanzar error si se intenta completar una inscripción no pagada', () => {
        enrollment.confirm();

        expect(() => {
          enrollment.complete();
        }).toThrow('Solo se pueden completar inscripciones pagadas');
      });
    });

    describe('Métodos de consulta', () => {
      test('canBeCancelled() debe retornar true para inscripciones cancelables', () => {
        expect(enrollment.canBeCancelled()).toBe(true);

        enrollment.confirm();
        expect(enrollment.canBeCancelled()).toBe(true);

        enrollment.markAsPaid('payment-123');
        expect(enrollment.canBeCancelled()).toBe(true);
      });

      test('canBeCancelled() debe retornar false para inscripciones no cancelables', () => {
        enrollment.confirm();
        enrollment.markAsPaid('payment-123');
        enrollment.complete();

        expect(enrollment.canBeCancelled()).toBe(false);
      });

      test('requiresPayment() debe retornar true para inscripciones que requieren pago', () => {
        expect(enrollment.requiresPayment()).toBe(true);

        enrollment.confirm();
        expect(enrollment.requiresPayment()).toBe(true);
      });

      test('requiresPayment() debe retornar false para inscripciones pagadas', () => {
        enrollment.confirm();
        enrollment.markAsPaid('payment-123');

        expect(enrollment.requiresPayment()).toBe(false);
      });

      test('isActive() debe retornar true para inscripciones activas', () => {
        expect(enrollment.isActive()).toBe(true);

        enrollment.confirm();
        expect(enrollment.isActive()).toBe(true);

        enrollment.markAsPaid('payment-123');
        expect(enrollment.isActive()).toBe(true);
      });

      test('isActive() debe retornar false para inscripciones no activas', () => {
        enrollment.cancel('Cambio de horario');
        expect(enrollment.isActive()).toBe(false);

        enrollment = new Enrollment(enrollmentData);
        enrollment.confirm();
        enrollment.markAsPaid('payment-123');
        enrollment.complete();
        expect(enrollment.isActive()).toBe(false);
      });

      test('isCompleted() debe retornar true solo para inscripciones completadas', () => {
        expect(enrollment.isCompleted()).toBe(false);

        enrollment.confirm();
        enrollment.markAsPaid('payment-123');
        enrollment.complete();

        expect(enrollment.isCompleted()).toBe(true);
      });

      test('isCancelled() debe retornar true solo para inscripciones canceladas', () => {
        expect(enrollment.isCancelled()).toBe(false);

        enrollment.cancel('Cambio de horario');
        expect(enrollment.isCancelled()).toBe(true);
      });
    });

    describe('toPublicJSON()', () => {
      test('debe retornar información pública de la inscripción', () => {
        const publicData = enrollment.toPublicJSON();

        expect(publicData.id).toBe('enrollment-123');
        expect(publicData.studentId).toBe('student-456');
        expect(publicData.courseId).toBe('course-789');
        expect(publicData.status).toBe(EnrollmentStatus.PENDING);
        expect(publicData.paymentStatus).toBe(PaymentStatus.PENDING);
      });

      test('debe incluir información actualizada después de cambios', () => {
        enrollment.confirm();
        enrollment.markAsPaid('payment-123');

        const publicData = enrollment.toPublicJSON();

        expect(publicData.status).toBe(EnrollmentStatus.PAID);
        expect(publicData.paymentStatus).toBe(PaymentStatus.PAID);
        expect(publicData.paymentId).toBe('payment-123');
      });
    });
  });

  describe('Métodos estáticos', () => {
    describe('create()', () => {
      test('debe crear una nueva inscripción', () => {
        const newEnrollment = Enrollment.create(enrollmentData);

        expect(newEnrollment).toBeInstanceOf(Enrollment);
        expect(newEnrollment.id).toBe('enrollment-123');
      });
    });

    describe('fromPersistence()', () => {
      test('debe reconstruir una inscripción desde datos de persistencia', () => {
        const persistenceData = {
          id: 'enrollment-123',
          userId: 'student-456',
          courseId: 'course-789',
          studentEmail: 'student@university.edu',
          studentName: 'Juan Pérez',
          courseCode: 'CS101',
          courseName: 'Programación I',
          courseCredits: 3,
          courseSemester: '2025-1',
          amount: 150.0,
          currency: 'USD',
          status: EnrollmentStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PENDING,
          enrollmentDate: new Date('2025-01-15T10:00:00Z'),
          confirmationDate: new Date('2025-01-15T11:00:00Z'),
          paymentDate: null,
          cancellationDate: null,
          cancellationReason: null,
          paymentId: null,
          grade: null,
          attendancePercentage: null,
          notes: null,
          enrolledBy: null,
        };

        const enrollment = Enrollment.fromPersistence(persistenceData);

        expect(enrollment).toBeInstanceOf(Enrollment);
        expect(enrollment.id).toBe('enrollment-123');
        expect(enrollment.studentId).toBe('student-456');
        expect(enrollment.status).toBe(EnrollmentStatus.CONFIRMED);
      });
    });
  });
});
