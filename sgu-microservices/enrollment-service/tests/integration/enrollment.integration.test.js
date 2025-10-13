const request = require('supertest');
const app = require('../../src/app');

describe('Enrollment Service Integration Tests', () => {
  describe('Health Check', () => {
    test('should check service health', async () => {
      const response = await request(app)
        .get('/api/enrollments/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('database');
    });
  });

  describe('Enrollment CRUD Operations', () => {
    let enrollmentId;
    const testEnrollment = {
      studentId: `student-${Date.now()}`,
      courseId: `course-${Date.now()}`,
      academicPeriod: '2024-1',
      semester: 1,
    };

    test('should create a new enrollment', async () => {
      const response = await request(app)
        .post('/api/enrollments')
        .send(testEnrollment)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.studentId).toBe(testEnrollment.studentId);
      expect(response.body.data.courseId).toBe(testEnrollment.courseId);

      enrollmentId = response.body.data.id;
    });

    test('should get enrollment by ID', async () => {
      const response = await request(app)
        .get(`/api/enrollments/${enrollmentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(enrollmentId);
      expect(response.body.data.studentId).toBe(testEnrollment.studentId);
    });

    test('should list all enrollments', async () => {
      const response = await request(app)
        .get('/api/enrollments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should get enrollments by student ID', async () => {
      const response = await request(app)
        .get(`/api/enrollments/student/${testEnrollment.studentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      const studentEnrollments = response.body.data.filter(
        (e) => e.studentId === testEnrollment.studentId
      );
      expect(studentEnrollments.length).toBeGreaterThan(0);
    });

    test('should update enrollment status', async () => {
      const response = await request(app)
        .put(`/api/enrollments/${enrollmentId}`)
        .send({ status: 'approved' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
    });
  });

  describe('Enrollment Validation Strategy Pattern', () => {
    test('should validate enrollment with validation strategy', async () => {
      const enrollmentData = {
        studentId: `student-validation-${Date.now()}`,
        courseId: `course-validation-${Date.now()}`,
        academicPeriod: '2024-1',
        semester: 1,
      };

      const response = await request(app)
        .post('/api/enrollments')
        .send(enrollmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('validationResults');
    });

    test('should reject enrollment with invalid data', async () => {
      const invalidEnrollment = {
        studentId: '',
        courseId: '',
        academicPeriod: 'invalid',
      };

      const response = await request(app)
        .post('/api/enrollments')
        .send(invalidEnrollment)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Domain-Driven Design Integration', () => {
    test('should handle enrollment with value objects (Money)', async () => {
      const enrollmentData = {
        studentId: `student-ddd-${Date.now()}`,
        courseId: `course-ddd-${Date.now()}`,
        academicPeriod: '2024-1',
        semester: 1,
        tuitionFee: {
          amount: 1500.0,
          currency: 'USD',
        },
      };

      const response = await request(app)
        .post('/api/enrollments')
        .send(enrollmentData)
        .expect(201);

      expect(response.body.success).toBe(true);

      if (response.body.data.tuitionFee) {
        expect(response.body.data.tuitionFee).toHaveProperty('amount');
        expect(response.body.data.tuitionFee).toHaveProperty('currency');
      }
    });

    test('should validate domain rules for enrollment', async () => {
      const enrollmentData = {
        studentId: `student-rules-${Date.now()}`,
        courseId: `course-rules-${Date.now()}`,
        academicPeriod: '2024-1',
        semester: 1,
        maxCapacity: 30,
        currentEnrollments: 29,
      };

      const response = await request(app)
        .post('/api/enrollments')
        .send(enrollmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should reject enrollment when capacity is full', async () => {
      const enrollmentData = {
        studentId: `student-full-${Date.now()}`,
        courseId: `course-full-${Date.now()}`,
        academicPeriod: '2024-1',
        semester: 1,
        maxCapacity: 30,
        currentEnrollments: 30,
      };

      const response = await request(app)
        .post('/api/enrollments')
        .send(enrollmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('capacidad');
    });
  });

  describe('Factory Pattern Integration', () => {
    test('should use ValidatorFactory for enrollment validation', async () => {
      const enrollmentData = {
        studentId: `student-factory-${Date.now()}`,
        courseId: `course-factory-${Date.now()}`,
        academicPeriod: '2024-1',
        semester: 1,
        validationType: 'standard',
      };

      const response = await request(app)
        .post('/api/enrollments/validate')
        .send(enrollmentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isValid');
      expect(response.body.data).toHaveProperty('validationType');
    });
  });

  describe('Concurrent Enrollment Handling', () => {
    test('should handle multiple enrollments for same student', async () => {
      const studentId = `student-concurrent-${Date.now()}`;

      const enrollments = [
        {
          studentId,
          courseId: `course-1-${Date.now()}`,
          academicPeriod: '2024-1',
          semester: 1,
        },
        {
          studentId,
          courseId: `course-2-${Date.now()}`,
          academicPeriod: '2024-1',
          semester: 1,
        },
        {
          studentId,
          courseId: `course-3-${Date.now()}`,
          academicPeriod: '2024-1',
          semester: 1,
        },
      ];

      const promises = enrollments.map((enrollment) =>
        request(app).post('/api/enrollments').send(enrollment)
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    test('should prevent duplicate enrollments for same course', async () => {
      const enrollmentData = {
        studentId: `student-duplicate-${Date.now()}`,
        courseId: `course-duplicate-${Date.now()}`,
        academicPeriod: '2024-1',
        semester: 1,
      };

      // First enrollment
      const firstResponse = await request(app)
        .post('/api/enrollments')
        .send(enrollmentData)
        .expect(201);

      expect(firstResponse.body.success).toBe(true);

      // Second enrollment (should fail or be handled gracefully)
      const secondResponse = await request(app)
        .post('/api/enrollments')
        .send(enrollmentData);

      // Should either fail (400) or return existing enrollment (200/409)
      expect([200, 400, 409]).toContain(secondResponse.status);

      if (secondResponse.status === 400 || secondResponse.status === 409) {
        expect(secondResponse.body.success).toBe(false);
      }
    });
  });

  describe('Enrollment Lifecycle', () => {
    let enrollmentId;

    beforeEach(async () => {
      const enrollmentData = {
        studentId: `student-lifecycle-${Date.now()}`,
        courseId: `course-lifecycle-${Date.now()}`,
        academicPeriod: '2024-1',
        semester: 1,
      };

      const response = await request(app)
        .post('/api/enrollments')
        .send(enrollmentData)
        .expect(201);

      enrollmentId = response.body.data.id;
    });

    test('should transition enrollment from pending to approved', async () => {
      const response = await request(app)
        .put(`/api/enrollments/${enrollmentId}/approve`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
    });

    test('should cancel enrollment', async () => {
      const response = await request(app)
        .put(`/api/enrollments/${enrollmentId}/cancel`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(['cancelled', 'canceled']).toContain(response.body.data.status);
    });

    test('should delete enrollment', async () => {
      const response = await request(app)
        .delete(`/api/enrollments/${enrollmentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/enrollments/${enrollmentId}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent enrollment', async () => {
      const response = await request(app)
        .get('/api/enrollments/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 400 for invalid enrollment data', async () => {
      const invalidData = {
        studentId: '',
        courseId: '',
      };

      const response = await request(app)
        .post('/api/enrollments')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
