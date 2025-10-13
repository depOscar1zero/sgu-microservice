const request = require('supertest');
const app = require('../../src/app');

describe('Auth Service Integration Tests', () => {
  describe('Health Check', () => {
    test('should check service health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('User Registration and Login Flow', () => {
    const testUser = {
      firstName: 'Integration',
      lastName: 'Test',
      email: `test-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      role: 'student',
    };

    let userId;
    let authToken;

    test('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.message).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email);

      userId = response.body.user.id;
      authToken = response.body.token;
    });

    test('should login with registered user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
    });

    test('should validate token and get user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
    });

    test('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Role-Based Access Control', () => {
    test('should create users with different roles', async () => {
      const roles = ['student', 'admin'];

      for (const role of roles) {
        const userData = {
          firstName: `Test`,
          lastName: role,
          email: `${role}-${Date.now()}@example.com`,
          password: 'Password123!',
          role: role,
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.user.role).toBe(role);
      }
    });
  });

  describe('Data Validation', () => {
    test('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'invalid-email',
          password: 'Password123!',
          role: 'student',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: `test-${Date.now()}@example.com`,
          password: '123',
          role: 'student',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should prevent duplicate email registration', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: `duplicate-${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'student',
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('existe');
    });
  });

  describe('Token Management', () => {
    let refreshToken;
    let accessToken;

    test('should provide token on login', async () => {
      const userData = {
        firstName: 'Refresh',
        lastName: 'Test',
        email: `refresh-${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'student',
      };

      // Register
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.token).toBeDefined();
      accessToken = loginResponse.body.token;

      if (loginResponse.body.refreshToken) {
        refreshToken = loginResponse.body.refreshToken;
      }
    });

    test('should refresh access token if endpoint exists', async () => {
      if (!refreshToken) {
        // Skip if refresh token not implemented
        return;
      }

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      if (response.status === 404) {
        // Endpoint not implemented yet
        return;
      }

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });
  });
});
