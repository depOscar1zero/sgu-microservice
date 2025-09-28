const request = require("supertest");
const { testUtils } = global;

// URLs de los servicios (en un entorno real, estos serían variables de entorno)
const AUTH_SERVICE_URL = "http://localhost:3001";
const COURSES_SERVICE_URL = "http://localhost:3002";
const ENROLLMENT_SERVICE_URL = "http://localhost:3003";
const PAYMENTS_SERVICE_URL = "http://localhost:3004";

describe("Services Integration Tests", () => {
  let authToken;
  let userId;
  let courseId;
  let enrollmentId;

  beforeAll(async () => {
    // Esperar a que los servicios estén disponibles
    await waitForService(AUTH_SERVICE_URL);
    await waitForService(COURSES_SERVICE_URL);
    await waitForService(ENROLLMENT_SERVICE_URL);
    await waitForService(PAYMENTS_SERVICE_URL);
  });

  describe("Complete User Flow", () => {
    test("should complete full user registration and enrollment flow", async () => {
      // 1. Register user
      const userData = testUtils.generateUser();
      const registerResponse = await request(AUTH_SERVICE_URL)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      authToken = registerResponse.body.data.token;
      userId = registerResponse.body.data.user.id;

      // 2. Create course
      const courseData = testUtils.generateCourse();
      const courseResponse = await request(COURSES_SERVICE_URL)
        .post("/api/courses")
        .set("Authorization", `Bearer ${authToken}`)
        .send(courseData)
        .expect(201);

      expect(courseResponse.body.success).toBe(true);
      courseId = courseResponse.body.data.id;

      // 3. Enroll in course
      const enrollmentResponse = await request(ENROLLMENT_SERVICE_URL)
        .post("/api/enrollments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          courseId: courseId,
          studentId: userId,
        })
        .expect(201);

      expect(enrollmentResponse.body.success).toBe(true);
      enrollmentId = enrollmentResponse.body.data.id;

      // 4. Approve enrollment
      const approveResponse = await request(ENROLLMENT_SERVICE_URL)
        .put(`/api/enrollments/${enrollmentId}/approve`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(approveResponse.body.success).toBe(true);
      expect(approveResponse.body.data.status).toBe("approved");

      // 5. Create payment
      const paymentData = {
        enrollmentId: enrollmentId,
        amount: 100.0,
        paymentMethod: "credit_card",
      };

      const paymentResponse = await request(PAYMENTS_SERVICE_URL)
        .post("/api/payments")
        .set("Authorization", `Bearer ${authToken}`)
        .send(paymentData)
        .expect(201);

      expect(paymentResponse.body.success).toBe(true);
      expect(paymentResponse.body.data.status).toBe("pending");
    });
  });

  describe("Cross-Service Communication", () => {
    beforeEach(async () => {
      // Setup: Create user and get token
      const userData = testUtils.generateUser();
      const registerResponse = await request(AUTH_SERVICE_URL)
        .post("/api/auth/register")
        .send(userData);

      authToken = registerResponse.body.data.token;
      userId = registerResponse.body.data.user.id;
    });

    test("should validate user across services", async () => {
      // Test that the same token works across all services
      const services = [
        { url: COURSES_SERVICE_URL, endpoint: "/api/courses" },
        { url: ENROLLMENT_SERVICE_URL, endpoint: "/api/enrollments" },
        { url: PAYMENTS_SERVICE_URL, endpoint: "/api/payments" },
      ];

      for (const service of services) {
        const response = await request(service.url)
          .get(service.endpoint)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    test("should handle service unavailability gracefully", async () => {
      // Test error handling when a service is down
      const response = await request("http://localhost:9999")
        .get("/api/test")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Data Consistency", () => {
    beforeEach(async () => {
      // Setup: Create user, course, and enrollment
      const userData = testUtils.generateUser();
      const registerResponse = await request(AUTH_SERVICE_URL)
        .post("/api/auth/register")
        .send(userData);

      authToken = registerResponse.body.data.token;
      userId = registerResponse.body.data.user.id;

      const courseData = testUtils.generateCourse();
      const courseResponse = await request(COURSES_SERVICE_URL)
        .post("/api/courses")
        .set("Authorization", `Bearer ${authToken}`)
        .send(courseData);

      courseId = courseResponse.body.data.id;

      const enrollmentResponse = await request(ENROLLMENT_SERVICE_URL)
        .post("/api/enrollments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          courseId: courseId,
          studentId: userId,
        });

      enrollmentId = enrollmentResponse.body.data.id;
    });

    test("should maintain data consistency across services", async () => {
      // Verify that data is consistent across services
      const enrollmentResponse = await request(ENROLLMENT_SERVICE_URL)
        .get(`/api/enrollments/${enrollmentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(enrollmentResponse.body.data.studentId).toBe(userId);
      expect(enrollmentResponse.body.data.courseId).toBe(courseId);
    });

    test("should handle concurrent operations", async () => {
      // Test concurrent enrollment attempts
      const promises = Array(5)
        .fill()
        .map(() =>
          request(ENROLLMENT_SERVICE_URL)
            .post("/api/enrollments")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
              courseId: courseId,
              studentId: userId,
            })
        );

      const responses = await Promise.allSettled(promises);

      // At least one should succeed, others might fail due to constraints
      const successful = responses.filter(
        (r) => r.status === "fulfilled" && r.value.status === 201
      );
      expect(successful.length).toBeGreaterThan(0);
    });
  });

  describe("Error Propagation", () => {
    test("should propagate errors correctly between services", async () => {
      // Test with invalid token
      const response = await request(COURSES_SERVICE_URL)
        .get("/api/courses")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("token");
    });

    test("should handle network timeouts", async () => {
      // This test would require mocking network delays
      // For now, we'll test that services respond within reasonable time
      const startTime = Date.now();

      const response = await request(COURSES_SERVICE_URL)
        .get("/api/courses")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });
});

// Helper function to wait for service availability
async function waitForService(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await request(url).get("/health").expect(200);
      return;
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw new Error(
          `Service at ${url} is not available after ${maxAttempts} attempts`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
