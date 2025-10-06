/**
 * Metrics Decorator para el API Gateway
 * Recolecta métricas de performance y uso
 */

const BaseDecorator = require("./BaseDecorator");

class MetricsDecorator extends BaseDecorator {
  constructor(component, options = {}) {
    super(component);
    this._options = {
      collectResponseTime: options.collectResponseTime !== false,
      collectStatusCode: options.collectStatusCode !== false,
      collectUserAgent: options.collectUserAgent || false,
      collectIP: options.collectIP || false,
      ...options,
    };

    // Métricas en memoria (en producción usar Redis o similar)
    this._metrics = {
      requests: 0,
      errors: 0,
      responseTimes: [],
      statusCodes: {},
      userAgents: {},
      ips: {},
      lastReset: Date.now(),
    };
  }

  /**
   * Maneja la request con recolección de métricas
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  handle(req, res, next) {
    const startTime = Date.now();
    const requestId = req.headers["x-request-id"] || "unknown";

    // Incrementar contador de requests
    this._metrics.requests++;

    // Interceptar la respuesta para métricas
    const originalSend = res.send;
    res.send = (data) => {
      const duration = Date.now() - startTime;
      this._collectMetrics(req, res, duration, requestId);
      return originalSend.call(res, data);
    };

    // Continuar con el siguiente decorador/componente
    return this._component.handle(req, res, next);
  }

  /**
   * Recolecta métricas de la request/response
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {number} duration - Duración en ms
   * @param {string} requestId - ID de la request
   */
  _collectMetrics(req, res, duration, requestId) {
    // Métricas de tiempo de respuesta
    if (this._options.collectResponseTime) {
      this._metrics.responseTimes.push(duration);

      // Mantener solo los últimos 1000 tiempos
      if (this._metrics.responseTimes.length > 1000) {
        this._metrics.responseTimes = this._metrics.responseTimes.slice(-1000);
      }
    }

    // Métricas de status code
    if (this._options.collectStatusCode) {
      const statusCode = res.statusCode;
      this._metrics.statusCodes[statusCode] =
        (this._metrics.statusCodes[statusCode] || 0) + 1;

      // Contar errores
      if (statusCode >= 400) {
        this._metrics.errors++;
      }
    }

    // Métricas de User Agent
    if (this._options.collectUserAgent) {
      const userAgent = req.get("User-Agent") || "unknown";
      this._metrics.userAgents[userAgent] =
        (this._metrics.userAgents[userAgent] || 0) + 1;
    }

    // Métricas de IP
    if (this._options.collectIP) {
      const ip = req.ip || req.connection.remoteAddress || "unknown";
      this._metrics.ips[ip] = (this._metrics.ips[ip] || 0) + 1;
    }
  }

  /**
   * Obtiene las métricas actuales
   * @returns {Object} Métricas recolectadas
   */
  getMetrics() {
    const responseTimes = this._metrics.responseTimes;
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const minResponseTime =
      responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime =
      responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

    return {
      summary: {
        totalRequests: this._metrics.requests,
        totalErrors: this._metrics.errors,
        errorRate:
          this._metrics.requests > 0
            ? ((this._metrics.errors / this._metrics.requests) * 100).toFixed(
                2
              ) + "%"
            : "0%",
        averageResponseTime: Math.round(avgResponseTime) + "ms",
        minResponseTime: minResponseTime + "ms",
        maxResponseTime: maxResponseTime + "ms",
        uptime: Date.now() - this._metrics.lastReset,
      },
      statusCodes: { ...this._metrics.statusCodes },
      userAgents: this._options.collectUserAgent
        ? { ...this._metrics.userAgents }
        : null,
      ips: this._options.collectIP ? { ...this._metrics.ips } : null,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Resetea las métricas
   */
  resetMetrics() {
    this._metrics = {
      requests: 0,
      errors: 0,
      responseTimes: [],
      statusCodes: {},
      userAgents: {},
      ips: {},
      lastReset: Date.now(),
    };
  }

  /**
   * Obtiene las opciones del decorador
   * @returns {Object} Opciones del decorador
   */
  getOptions() {
    return { ...this._options };
  }
}

module.exports = MetricsDecorator;
