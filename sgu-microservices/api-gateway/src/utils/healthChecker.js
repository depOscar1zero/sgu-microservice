const axios = require('axios');
const { services } = require('../config/services');

/**
 * Estado de los servicios
 */
let serviceStatus = {};

/**
 * Verificar salud de un servicio específico
 */
const checkServiceHealth = async (serviceName, serviceConfig) => {
  try {
    const response = await axios.get(
      `${serviceConfig.url}${serviceConfig.healthCheck}`,
      { timeout: serviceConfig.timeout }
    );

    return {
      name: serviceName,
      status: 'healthy',
      url: serviceConfig.url,
      responseTime: response.headers['x-response-time'] || 'N/A',
      timestamp: new Date().toISOString(),
      details: response.data || null
    };
  } catch (error) {
    return {
      name: serviceName,
      status: 'unhealthy',
      url: serviceConfig.url,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Verificar salud de todos los servicios
 */
const checkAllServices = async () => {
  const healthChecks = Object.entries(services).map(([name, config]) =>
    checkServiceHealth(name, config)
  );

  const results = await Promise.all(healthChecks);
  
  // Actualizar estado global
  results.forEach(result => {
    serviceStatus[result.name] = result;
  });

  return results;
};

/**
 * Obtener estado actual de los servicios
 */
const getServiceStatus = () => {
  return {
    gateway: {
      name: 'api-gateway',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    },
    services: serviceStatus,
    summary: {
      total: Object.keys(services).length,
      healthy: Object.values(serviceStatus).filter(s => s.status === 'healthy').length,
      unhealthy: Object.values(serviceStatus).filter(s => s.status === 'unhealthy').length
    }
  };
};

/**
 * Verificar si un servicio específico está disponible
 */
const isServiceHealthy = (serviceName) => {
  const status = serviceStatus[serviceName];
  return status && status.status === 'healthy';
};

/**
 * Inicializar monitoreo periódico
 */
const startHealthMonitoring = () => {
  const interval = parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000; // 30 segundos
  
  console.log(`Iniciando monitoreo de servicios cada ${interval / 1000} segundos`);
  
  // Verificación inicial
  checkAllServices();
  
  // Verificaciones periódicas
  setInterval(async () => {
    console.log('Verificando salud de servicios...');
    await checkAllServices();
  }, interval);
};

module.exports = {
  checkServiceHealth,
  checkAllServices,
  getServiceStatus,
  isServiceHealthy,
  startHealthMonitoring
};