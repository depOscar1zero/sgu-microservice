/**
 * Tests para MetricsDecorator
 * Aplicando principios del Decorator Pattern
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const MetricsDecorator = require('../../src/decorators/MetricsDecorator');

describe('MetricsDecorator', () => {
  let mockComponent;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Mock del componente base
    mockComponent = {
      handle: jest.fn(),
    };

    // Mock de request
    mockReq = {
      method: 'GET',
      url: '/api/test',
      headers: {
        'x-request-id': 'test-123',
        'User-Agent': 'Test Agent',
      },
      ip: '127.0.0.1',
      body: { test: 'data' },
      get: jest.fn().mockReturnValue('Test Agent'),
    };

    // Mock de response
    mockRes = {
      statusCode: 200,
      send: jest.fn(),
    };

    // Mock de next
    mockNext = jest.fn();
  });

  describe('Creación del decorador', () => {
    test('debe crear un decorador con opciones por defecto', () => {
      const decorator = new MetricsDecorator(mockComponent);

      expect(decorator.getComponent()).toBe(mockComponent);
      expect(decorator.getName()).toBe('MetricsDecorator');
    });

    test('debe crear un decorador con opciones personalizadas', () => {
      const options = {
        collectResponseTime: true,
        collectStatusCode: true,
        collectUserAgent: true,
        collectIP: true,
      };

      const decorator = new MetricsDecorator(mockComponent, options);

      expect(decorator.getOptions()).toEqual(expect.objectContaining(options));
    });
  });

  describe('Recolección de métricas', () => {
    test('debe recolectar métricas básicas', () => {
      const decorator = new MetricsDecorator(mockComponent);

      decorator.handle(mockReq, mockRes, mockNext);
      mockRes.send('{"success": true}');

      const metrics = decorator.getMetrics();

      expect(metrics.summary.totalRequests).toBe(1);
      expect(metrics.summary.totalErrors).toBe(0);
      expect(metrics.summary.errorRate).toBe('0.00%');
      expect(metrics.statusCodes[200]).toBe(1);
    });

    test('debe recolectar tiempo de respuesta', () => {
      const decorator = new MetricsDecorator(mockComponent);

      decorator.handle(mockReq, mockRes, mockNext);
      mockRes.send('{"success": true}');

      const metrics = decorator.getMetrics();

      expect(metrics.summary.averageResponseTime).toMatch(/\d+ms/);
      expect(metrics.summary.minResponseTime).toMatch(/\d+ms/);
      expect(metrics.summary.maxResponseTime).toMatch(/\d+ms/);
    });

    test('debe contar errores correctamente', () => {
      const decorator = new MetricsDecorator(mockComponent);

      // Request con error
      mockRes.statusCode = 500;
      decorator.handle(mockReq, mockRes, mockNext);
      mockRes.send('{"error": "Internal Server Error"}');

      const metrics = decorator.getMetrics();

      expect(metrics.summary.totalRequests).toBe(1);
      expect(metrics.summary.totalErrors).toBe(1);
      expect(metrics.summary.errorRate).toBe('100.00%');
      expect(metrics.statusCodes[500]).toBe(1);
    });

    test('debe recolectar User Agents cuando está habilitado', () => {
      const options = { collectUserAgent: true };
      const decorator = new MetricsDecorator(mockComponent, options);

      decorator.handle(mockReq, mockRes, mockNext);
      mockRes.send('{"success": true}');

      const metrics = decorator.getMetrics();

      expect(metrics.userAgents).toBeDefined();
      expect(metrics.userAgents['Test Agent']).toBe(1);
    });

    test('debe recolectar IPs cuando está habilitado', () => {
      const options = { collectIP: true };
      const decorator = new MetricsDecorator(mockComponent, options);

      decorator.handle(mockReq, mockRes, mockNext);
      mockRes.send('{"success": true}');

      const metrics = decorator.getMetrics();

      expect(metrics.ips).toBeDefined();
      expect(metrics.ips['127.0.0.1']).toBe(1);
    });
  });

  describe('Gestión de métricas', () => {
    test('debe resetear métricas', () => {
      const decorator = new MetricsDecorator(mockComponent);

      // Agregar algunas métricas
      decorator.handle(mockReq, mockRes, mockNext);
      mockRes.send('{"success": true}');

      expect(decorator.getMetrics().summary.totalRequests).toBe(1);

      // Resetear
      decorator.resetMetrics();

      const metrics = decorator.getMetrics();
      expect(metrics.summary.totalRequests).toBe(0);
      expect(metrics.summary.totalErrors).toBe(0);
      expect(metrics.summary.errorRate).toBe('0%');
    });

    test('debe mantener límite de response times', () => {
      const decorator = new MetricsDecorator(mockComponent);

      // Simular muchas requests
      for (let i = 0; i < 1001; i++) {
        decorator.handle(mockReq, mockRes, mockNext);
        mockRes.send('{"success": true}');
      }

      const metrics = decorator.getMetrics();
      expect(metrics.summary.totalRequests).toBe(1001);
      // Debe mantener solo los últimos 1000 tiempos
      expect(decorator._metrics.responseTimes.length).toBe(1000);
    });
  });

  describe('Cálculo de estadísticas', () => {
    test('debe calcular promedio de tiempo de respuesta', () => {
      const decorator = new MetricsDecorator(mockComponent);

      // Simular requests con diferentes tiempos
      for (let i = 0; i < 5; i++) {
        decorator.handle(mockReq, mockRes, mockNext);
        mockRes.send('{"success": true}');
      }

      const metrics = decorator.getMetrics();
      expect(metrics.summary.averageResponseTime).toMatch(/\d+ms/);
      expect(metrics.summary.minResponseTime).toMatch(/\d+ms/);
      expect(metrics.summary.maxResponseTime).toMatch(/\d+ms/);
    });

    test('debe calcular tasa de error correctamente', () => {
      // Crear un nuevo decorador completamente aislado
      const isolatedComponent = { handle: jest.fn() };
      const decorator = new MetricsDecorator(isolatedComponent);

      // Solo 1 request con error
      mockRes.statusCode = 400;
      decorator.handle(mockReq, mockRes, mockNext);
      mockRes.send('{"error": "Bad Request"}');

      const metrics = decorator.getMetrics();
      expect(metrics.summary.totalRequests).toBe(1);
      expect(metrics.summary.totalErrors).toBe(1);
      expect(metrics.summary.errorRate).toBe('100.00%');
    });
  });

  describe('Opciones del decorador', () => {
    test('debe retornar opciones configuradas', () => {
      const options = {
        collectResponseTime: false,
        collectStatusCode: true,
        collectUserAgent: true,
        collectIP: false,
      };

      const decorator = new MetricsDecorator(mockComponent, options);
      const returnedOptions = decorator.getOptions();

      expect(returnedOptions).toEqual(expect.objectContaining(options));
    });

    test('debe usar opciones por defecto', () => {
      const decorator = new MetricsDecorator(mockComponent);
      const options = decorator.getOptions();

      expect(options.collectResponseTime).toBe(true);
      expect(options.collectStatusCode).toBe(true);
      expect(options.collectUserAgent).toBe(false);
      expect(options.collectIP).toBe(false);
    });
  });
});
