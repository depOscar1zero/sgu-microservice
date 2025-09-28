// Configuración global para tests
const path = require("path");

// Configurar variables de entorno para testing
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "1h";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.MONGODB_URI = "mongodb://localhost:27017/sgu_test";
process.env.REDIS_URL = "redis://localhost:6379/1";

// Configurar timeouts
jest.setTimeout(30000);

// Mock de console para tests más limpios
global.console = {
  ...console,
  // Deshabilitar logs en tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Utilidades globales para tests
global.testUtils = {
  // Generar datos de prueba
  generateUser: (overrides = {}) => ({
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    password: "password123",
    role: "student",
    studentId: "12345",
    ...overrides,
  }),

  generateCourse: (overrides = {}) => ({
    name: "Test Course",
    code: "TC-2024-01",
    description: "Test course description",
    credits: 3,
    semester: "1",
    year: 2024,
    teacherId: "teacher-123",
    teacherName: "Prof. Test",
    maxStudents: 30,
    isActive: true,
    ...overrides,
  }),

  generateEnrollment: (overrides = {}) => ({
    studentId: "student-123",
    courseId: "course-123",
    status: "pending",
    enrollmentDate: new Date().toISOString(),
    ...overrides,
  }),

  generatePayment: (overrides = {}) => ({
    studentId: "student-123",
    enrollmentId: "enrollment-123",
    amount: 100.0,
    currency: "USD",
    paymentMethod: "credit_card",
    status: "pending",
    description: "Test payment",
    ...overrides,
  }),

  // Mock de servicios externos
  mockExternalServices: () => {
    jest.mock("../auth-service/src/services/externalServices", () => ({
      AuthServiceClient: {
        validateToken: jest.fn().mockResolvedValue({
          success: true,
          data: { id: "user-123", role: "student" },
        }),
        getUserById: jest.fn().mockResolvedValue({
          success: true,
          data: { id: "user-123", firstName: "Test", lastName: "User" },
        }),
      },
      EnrollmentServiceClient: {
        getEnrollmentById: jest.fn().mockResolvedValue({
          success: true,
          data: {
            id: "enrollment-123",
            studentId: "student-123",
            courseId: "course-123",
          },
        }),
        updateEnrollmentStatus: jest.fn().mockResolvedValue({
          success: true,
          data: { id: "enrollment-123", status: "approved" },
        }),
      },
      NotificationHelper: {
        sendNotification: jest.fn().mockResolvedValue(true),
      },
    }));
  },

  // Helper para limpiar base de datos
  cleanDatabase: async (sequelize) => {
    if (sequelize) {
      await sequelize.drop();
      await sequelize.sync();
    }
  },

  // Helper para crear usuario de prueba
  createTestUser: async (User, userData = {}) => {
    const user = global.testUtils.generateUser(userData);
    return await User.create(user);
  },

  // Helper para crear curso de prueba
  createTestCourse: async (Course, courseData = {}) => {
    const course = global.testUtils.generateCourse(courseData);
    return await Course.create(course);
  },
};

// Configurar cleanup después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

// Cleanup global después de todos los tests
afterAll(async () => {
  // Cerrar conexiones de base de datos si existen
  if (global.testDatabase) {
    await global.testDatabase.close();
  }
});
