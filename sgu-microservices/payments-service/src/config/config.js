require("dotenv").config();

/**
 * Configuración del Payments Service
 */
const config = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3004,
    env: process.env.NODE_ENV || "development",
    host: process.env.HOST || "localhost",
  },

  // Configuración de base de datos
  database: {
    type: process.env.NODE_ENV === "development" ? "sqlite" : "postgresql",
    storage: process.env.DB_STORAGE || "./payments.sqlite",
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || "localhost",
    port:
      process.env.DB_PORT ||
      (process.env.NODE_ENV === "development" ? null : 5432),
    name: process.env.DB_NAME || "sgu_payments",
    user: process.env.DB_USER || "sgu_user",
    password: process.env.DB_PASSWORD || "sgu_password",
    ssl: process.env.DB_SSL === "true",
  },

  // Configuración de servicios externos
  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
      timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
    },
    enrollment: {
      url: process.env.ENROLLMENT_SERVICE_URL || "http://localhost:3003",
      timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
    },
    notifications: {
      url: process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:3005",
      timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
    },
  },

  // Configuración de Stripe
  stripe: {
    secretKey:
      process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_development",
    publishableKey:
      process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_dummy_key_for_development",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    apiVersion: "2023-10-16",
    currency: process.env.DEFAULT_CURRENCY || "USD",
    country: process.env.STRIPE_COUNTRY || "US",
  },

  // Configuración de pagos
  payments: {
    maxAmount: parseFloat(process.env.MAX_PAYMENT_AMOUNT) || 10000,
    minAmount: parseFloat(process.env.MIN_PAYMENT_AMOUNT) || 0.01,
    defaultCurrency: process.env.DEFAULT_CURRENCY || "USD",
    supportedCurrencies: ["USD", "MXN", "EUR"],
    supportedMethods: [
      "credit_card",
      "debit_card",
      "bank_transfer",
      "cash",
      "stripe",
    ],
    timeout: parseInt(process.env.PAYMENT_TIMEOUT) || 30000, // 30 segundos
    retryAttempts: parseInt(process.env.PAYMENT_RETRY_ATTEMPTS) || 3,
  },

  // Configuración de seguridad
  security: {
    jwtSecret: process.env.JWT_SECRET || "fallback-secret-key",
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutos
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    },
    cors: {
      origins: process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:3000",
      ],
      credentials: true,
    },
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === "true",
    logDirectory: process.env.LOG_DIRECTORY || "./logs",
  },

  // Configuración de notificaciones
  notifications: {
    enabled: process.env.ENABLE_NOTIFICATIONS === "true",
    email: {
      enabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === "true",
      service: process.env.EMAIL_SERVICE || "smtp",
    },
    sms: {
      enabled: process.env.ENABLE_SMS_NOTIFICATIONS === "true",
      service: process.env.SMS_SERVICE || "twilio",
    },
  },

  // Configuración de monitoreo
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === "true",
    metricsPort: parseInt(process.env.METRICS_PORT) || 9090,
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
  },

  // Configuración de desarrollo
  development: {
    enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === "true",
    enableMockPayments: process.env.ENABLE_MOCK_PAYMENTS === "true",
    simulateStripeErrors: process.env.SIMULATE_STRIPE_ERRORS === "true",
  },
};

/**
 * Validar configuración requerida
 */
const validateConfig = () => {
  const errors = [];

  // Validar configuración de base de datos
  if (
    config.database.type === "postgresql" &&
    !config.database.url &&
    !config.database.host
  ) {
    errors.push("Configuración de base de datos PostgreSQL requerida");
  }

  // Validar configuración de Stripe en producción
  if (config.server.env === "production") {
    if (config.stripe.secretKey === "sk_test_dummy_key_for_development") {
      errors.push("Clave secreta de Stripe requerida en producción");
    }
    if (
      config.stripe.webhookSecret &&
      config.stripe.webhookSecret.startsWith("whsec_")
    ) {
      // Webhook secret válido
    } else if (config.stripe.webhookSecret) {
      errors.push("Webhook secret de Stripe inválido");
    }
  }

  // Validar URLs de servicios
  const serviceUrls = [
    config.services.auth.url,
    config.services.enrollment.url,
  ];

  serviceUrls.forEach((url, index) => {
    if (!url || !url.startsWith("http")) {
      const serviceNames = ["auth", "enrollment"];
      errors.push(`URL del servicio ${serviceNames[index]} inválida: ${url}`);
    }
  });

  if (errors.length > 0) {
    console.error("❌ Errores de configuración:");
    errors.forEach((error) => console.error(`  - ${error}`));
    return false;
  }

  return true;
};

/**
 * Obtener configuración para un entorno específico
 */
const getConfigForEnv = (env) => {
  const envConfig = { ...config };

  if (env === "test") {
    envConfig.database.storage = ":memory:";
    envConfig.database.type = "sqlite";
    envConfig.stripe.secretKey = "sk_test_dummy_key_for_testing";
    envConfig.logging.level = "error";
    envConfig.development.enableMockPayments = true;
  }

  return envConfig;
};

/**
 * Verificar si estamos en modo desarrollo
 */
const isDevelopment = () => config.server.env === "development";

/**
 * Verificar si estamos en modo producción
 */
const isProduction = () => config.server.env === "production";

/**
 * Verificar si estamos en modo test
 */
const isTest = () => config.server.env === "test";

module.exports = {
  config,
  validateConfig,
  getConfigForEnv,
  isDevelopment,
  isProduction,
  isTest,
};
