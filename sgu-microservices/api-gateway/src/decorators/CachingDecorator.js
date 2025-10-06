/**
 * Caching Decorator para el API Gateway
 * Implementa cache en memoria para responses
 */

const BaseDecorator = require("./BaseDecorator");

class CachingDecorator extends BaseDecorator {
  constructor(component, options = {}) {
    super(component);
    this._options = {
      ttl: options.ttl || 300000, // 5 minutos por defecto
      maxSize: options.maxSize || 100, // Máximo 100 entradas
      cacheKeyGenerator:
        options.cacheKeyGenerator || this._defaultCacheKeyGenerator,
      shouldCache: options.shouldCache || this._defaultShouldCache,
      ...options,
    };

    // Cache en memoria (en producción usar Redis)
    this._cache = new Map();
    this._cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
    };
  }

  /**
   * Maneja la request con cache
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  handle(req, res, next) {
    // Verificar si debe cachear
    if (!this._options.shouldCache(req)) {
      return this._component.handle(req, res, next);
    }

    const cacheKey = this._options.cacheKeyGenerator(req);
    const cachedResponse = this._getFromCache(cacheKey);

    if (cachedResponse) {
      this._cacheStats.hits++;
      this._cacheStats.totalRequests++;

      console.log(`💾 [CACHE HIT] ${req.method} ${req.url} - Key: ${cacheKey}`);

      // Enviar respuesta desde cache
      res.status(cachedResponse.statusCode).json(cachedResponse.data);
      return;
    }

    this._cacheStats.misses++;
    this._cacheStats.totalRequests++;

    // Interceptar la respuesta para cachear
    const originalSend = res.send;
    res.send = (data) => {
      // Solo cachear si es exitoso
      if (res.statusCode >= 200 && res.statusCode < 300) {
        this._setCache(cacheKey, {
          data: JSON.parse(data),
          statusCode: res.statusCode,
          timestamp: Date.now(),
        });

        console.log(
          `💾 [CACHE SET] ${req.method} ${req.url} - Key: ${cacheKey}`
        );
      }

      return originalSend.call(res, data);
    };

    // Continuar con el siguiente decorador/componente
    return this._component.handle(req, res, next);
  }

  /**
   * Obtiene un valor del cache
   * @param {string} key - Clave del cache
   * @returns {Object|null} Valor cacheado o null
   */
  _getFromCache(key) {
    const cached = this._cache.get(key);

    if (!cached) {
      return null;
    }

    // Verificar TTL
    if (Date.now() - cached.timestamp > this._options.ttl) {
      this._cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Establece un valor en el cache
   * @param {string} key - Clave del cache
   * @param {Object} value - Valor a cachear
   */
  _setCache(key, value) {
    // Verificar tamaño máximo
    if (this._cache.size >= this._options.maxSize) {
      // Eliminar la entrada más antigua
      const oldestKey = this._cache.keys().next().value;
      this._cache.delete(oldestKey);
      this._cacheStats.evictions++;
    }

    this._cache.set(key, value);
  }

  /**
   * Generador de clave de cache por defecto
   * @param {Object} req - Request object
   * @returns {string} Clave de cache
   */
  _defaultCacheKeyGenerator(req) {
    const method = req.method;
    const url = req.url;
    const query = req.query ? JSON.stringify(req.query) : "";
    const user = req.user ? req.user.id : "anonymous";

    return `${method}:${url}:${query}:${user}`;
  }

  /**
   * Verifica si debe cachear la request
   * @param {Object} req - Request object
   * @returns {boolean} True si debe cachear
   */
  _defaultShouldCache(req) {
    // Solo cachear GET requests
    return req.method === "GET";
  }

  /**
   * Obtiene estadísticas del cache
   * @returns {Object} Estadísticas del cache
   */
  getCacheStats() {
    const hitRate =
      this._cacheStats.totalRequests > 0
        ? (
            (this._cacheStats.hits / this._cacheStats.totalRequests) *
            100
          ).toFixed(2) + "%"
        : "0%";

    return {
      size: this._cache.size,
      maxSize: this._options.maxSize,
      ttl: this._options.ttl,
      hits: this._cacheStats.hits,
      misses: this._cacheStats.misses,
      evictions: this._cacheStats.evictions,
      hitRate,
      totalRequests: this._cacheStats.totalRequests,
    };
  }

  /**
   * Limpia el cache
   */
  clearCache() {
    this._cache.clear();
    this._cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
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

module.exports = CachingDecorator;
