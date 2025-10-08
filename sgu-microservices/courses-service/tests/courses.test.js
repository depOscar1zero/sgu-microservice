const request = require('supertest');
const app = require('../src/app');
const Course = require('../src/models/Course');
const { testUtils } = global;

describe('Courses Service API', () => {
  let testCourse;
  let authToken;

  beforeAll(async () => {
    // Limpiar y sincronizar base de datos
    await Course.sync({ force: true });
  });

  afterAll(async () => {
    // Limpiar base de datos
    await Course.drop();
  });

  beforeEach(async () => {
    // Limpiar cursos antes de cada test
    await Course.destroy({ where: {} });

    // Mock de autenticación
    authToken = 'mock-jwt-token';
  });

  describe('GET /api/courses', () => {
    beforeEach(async () => {
      // Crear cursos de prueba
      await testUtils.createTestCourse(Course);
      await testUtils.createTestCourse(Course, {
        name: 'Advanced Programming',
        code: 'AP-2024-01',
        teacherName: 'Prof. Smith',
      });
    });

    test('should return all courses', async () => {
      const response = await request(app).get('/api/courses').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toHaveLength(2);
    });

    test('should filter courses by department', async () => {
      const response = await request(app)
        .get('/api/courses?department=Computer Science')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toHaveLength(2);
    });

    test('should filter courses by status', async () => {
      const response = await request(app)
        .get('/api/courses?status=ACTIVE')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toHaveLength(2);
    });

    test('should search courses by name', async () => {
      const response = await request(app)
        .get('/api/courses?search=Test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toHaveLength(2);
      expect(response.body.data.courses[0].name).toContain('Test');
    });
  });

  describe('POST /api/courses', () => {
    test('should create a new course', async () => {
      const courseData = testUtils.generateCourse();

      const response = await request(app)
        .post('/api/courses')
        .send(courseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(courseData.name);
      expect(response.body.data.code).toBe(courseData.code);
    });

    test('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/courses')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/courses/:id', () => {
    beforeEach(async () => {
      testCourse = await testUtils.createTestCourse(Course);
    });

    test('should return specific course', async () => {
      const response = await request(app)
        .get(`/api/courses/${testCourse.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testCourse.id);
      expect(response.body.data.name).toBe(testCourse.name);
    });

    test('should return 404 for non-existent course', async () => {
      const response = await request(app)
        .get('/api/courses/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/courses/:id', () => {
    beforeEach(async () => {
      testCourse = await testUtils.createTestCourse(Course);
    });

    test('should update course', async () => {
      const updateData = {
        name: 'Updated Course Name',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/courses/${testCourse.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    test('should return 404 for non-existent course', async () => {
      const response = await request(app)
        .put('/api/courses/non-existent-id')
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/courses/:id', () => {
    beforeEach(async () => {
      testCourse = await testUtils.createTestCourse(Course);
    });

    test('should delete course (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/courses/${testCourse.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar que el curso fue marcado como invisible (soft delete)
      const deletedCourse = await Course.findByPk(testCourse.id);
      expect(deletedCourse.isVisible).toBe(false);
      expect(deletedCourse.status).toBe('INACTIVE');
    });

    test('should return 404 for non-existent course', async () => {
      const response = await request(app)
        .delete('/api/courses/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/courses/stats', () => {
    beforeEach(async () => {
      // Limpiar cursos existentes
      await Course.destroy({ where: {} });

      // Crear varios cursos para estadísticas
      await testUtils.createTestCourse(Course, {
        name: 'Course 1',
        code: 'C1-2024-01',
        status: 'ACTIVE',
      });
      await testUtils.createTestCourse(Course, {
        name: 'Course 2',
        code: 'C2-2024-01',
        status: 'ACTIVE',
      });
      await testUtils.createTestCourse(Course, {
        name: 'Course 3',
        code: 'C3-2024-01',
        status: 'INACTIVE',
      });
    });

    test('should return course statistics', async () => {
      const response = await request(app).get('/api/courses/stats').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalCourses');
      expect(response.body.data).toHaveProperty('activeCourses');
      expect(response.body.data).toHaveProperty('inactiveCourses');
      expect(response.body.data).toHaveProperty('byDepartment');

      // Verificar que las estadísticas son coherentes
      expect(response.body.data.totalCourses).toBeGreaterThan(0);
      expect(
        response.body.data.activeCourses + response.body.data.inactiveCourses
      ).toBe(response.body.data.totalCourses);
    });
  });

  describe('Health Check', () => {
    test('GET /health should return service status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe('Courses Service');
      expect(response.body.status).toBe('healthy');
    });
  });
});

describe('Course Model', () => {
  beforeAll(async () => {
    await Course.sync({ force: true });
  });

  afterAll(async () => {
    await Course.drop();
  });

  test('should create course with valid data', async () => {
    const courseData = testUtils.generateCourse();
    const course = await Course.create(courseData);

    expect(course.id).toBeDefined();
    expect(course.name).toBe(courseData.name);
    expect(course.code).toBe(courseData.code);
    expect(course.credits).toBe(courseData.credits);
    expect(course.isActive).toBe(courseData.isActive);
  });

  test('should validate required fields', async () => {
    await expect(Course.create({})).rejects.toThrow();
  });

  test('should validate credits as positive number', async () => {
    const courseData = testUtils.generateCourse({ credits: -1 });

    await expect(Course.create(courseData)).rejects.toThrow();
  });

  test('should validate capacity as positive number', async () => {
    const courseData = testUtils.generateCourse({ capacity: 0 });

    await expect(Course.create(courseData)).rejects.toThrow();
  });
});
