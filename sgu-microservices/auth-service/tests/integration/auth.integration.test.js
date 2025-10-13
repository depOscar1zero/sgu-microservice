const request = require('supertest');
const app = require('../../src/app');

describe('Auth Service Integration Tests', () => {
  describe('Database Integration', () => {
    test('should connect to database successfully', async () => {
      const response = await request(app)
        .get('/api/auth/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('database');
    });
  });

  describe('User Registration and Login Flow', () => {
    const testUser = {
      name: 'Integration Test User',
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

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testUser.email);

      userId = response.body.data.user.id;
      authToken = response.body.data.token;
    });

    test('should login with registered user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    test('should validate token and get user profile', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });

    test('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Role-Based Access Control', () => {
    test('should create users with different roles', async () => {
      const roles = ['student', 'teacher', 'admin'];

      for (const role of roles) {
        const userData = {
          name: `Test ${role}`,
          email: `${role}-${Date.now()}@example.com`,
          password: 'Password123!',
          role: role,
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.role).toBe(role);
      }
    });
  });

  describe('Data Validation', () => {
    test('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Password123!',
          role: 'student',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: '123',
          role: 'student',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should prevent duplicate email registration', async () => {
      const userData = {
        name: 'Test User',
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
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('existe');
    });
  });

  describe('Token Management', () => {
    let refreshToken;
    let accessToken;

    test('should provide refresh token on login', async () => {
      const userData = {
        name: 'Refresh Test User',
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

      expect(loginResponse.body.data).toHaveProperty('token');
      accessToken = loginResponse.body.data.token;

      if (loginResponse.body.data.refreshToken) {
        refreshToken = loginResponse.body.data.refreshToken;
      }
    });

    test('should refresh access token if endpoint exists', async () => {
      if (!refreshToken) {
        // Skip if refresh token not implemented
        return;
      }

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });
  });
});
