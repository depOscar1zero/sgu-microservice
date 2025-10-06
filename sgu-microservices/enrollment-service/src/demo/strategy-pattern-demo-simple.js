/**
 * Demostración Simple del Patrón Strategy implementado en el SGU
 * Este script muestra cómo usar las estrategias de validación de inscripción
 * SIN dependencias externas
 */

// Mock simple de servicios externos
const mockCoursesServiceClient = {
  checkCourseAvailability: async (courseId) => {
    if (courseId === 999) {
      return { success: false, error: "Curso no encontrado" };
    }
    return {
      success: true,
      data: {
        canEnroll: true,
        availableSlots: 5,
        id: courseId,
        code: "CS101",
        name: "Programación I",
      },
    };
  },
  checkPrerequisites: async (courseId, userId, authToken) => {
    if (userId === 456) {
      return {
        success: true,
        data: {
          canEnroll: false,
          requiredPrerequisites: ["CS100", "MATH101"],
          completedPrerequisites: ["CS100"],
          missingPrerequisites: ["MATH101"],
        },
      };
    }
    return {
      success: true,
      data: {
        canEnroll: true,
        requiredPrerequisites: [],
        completedPrerequisites: [],
      },
    };
  },
};

const mockEnrollment = {
  findActiveByUser: async (userId) => {
    if (userId === 789) {
      // Simular límite excedido
      return Array(8)
        .fill()
        .map((_, i) => ({
          id: i + 1,
          courseCode: `CS${100 + i}`,
          courseName: `Curso ${i + 1}`,
          status: "Confirmed",
        }));
    }
    return [];
  },
  findOne: async (options) => {
    if (options.where.userId === 101) {
      // Simular inscripción duplicada
      return {
        id: 1,
        userId: 101,
        courseId: 1,
        status: "Confirmed",
        enrollmentDate: new Date(),
        toPublicJSON: () => ({
          id: 1,
          status: "Confirmed",
          enrollmentDate: new Date(),
        }),
      };
    }
    return null;
  },
};

// Mock de las dependencias
const originalRequire = require;
require = function (id) {
  if (id === "../services/externalServices") {
    return { CoursesServiceClient: mockCoursesServiceClient };
  }
  if (id === "../models/Enrollment") {
    return mockEnrollment;
  }
  return originalRequire.apply(this, arguments);
};

// Ahora importar las estrategias
const EnrollmentValidationContext = require("../strategies/EnrollmentValidationContext");
const AvailabilityValidationStrategy = require("../strategies/AvailabilityValidationStrategy");
const PrerequisitesValidationStrategy = require("../strategies/PrerequisitesValidationStrategy");
const EnrollmentLimitValidationStrategy = require("../strategies/EnrollmentLimitValidationStrategy");
const DuplicateEnrollmentValidationStrategy = require("../strategies/DuplicateEnrollmentValidationStrategy");

/**
 * Simular datos de contexto para la demostración
 */
const createMockContext = (scenario = "success") => {
  const baseContext = {
    courseId: 1,
    userId: 123,
    authToken: "Bearer token123",
  };

  switch (scenario) {
    case "course_unavailable":
      return { ...baseContext, courseId: 999 };
    case "prerequisites_missing":
      return { ...baseContext, userId: 456 };
    case "enrollment_limit_exceeded":
      return { ...baseContext, userId: 789 };
    case "duplicate_enrollment":
      return { ...baseContext, userId: 101 };
    default:
      return baseContext;
  }
};

/**
 * Configurar el contexto de validación con todas las estrategias
 */
const setupValidationContext = () => {
  console.log("🔧 Configurando contexto de validación...");

  const context = new EnrollmentValidationContext();

  // Agregar estrategias en orden de prioridad
  context.addStrategy(new AvailabilityValidationStrategy());
  context.addStrategy(new PrerequisitesValidationStrategy());
  context.addStrategy(new EnrollmentLimitValidationStrategy());
  context.addStrategy(new DuplicateEnrollmentValidationStrategy());

  console.log(`✅ ${context.getStrategies().length} estrategias configuradas:`);
  context.getStrategies().forEach((strategy, index) => {
    console.log(
      `   ${
        index + 1
      }. ${strategy.getName()} (Prioridad: ${strategy.getPriority()})`
    );
  });

  return context;
};

/**
 * Demostrar validación exitosa
 */
const demonstrateSuccessfulValidation = async () => {
  console.log("\n🎯 === DEMOSTRACIÓN: Validación Exitosa ===");

  const validationContext = setupValidationContext();
  const context = createMockContext("success");

  console.log("\n📋 Contexto de validación:");
  console.log(`   Curso ID: ${context.courseId}`);
  console.log(`   Usuario ID: ${context.userId}`);
  console.log(`   Token: ${context.authToken.substring(0, 20)}...`);

  try {
    const result = await validationContext.validateUntilFirstError(context);

    if (result.isValid) {
      console.log(
        "\n✅ RESULTADO: Todas las validaciones pasaron exitosamente"
      );
      console.log(`   Mensaje: ${result.message}`);
    } else {
      console.log("\n❌ RESULTADO: Validación falló");
      console.log(`   Error: ${result.firstError.error}`);
      console.log(`   Estrategia: ${result.strategy}`);
      if (result.firstError.details) {
        console.log(
          `   Detalles: ${JSON.stringify(result.firstError.details, null, 2)}`
        );
      }
    }
  } catch (error) {
    console.log(`\n💥 ERROR: ${error.message}`);
  }
};

/**
 * Demostrar diferentes escenarios de fallo
 */
