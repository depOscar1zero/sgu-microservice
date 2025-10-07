const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

// Importar configuraciones y middleware
const { services, proxyConfig } = require('./config/services');
const { generalLimiter, authLimiter, registerLimiter, writeLimiter } = require('./middleware/rateLimiter');
const { authenticateToken, requireRole, optionalAuth } = require('./middleware/authMiddleware');
const { getServiceStatus, startHealthMonitoring } = require('./utils/healthChecker');

const app = express();

// Middleware de seguridad
app.use(helmet());

// Configuración CORS más explícita
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman) o desde localhost:3005
    if (!origin || origin === 'http://localhost:3005' || origin === 'http://127.0.0.1:3005') {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
// Proxy para Payments Service (requiere autenticación)
app.use('/api/payments', authenticateToken, createProxyMiddleware({
  target: services.payments.url,
  changeOrigin: true,
  timeout: 30000,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`💳 Proxy: ${req.method} ${req.url} → ${proxyReq.path}`);
    
    // Si hay un body, asegurar que se envía correctamente
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    console.error('Error en proxy payments:', err.message);
    res.status(503).json({
      success: false,
      message: 'Servicio de pagos temporalmente no disponible',
      timestamp: new Date().toISOString()
    });
  }
}));

// Middleware de logging
app.use(morgan('combined'));

// Rate limiting general
app.use(generalLimiter);

// Middleware de parsing (solo para rutas del gateway)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para agregar Request ID
app.use((req, res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || 
    Date.now().toString(36) + Math.random().toString(36).substr(2);
  next();
});

/**
 * Rutas del API Gateway (no proxeadas)
 */

// Health check del gateway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'API Gateway',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Estado de todos los servicios
app.get('/status', async (req, res) => {
  try {
    const status = getServiceStatus();
    const overallStatus = status.summary.unhealthy === 0 ? 'healthy' : 'degraded';
    
    res.status(overallStatus === 'healthy' ? 200 : 503).json({
      status: overallStatus,
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error checking service status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Información del gateway
app.get('/info', (req, res) => {
  res.status(200).json({
    service: 'API Gateway',
    description: 'Punto único de entrada para el Sistema de Gestión Universitaria',
    version: '1.0.0',
    services: Object.keys(services),
    routes: {
      auth: '/api/auth/*',
      courses: '/api/courses/*',
      enrollments: '/api/enrollments/*',
      payments: '/api/payments/*'
    },
    features: [
      'Authentication & Authorization',
      'Rate Limiting',
      'Service Discovery',
      'Health Monitoring',
      'Request Logging'
    ],
    timestamp: new Date().toISOString()
  });
});

/**
 * Configuración de proxies para microservicios
 */

// Proxy para Auth Service con rate limiting específico
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', createProxyMiddleware({
  target: services.auth.url,
  changeOrigin: true,
  timeout: 30000,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxy: ${req.method} ${req.url} → ${proxyReq.path}`);
    
    // Si hay un body, asegurar que se envía correctamente
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Asegurar que los headers CORS se apliquen
    const origin = req.headers.origin;
    if (origin === 'http://localhost:3005' || origin === 'http://127.0.0.1:3005') {
      proxyRes.headers['access-control-allow-origin'] = origin;
      proxyRes.headers['access-control-allow-credentials'] = 'true';
      proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-Requested-With';
    }
  },
  onError: (err, req, res) => {
    console.error('Error en proxy auth:', err.message);
    res.status(503).json({
      success: false,
      message: 'Servicio de autenticación temporalmente no disponible',
      timestamp: new Date().toISOString()
    });
  }
}));

// Proxy para Courses Service
app.use('/api/courses', (req, res, next) => {
  // Permitir GET sin autenticación
  if (req.method === 'GET') {
    return next();
  }
  
  // Requerir autenticación para operaciones de escritura
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return writeLimiter(req, res, () => {
      authenticateToken(req, res, next);
    });
  }
  
  next();
}, createProxyMiddleware({
  target: services.courses.url,
  changeOrigin: true,
  timeout: 30000,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxy: ${req.method} ${req.url} → ${proxyReq.path}`);
    
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    console.error('Error en proxy courses:', err.message);
    res.status(503).json({
      success: false,
      message: 'Servicio de cursos temporalmente no disponible',
      timestamp: new Date().toISOString()
    });
  }
}));

// Proxy para Enrollment Service (requiere autenticación)
app.use('/api/enrollments', authenticateToken, createProxyMiddleware({
  target: services.enrollments.url,
  changeOrigin: true,
  timeout: 30000,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxy: ${req.method} ${req.url} → ${proxyReq.path}`);
    
    // Si hay un body, asegurar que se envía correctamente
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    console.error('Error en proxy enrollment:', err.message);
    res.status(503).json({
      success: false,
      message: 'Servicio de inscripciones temporalmente no disponible',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * Rutas específicas con autenticación
 */

// Ejemplo: Ruta que requiere autenticación específica
app.get('/api/admin/*', authenticateToken, requireRole('admin'), (req, res, next) => {
  // Aquí podrías proxy a un servicio de administración
  res.json({
    message: 'Ruta de administración',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

/**
 * Middleware de manejo de errores
 */
app.use((err, req, res, next) => {
  console.error('Error en Gateway:', err);

  // Error de proxy
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: 'Servicio temporalmente no disponible',
      error: 'SERVICE_UNAVAILABLE',
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString()
    });
  }

  // Error de timeout
  if (err.code === 'ECONNRESET' || err.message.includes('timeout')) {
    return res.status(504).json({
      success: false,
      message: 'Tiempo de espera agotado',
      error: 'GATEWAY_TIMEOUT',
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString()
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    message: 'Error interno del gateway',
    requestId: req.headers['x-request-id'],
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack
    })
  });
});

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    availableRoutes: [
      'GET /health',
      'GET /status', 
      'GET /info',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/profile',
      'GET /api/courses',
      'POST /api/courses',
      'GET /api/courses/:id',
      'POST /api/enrollments',
      'GET /api/enrollments/my',
      'GET /api/enrollments/:id',
      'POST /api/payments',
      'GET /api/payments/my',
      'PUT /api/payments/:id/confirm'
    ],
    requestId: req.headers['x-request-id'],
    timestamp: new Date().toISOString()
  });
});

// Inicializar monitoreo de servicios
startHealthMonitoring();

module.exports = app;