/**
 * Security Decorator para el API Gateway
 * Aplica medidas de seguridad adicionales
 */

const BaseDecorator = require('./BaseDecorator');

class SecurityDecorator extends BaseDecorator {
  constructor(component, options = {}) {
    super(component);
    this._options = {
      enableCORS: options.enableCORS !== false,
      enableHelmet: options.enableHelmet !== false,
      enableRateLimit: options.enableRateLimit !== false,
      enableRequestValidation: options.enableRequestValidation !== false,
      maxRequestSize: options.maxRequestSize || '10mb',
      allowedOrigins: options.allowedOrigins || ['http://localhost:3000'],
      ...options,
    };

    // Lista de IPs bloqueadas
    this._blockedIPs = new Set();

    // Patrones de request sospechosos
    this._suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
    ];
  }

  /**
   * Maneja la request con medidas de seguridad
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  handle(req, res, next) {
    // Verificar IP bloqueada
    if (this._isIPBlocked(req)) {
      return this._sendSecurityResponse(res, 403, 'IP bloqueada');
    }

    // Validar request
    if (this._options.enableRequestValidation && !this._isValidRequest(req)) {
      return this._sendSecurityResponse(res, 400, 'Request inválida');
    }

    // Aplicar headers de seguridad
    this._applySecurityHeaders(res);

    // Interceptar la respuesta para logging de seguridad
    const originalSend = res.send;
    res.send = data => {
      this._logSecurityEvent(req, res);
      return originalSend.call(res, data);
    };

    // Continuar con el siguiente decorador/componente
    return this._component.handle(req, res, next);
  }

  /**
   * Verifica si la IP está bloqueada
   * @param {Object} req - Request object
   * @returns {boolean} True si está bloqueada
   */
  _isIPBlocked(req) {
    const ip = req.ip || req.connection.remoteAddress;
    return this._blockedIPs.has(ip);
  }

  /**
   * Valida si la request es válida
   * @param {Object} req - Request object
   * @returns {boolean} True si es válida
   */
  _isValidRequest(req) {
    // Verificar tamaño de request
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSize = this._parseSize(this._options.maxRequestSize);

    if (contentLength > maxSize) {
      console.warn(
        `⚠️ [SECURITY] Request demasiado grande: ${contentLength} bytes`
      );
      return false;
    }

    // Verificar patrones sospechosos en URL
    if (this._containsSuspiciousPattern(req.url)) {
      console.warn(`⚠️ [SECURITY] Patrón sospechoso en URL: ${req.url}`);
      return false;
    }

    // Verificar patrones sospechosos en body
    if (req.body && this._containsSuspiciousPattern(JSON.stringify(req.body))) {
      console.warn(`⚠️ [SECURITY] Patrón sospechoso en body`);
      return false;
    }

    return true;
  }

  /**
   * Verifica si contiene patrones sospechosos
   * @param {string} text - Texto a verificar
   * @returns {boolean} True si contiene patrones sospechosos
   */
  _containsSuspiciousPattern(text) {
    return this._suspiciousPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Aplica headers de seguridad
   * @param {Object} res - Response object
   */
  _applySecurityHeaders(res) {
    if (this._options.enableHelmet) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    if (this._options.enableCORS) {
      res.setHeader(
        'Access-Control-Allow-Origin',
        this._options.allowedOrigins.join(', ')
      );
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      );
    }
  }

  /**
   * Log de eventos de seguridad
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  _logSecurityEvent(req, res) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Log de requests sospechosas
    if (res.statusCode >= 400) {
      console.warn(
        `🔒 [SECURITY] ${req.method} ${req.url} - ${res.statusCode} from ${ip}`,
        {
          userAgent,
          timestamp: new Date().toISOString(),
        }
      );
    }
  }

  /**
   * Envía respuesta de seguridad
   * @param {Object} res - Response object
   * @param {number} statusCode - Status code
   * @param {string} message - Mensaje
   */
  _sendSecurityResponse(res, statusCode, message) {
    res.status(statusCode).json({
      success: false,
      message,
      error: 'SECURITY_VIOLATION',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Convierte tamaño de string a bytes
   * @param {string} size - Tamaño en formato string
   * @returns {number} Tamaño en bytes
   */
  _parseSize(size) {
    const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = size.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/i);

    if (!match) return 10 * 1024 * 1024; // 10MB por defecto

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    return Math.floor(value * units[unit]);
  }

  /**
   * Bloquea una IP
   * @param {string} ip - IP a bloquear
   */
  blockIP(ip) {
    this._blockedIPs.add(ip);
    console.log(`🔒 [SECURITY] IP bloqueada: ${ip}`);
  }

  /**
   * Desbloquea una IP
   * @param {string} ip - IP a desbloquear
   */
  unblockIP(ip) {
    this._blockedIPs.delete(ip);
    console.log(`🔓 [SECURITY] IP desbloqueada: ${ip}`);
  }

  /**
   * Obtiene IPs bloqueadas
   * @returns {Array} Lista de IPs bloqueadas
   */
  getBlockedIPs() {
    return Array.from(this._blockedIPs);
  }

  /**
   * Obtiene las opciones del decorador
   * @returns {Object} Opciones del decorador
   */
  getOptions() {
    return { ...this._options };
  }
}

module.exports = SecurityDecorator;