const demonstrateFailureScenarios = async () => {
  const scenarios = [
    { name: "Curso No Disponible", context: "course_unavailable" },
    { name: "Prerrequisitos Faltantes", context: "prerequisites_missing" },
    {
      name: "Límite de Inscripciones Excedido",
      context: "enrollment_limit_exceeded",
    },
    { name: "Inscripción Duplicada", context: "duplicate_enrollment" },
  ];

  for (const scenario of scenarios) {
    console.log(`\n🎯 === DEMOSTRACIÓN: ${scenario.name} ===`);

    const validationContext = setupValidationContext();
    const context = createMockContext(scenario.context);

    console.log(`\n📋 Contexto de validación (${scenario.name}):`);
    console.log(`   Curso ID: ${context.courseId}`);
    console.log(`   Usuario ID: ${context.userId}`);

    try {
      const result = await validationContext.validateUntilFirstError(context);

      if (result.isValid) {
        console.log("\n✅ RESULTADO: Todas las validaciones pasaron");
        console.log(`   Mensaje: ${result.message}`);
      } else {
        console.log("\n❌ RESULTADO: Validación falló");
        console.log(`   Error: ${result.firstError.error}`);
        console.log(`   Estrategia: ${result.strategy}`);
        if (result.firstError.details) {
          console.log(
            `   Detalles: ${JSON.stringify(result.firstError.details, null, 2)}`
          );
        }
      }
    } catch (error) {
      console.log(`\n💥 ERROR: ${error.message}`);
    }
  }
};

/**
 * Demostrar ejecución de todas las validaciones
 */
const demonstrateAllValidations = async () => {
  console.log("\n🎯 === DEMOSTRACIÓN: Ejecutar Todas las Validaciones ===");

  const validationContext = setupValidationContext();
  const context = createMockContext("success");

  try {
    const result = await validationContext.validateAll(context);

    console.log("\n📊 RESULTADO: Ejecución de todas las validaciones");
    console.log(`   Válido: ${result.isValid}`);
    console.log(`   Validaciones ejecutadas: ${result.validations.length}`);
    console.log(`   Errores: ${result.errors.length}`);
    console.log(`   Advertencias: ${result.warnings.length}`);

    console.log("\n📋 Detalles de cada validación:");
    result.validations.forEach((validation, index) => {
      const status = validation.isValid ? "✅" : "❌";
      console.log(
        `   ${index + 1}. ${status} ${validation.strategy}: ${
          validation.isValid ? "PASÓ" : "FALLÓ"
        }`
      );
      if (!validation.isValid) {
        console.log(`      Error: ${validation.error}`);
      }
    });

    if (result.errors.length > 0) {
      console.log("\n🚨 Errores encontrados:");
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.strategy}: ${error.error}`);
      });
    }
  } catch (error) {
    console.log(`\n💥 ERROR: ${error.message}`);
  }
};

/**
 * Demostrar flexibilidad del patrón
 */
const demonstratePatternFlexibility = async () => {
  console.log("\n🎯 === DEMOSTRACIÓN: Flexibilidad del Patrón ===");

  // Crear contexto con solo algunas estrategias
  const partialContext = new EnrollmentValidationContext();
  partialContext.addStrategy(new AvailabilityValidationStrategy());
  partialContext.addStrategy(new DuplicateEnrollmentValidationStrategy());

  console.log("\n🔧 Contexto parcial configurado:");
  console.log(`   Estrategias: ${partialContext.getStrategies().length}`);
  partialContext.getStrategies().forEach((strategy, index) => {
    console.log(`   ${index + 1}. ${strategy.getName()}`);
  });

  const context = createMockContext("success");
  const result = await partialContext.validateUntilFirstError(context);

  console.log(`\n📊 RESULTADO: Validación parcial`);
  console.log(`   Válido: ${result.isValid}`);
  if (!result.isValid) {
    console.log(`   Error: ${result.firstError.error}`);
    console.log(`   Estrategia: ${result.strategy}`);
  }
};

/**
 * Función principal de demostración
 */
const runDemo = async () => {
  console.log("🚀 === DEMOSTRACIÓN DEL PATRÓN STRATEGY EN SGU ===");
  console.log(
    "📚 Sistema de Gestión Universitaria - Validaciones de Inscripción"
  );
  console.log(
    "🎯 Patrón Strategy implementado para validaciones modulares y extensibles\n"
  );

  try {
    // Demostrar validación exitosa
    await demonstrateSuccessfulValidation();

    // Demostrar escenarios de fallo
    await demonstrateFailureScenarios();

    // Demostrar ejecución de todas las validaciones
    await demonstrateAllValidations();

    // Demostrar flexibilidad
    await demonstratePatternFlexibility();

    console.log("\n🎉 === DEMOSTRACIÓN COMPLETADA ===");
    console.log("✅ El patrón Strategy permite:");
    console.log("   • Validaciones modulares e independientes");
    console.log("   • Fácil extensión con nuevas estrategias");
    console.log("   • Orden de ejecución configurable por prioridades");
    console.log("   • Testing individual de cada estrategia");
    console.log("   • Reutilización en diferentes contextos");
    console.log("   • Mantenimiento simplificado");
  } catch (error) {
    console.error("\n💥 ERROR EN DEMOSTRACIÓN:", error.message);
    console.error(error.stack);
  }
};

// Ejecutar demostración si se llama directamente
if (require.main === module) {
  runDemo();
}

module.exports = {
  runDemo,
  demonstrateSuccessfulValidation,
  demonstrateFailureScenarios,
  demonstrateAllValidations,
  demonstratePatternFlexibility,
};
