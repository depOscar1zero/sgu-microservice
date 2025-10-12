/**
 * Tests para DecoratorFactory
 * Aplicando principios del Decorator Pattern
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const DecoratorFactory = require('../../src/decorators/DecoratorFactory');
const LoggingDecorator = require('../../src/decorators/LoggingDecorator');

describe('DecoratorFactory', () => {
  let mockComponent;

  beforeEach(() => {
    mockComponent = {
      handle: jest.fn(),
    };
  });

  describe('createDecoratedComponent', () => {
    test('debe crear componente sin decoradores', () => {
      const decorated = DecoratorFactory.createDecoratedComponent(
        mockComponent,
        {
          decorators: [],
        }
      );

      expect(decorated).toBe(mockComponent);
    });

    test('debe crear componente con un decorador', () => {
      const decorated = DecoratorFactory.createDecoratedComponent(
        mockComponent,
        {
          decorators: [{ type: 'logging', config: { logLevel: 'debug' } }],
        }
      );

      expect(decorated).toBeInstanceOf(LoggingDecorator);
      expect(decorated.getComponent()).toBe(mockComponent);
    });

    test('debe crear componente con múltiples decoradores', () => {
      const decorated = DecoratorFactory.createDecoratedComponent(
        mockComponent,
        {
          decorators: [
            { type: 'logging', config: { logLevel: 'info' } },
            { type: 'metrics', config: { collectResponseTime: true } },
            { type: 'security', config: { enableRequestValidation: true } },
          ],
        }
      );

      // Verificar cadena de decoradores
      const chain = decorated.getDecoratorChain();
      expect(chain).toContain('SecurityDecorator');
      expect(chain).toContain('MetricsDecorator');
      expect(chain).toContain('LoggingDecorator');
    });

    test('debe manejar decorador desconocido', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const decorated = DecoratorFactory.createDecoratedComponent(
        mockComponent,
        {
          decorators: [{ type: 'unknown', config: {} }],
        }
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ Decorador desconocido: unknown'
      );
      expect(decorated).toBe(mockComponent);

      consoleSpy.mockRestore();
    });
  });

  describe('createDecoratedMiddleware', () => {
    test('debe crear middleware decorado', () => {
      const middleware = jest.fn();
      const decorated = DecoratorFactory.createDecoratedMiddleware(middleware, {
        decorators: [{ type: 'logging', config: {} }],
      });

      expect(typeof decorated).toBe('function');
    });

    test('debe ejecutar middleware decorado', () => {
      const middleware = jest.fn();
      const decorated = DecoratorFactory.createDecoratedMiddleware(middleware, {
        decorators: [{ type: 'logging', config: {} }],
      });

      const req = {
        headers: {},
        get: jest.fn().mockReturnValue('Test Agent'),
        method: 'GET',
        url: '/test',
        ip: '127.0.0.1',
      };
      const res = {};
      const next = jest.fn();

      decorated(req, res, next);

      expect(middleware).toHaveBeenCalledWith(req, res, next);
    });
  });

  describe('getDefaultConfig', () => {
    test('debe retornar configuración para auth', () => {
      const config = DecoratorFactory.getDefaultConfig('auth');

      expect(config.decorators).toContainEqual(
        expect.objectContaining({ type: 'logging' })
      );
      expect(config.decorators).toContainEqual(
        expect.objectContaining({ type: 'caching' })
      );
    });

    test('debe retornar configuración para courses', () => {
      const config = DecoratorFactory.getDefaultConfig('courses');

      expect(config.decorators).toContainEqual(
        expect.objectContaining({ type: 'caching' })
      );
    });

    test('debe retornar configuración para enrollments', () => {
      const config = DecoratorFactory.getDefaultConfig('enrollments');

      expect(config.decorators).toContainEqual(
        expect.objectContaining({ type: 'caching' })
      );
    });

    test('debe retornar configuración para payments', () => {
      const config = DecoratorFactory.getDefaultConfig('payments');

      // Payments no debe tener cache por seguridad
      const cachingDecorator = config.decorators.find(
        d => d.type === 'caching'
      );
      expect(cachingDecorator).toBeUndefined();
    });

    test('debe retornar configuración base para tipo desconocido', () => {
      const config = DecoratorFactory.getDefaultConfig('unknown');

      expect(config.decorators).toContainEqual(
        expect.objectContaining({ type: 'logging' })
      );
      expect(config.decorators).toContainEqual(
        expect.objectContaining({ type: 'metrics' })
      );
      expect(config.decorators).toContainEqual(
        expect.objectContaining({ type: 'security' })
      );
    });
  });

  describe('getAvailableDecorators', () => {
    test('debe retornar decoradores builtin', () => {
      const decorators = DecoratorFactory.getAvailableDecorators();

      expect(decorators.builtin).toHaveProperty('logging');
      expect(decorators.builtin).toHaveProperty('metrics');
      expect(decorators.builtin).toHaveProperty('caching');
      expect(decorators.builtin).toHaveProperty('security');
    });

    test('debe incluir descripción de decoradores', () => {
      const decorators = DecoratorFactory.getAvailableDecorators();

      expect(decorators.builtin.logging.description).toBeDefined();
      expect(decorators.builtin.metrics.description).toBeDefined();
      expect(decorators.builtin.caching.description).toBeDefined();
      expect(decorators.builtin.security.description).toBeDefined();
    });

    test('debe incluir opciones de decoradores', () => {
      const decorators = DecoratorFactory.getAvailableDecorators();

      expect(decorators.builtin.logging.options).toBeInstanceOf(Array);
      expect(decorators.builtin.metrics.options).toBeInstanceOf(Array);
      expect(decorators.builtin.caching.options).toBeInstanceOf(Array);
      expect(decorators.builtin.security.options).toBeInstanceOf(Array);
    });
  });

  describe('Configuraciones específicas', () => {
    test('debe aplicar configuración de logging correctamente', () => {
      const decorated = DecoratorFactory.createDecoratedComponent(
        mockComponent,
        {
          decorators: [
            {
              type: 'logging',
              config: {
                logLevel: 'debug',
                includeHeaders: true,
                includeBody: true,
              },
            },
          ],
        }
      );

      expect(decorated.getOptions()).toEqual(
        expect.objectContaining({
          logLevel: 'debug',
          includeHeaders: true,
          includeBody: true,
        })
      );
    });

    test('debe aplicar configuración de metrics correctamente', () => {
      const decorated = DecoratorFactory.createDecoratedComponent(
        mockComponent,
        {
          decorators: [
            {
              type: 'metrics',
              config: {
                collectResponseTime: true,
                collectStatusCode: true,
                collectUserAgent: true,
                collectIP: true,
              },
            },
          ],
        }
      );

      expect(decorated.getOptions()).toEqual(
        expect.objectContaining({
          collectResponseTime: true,
          collectStatusCode: true,
          collectUserAgent: true,
          collectIP: true,
        })
      );
    });

    test('debe aplicar configuración de caching correctamente', () => {
      const decorated = DecoratorFactory.createDecoratedComponent(
        mockComponent,
        {
          decorators: [
            {
              type: 'caching',
              config: {
                ttl: 60000,
                maxSize: 50,
              },
            },
          ],
        }
      );

      expect(decorated.getOptions()).toEqual(
        expect.objectContaining({
          ttl: 60000,
          maxSize: 50,
        })
      );
    });

    test('debe aplicar configuración de security correctamente', () => {
      const decorated = DecoratorFactory.createDecoratedComponent(
        mockComponent,
        {
          decorators: [
            {
              type: 'security',
              config: {
                enableCORS: true,
                enableHelmet: true,
                enableRequestValidation: true,
              },
            },
          ],
        }
      );

      expect(decorated.getOptions()).toEqual(
        expect.objectContaining({
          enableCORS: true,
          enableHelmet: true,
          enableRequestValidation: true,
        })
      );
    });
  });
});
