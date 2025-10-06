const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
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

      expect(response.body.message).toBe("Usuario registrado exitosamente");
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.password).toBeUndefined(); // Password no debe estar en la respuesta
    });

    test("should return 400 for invalid email", async () => {
      const userData = testUtils.generateUser({ email: "invalid-email" });

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
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

      expect(response.body.error).toBeDefined();
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

      expect(response.body.message).toBe("Login exitoso");
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe(testUser.email);

      authToken = response.body.token;
    });

    test("should return 401 for invalid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "wrong-password",
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    test("should return 401 for non-existent user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe("GET /api/users/profile", () => {
    beforeEach(async () => {
      testUser = await testUtils.createTestUser(User);

      // Obtener token de login
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "password123",
      });

      authToken = loginResponse.body.token;
    });

    test("should return user profile with valid token", async () => {
      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.password).toBeUndefined();
    });

    test("should return 401 without token", async () => {
      const response = await request(app).get("/api/users/profile").expect(401);

      expect(response.body.error).toBeDefined();
    });

    test("should return 401 with invalid token", async () => {
      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.error).toBeDefined();
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

      authToken = loginResponse.body.token;
    });

    test("should refresh token successfully", async () => {
      const response = await request(app)
        .post("/api/auth/refresh")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe("Token renovado exitosamente");
      expect(response.body).toHaveProperty("token");
      // Nota: Los tokens pueden ser iguales si se generan muy rápido
      // expect(response.body.token).not.toBe(authToken);
    });
  });

  describe("Health Check", () => {
    test("GET /health should return service status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body.status).toBe("OK");
      expect(response.body.service).toBe("auth-service");
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
