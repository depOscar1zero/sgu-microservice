const request = require("supertest");
const app = require("../src/app");
const { User } = require("../src/models");
const { testUtils } = global;

describe("Auth Service API", () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Limpiar y sincronizar base de datos
    await User.sync({ force: true });
  });

  afterAll(async () => {
    // Limpiar base de datos
    await User.drop();
  });

  beforeEach(async () => {
    // Limpiar usuarios antes de cada test
    await User.destroy({ where: {} });
  });

  describe("POST /api/auth/register", () => {
    test("should register a new user successfully", async () => {
      const userData = testUtils.generateUser();

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined(); // Password no debe estar en la respuesta
    });

    test("should return 400 for invalid email", async () => {
      const userData = testUtils.generateUser({ email: "invalid-email" });

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("email");
    });

    test("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test("should return 409 for duplicate email", async () => {
      const userData = testUtils.generateUser();

      // Crear usuario primero
      await request(app).post("/api/auth/register").send(userData).expect(201);

      // Intentar crear usuario con mismo email
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("email");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Crear usuario de prueba
      testUser = await testUtils.createTestUser(User);
    });

    test("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "password123",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user.email).toBe(testUser.email);

      authToken = response.body.data.token;
    });

    test("should return 401 for invalid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "wrong-password",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("credenciales");
    });

    test("should return 401 for non-existent user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/auth/profile", () => {
    beforeEach(async () => {
      testUser = await testUtils.createTestUser(User);

      // Obtener token de login
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "password123",
      });

      authToken = loginResponse.body.data.token;
    });

    test("should return user profile with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.password).toBeUndefined();
    });

    test("should return 401 without token", async () => {
      const response = await request(app).get("/api/auth/profile").expect(401);

      expect(response.body.success).toBe(false);
    });

    test("should return 401 with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/refresh", () => {
    beforeEach(async () => {
      testUser = await testUtils.createTestUser(User);

      // Obtener token de login
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "password123",
      });

      authToken = loginResponse.body.data.token;
    });

    test("should refresh token successfully", async () => {
      const response = await request(app)
        .post("/api/auth/refresh")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.token).not.toBe(authToken); // Debe ser un token diferente
    });
  });

  describe("Health Check", () => {
    test("GET /health should return service status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe("Auth Service");
      expect(response.body.status).toBe("healthy");
    });
  });
});

describe("User Model", () => {
  beforeAll(async () => {
    await User.sync({ force: true });
  });

  afterAll(async () => {
    await User.drop();
  });

  test("should create user with valid data", async () => {
    const userData = testUtils.generateUser();
    const user = await User.create(userData);

    expect(user.id).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.firstName).toBe(userData.firstName);
    expect(user.lastName).toBe(userData.lastName);
    expect(user.role).toBe(userData.role);
  });

  test("should hash password before saving", async () => {
    const userData = testUtils.generateUser();
    const user = await User.create(userData);

    expect(user.password).not.toBe(userData.password);
    expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
  });

  test("should validate email format", async () => {
    const userData = testUtils.generateUser({ email: "invalid-email" });

    await expect(User.create(userData)).rejects.toThrow();
  });

  test("should validate required fields", async () => {
    await expect(User.create({})).rejects.toThrow();
  });
});
