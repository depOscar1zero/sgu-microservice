// Mock para servicios externos en pruebas
const mockExternalServices = {
  AuthServiceClient: {
    verifyToken: async token => {
      return {
        success: true,
        data: {
          userId: 'user-123',
          email: 'student@test.com',
          role: 'student',
          firstName: 'Test',
          lastName: 'Student',
        },
      };
    },
    getUserById: async userId => {
      return {
        success: true,
        data: {
          id: userId,
          email: 'student@test.com',
          firstName: 'Test',
          lastName: 'Student',
          role: 'student',
        },
      };
    },
  },

  CoursesServiceClient: {
    getCourseById: async courseId => {
      return {
        success: true,
        data: {
          id: courseId,
          code: 'CS101',
          name: 'Computer Science 101',
          credits: 3,
          semester: 'Primavera 2024',
          status: 'ACTIVE',
          capacity: 30,
          availableSlots: 25,
          enrolled: 5,
          price: 100.0,
          currency: 'USD',
        },
      };
    },
    checkCourseAvailability: async courseId => {
      return {
        success: true,
        data: {
          id: courseId,
          code: 'CS101',
          name: 'Computer Science 101',
          credits: 3,
          semester: 'Primavera 2024',
          status: 'ACTIVE',
          capacity: 30,
          availableSlots: 25,
          enrolled: 5,
          price: 100.0,
          currency: 'USD',
          isAvailable: true,
          canEnroll: true,
        },
      };
    },
    checkPrerequisites: async (courseId, studentId) => {
      return {
        success: true,
        data: {
          courseId,
          studentId,
          prerequisitesMet: true,
          missingPrerequisites: [],
          canEnroll: true,
        },
      };
    },
    reserveSlots: async (courseId, slots) => {
      return {
        success: true,
        data: {
          courseId,
          slotsReserved: slots,
          availableSlots: 25 - slots,
        },
      };
    },
    releaseSlots: async (courseId, slots) => {
      return {
        success: true,
        data: {
          courseId,
          slotsReleased: slots,
          availableSlots: 25 + slots,
        },
      };
    },
  },

  NotificationsServiceClient: {
    sendNotification: async notificationData => {
      return {
        success: true,
        data: {
          id: 'notification-123',
          status: 'sent',
        },
      };
    },
  },
};

module.exports = mockExternalServices;
