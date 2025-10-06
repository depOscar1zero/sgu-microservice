/**
 * Tests para LoggingDecorator
 * Aplicando principios del Decorator Pattern
 */

const { describe, test, expect, beforeEach } = require("@jest/globals");
const LoggingDecorator = require("../../src/decorators/LoggingDecorator");

describe("LoggingDecorator", () => {
  let mockComponent;
  let mockReq;
  let mockRes;
  let mockNext;
  let consoleSpy;

  beforeEach(() => {
    // Mock del componente base
    mockComponent = {
      handle: jest.fn(),
    };

    // Mock de request
    mockReq = {
      method: "GET",
      url: "/api/test",
      headers: {
        "x-request-id": "test-123",
        "User-Agent": "Test Agent",
      },
      ip: "127.0.0.1",
      body: { test: "data" },
      get: jest.fn().mockReturnValue("Test Agent"),
    };

    // Mock de response
    mockRes = {
      statusCode: 200,
      send: jest.fn(),
      get: jest.fn(),
    };

    // Mock de next
    mockNext = jest.fn();

    // Spy de console
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("Creación del decorador", () => {
    test("debe crear un decorador con opciones por defecto", () => {
      const decorator = new LoggingDecorator(mockComponent);

      expect(decorator.getComponent()).toBe(mockComponent);
      expect(decorator.getName()).toBe("LoggingDecorator");
    });

    test("debe crear un decorador con opciones personalizadas", () => {
      const options = {
        logLevel: "debug",
        includeHeaders: true,
        includeBody: true,
      };

      const decorator = new LoggingDecorator(mockComponent, options);

      expect(decorator.getOptions()).toEqual(expect.objectContaining(options));
    });

    test("debe lanzar error si no se proporciona componente", () => {
      expect(() => {
        new LoggingDecorator();
      }).toThrow("BaseDecorator requires a component to decorate");
    });
  });

  describe("Manejo de requests", () => {
    test("debe loggear request y response correctamente", () => {
      const decorator = new LoggingDecorator(mockComponent);

      decorator.handle(mockReq, mockRes, mockNext);

      // Verificar que se llamó al componente
      expect(mockComponent.handle).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        mockNext
      );

      // Verificar que se loggeó la request
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("📝 [test-123] GET /api/test"),
        expect.objectContaining({
          type: "REQUEST",
          requestId: "test-123",
          method: "GET",
          url: "/api/test",
        })
      );
    });

    test("debe incluir headers cuando está habilitado", () => {
      const options = { includeHeaders: true };
      const decorator = new LoggingDecorator(mockComponent, options);

      decorator.handle(mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: mockReq.headers,
        })
      );
    });

    test("debe incluir body cuando está habilitado", () => {
      const options = { includeBody: true };
      const decorator = new LoggingDecorator(mockComponent, options);

      decorator.handle(mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: mockReq.body,
        })
      );
    });

    test("debe loggear response con duración", () => {
      const decorator = new LoggingDecorator(mockComponent);

      decorator.handle(mockReq, mockRes, mockNext);

      // Simular envío de respuesta
      mockRes.send('{"success": true}');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("✅ [test-123] GET /api/test - 200"),
        expect.objectContaining({
          type: "RESPONSE",
          statusCode: 200,
          duration: expect.stringMatching(/\d+ms/),
        })
      );
    });
  });

  describe("Niveles de log", () => {
    test("debe usar nivel info para status 200", () => {
      const decorator = new LoggingDecorator(mockComponent);

      decorator.handle(mockReq, mockRes, mockNext);
      mockRes.send('{"success": true}');

      // Verificar que se llamó console.log con el mensaje de respuesta
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("✅ [test-123]"),
        expect.any(Object)
      );
    });

    test("debe usar nivel warn para status 400", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const decorator = new LoggingDecorator(mockComponent);
      mockRes.statusCode = 400;

      decorator.handle(mockReq, mockRes, mockNext);
      mockRes.send('{"error": "Bad Request"}');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ [test-123]"),
        expect.any(Object)
      );

      consoleWarnSpy.mockRestore();
    });

    test("debe usar nivel error para status 500", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const decorator = new LoggingDecorator(mockComponent);
      mockRes.statusCode = 500;

      decorator.handle(mockReq, mockRes, mockNext);
      mockRes.send('{"error": "Internal Server Error"}');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("❌ [test-123]"),
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Cadena de decoradores", () => {
    test("debe retornar cadena de decoradores", () => {
      const decorator = new LoggingDecorator(mockComponent);
      const chain = decorator.getDecoratorChain();

      expect(chain).toEqual(["LoggingDecorator"]);
    });

    test("debe verificar si tiene componente específico", () => {
      const decorator = new LoggingDecorator(mockComponent);

      expect(decorator.hasComponent("MockComponent")).toBe(false);
      expect(decorator.hasComponent("MockComponent")).toBe(false);
    });
  });

  describe("Opciones del decorador", () => {
    test("debe retornar opciones configuradas", () => {
      const options = {
        logLevel: "debug",
        includeHeaders: true,
        includeBody: false,
        logResponse: true,
      };

      const decorator = new LoggingDecorator(mockComponent, options);
      const returnedOptions = decorator.getOptions();

      expect(returnedOptions).toEqual(expect.objectContaining(options));
    });

    test("debe usar opciones por defecto", () => {
      const decorator = new LoggingDecorator(mockComponent);
      const options = decorator.getOptions();

      expect(options.logLevel).toBe("info");
      expect(options.includeHeaders).toBe(false);
      expect(options.includeBody).toBe(false);
      expect(options.logResponse).toBe(true);
    });
  });
});
