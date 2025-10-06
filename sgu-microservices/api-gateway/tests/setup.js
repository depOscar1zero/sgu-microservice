/**
 * Setup para tests del API Gateway
 */

// Configurar variables de entorno para tests
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.CORS_ORIGIN = "http://localhost:3000";
