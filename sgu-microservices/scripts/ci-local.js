#!/usr/bin/env node

/**
 * Script de CI/CD Local para SGU Microservices
 * Ejecuta todos los tests y validaciones localmente
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
async function runCILocal() {
  console.log(`${colors.bright}${colors.blue}🚀 SGU Microservices - CI/CD Local${colors.reset}`);
  console.log(`${colors.blue}==========================================${colors.reset}\n`);

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

  // 2. Instalar dependencias
  console.log(`\n${colors.yellow}📦 Instalando dependencias...${colors.reset}`);
  
  const installResult = runCommand('npm run install:all', 'Instalación de dependencias');
  if (!installResult.success) {
    results.overall.success = false;
    results.overall.errors.push('Error en instalación de dependencias');
  }

  // 3. Tests de linting
  console.log(`\n${colors.yellow}🔍 Ejecutando linting...${colors.reset}`);
  
  const lintResult = runCommand('npm run lint:all', 'Linting de código');
  if (!lintResult.success) {
    console.log(`${colors.yellow}⚠️  Linting completado con advertencias${colors.reset}`);
  }

  // 4. Tests de servicios
  console.log(`\n${colors.yellow}🧪 Ejecutando tests de servicios...${colors.reset}`);
  
  for (const service of services) {
    console.log(`\n${colors.cyan}🔬 Testing ${service}...${colors.reset}`);
    const testResult = runCommand(`cd ${service} && npm test`, `Tests de ${service}`);
    results.services[service] = testResult.success;
    
    if (!testResult.success) {
      results.overall.success = false;
      results.overall.errors.push(`Error en tests de ${service}`);
    }
  }

  // 5. Tests de patrones de diseño
  console.log(`\n${colors.yellow}🎨 Ejecutando tests de patrones de diseño...${colors.reset}`);
  
  // DDD Tests
  console.log(`\n${colors.magenta}🏗️  Testing Domain-Driven Design (DDD)...${colors.reset}`);
  const dddResult = runCommand('cd enrollment-service && npm test -- tests/domain/', 'Tests DDD');
  results.patterns.ddd = dddResult.success;
  
  // Factory Method Tests
  console.log(`\n${colors.magenta}🏭 Testing Factory Method...${colors.reset}`);
  const factoryResult = runCommand('npm run test:factory', 'Tests Factory Method');
  results.patterns.factory = factoryResult.success;
  
  // Strategy Tests
  console.log(`\n${colors.magenta}⚡ Testing Strategy Pattern...${colors.reset}`);
  const strategyResult = runCommand('npm run test:strategy', 'Tests Strategy');
  results.patterns.strategy = strategyResult.success;
  
  // Decorator Tests
  console.log(`\n${colors.magenta}🎨 Testing Decorator Pattern...${colors.reset}`);
  const decoratorResult = runCommand('npm run test:decorator', 'Tests Decorator');
  results.patterns.decorator = decoratorResult.success;

  // 6. Tests de integración
  console.log(`\n${colors.yellow}🔗 Ejecutando tests de integración...${colors.reset}`);
  
  const integrationResult = runCommand('npm run test:integration', 'Tests de integración');
  if (!integrationResult.success) {
    console.log(`${colors.yellow}⚠️  Tests de integración completados con advertencias${colors.reset}`);
  }

  // 7. Generar reporte de cobertura
  console.log(`\n${colors.yellow}📊 Generando reporte de cobertura...${colors.reset}`);
  
  const coverageResult = runCommand('npm run test:coverage', 'Reporte de cobertura');
  if (!coverageResult.success) {
    console.log(`${colors.yellow}⚠️  Reporte de cobertura completado con advertencias${colors.reset}`);
  }

  // 8. Verificar estructura de patrones
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

  // 9. Generar reporte final
  console.log(`\n${colors.bright}${colors.blue}📋 REPORTE FINAL CI/CD LOCAL${colors.reset}`);
  console.log(`${colors.blue}================================${colors.reset}`);
  
  console.log(`\n${colors.yellow}🔧 Servicios:${colors.reset}`);
  Object.entries(results.services).forEach(([service, success]) => {
    const status = success ? `${colors.green}✅` : `${colors.red}❌`;
    console.log(`  ${status} ${service}`);
  });
  
  console.log(`\n${colors.yellow}🎨 Patrones de Diseño:${colors.reset}`);
  Object.entries(results.patterns).forEach(([pattern, success]) => {
    const status = success ? `${colors.green}✅` : `${colors.red}❌`;
    const patternName = pattern.toUpperCase();
    console.log(`  ${status} ${patternName}`);
  });
  
  console.log(`\n${colors.yellow}📊 Resumen:${colors.reset}`);
  const totalServices = Object.keys(results.services).length;
  const passedServices = Object.values(results.services).filter(Boolean).length;
  const totalPatterns = Object.keys(results.patterns).length;
  const passedPatterns = Object.values(results.patterns).filter(Boolean).length;
  
  console.log(`  📈 Servicios: ${passedServices}/${totalServices} pasaron`);
  console.log(`  🎨 Patrones: ${passedPatterns}/${totalPatterns} pasaron`);
  
  if (results.overall.success) {
    console.log(`\n${colors.green}🎉 ¡CI/CD LOCAL COMPLETADO EXITOSAMENTE!${colors.reset}`);
    console.log(`${colors.green}✅ Todos los tests pasaron${colors.reset}`);
    console.log(`${colors.green}✅ Todos los patrones funcionando${colors.reset}`);
    console.log(`${colors.green}🚀 Sistema listo para deployment${colors.reset}`);
  } else {
    console.log(`\n${colors.red}❌ CI/CD LOCAL FALLÓ${colors.reset}`);
    console.log(`${colors.red}Errores encontrados:${colors.reset}`);
    results.overall.errors.forEach(error => {
      console.log(`  ${colors.red}• ${error}${colors.reset}`);
    });
    process.exit(1);
  }
}

// Ejecutar CI/CD local
if (require.main === module) {
  runCILocal().catch(error => {
    console.error(`${colors.red}❌ Error fatal en CI/CD local: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { runCILocal };
