require('dotenv').config();

/**
 * Configuración de microservicios
 */
const services = {
  auth: {
    name: 'Auth Service',
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    routes: ['/api/auth'],
    healthCheck: '/health',
    timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
    retries: 3,
  },

  courses: {
    name: 'Courses Service',
    url: process.env.COURSES_SERVICE_URL || 'http://localhost:3002',
    routes: ['/api/courses'],
    healthCheck: '/health',
    timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
    retries: 3,
  },

  enrollments: {
    name: 'Enrollment Service',
    url: process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3003',
    routes: ['/api/enrollments'],
    healthCheck: '/health',
    timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
    retries: 3,
  },

  payments: {
    name: 'Payments Service',
    url: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3004',
    routes: ['/api/payments'],
    healthCheck: '/health',
    timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
    retries: 3,
  },
};

/**
 * Configuración del proxy
 */
const proxyConfig = {
  timeout: parseInt(process.env.PROXY_TIMEOUT) || 30000,
  changeOrigin: true,
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',

  // Configuración para manejo de errores
  onError: (err, req, res) => {
    console.error('Error en proxy:', err.message);
    res.status(503).json({
      success: false,
      message: 'Servicio temporalmente no disponible',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown',
    });
  },

  // Log de requests
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxy: ${req.method} ${req.url} → ${proxyReq.path}`);

    // Agregar headers útiles
    proxyReq.setHeader('X-Forwarded-For', req.ip);
    proxyReq.setHeader(
      'X-Request-ID',
      req.headers['x-request-id'] || generateRequestId()
    );
  },

  // Log de responses
  onProxyRes: (proxyRes, req, res) => {
    console.log(
      `✅ Response: ${proxyRes.statusCode} para ${req.method} ${req.url}`
    );
  },
};

/**
 * Generar ID único para requests
 */
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = {
  services,
  proxyConfig,
};
