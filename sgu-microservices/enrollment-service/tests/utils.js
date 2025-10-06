/**
 * Utilidades para las pruebas del enrollment service
 */

const testUtils = {
  /**
   * Generar datos de inscripción para pruebas
   */
  generateEnrollment: (overrides = {}) => {
    const baseEnrollment = {
      userId: "user-123",
      courseId: "course-123",
      studentEmail: "student@test.com",
      studentName: "Test Student",
      studentId: "STU123",
      courseCode: "CS101",
      courseName: "Computer Science 101",
      courseCredits: 3,
      courseSemester: "Primavera 2024",
      amount: 100.00,
      currency: "USD",
      status: "Pending",
      paymentStatus: "Pending"
    };

    return { ...baseEnrollment, ...overrides };
  },

  /**
   * Crear inscripción de prueba en la base de datos
   */
  createTestEnrollment: async (EnrollmentModel, overrides = {}) => {
    const enrollmentData = testUtils.generateEnrollment(overrides);
    return await EnrollmentModel.create(enrollmentData);
  },

  /**
   * Generar token de autenticación para pruebas
   */
  generateAuthToken: () => {
    const jwt = require('jsonwebtoken');
    const payload = {
      userId: "user-123",
      email: "student@test.com",
      role: "student",
      firstName: "Test",
      lastName: "Student"
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET || "test-secret", { expiresIn: "1h" });
  },

  /**
   * Generar token de administrador para pruebas
   */
  generateAdminToken: () => {
    const jwt = require('jsonwebtoken');
    const payload = {
      userId: "admin-123",
      email: "admin@test.com",
      role: "admin",
      firstName: "Admin",
      lastName: "User"
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET || "test-secret", { expiresIn: "1h" });
  },

  /**
   * Limpiar base de datos de pruebas
   */
  cleanDatabase: async (EnrollmentModel) => {
    await EnrollmentModel.destroy({ where: {} });
  },

  /**
   * Crear múltiples inscripciones de prueba
   */
  createMultipleTestEnrollments: async (EnrollmentModel, count = 3) => {
    const enrollments = [];
    for (let i = 0; i < count; i++) {
      const enrollment = await testUtils.createTestEnrollment(EnrollmentModel, {
        userId: `user-${i + 1}`,
        courseId: `course-${i + 1}`,
        studentEmail: `student${i + 1}@test.com`,
        studentName: `Test Student ${i + 1}`
      });
      enrollments.push(enrollment);
    }
    return enrollments;
  }
};

module.exports = testUtils;
