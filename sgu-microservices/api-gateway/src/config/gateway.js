// src/config/gateway.js
require('dotenv').config();

const logger = require('../utils/logger');

class GatewayConfig {
  constructor() {
    this.services = {
      auth: {
        url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        prefix: '/api/auth',
        timeout: 5000,
        retries: 3,
      },
      courses: {
        url: process.env.COURSES_SERVICE_URL || 'http://localhost:3002',
        prefix: '/api/courses',
        timeout: 5000,
        retries: 3,
      },
      enrollment: {
        url: process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3003',
        prefix: '/api/enrollments',
        timeout: 5000,
        retries: 3,
      },
      payments: {
        url: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3004',
        prefix: '/api/payments',
        timeout: 10000,
        retries: 3,
      },
      notifications: {
        url: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3005',
        prefix: '/api/notifications',
        timeout: 5000,
        retries: 3,
      },
    };

    this.rateLimits = {
      global: {
        windowMs: 15 * 60 * 1000,
        max: 1000,
        message: 'Demasiadas solicitudes desde esta IP, intenta más tarde',
      },
      auth: {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Demasiados intentos de autenticación, intenta más tarde',
      },
      payments: {
        windowMs: 15 * 60 * 1000,
        max: 50,
        message: 'Demasiadas solicitudes de pago, intenta más tarde',
      },
    };

    this.cors = {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',
        'http://localhost:3005',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-API-Key',
        'X-Request-ID',
      ],
    };

    this.security = {
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
      apiKeyHeader: 'X-API-Key',
      apiKeys: process.env.API_KEYS?.split(',') || [],
    };

    this.monitoring = {
      enabled: process.env.MONITORING_ENABLED === 'true',
      metricsPath: '/metrics',
      healthCheckPath: '/health',
    };

    this.swagger = {
      enabled: process.env.SWAGGER_ENABLED === 'true',
      path: '/api-docs',
      title: 'SGU API Gateway',
      version: '1.0.0',
      description: 'API Gateway para el Sistema de Gestión Universitaria',
    };

    this.cache = {
      enabled: process.env.CACHE_ENABLED === 'true',
      ttl: parseInt(process.env.CACHE_TTL) || 300,
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
      },
    };

    this.loadBalancing = {
      strategy: process.env.LOAD_BALANCING_STRATEGY || 'round-robin',
      healthCheck: {
        enabled: process.env.HEALTH_CHECK_ENABLED === 'true',
        interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
        timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
      },
    };

    this.timeout = {
      request: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
      connection: parseInt(process.env.CONNECTION_TIMEOUT) || 5000,
    };

    this.validateConfig();
  }

  validateConfig() {
    const requiredEnvVars = ['JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );

    if (missingVars.length > 0) {
      logger.error('Missing required environment variables:', {
        missing: missingVars,
      });
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
    }

    logger.info('Gateway configuration validated successfully');
  }

  getServiceConfig(serviceName) {
    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not found in configuration`);
    }
    return service;
  }

  getRateLimit(serviceName) {
    return this.rateLimits[serviceName] || this.rateLimits.global;
  }

  isServiceEnabled(serviceName) {
    return !!this.services[serviceName];
  }

  getServiceHealthCheckUrl(serviceName) {
    const service = this.getServiceConfig(serviceName);
    return `${service.url}/health`;
  }

  getAllServices() {
    return Object.keys(this.services);
  }

  getEnabledServices() {
    return Object.entries(this.services)
      .filter(([name, _config]) => this.isServiceEnabled(name))
      .map(([name, config]) => ({ name, ...config }));
  }
}

module.exports = new GatewayConfig();
