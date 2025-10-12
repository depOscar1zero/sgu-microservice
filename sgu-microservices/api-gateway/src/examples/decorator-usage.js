/**
 * Ejemplo de uso del Decorator Pattern en el API Gateway
 * Demuestra cómo aplicar decoradores a diferentes componentes
 */

const DecoratorFactory = require('../decorators/DecoratorFactory');

/**
 * Ejemplo 1: Decorar un middleware simple
 */
function createDecoratedMiddleware() {
  // Middleware original
  const originalMiddleware = (req, res, next) => {
    console.log('Middleware original ejecutado');
    next();
  };

  // Aplicar decoradores
  const decoratedMiddleware = DecoratorFactory.createDecoratedMiddleware(
    originalMiddleware,
    {
      decorators: [
        { type: 'logging', config: { logLevel: 'info' } },
        { type: 'metrics', config: { collectResponseTime: true } },
        { type: 'security', config: { enableRequestValidation: true } },
      ],
    }
  );

  return decoratedMiddleware;
}

/**
 * Ejemplo 2: Decorar un proxy
 */
function createDecoratedProxy() {
  const proxyConfig = {
    target: 'http://localhost:3001',
    changeOrigin: true,
    timeout: 30000,
  };

  // Aplicar decoradores al proxy
  const decoratedProxy = DecoratorFactory.createDecoratedProxy(proxyConfig, {
    decorators: [
      { type: 'logging', config: { logLevel: 'debug', includeHeaders: true } },
      {
        type: 'metrics',
        config: { collectResponseTime: true, collectStatusCode: true },
      },
      { type: 'caching', config: { ttl: 300000, maxSize: 100 } },
      { type: 'security', config: { enableCORS: true, enableHelmet: true } },
    ],
  });

  return decoratedProxy;
}

/**
 * Ejemplo 3: Usar configuración por defecto para diferentes rutas
 */
function createRouteSpecificDecorators() {
  const routes = {
    auth: DecoratorFactory.getDefaultConfig('auth'),
    courses: DecoratorFactory.getDefaultConfig('courses'),
    enrollments: DecoratorFactory.getDefaultConfig('enrollments'),
    payments: DecoratorFactory.getDefaultConfig('payments'),
  };

  return routes;
}

/**
 * Ejemplo 4: Decorador personalizado
 */
function createCustomDecorator() {
  // Definir decorador personalizado
  class CustomDecorator extends require('../decorators/BaseDecorator') {
    constructor(component, options = {}) {
      super(component);
      this._options = options;
    }

    handle(req, res, next) {
      console.log(`🎯 [CUSTOM] ${req.method} ${req.url}`);
      return this._component.handle(req, res, next);
    }
  }

  // Registrar decorador personalizado
  DecoratorFactory.registerCustomDecorator('custom', CustomDecorator, {
    customOption: 'defaultValue',
  });

  return CustomDecorator;
}

/**
 * Ejemplo 5: Obtener métricas de decoradores
 */
function getDecoratorMetrics() {
  const component = { handle: () => {} };

  const decorated = DecoratorFactory.createDecoratedComponent(component, {
    decorators: [
      { type: 'metrics', config: { collectResponseTime: true } },
      { type: 'caching', config: { ttl: 300000 } },
    ],
  });

  // Simular algunas requests para generar métricas
  const mockReq = { method: 'GET', url: '/test', headers: {} };
  const mockRes = { statusCode: 200, send: () => {} };

  for (let i = 0; i < 5; i++) {
    decorated.handle(mockReq, mockRes, () => {});
    mockRes.send('{"success": true}');
  }

  // Obtener métricas
  const metrics = decorated.getMetrics();
  const cacheStats = decorated.getCacheStats();

  return { metrics, cacheStats };
}

/**
 * Ejemplo 6: Cadena de decoradores
 */
function demonstrateDecoratorChain() {
  const component = { handle: () => {} };

  const decorated = DecoratorFactory.createDecoratedComponent(component, {
    decorators: [
      { type: 'logging', config: {} },
      { type: 'metrics', config: {} },
      { type: 'caching', config: {} },
      { type: 'security', config: {} },
    ],
  });

  const chain = decorated.getDecoratorChain();
  console.log('Cadena de decoradores:', chain);

  return chain;
}

module.exports = {
  createDecoratedMiddleware,
  createDecoratedProxy,
  createRouteSpecificDecorators,
  createCustomDecorator,
  getDecoratorMetrics,
  demonstrateDecoratorChain,
};
