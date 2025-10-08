/**
 * Factory para crear decoradores del API Gateway
 * Aplicando principios del Decorator Pattern
 */

const BaseDecorator = require('./BaseDecorator');
const LoggingDecorator = require('./LoggingDecorator');
const MetricsDecorator = require('./MetricsDecorator');
const CachingDecorator = require('./CachingDecorator');
const SecurityDecorator = require('./SecurityDecorator');

class DecoratorFactory {
  /**
   * Crea una cadena de decoradores
   * @param {Object} component - Componente base a decorar
   * @param {Object} options - Opciones de configuración
   * @returns {Object} Componente decorado
   */
  static createDecoratedComponent(component, options = {}) {
    let decoratedComponent = component;

    // Aplicar decoradores en orden específico
    const decorators = options.decorators || [];

    for (const decoratorConfig of decorators) {
      const { type, config = {} } = decoratorConfig;

      switch (type) {
        case 'logging':
          decoratedComponent = new LoggingDecorator(decoratedComponent, config);
          break;

        case 'metrics':
          decoratedComponent = new MetricsDecorator(decoratedComponent, config);
          break;

        case 'caching':
          decoratedComponent = new CachingDecorator(decoratedComponent, config);
          break;

        case 'security':
          decoratedComponent = new SecurityDecorator(
            decoratedComponent,
            config
          );
          break;

        default:
          console.warn(`⚠️ Decorador desconocido: ${type}`);
      }
    }

    return decoratedComponent;
  }

  /**
   * Crea un middleware decorado para Express
   * @param {Function} middleware - Middleware original
   * @param {Object} options - Opciones de configuración
   * @returns {Function} Middleware decorado
   */
  static createDecoratedMiddleware(middleware, options = {}) {
    const decoratedComponent = this.createDecoratedComponent(
      { handle: middleware },
      options
    );

    return (req, res, next) => {
      return decoratedComponent.handle(req, res, next);
    };
  }

  /**
   * Crea un proxy decorado
   * @param {Object} proxyConfig - Configuración del proxy
   * @param {Object} options - Opciones de decoradores
   * @returns {Function} Proxy decorado
   */
  static createDecoratedProxy(proxyConfig, options = {}) {
    const { createProxyMiddleware } = require('http-proxy-middleware');

    const originalProxy = createProxyMiddleware(proxyConfig);

    const decoratedComponent = this.createDecoratedComponent(
      { handle: originalProxy },
      options
    );

    return (req, res, next) => {
      return decoratedComponent.handle(req, res, next);
    };
  }

  /**
   * Obtiene configuración por defecto para diferentes tipos de rutas
   * @param {string} routeType - Tipo de ruta (auth, courses, enrollments, payments)
   * @returns {Object} Configuración de decoradores
   */
  static getDefaultConfig(routeType) {
    const baseConfig = {
      decorators: [
        {
          type: 'logging',
          config: { logLevel: 'info', includeHeaders: false },
        },
        {
          type: 'metrics',
          config: { collectResponseTime: true, collectStatusCode: true },
        },
        { type: 'security', config: { enableRequestValidation: true } },
      ],
    };

    switch (routeType) {
      case 'auth':
        return {
          ...baseConfig,
          decorators: [
            ...baseConfig.decorators,
            { type: 'caching', config: { ttl: 60000, maxSize: 50 } }, // 1 minuto para auth
          ],
        };

      case 'courses':
        return {
          ...baseConfig,
          decorators: [
            ...baseConfig.decorators,
            { type: 'caching', config: { ttl: 300000, maxSize: 100 } }, // 5 minutos para courses
          ],
        };

      case 'enrollments':
        return {
          ...baseConfig,
          decorators: [
            ...baseConfig.decorators,
            { type: 'caching', config: { ttl: 120000, maxSize: 50 } }, // 2 minutos para enrollments
          ],
        };

      case 'payments':
        return {
          ...baseConfig,
          decorators: [
            ...baseConfig.decorators,
            // No cache para payments por seguridad
          ],
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Crea un decorador personalizado
   * @param {string} name - Nombre del decorador
   * @param {Function} decoratorClass - Clase del decorador
   * @param {Object} defaultConfig - Configuración por defecto
   */
  static registerCustomDecorator(name, decoratorClass, defaultConfig = {}) {
    this._customDecorators = this._customDecorators || {};
    this._customDecorators[name] = {
      class: decoratorClass,
      config: defaultConfig,
    };
  }

  /**
   * Obtiene información de todos los decoradores disponibles
   * @returns {Object} Información de decoradores
   */
  static getAvailableDecorators() {
    return {
      builtin: {
        logging: {
          description: 'Logging detallado de requests y responses',
          options: ['logLevel', 'includeHeaders', 'includeBody', 'logResponse'],
        },
        metrics: {
          description: 'Recolección de métricas de performance',
          options: [
            'collectResponseTime',
            'collectStatusCode',
            'collectUserAgent',
            'collectIP',
          ],
        },
        caching: {
          description: 'Cache en memoria para responses',
          options: ['ttl', 'maxSize', 'cacheKeyGenerator', 'shouldCache'],
        },
        security: {
          description: 'Medidas de seguridad adicionales',
          options: [
            'enableCORS',
            'enableHelmet',
            'enableRateLimit',
            'enableRequestValidation',
          ],
        },
      },
      custom: this._customDecorators || {},
    };
  }
}

module.exports = DecoratorFactory;
