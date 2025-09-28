const request = require("supertest");
const app = require("../src/app");
const { Enrollment } = require("../src/models");
const { testUtils } = global;

describe("Enrollment Service API", () => {
  let testEnrollment;
  let authToken;

  beforeAll(async () => {
    // Limpiar y sincronizar base de datos
    await Enrollment.sync({ force: true });
  });

  afterAll(async () => {
    // Limpiar base de datos
    await Enrollment.drop();
  });

  beforeEach(async () => {
    // Limpiar inscripciones antes de cada test
    await Enrollment.destroy({ where: {} });

    // Mock de autenticación
    authToken = "mock-jwt-token";
  });

  describe("GET /api/enrollments", () => {
    beforeEach(async () => {
      // Crear inscripciones de prueba
      await testUtils.createTestEnrollment(Enrollment);
      await testUtils.createTestEnrollment(Enrollment, {
        studentId: "student-456",
        courseId: "course-456",
        status: "approved",
      });
    });

    test("should return all enrollments", async () => {
      const response = await request(app)
        .get("/api/enrollments")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    test("should filter enrollments by student", async () => {
      const response = await request(app)
        .get("/api/enrollments?studentId=student-123")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].studentId).toBe("student-123");
    });

    test("should filter enrollments by course", async () => {
      const response = await request(app)
        .get("/api/enrollments?courseId=course-123")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].courseId).toBe("course-123");
    });

    test("should filter enrollments by status", async () => {
      const response = await request(app)
        .get("/api/enrollments?status=approved")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe("approved");
    });

    test("should return 401 without token", async () => {
      const response = await request(app).get("/api/enrollments").expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/enrollments", () => {
    test("should create a new enrollment", async () => {
      const enrollmentData = {
        courseId: "course-123",
        studentId: "student-123",
      };

      const response = await request(app)
        .post("/api/enrollments")
        .set("Authorization", `Bearer ${authToken}`)
        .send(enrollmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courseId).toBe(enrollmentData.courseId);
      expect(response.body.data.studentId).toBe(enrollmentData.studentId);
      expect(response.body.data.status).toBe("pending");
    });

    test("should return 400 for invalid data", async () => {
      const response = await request(app)
        .post("/api/enrollments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test("should return 401 without token", async () => {
      const enrollmentData = {
        courseId: "course-123",
        studentId: "student-123",
      };

      const response = await request(app)
        .post("/api/enrollments")
        .send(enrollmentData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/enrollments/:id", () => {
    beforeEach(async () => {
      testEnrollment = await testUtils.createTestEnrollment(Enrollment);
    });

    test("should return specific enrollment", async () => {
      const response = await request(app)
        .get(`/api/enrollments/${testEnrollment.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testEnrollment.id);
      expect(response.body.data.studentId).toBe(testEnrollment.studentId);
    });

    test("should return 404 for non-existent enrollment", async () => {
      const response = await request(app)
        .get("/api/enrollments/non-existent-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test("should return 401 without token", async () => {
      const response = await request(app)
        .get(`/api/enrollments/${testEnrollment.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/enrollments/:id/approve", () => {
    beforeEach(async () => {
      testEnrollment = await testUtils.createTestEnrollment(Enrollment, {
        status: "pending",
      });
    });

    test("should approve enrollment", async () => {
      const response = await request(app)
        .put(`/api/enrollments/${testEnrollment.id}/approve`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("approved");
      expect(response.body.data.approvedDate).toBeDefined();
    });

    test("should return 404 for non-existent enrollment", async () => {
      const response = await request(app)
        .put("/api/enrollments/non-existent-id/approve")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/enrollments/:id/reject", () => {
    beforeEach(async () => {
      testEnrollment = await testUtils.createTestEnrollment(Enrollment, {
        status: "pending",
      });
    });

    test("should reject enrollment with reason", async () => {
      const reason = "Course is full";

      const response = await request(app)
        .put(`/api/enrollments/${testEnrollment.id}/reject`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("rejected");
      expect(response.body.data.reason).toBe(reason);
      expect(response.body.data.rejectedDate).toBeDefined();
    });

    test("should reject enrollment without reason", async () => {
      const response = await request(app)
        .put(`/api/enrollments/${testEnrollment.id}/reject`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("rejected");
    });
  });

  describe("DELETE /api/enrollments/:id", () => {
    beforeEach(async () => {
      testEnrollment = await testUtils.createTestEnrollment(Enrollment);
    });

    test("should cancel enrollment", async () => {
      const response = await request(app)
        .delete(`/api/enrollments/${testEnrollment.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: "Student request" })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar que la inscripción fue cancelada
      const updatedEnrollment = await Enrollment.findByPk(testEnrollment.id);
      expect(updatedEnrollment.status).toBe("cancelled");
    });

    test("should return 404 for non-existent enrollment", async () => {
      const response = await request(app)
        .delete("/api/enrollments/non-existent-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/enrollments/stats", () => {
    beforeEach(async () => {
      // Crear inscripciones con diferentes estados
      await testUtils.createTestEnrollment(Enrollment, { status: "pending" });
      await testUtils.createTestEnrollment(Enrollment, {
        studentId: "student-2",
        courseId: "course-2",
        status: "approved",
      });
      await testUtils.createTestEnrollment(Enrollment, {
        studentId: "student-3",
        courseId: "course-3",
        status: "rejected",
      });
    });

    test("should return enrollment statistics", async () => {
      const response = await request(app)
        .get("/api/enrollments/stats")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("totalEnrollments");
      expect(response.body.data).toHaveProperty("pendingEnrollments");
      expect(response.body.data).toHaveProperty("approvedEnrollments");
      expect(response.body.data).toHaveProperty("rejectedEnrollments");
      expect(response.body.data.totalEnrollments).toBe(3);
      expect(response.body.data.pendingEnrollments).toBe(1);
      expect(response.body.data.approvedEnrollments).toBe(1);
      expect(response.body.data.rejectedEnrollments).toBe(1);
    });
  });

  describe("Health Check", () => {
    test("GET /health should return service status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe("Enrollment Service");
      expect(response.body.status).toBe("healthy");
    });
  });
});

describe("Enrollment Model", () => {
  beforeAll(async () => {
    await Enrollment.sync({ force: true });
  });

  afterAll(async () => {
    await Enrollment.drop();
  });

  test("should create enrollment with valid data", async () => {
    const enrollmentData = testUtils.generateEnrollment();
    const enrollment = await Enrollment.create(enrollmentData);

    expect(enrollment.id).toBeDefined();
    expect(enrollment.studentId).toBe(enrollmentData.studentId);
    expect(enrollment.courseId).toBe(enrollmentData.courseId);
    expect(enrollment.status).toBe(enrollmentData.status);
  });

  test("should validate required fields", async () => {
    await expect(Enrollment.create({})).rejects.toThrow();
  });

  test("should validate status enum", async () => {
    const enrollmentData = testUtils.generateEnrollment({
      status: "invalid-status",
    });

    await expect(Enrollment.create(enrollmentData)).rejects.toThrow();
  });

  test("should set default enrollment date", async () => {
    const enrollmentData = testUtils.generateEnrollment();
    delete enrollmentData.enrollmentDate;

    const enrollment = await Enrollment.create(enrollmentData);
    expect(enrollment.enrollmentDate).toBeDefined();
  });
});
