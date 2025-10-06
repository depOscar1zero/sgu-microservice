/**
 * Tests simples para las estrategias del patrón Strategy
 * Sin dependencias de base de datos
 */

const { describe, test, expect, beforeEach } = require("@jest/globals");

// Mock de servicios externos antes de importar las estrategias
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

// Importar las estrategias después de los mocks
const ValidationStrategy = require("../src/strategies/ValidationStrategy");
const AvailabilityValidationStrategy = require("../src/strategies/AvailabilityValidationStrategy");
const PrerequisitesValidationStrategy = require("../src/strategies/PrerequisitesValidationStrategy");
const EnrollmentLimitValidationStrategy = require("../src/strategies/EnrollmentLimitValidationStrategy");
const DuplicateEnrollmentValidationStrategy = require("../src/strategies/DuplicateEnrollmentValidationStrategy");
const EnrollmentValidationContext = require("../src/strategies/EnrollmentValidationContext");

describe("Patrón Strategy - Tests Básicos", () => {
  let validationContext;

  beforeEach(() => {
    validationContext = new EnrollmentValidationContext();
    jest.clearAllMocks();
  });

  describe("ValidationStrategy (Clase Base)", () => {
    test("debe lanzar error si se intenta usar la clase base directamente", async () => {
      const strategy = new ValidationStrategy();

      await expect(strategy.validate({})).rejects.toThrow(
        "Método validate debe ser implementado por las clases hijas"
      );
    });

    test("debe retornar el nombre correcto de la estrategia", () => {
      const strategy = new ValidationStrategy();
      expect(strategy.getName()).toBe("ValidationStrategy");
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

    test("debe tener prioridad 1", () => {
      expect(strategy.getPriority()).toBe(1);
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

    test("debe limpiar estrategias correctamente", () => {
      const strategy = new AvailabilityValidationStrategy();
      validationContext.addStrategy(strategy);
      expect(validationContext.getStrategies()).toHaveLength(1);

      validationContext.clearStrategies();
      expect(validationContext.getStrategies()).toHaveLength(0);
    });
  });

  describe("Estrategias - Prioridades", () => {
    test("AvailabilityValidationStrategy debe tener prioridad 1", () => {
      const strategy = new AvailabilityValidationStrategy();
      expect(strategy.getPriority()).toBe(1);
    });

    test("PrerequisitesValidationStrategy debe tener prioridad 2", () => {
      const strategy = new PrerequisitesValidationStrategy();
      expect(strategy.getPriority()).toBe(2);
    });

    test("EnrollmentLimitValidationStrategy debe tener prioridad 3", () => {
      const strategy = new EnrollmentLimitValidationStrategy();
      expect(strategy.getPriority()).toBe(3);
    });

    test("DuplicateEnrollmentValidationStrategy debe tener prioridad 4", () => {
      const strategy = new DuplicateEnrollmentValidationStrategy();
      expect(strategy.getPriority()).toBe(4);
    });
  });
});
