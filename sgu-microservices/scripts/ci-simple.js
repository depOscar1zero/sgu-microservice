#!/usr/bin/env node

/**
 * Script de CI/CD Simple para SGU Microservices
 * Ejecuta tests básicos sin dependencias complejas
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Función para ejecutar comandos
function runCommand(command, description) {
  console.log(`${colors.cyan}🔄 ${description}...${colors.reset}`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    console.log(`${colors.green}✅ ${description} completado${colors.reset}`);
    return { success: true, output };
  } catch (error) {
    console.log(`${colors.red}❌ ${description} falló${colors.reset}`);
    console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

// Función para verificar si un directorio existe
function directoryExists(dirPath) {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

// Función para verificar si un archivo existe
function fileExists(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

// Función para obtener estadísticas de archivos
function getFileStats(dirPath, pattern) {
  if (!directoryExists(dirPath)) return { count: 0, files: [] };
  
  const files = fs.readdirSync(dirPath, { recursive: true })
    .filter(file => file.includes(pattern))
    .map(file => path.join(dirPath, file));
    
  return { count: files.length, files };
}

// Función principal
async function runCISimple() {
  console.log(`${colors.bright}${colors.blue}🚀 SGU Microservices - CI/CD Simple${colors.reset}`);
  console.log(`${colors.blue}=====================================${colors.reset}\n`);

  const results = {
    services: {},
    patterns: {},
    overall: { success: true, errors: [] }
  };

  // 1. Verificar estructura del proyecto
  console.log(`${colors.yellow}📋 Verificando estructura del proyecto...${colors.reset}`);
  
  const services = ['auth-service', 'courses-service', 'enrollment-service', 'notifications-service', 'payments-service', 'api-gateway'];
  const missingServices = [];
  
  services.forEach(service => {
    if (!directoryExists(service)) {
      missingServices.push(service);
    }
  });
  
  if (missingServices.length > 0) {
    console.log(`${colors.red}❌ Servicios faltantes: ${missingServices.join(', ')}${colors.reset}`);
    results.overall.success = false;
    results.overall.errors.push(`Servicios faltantes: ${missingServices.join(', ')}`);
  } else {
    console.log(`${colors.green}✅ Todos los servicios presentes${colors.reset}`);
  }

  // 2. Tests de patrones de diseño específicos
  console.log(`\n${colors.yellow}🎨 Ejecutando tests de patrones de diseño...${colors.reset}`);
  
  // DDD Tests
  console.log(`\n${colors.magenta}🏗️  Testing Domain-Driven Design (DDD)...${colors.reset}`);
  const dddResult = runCommand('cd enrollment-service && npm test -- tests/domain/', 'Tests DDD');
  results.patterns.ddd = dddResult.success;
  
  // Factory Method Tests
  console.log(`\n${colors.magenta}🏭 Testing Factory Method...${colors.reset}`);
  const factoryResult = runCommand('cd notifications-service && npm test -- tests/factories/', 'Tests Factory Method');
  results.patterns.factory = factoryResult.success;
  
  // Strategy Tests
  console.log(`\n${colors.magenta}⚡ Testing Strategy Pattern...${colors.reset}`);
  const strategyResult = runCommand('cd enrollment-service && npm test -- tests/strategies/', 'Tests Strategy');
  results.patterns.strategy = strategyResult.success;
  
  // Decorator Tests
  console.log(`\n${colors.magenta}🎨 Testing Decorator Pattern...${colors.reset}`);
  const decoratorResult = runCommand('cd api-gateway && npm test -- tests/decorators/', 'Tests Decorator');
  results.patterns.decorator = decoratorResult.success;

  // 3. Verificar estructura de patrones
  console.log(`\n${colors.yellow}📋 Verificando estructura de patrones...${colors.reset}`);
  
  const patternStats = {
    ddd: getFileStats('enrollment-service/src/domain', '.js'),
    factory: {
      notifications: getFileStats('notifications-service/src/factories', '.js'),
      payments: getFileStats('payments-service/src/factories', '.js'),
      validators: getFileStats('enrollment-service/src/factories', '.js')
    },
    strategy: getFileStats('enrollment-service/src/strategies', '.js'),
    decorator: getFileStats('api-gateway/src/decorators', '.js')
  };

  console.log(`\n${colors.blue}📊 Estadísticas de Patrones de Diseño:${colors.reset}`);
  console.log(`🏗️  DDD: ${patternStats.ddd.count} archivos`);
  console.log(`🏭 Factory Method: ${patternStats.factory.notifications.count + patternStats.factory.payments.count + patternStats.factory.validators.count} archivos`);
  console.log(`⚡ Strategy: ${patternStats.strategy.count} archivos`);
  console.log(`🎨 Decorator: ${patternStats.decorator.count} archivos`);

  // 4. Generar reporte final
  console.log(`\n${colors.bright}${colors.blue}📋 REPORTE FINAL CI/CD SIMPLE${colors.reset}`);
  console.log(`${colors.blue}===================================${colors.reset}`);
  
  console.log(`\n${colors.yellow}🎨 Patrones de Diseño:${colors.reset}`);
  Object.entries(results.patterns).forEach(([pattern, success]) => {
    const status = success ? `${colors.green}✅` : `${colors.red}❌`;
    const patternName = pattern.toUpperCase();
    console.log(`  ${status} ${patternName}`);
  });
  
  console.log(`\n${colors.yellow}📊 Resumen:${colors.reset}`);
  const totalPatterns = Object.keys(results.patterns).length;
  const passedPatterns = Object.values(results.patterns).filter(Boolean).length;
  
  console.log(`  🎨 Patrones: ${passedPatterns}/${totalPatterns} pasaron`);
  
  if (results.overall.success && passedPatterns === totalPatterns) {
    console.log(`\n${colors.green}🎉 ¡CI/CD SIMPLE COMPLETADO EXITOSAMENTE!${colors.reset}`);
    console.log(`${colors.green}✅ Todos los patrones funcionando${colors.reset}`);
    console.log(`${colors.green}🚀 Sistema listo para deployment${colors.reset}`);
  } else {
    console.log(`\n${colors.red}❌ CI/CD SIMPLE FALLÓ${colors.reset}`);
    console.log(`${colors.red}Errores encontrados:${colors.reset}`);
    results.overall.errors.forEach(error => {
      console.log(`  ${colors.red}• ${error}${colors.reset}`);
    });
    process.exit(1);
  }
}

// Ejecutar CI/CD simple
if (require.main === module) {
  runCISimple().catch(error => {
    console.error(`${colors.red}❌ Error fatal en CI/CD simple: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { runCISimple };
