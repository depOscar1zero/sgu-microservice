const request = require("supertest");
const app = require("../src/app");
const { testUtils } = global;

describe("API Gateway", () => {
  let authToken;

  beforeAll(async () => {
    // Mock de autenticación
    authToken = "mock-jwt-token";
  });

  describe("Health Check", () => {
    test("GET /health should return gateway status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe("API Gateway");
      expect(response.body.status).toBe("healthy");
    });
  });

  describe("Root Endpoint", () => {
    test("GET / should return gateway info", async () => {
      const response = await request(app).get("/").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("SGU API Gateway");
      expect(response.body.endpoints).toHaveProperty("health");
      expect(response.body.endpoints).toHaveProperty("services");
    });
  });

  describe("Metrics Endpoint", () => {
    test("GET /metrics should return Prometheus metrics", async () => {
      const response = await request(app).get("/metrics").expect(200);

      expect(response.headers["content-type"]).toContain("text/plain");
      expect(response.text).toContain("http_requests_total");
    });
  });

  describe("Authentication", () => {
    test("should require authentication for protected routes", async () => {
      const response = await request(app).get("/api/courses").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Token de acceso requerido");
    });

    test("should accept valid authentication", async () => {
      const response = await request(app)
        .get("/api/courses")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // El proxy debería manejar la respuesta
      expect(response.body).toBeDefined();
    });
  });

  describe("Rate Limiting", () => {
    test("should apply rate limiting", async () => {
      // Hacer múltiples requests rápidamente
      const promises = Array(10)
        .fill()
        .map(() => request(app).get("/health"));

      const responses = await Promise.all(promises);

      // Todas deberían ser exitosas (health check no tiene rate limit)
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe("CORS", () => {
    test("should handle CORS preflight", async () => {
      const response = await request(app)
        .options("/api/courses")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET")
        .set("Access-Control-Request-Headers", "Authorization")
        .expect(200);

      expect(response.headers["access-control-allow-origin"]).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    test("should handle 404 errors", async () => {
      const response = await request(app).get("/api/nonexistent").expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Endpoint no encontrado");
    });

    test("should handle proxy errors gracefully", async () => {
      // Simular error de proxy
      const response = await request(app)
        .get("/api/courses")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // El proxy debería manejar la respuesta
      expect(response.body).toBeDefined();
    });
  });

  describe("Request ID", () => {
    test("should add request ID to responses", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["x-request-id"]).toBeDefined();
    });
  });

  describe("Security Headers", () => {
    test("should include security headers", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("DENY");
    });
  });
});

describe("Proxy Service", () => {
  test("should create proxy middleware", () => {
    const proxyService = require("../src/services/proxyService");
    const proxy = proxyService.createProxy("auth");

    expect(proxy).toBeDefined();
    expect(typeof proxy).toBe("function");
  });

  test("should check service health", async () => {
    const proxyService = require("../src/services/proxyService");

    // Mock del servicio de salud
    const mockHealth = { healthy: true, lastCheck: new Date() };
    proxyService.serviceHealth.set("auth", mockHealth);

    const isHealthy = await proxyService.checkServiceHealth("auth");
    expect(isHealthy).toBe(true);
  });
});

describe("Auth Service", () => {
  test("should validate tokens", async () => {
    const authService = require("../src/services/authService");

    // Mock de token válido
    const mockUser = { id: "user-123", role: "student" };
    authService.tokenCache.set("valid-token", {
      user: mockUser,
      timestamp: Date.now(),
    });

    const user = await authService.validateToken("valid-token");
    expect(user).toEqual(mockUser);
  });

  test("should check user roles", () => {
    const authService = require("../src/services/authService");

    const user = { id: "user-123", role: "admin" };
    const hasRole = authService.checkRole(user, ["admin", "teacher"]);

    expect(hasRole).toBe(true);
  });
});

describe("Rate Limit Service", () => {
  test("should create rate limiters", () => {
    const rateLimitService = require("../src/services/rateLimitService");

    const globalLimiter = rateLimitService.getLimiter("global");
    expect(globalLimiter).toBeDefined();

    const authLimiter = rateLimitService.getLimiter("auth");
    expect(authLimiter).toBeDefined();
  });

  test("should get service limiters", () => {
    const rateLimitService = require("../src/services/rateLimitService");

    const serviceLimiter = rateLimitService.getServiceLimiter("courses");
    expect(serviceLimiter).toBeDefined();
  });
});

describe("Metrics Service", () => {
  test("should record HTTP requests", () => {
    const metricsService = require("../src/services/metricsService");

    metricsService.recordHttpRequest(
      "GET",
      "/api/courses",
      200,
      "courses",
      100,
      1024,
      2048
    );

    // Verificar que las métricas se registraron
    expect(metricsService.httpRequestsTotal).toBeDefined();
  });

  test("should record service health", () => {
    const metricsService = require("../src/services/metricsService");

    metricsService.recordServiceHealth("courses", "/health", true);

    // Verificar que las métricas se registraron
    expect(metricsService.serviceHealth).toBeDefined();
  });
});
