const prometheus = require("prom-client");
const logger = require("../utils/logger");
const gatewayConfig = require("../config/gateway");

class MetricsService {
  constructor() {
    this.registry = new prometheus.Registry();
    this.initializeMetrics();
  }

  initializeMetrics() {
    // Métricas de requests HTTP
    this.httpRequestsTotal = new prometheus.Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status_code", "service"],
      registers: [this.registry],
    });

    this.httpRequestDuration = new prometheus.Histogram({
      name: "http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "route", "service"],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.registry],
    });

    this.httpRequestSize = new prometheus.Histogram({
      name: "http_request_size_bytes",
      help: "Size of HTTP requests in bytes",
      labelNames: ["method", "route", "service"],
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [this.registry],
    });

    this.httpResponseSize = new prometheus.Histogram({
      name: "http_response_size_bytes",
      help: "Size of HTTP responses in bytes",
      labelNames: ["method", "route", "service"],
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [this.registry],
    });

    // Métricas de servicios
    this.serviceHealth = new prometheus.Gauge({
      name: "service_health",
      help: "Health status of services (1 = healthy, 0 = unhealthy)",
      labelNames: ["service", "endpoint"],
      registers: [this.registry],
    });

    this.serviceResponseTime = new prometheus.Histogram({
      name: "service_response_time_seconds",
      help: "Response time of services in seconds",
      labelNames: ["service", "endpoint"],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.registry],
    });

    this.serviceErrors = new prometheus.Counter({
      name: "service_errors_total",
      help: "Total number of service errors",
      labelNames: ["service", "error_type"],
      registers: [this.registry],
    });

    // Métricas de autenticación
    this.authAttempts = new prometheus.Counter({
      name: "auth_attempts_total",
      help: "Total number of authentication attempts",
      labelNames: ["result", "method"],
      registers: [this.registry],
    });

    this.authFailures = new prometheus.Counter({
      name: "auth_failures_total",
      help: "Total number of authentication failures",
      labelNames: ["reason"],
      registers: [this.registry],
    });

    // Métricas de rate limiting
    this.rateLimitHits = new prometheus.Counter({
      name: "rate_limit_hits_total",
      help: "Total number of rate limit hits",
      labelNames: ["limiter", "key"],
      registers: [this.registry],
    });

    this.rateLimitRejections = new prometheus.Counter({
      name: "rate_limit_rejections_total",
      help: "Total number of rate limit rejections",
      labelNames: ["limiter", "key"],
      registers: [this.registry],
    });

    // Métricas de circuit breaker
    this.circuitBreakerState = new prometheus.Gauge({
      name: "circuit_breaker_state",
      help: "State of circuit breakers (0 = closed, 1 = open, 2 = half-open)",
      labelNames: ["service"],
      registers: [this.registry],
    });

    this.circuitBreakerFailures = new prometheus.Counter({
      name: "circuit_breaker_failures_total",
      help: "Total number of circuit breaker failures",
      labelNames: ["service"],
      registers: [this.registry],
    });

    // Métricas de cache
    this.cacheHits = new prometheus.Counter({
      name: "cache_hits_total",
      help: "Total number of cache hits",
      labelNames: ["cache_type"],
      registers: [this.registry],
    });

    this.cacheMisses = new prometheus.Counter({
      name: "cache_misses_total",
      help: "Total number of cache misses",
      labelNames: ["cache_type"],
      registers: [this.registry],
    });

    // Métricas del sistema
    this.activeConnections = new prometheus.Gauge({
      name: "active_connections",
      help: "Number of active connections",
      registers: [this.registry],
    });

    this.memoryUsage = new prometheus.Gauge({
      name: "memory_usage_bytes",
      help: "Memory usage in bytes",
      labelNames: ["type"],
      registers: [this.registry],
    });

    this.cpuUsage = new prometheus.Gauge({
      name: "cpu_usage_percent",
      help: "CPU usage percentage",
      registers: [this.registry],
    });

    // Registrar métricas del sistema
    this.registerSystemMetrics();
  }

  registerSystemMetrics() {
    // Actualizar métricas del sistema cada 30 segundos
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.memoryUsage.set({ type: "rss" }, memUsage.rss);
      this.memoryUsage.set({ type: "heapTotal" }, memUsage.heapTotal);
      this.memoryUsage.set({ type: "heapUsed" }, memUsage.heapUsed);
      this.memoryUsage.set({ type: "external" }, memUsage.external);

      // CPU usage (aproximado)
      const cpuUsage = process.cpuUsage();
      this.cpuUsage.set(cpuUsage.user + cpuUsage.system);
    }, 30000);
  }

  // Registrar request HTTP
  recordHttpRequest(
    method,
    route,
    statusCode,
    service,
    duration,
    requestSize,
    responseSize
  ) {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
      service,
    });

    this.httpRequestDuration.observe(
      { method, route, service },
      duration / 1000
    );

    if (requestSize) {
      this.httpRequestSize.observe({ method, route, service }, requestSize);
    }

    if (responseSize) {
      this.httpResponseSize.observe({ method, route, service }, responseSize);
    }
  }

  // Registrar salud de servicio
  recordServiceHealth(service, endpoint, healthy) {
    this.serviceHealth.set({ service, endpoint }, healthy ? 1 : 0);
  }

  // Registrar tiempo de respuesta de servicio
  recordServiceResponseTime(service, endpoint, duration) {
    this.serviceResponseTime.observe({ service, endpoint }, duration / 1000);
  }

  // Registrar error de servicio
  recordServiceError(service, errorType) {
    this.serviceErrors.inc({
      service,
      error_type: errorType,
    });
  }

  // Registrar intento de autenticación
  recordAuthAttempt(result, method) {
    this.authAttempts.inc({
      result,
      method,
    });
  }

  // Registrar fallo de autenticación
  recordAuthFailure(reason) {
    this.authFailures.inc({
      reason,
    });
  }

  // Registrar hit de rate limit
  recordRateLimitHit(limiter, key) {
    this.rateLimitHits.inc({
      limiter,
      key,
    });
  }

  // Registrar rechazo de rate limit
  recordRateLimitRejection(limiter, key) {
    this.rateLimitRejections.inc({
      limiter,
      key,
    });
  }

  // Registrar estado de circuit breaker
  recordCircuitBreakerState(service, state) {
    this.circuitBreakerState.set(
      { service },
      state === "closed" ? 0 : state === "open" ? 1 : 2
    );
  }

  // Registrar fallo de circuit breaker
  recordCircuitBreakerFailure(service) {
    this.circuitBreakerFailures.inc({
      service,
    });
  }

  // Registrar hit de cache
  recordCacheHit(cacheType) {
    this.cacheHits.inc({
      cache_type: cacheType,
    });
  }

  // Registrar miss de cache
  recordCacheMiss(cacheType) {
    this.cacheMisses.inc({
      cache_type: cacheType,
    });
  }

  // Registrar conexión activa
  recordActiveConnection() {
    this.activeConnections.inc();
  }

  // Registrar desconexión
  recordDisconnection() {
    this.activeConnections.dec();
  }

  // Obtener métricas en formato Prometheus
  async getMetrics() {
    return this.registry.metrics();
  }

  // Obtener métricas en formato JSON
  async getMetricsJSON() {
    return this.registry.getMetricsAsJSON();
  }

  // Limpiar métricas
  clearMetrics() {
    this.registry.clear();
    logger.info("Metrics cleared");
  }

  // Obtener estadísticas de métricas
  async getMetricsStats() {
    const metrics = await this.getMetricsJSON();
    const stats = {
      totalMetrics: metrics.length,
      metrics: metrics.map((metric) => ({
        name: metric.name,
        help: metric.help,
        type: metric.type,
        values: metric.values?.length || 0,
      })),
    };

    return stats;
  }

  // Middleware para registrar métricas automáticamente
  metricsMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage();

      // Registrar conexión
      this.recordActiveConnection();

      // Interceptar response
      const originalSend = res.send;
      res.send = function (data) {
        const duration = Date.now() - startTime;
        const service = req.route?.path?.split("/")[2] || "unknown";
        const route = req.route?.path || req.path;
        const method = req.method;

        // Registrar métricas
        this.recordHttpRequest(
          method,
          route,
          res.statusCode,
          service,
          duration,
          req.get("content-length") ? parseInt(req.get("content-length")) : 0,
          data ? Buffer.byteLength(data) : 0
        );

        // Registrar desconexión
        this.recordDisconnection();

        return originalSend.call(this, data);
      }.bind(this);

      next();
    };
  }
}

module.exports = new MetricsService();
