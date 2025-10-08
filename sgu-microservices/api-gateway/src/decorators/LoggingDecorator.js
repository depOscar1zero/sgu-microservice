/**
 * Logging Decorator para el API Gateway
 * Aplica logging detallado a las requests
 */

const BaseDecorator = require('./BaseDecorator');

class LoggingDecorator extends BaseDecorator {
  constructor(component, options = {}) {
    super(component);
    this._options = {
      logLevel: options.logLevel || 'info',
      includeHeaders: options.includeHeaders || false,
      includeBody: options.includeBody || false,
      logResponse: options.logResponse || true,
      ...options,
    };
  }

  /**
   * Maneja la request con logging
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  handle(req, res, next) {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || 'unknown';

    // Log de entrada
    this._logRequest(req, requestId);

    // Interceptar la respuesta para logging
    const originalSend = res.send;
    res.send = data => {
      const duration = Date.now() - startTime;
      this._logResponse(req, res, data, duration, requestId);
      return originalSend.call(res, data);
    };

    // Continuar con el siguiente decorador/componente
    return this._component.handle(req, res, next);
  }

  /**
   * Log de la request entrante
   * @param {Object} req - Request object
   * @param {string} requestId - ID de la request
   */
  _logRequest(req, requestId) {
    const logData = {
      type: 'REQUEST',
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
    };

    if (this._options.includeHeaders) {
      logData.headers = req.headers;
    }

    if (
      this._options.includeBody &&
      req.body &&
      Object.keys(req.body).length > 0
    ) {
      logData.body = req.body;
    }

    console.log(`📝 [${requestId}] ${req.method} ${req.url}`, logData);
  }

  /**
   * Log de la response
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {*} data - Datos de respuesta
   * @param {number} duration - Duración en ms
   * @param {string} requestId - ID de la request
   */
  _logResponse(req, res, data, duration, requestId) {
    if (!this._options.logResponse) return;

    const logData = {
      type: 'RESPONSE',
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    // Log level basado en status code
    const logLevel = this._getLogLevel(res.statusCode);

    if (logLevel === 'error') {
      console.error(
        `❌ [${requestId}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`,
        logData
      );
    } else if (logLevel === 'warn') {
      console.warn(
        `⚠️ [${requestId}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`,
        logData
      );
    } else {
      console.log(
        `✅ [${requestId}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`,
        logData
      );
    }
  }

  /**
   * Determina el nivel de log basado en el status code
   * @param {number} statusCode - Status code de la respuesta
   * @returns {string} Nivel de log
   */
  _getLogLevel(statusCode) {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'info';
  }

  /**
   * Obtiene las opciones del decorador
   * @returns {Object} Opciones del decorador
   */
  getOptions() {
    return { ...this._options };
  }
}

module.exports = LoggingDecorator;
