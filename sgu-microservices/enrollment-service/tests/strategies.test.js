const { describe, test, expect, beforeEach } = require("@jest/globals");

// Importar las estrategias
const { ValidationStrategy } = require("../src/strategies/ValidationStrategy");
const AvailabilityValidationStrategy = require("../src/strategies/AvailabilityValidationStrategy");
const PrerequisitesValidationStrategy = require("../src/strategies/PrerequisitesValidationStrategy");
const EnrollmentLimitValidationStrategy = require("../src/strategies/EnrollmentLimitValidationStrategy");
const DuplicateEnrollmentValidationStrategy = require("../src/strategies/DuplicateEnrollmentValidationStrategy");
const EnrollmentValidationContext = require("../src/strategies/EnrollmentValidationContext");

// Mock de servicios externos
jest.mock("../src/services/externalServices", () => ({
  CoursesServiceClient: {
    checkCourseAvailability: jest.fn(),
    checkPrerequisites: jest.fn(),
    reserveSlots: jest.fn(),
    releaseSlots: jest.fn(),
  },
}));

// Mock del modelo Enrollment
jest.mock("../src/models/Enrollment", () => ({
  findActiveByUser: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
}));

describe("Patrón Strategy - Validaciones de Inscripción", () => {
  let validationContext;

  beforeEach(() => {
    validationContext = new EnrollmentValidationContext();
    jest.clearAllMocks();
  });

  describe("ValidationStrategy (Clase Base)", () => {
    test("debe lanzar error si se intenta usar la clase base directamente", async () => {
      const strategy = new ValidationStrategy();

      expect(() => strategy.validate({})).toThrow(
        "validate debe ser implementado por subclases"
      );
    });

    test("debe retornar el nombre correcto de la estrategia", () => {
      const strategy = new ValidationStrategy();
      expect(strategy.getStrategyName()).toBe("ValidationStrategy");
    });

    test("debe retornar la prioridad por defecto", () => {
      const strategy = new ValidationStrategy();
      expect(strategy.getPriority()).toBe(100);
    });
  });

  describe("AvailabilityValidationStrategy", () => {
    let strategy;
    const {
      CoursesServiceClient,
    } = require("../src/services/externalServices");

    beforeEach(() => {
      strategy = new AvailabilityValidationStrategy();
    });

    test("debe validar correctamente cuando el curso está disponible", async () => {
      const mockCourse = {
        id: 1,
        code: "CS101",
        name: "Programación I",
        canEnroll: true,
        availableSlots: 5,
      };

      CoursesServiceClient.checkCourseAvailability.mockResolvedValue({
        success: true,
        data: mockCourse,
      });

      const context = { courseId: 1 };
      const result = await strategy.validate(context);

      expect(result.isValid).toBe(true);
      expect(result.data.course).toEqual(mockCourse);
      expect(result.strategy).toBe("AvailabilityValidationStrategy");
    });

    test("debe fallar cuando el curso no está disponible", async () => {
      const mockCourse = {
        id: 1,
        code: "CS101",
        name: "Programación I",
        canEnroll: false,
        availableSlots: 0,
        status: "FULL",
      };

      CoursesServiceClient.checkCourseAvailability.mockResolvedValue({
        success: true,
        data: mockCourse,
      });

      const context = { courseId: 1 };
      const result = await strategy.validate(context);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("El curso no está disponible para inscripción");
      expect(result.details.status).toBe("FULL");
    });

    test("debe fallar cuando el servicio no responde correctamente", async () => {
      CoursesServiceClient.checkCourseAvailability.mockResolvedValue({
        success: false,
        error: "Curso no encontrado",
      });

      const context = { courseId: 1 };
      const result = await strategy.validate(context);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Curso no encontrado");
    });

    test("debe tener prioridad 1", () => {
      expect(strategy.getPriority()).toBe(1);
    });
  });

  describe("PrerequisitesValidationStrategy", () => {
    let strategy;
    const {
      CoursesServiceClient,
    } = require("../src/services/externalServices");

    beforeEach(() => {
      strategy = new PrerequisitesValidationStrategy();
    });

    test("debe validar correctamente cuando se cumplen los prerrequisitos", async () => {
      const mockPrerequisites = {
        canEnroll: true,
        requiredPrerequisites: ["CS100"],
        completedPrerequisites: ["CS100"],
      };

      CoursesServiceClient.checkPrerequisites.mockResolvedValue({
        success: true,
        data: mockPrerequisites,
      });

      const context = { courseId: 1, userId: 1, authToken: "token123" };
      const result = await strategy.validate(context);

      expect(result.isValid).toBe(true);
      expect(result.data.prerequisites).toEqual(["CS100"]);
      expect(result.strategy).toBe("PrerequisitesValidationStrategy");
    });

    test("debe fallar cuando no se cumplen los prerrequisitos", async () => {
      const mockPrerequisites = {
        canEnroll: false,
        requiredPrerequisites: ["CS100", "MATH101"],
        completedPrerequisites: ["CS100"],
        missingPrerequisites: ["MATH101"],
      };

      CoursesServiceClient.checkPrerequisites.mockResolvedValue({
        success: true,
        data: mockPrerequisites,
      });

      const context = { courseId: 1, userId: 1, authToken: "token123" };
      const result = await strategy.validate(context);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "No cumples con los prerrequisitos para este curso"
      );
      expect(result.details.missingPrerequisites).toEqual(["MATH101"]);
    });

    test("debe tener prioridad 2", () => {
      expect(strategy.getPriority()).toBe(2);
    });
  });

  describe("EnrollmentLimitValidationStrategy", () => {
    let strategy;
    const Enrollment = require("../src/models/Enrollment");

    beforeEach(() => {
      strategy = new EnrollmentLimitValidationStrategy();
      process.env.MAX_ENROLLMENTS_PER_STUDENT = "5";
    });

    test("debe validar correctamente cuando no se excede el límite", async () => {
      const mockEnrollments = [
        { id: 1, courseCode: "CS101", status: "Confirmed" },
        { id: 2, courseCode: "MATH101", status: "Confirmed" },
      ];

      Enrollment.findActiveByUser.mockResolvedValue(mockEnrollments);

      const context = { userId: 1 };
      const result = await strategy.validate(context);

      expect(result.isValid).toBe(true);
      expect(result.data.currentEnrollments).toBe(2);
      expect(result.data.maxEnrollments).toBe(5);
      expect(result.data.remainingSlots).toBe(3);
    });

    test("debe fallar cuando se excede el límite de inscripciones", async () => {
      const mockEnrollments = Array(5)
        .fill()
        .map((_, i) => ({
          id: i + 1,
          courseCode: `CS${100 + i}`,
          courseName: `Curso ${i + 1}`,
          status: "Confirmed",
        }));

      Enrollment.findActiveByUser.mockResolvedValue(mockEnrollments);

      const context = { userId: 1 };
      const result = await strategy.validate(context);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Has alcanzado el límite máximo de 5 inscripciones activas"
      );
      expect(result.details.currentEnrollments).toBe(5);
      expect(result.details.maxEnrollments).toBe(5);
    });

    test("debe tener prioridad 3", () => {
      expect(strategy.getPriority()).toBe(3);
    });
  });

  describe("DuplicateEnrollmentValidationStrategy", () => {
    let strategy;
    const Enrollment = require("../src/models/Enrollment");

    beforeEach(() => {
      strategy = new DuplicateEnrollmentValidationStrategy();
    });

    test("debe validar correctamente cuando no hay inscripción duplicada", async () => {
      Enrollment.findOne.mockResolvedValue(null);

      const context = { userId: 1, courseId: 1 };
      const result = await strategy.validate(context);

      expect(result.isValid).toBe(true);
      expect(result.data.message).toBe("No hay inscripción duplicada");
    });

    test("debe fallar cuando ya existe una inscripción", async () => {
      const mockEnrollment = {
        id: 1,
        userId: 1,
        courseId: 1,
        status: "Confirmed",
        enrollmentDate: new Date(),
        toPublicJSON: () => ({
          id: 1,
          status: "Confirmed",
          enrollmentDate: new Date(),
        }),
      };

      Enrollment.findOne.mockResolvedValue(mockEnrollment);

      const context = { userId: 1, courseId: 1 };
      const result = await strategy.validate(context);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Ya estás inscrito en este curso");
      expect(result.details.existingEnrollment).toBeDefined();
    });

    test("debe tener prioridad 4", () => {
      expect(strategy.getPriority()).toBe(4);
    });
  });

  describe("EnrollmentValidationContext", () => {
    test("debe agregar estrategias correctamente", () => {
      const strategy1 = new AvailabilityValidationStrategy();
      const strategy2 = new PrerequisitesValidationStrategy();

      validationContext.addStrategy(strategy1);
      validationContext.addStrategy(strategy2);

      const strategies = validationContext.getStrategies();
      expect(strategies).toHaveLength(2);
      expect(strategies[0]).toBe(strategy1); // Debe estar ordenado por prioridad
      expect(strategies[1]).toBe(strategy2);
    });

    test("debe ordenar estrategias por prioridad", () => {
      const strategy1 = new PrerequisitesValidationStrategy(); // Prioridad 2
      const strategy2 = new AvailabilityValidationStrategy(); // Prioridad 1
      const strategy3 = new EnrollmentLimitValidationStrategy(); // Prioridad 3

      validationContext.addStrategy(strategy1);
      validationContext.addStrategy(strategy2);
      validationContext.addStrategy(strategy3);

      const strategies = validationContext.getStrategies();
      expect(strategies[0]).toBe(strategy2); // Availability (prioridad 1)
      expect(strategies[1]).toBe(strategy1); // Prerequisites (prioridad 2)
      expect(strategies[2]).toBe(strategy3); // EnrollmentLimit (prioridad 3)
    });

    test("debe ejecutar todas las validaciones y retornar el primer error", async () => {
      const {
        CoursesServiceClient,
      } = require("../src/services/externalServices");
      const Enrollment = require("../src/models/Enrollment");

      // Mock para que la primera validación falle
      CoursesServiceClient.checkCourseAvailability.mockResolvedValue({
        success: false,
        error: "Curso no disponible",
      });

      const availabilityStrategy = new AvailabilityValidationStrategy();
      const prerequisitesStrategy = new PrerequisitesValidationStrategy();

      validationContext.addStrategy(availabilityStrategy);
      validationContext.addStrategy(prerequisitesStrategy);

      const context = { courseId: 1, userId: 1 };
      const result = await validationContext.validateUntilFirstError(context);

      expect(result.isValid).toBe(false);
      expect(result.firstError.error).toBe("Curso no disponible");
      expect(result.strategy).toBe("AvailabilityValidationStrategy");
    });

    test("debe ejecutar todas las validaciones exitosamente", async () => {
      const {
        CoursesServiceClient,
      } = require("../src/services/externalServices");
      const Enrollment = require("../src/models/Enrollment");

      // Mock para que todas las validaciones pasen
      CoursesServiceClient.checkCourseAvailability.mockResolvedValue({
        success: true,
        data: { canEnroll: true, availableSlots: 5 },
      });

      CoursesServiceClient.checkPrerequisites.mockResolvedValue({
        success: true,
        data: { canEnroll: true, requiredPrerequisites: [] },
      });

      Enrollment.findActiveByUser.mockResolvedValue([]);
      Enrollment.findOne.mockResolvedValue(null);

      const availabilityStrategy = new AvailabilityValidationStrategy();
      const prerequisitesStrategy = new PrerequisitesValidationStrategy();
      const limitStrategy = new EnrollmentLimitValidationStrategy();
      const duplicateStrategy = new DuplicateEnrollmentValidationStrategy();

      validationContext.addStrategy(availabilityStrategy);
      validationContext.addStrategy(prerequisitesStrategy);
      validationContext.addStrategy(limitStrategy);
      validationContext.addStrategy(duplicateStrategy);

      const context = { courseId: 1, userId: 1, authToken: "token123" };
      const result = await validationContext.validateUntilFirstError(context);

      expect(result.isValid).toBe(true);
      expect(result.message).toBe(
        "Todas las validaciones pasaron exitosamente"
      );
    });

    test("debe limpiar estrategias correctamente", () => {
      const strategy = new AvailabilityValidationStrategy();
      validationContext.addStrategy(strategy);
      expect(validationContext.getStrategies()).toHaveLength(1);

      validationContext.clearStrategies();
      expect(validationContext.getStrategies()).toHaveLength(0);
    });
  });
});
