// Utilidades para tests del Courses Service
const testUtils = {
  /**
   * Genera datos de curso para tests
   */
  generateCourse: (overrides = {}) => {
    const baseCourse = {
      name: `Test Course ${Date.now()}`,
      code: `TC${Date.now()}`,
      description: 'Test course description',
      credits: 3,
      instructor: 'Test Instructor',
      schedule: 'Monday 9:00-11:00',
      capacity: 30,
      semester: '2025-1'
    };
    
    return { ...baseCourse, ...overrides };
  },

  /**
   * Crea un curso de prueba en la base de datos
   */
  createTestCourse: async (CourseModel) => {
    const courseData = testUtils.generateCourse();
    return await CourseModel.create(courseData);
  },

  /**
   * Limpia la base de datos
   */
  cleanupDatabase: async (CourseModel) => {
    try {
      await CourseModel.destroy({ where: {} });
    } catch (error) {
      console.warn('Error cleaning database:', error.message);
    }
  }
};

module.exports = { testUtils };
