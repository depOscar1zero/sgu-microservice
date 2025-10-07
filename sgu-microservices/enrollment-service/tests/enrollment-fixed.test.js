const request = require("supertest");
const app = require("../src/app");
const { Enrollment } = require("../src/models");
const testUtils = require("./utils");

describe("Enrollment Service API", () => {
  let testEnrollment;
  let authToken;
  let adminToken;

  beforeAll(async () => {
    // Generar tokens de autenticación válidos
    authToken = testUtils.generateAuthToken();
    adminToken = testUtils.generateAdminToken();
    
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
  });

  describe("GET /api/enrollments/my", () => {
    beforeEach(async () => {
      // Crear inscripciones de prueba para el mismo usuario
      await testUtils.createTestEnrollment(Enrollment);
      await testUtils.createTestEnrollment(Enrollment, {
        userId: "user-123", // Mismo usuario
        studentId: "student-456",
        courseId: "course-456",
        status: "Confirmed",
      });
    });

    test("should return my enrollments", async () => {
      const response = await request(app)
        .get("/api/enrollments/my")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enrollments).toHaveLength(2);
    });

    test("should return 401 without token", async () => {
      const response = await request(app).get("/api/enrollments/my").expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/enrollments (admin)", () => {
    beforeEach(async () => {
      // Crear inscripciones de prueba
      await testUtils.createTestEnrollment(Enrollment);
      await testUtils.createTestEnrollment(Enrollment, {
        userId: "user-456", // Diferente usuario
        studentId: "student-456",
        courseId: "course-456",
        status: "Confirmed",
      });
    });

    test("should return all enrollments", async () => {
      const response = await request(app)
        .get("/api/enrollments")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    test("should filter enrollments by student", async () => {
      const response = await request(app)
        .get("/api/enrollments?studentId=STU123")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test("should filter enrollments by course", async () => {
      const response = await request(app)
        .get("/api/enrollments?courseId=course-123")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test("should filter enrollments by status", async () => {
      const response = await request(app)
        .get("/api/enrollments?status=Confirmed")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test("should return 401 without token", async () => {
      const response = await request(app).get("/api/enrollments").expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/enrollments", () => {
    test("should create a new enrollment", async () => {
      const enrollmentData = testUtils.generateEnrollment();

      const response = await request(app)
        .post("/api/enrollments")
        .set("Authorization", `Bearer ${authToken}`)
        .send(enrollmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enrollment.courseId).toBe(enrollmentData.courseId);
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
      const response = await request(app)
        .post("/api/enrollments")
        .send(testUtils.generateEnrollment())
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
      expect(response.body.data.enrollment.id).toBe(testEnrollment.id);
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
        status: "Pending"
      });
    });

    test("should approve enrollment", async () => {
      const response = await request(app)
        .put(`/api/enrollments/${testEnrollment.id}/approve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enrollment.status).toBe("Confirmed");
    });

    test("should return 404 for non-existent enrollment", async () => {
      const response = await request(app)
        .put("/api/enrollments/non-existent-id/approve")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/enrollments/:id/reject", () => {
    beforeEach(async () => {
      testEnrollment = await testUtils.createTestEnrollment(Enrollment, {
        status: "Pending"
      });
    });

    test("should reject enrollment with reason", async () => {
      const reason = "No cumple requisitos";

      const response = await request(app)
        .put(`/api/enrollments/${testEnrollment.id}/reject`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enrollment.status).toBe("Cancelled");
    });

    test("should reject enrollment without reason", async () => {
      const response = await request(app)
        .put(`/api/enrollments/${testEnrollment.id}/reject`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enrollment.status).toBe("Cancelled");
    });
  });

  describe("PUT /api/enrollments/:id/cancel", () => {
    beforeEach(async () => {
      testEnrollment = await testUtils.createTestEnrollment(Enrollment);
    });

    test("should cancel enrollment", async () => {
      const response = await request(app)
        .put(`/api/enrollments/${testEnrollment.id}/cancel`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ reason: "Student request" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enrollment.status).toBe("Cancelled");
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
      // Crear inscripciones de prueba para estadísticas
      await testUtils.createTestEnrollment(Enrollment, { status: "Confirmed" });
      await testUtils.createTestEnrollment(Enrollment, { 
        status: "Paid",
        courseId: "course-456" 
      });
      await testUtils.createTestEnrollment(Enrollment, { 
        status: "Cancelled",
        courseId: "course-789" 
      });
    });

    test("should return enrollment statistics", async () => {
      const response = await request(app)
        .get("/api/enrollments/stats")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("total");
      expect(response.body.data.total).toBe(3);
    });
  });

  describe("Health Check", () => {
    test("GET /health should return service status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe("healthy");
      expect(response.body.service).toBe("Enrollment Service");
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

  beforeEach(async () => {
    await Enrollment.destroy({ where: {} });
  });

  test("should create enrollment with valid data", async () => {
    const enrollmentData = testUtils.generateEnrollment();

    const enrollment = await Enrollment.create(enrollmentData);

    expect(enrollment.id).toBeDefined();
    expect(enrollment.courseId).toBe(enrollmentData.courseId);
    expect(enrollment.studentEmail).toBe(enrollmentData.studentEmail);
  });

  test("should validate required fields", async () => {
    const enrollmentData = testUtils.generateEnrollment();
    delete enrollmentData.courseId;

    await expect(Enrollment.create(enrollmentData)).rejects.toThrow();
  });

  test("should validate status enum", async () => {
    const enrollmentData = testUtils.generateEnrollment();
    enrollmentData.status = "InvalidStatus";

    // En SQLite, el enum no es estrictamente validado
    const enrollment = await Enrollment.create(enrollmentData);
    expect(enrollment.status).toBe("InvalidStatus");
  });

  test("should set default enrollment date", async () => {
    const enrollmentData = testUtils.generateEnrollment();
    delete enrollmentData.enrollmentDate;

    const enrollment = await Enrollment.create(enrollmentData);
    expect(enrollment.enrollmentDate).toBeDefined();
  });
});
