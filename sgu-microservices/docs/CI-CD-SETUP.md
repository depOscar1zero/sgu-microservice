# 🚀 CI/CD Setup para SGU Microservices

## 📋 Descripción

Este documento describe la implementación de CI/CD (Continuous Integration/Continuous Deployment) para el Sistema de Gestión Universitaria (SGU) con microservicios y patrones de diseño.

## 🎯 Objetivos

- **Automatización**: Tests automáticos en cada commit y pull request
- **Calidad**: Validación de código, linting y cobertura
- **Patrones**: Validación específica de patrones de diseño implementados
- **Integración**: Tests de integración entre microservicios
- **Deployment**: Despliegue automático a producción

## 🏗️ Arquitectura CI/CD

### **GitHub Actions Workflows**

#### 1. **CI/CD Principal** (`.github/workflows/ci-cd.yml`)
- **Trigger**: Push a `main`/`develop`, Pull Requests, Schedule diario
- **Jobs**:
  - `lint-and-quality`: Linting y calidad de código
  - `test-microservices`: Tests de todos los microservicios
  - `test-design-patterns`: Tests específicos de patrones de diseño
  - `integration-tests`: Tests de integración con bases de datos
  - `docker-tests`: Tests de contenedores Docker
  - `security-scan`: Análisis de seguridad
  - `deploy`: Despliegue a producción (solo en main)
  - `notify`: Notificaciones de resultados

#### 2. **Validación de Patrones** (`.github/workflows/design-patterns.yml`)
- **Trigger**: Cambios en archivos de patrones de diseño
- **Jobs**:
  - `test-ddd`: Validación Domain-Driven Design
  - `test-factory-method`: Validación Factory Method
  - `test-strategy`: Validación Strategy Pattern
  - `test-decorator`: Validación Decorator Pattern
  - `test-patterns-integration`: Validación de integración entre patrones
  - `generate-patterns-report`: Generación de reportes

### **Configuración Local**

#### **Scripts NPM**
```bash
# Tests completos
npm run test:all

# Tests por servicio
npm run test:auth
npm run test:courses
npm run test:enrollment
npm run test:notifications
npm run test:payments
npm run test:gateway

# Tests por patrón
npm run test:ddd
npm run test:factory
npm run test:strategy
npm run test:decorator

# Tests de integración
npm run test:integration

# Cobertura
npm run test:coverage

# Linting
npm run lint:all
npm run lint:fix

# Formateo
npm run format:check
```

#### **Scripts de CI/CD Local**

##### **Node.js** (`scripts/ci-local.js`)
```bash
node scripts/ci-local.js
```

##### **PowerShell** (`scripts/ci-local.ps1`)
```powershell
.\scripts\ci-local.ps1
```

##### **Con parámetros**:
```powershell
.\scripts\ci-local.ps1 -SkipInstall -SkipLint -Verbose
```

## 🔧 Configuración de Herramientas

### **ESLint** (`.eslintrc.js`)
- Reglas de calidad de código
- Configuración específica por patrón de diseño
- Reglas para microservicios
- Configuración para tests

### **Prettier** (`.prettierrc`)
- Formateo consistente de código
- Configuración para JavaScript, JSON, Markdown, YAML

### **Jest** (`jest.config.js`)
- Configuración de tests
- Cobertura de código
- Configuración por proyecto (microservicio)
- Timeouts y reportes

### **Husky** (`.huskyrc`)
- Pre-commit hooks
- Pre-push hooks
- Validación automática

### **Lint-staged** (`.lintstagedrc`)
- Linting solo de archivos modificados
- Formateo automático
- Tests relacionados

## 📊 Métricas y Reportes

### **Cobertura de Código**
- **Umbral global**: 80% (branches, functions, lines, statements)
- **Reportes**: HTML, LCOV, JSON
- **Por servicio**: Cobertura individual
- **Por patrón**: Cobertura específica de patrones

### **Calidad de Código**
- **Linting**: ESLint con reglas estrictas
- **Formateo**: Prettier automático
- **Complejidad**: Análisis de complejidad ciclomática
- **Duplicación**: Detección de código duplicado

### **Patrones de Diseño**
- **DDD**: Validación de entidades, value objects, domain services
- **Factory Method**: Validación de factories y managers
- **Strategy**: Validación de estrategias y contextos
- **Decorator**: Validación de decoradores y funcionalidades

## 🐳 Docker Integration

### **Docker Compose para Tests**
```yaml
# docker-compose.test.yml
services:
  postgres-test: # Base de datos PostgreSQL
  redis-test:   # Cache Redis
  mongo-test:   # Base de datos MongoDB
  # ... servicios de test
```

### **Tests de Contenedores**
- Build automático de imágenes
- Health checks
- Tests de integración
- Limpieza automática

## 🔒 Seguridad

### **Análisis de Seguridad**
- **npm audit**: Vulnerabilidades de dependencias
- **Snyk**: Análisis de seguridad avanzado
- **Dependabot**: Actualizaciones automáticas
- **Secret scanning**: Detección de secretos

### **Configuración de Secretos**
```yaml
# GitHub Secrets requeridos
SNYK_TOKEN: # Token de Snyk
DATABASE_URL: # URL de base de datos
REDIS_URL: # URL de Redis
MONGODB_URL: # URL de MongoDB
```

## 📈 Monitoreo y Alertas

### **Notificaciones**
- **Slack**: Notificaciones de CI/CD
- **Email**: Reportes de fallos
- **GitHub**: Comentarios en PRs

### **Métricas**
- **Tiempo de ejecución**: Duración de pipelines
- **Tasa de éxito**: Porcentaje de builds exitosos
- **Cobertura**: Tendencias de cobertura
- **Calidad**: Tendencias de calidad de código

## 🚀 Deployment

### **Estrategia de Deployment**
- **Branch Protection**: Protección de rama main
- **Approval Required**: Aprobación manual para producción
- **Rollback**: Rollback automático en caso de fallos
- **Blue-Green**: Deployment sin downtime

### **Ambientes**
- **Development**: Tests automáticos
- **Staging**: Validación completa
- **Production**: Despliegue controlado

## 📚 Uso y Comandos

### **Ejecutar CI/CD Local**
```bash
# Instalar dependencias
npm run install:all

# Ejecutar todos los tests
npm run test:all

# Ejecutar solo patrones
npm run test:patterns

# Ejecutar con cobertura
npm run test:coverage

# Linting y formateo
npm run lint:all
npm run format:check
```

### **GitHub Actions**
```bash
# Verificar workflows
gh workflow list

# Ejecutar workflow manualmente
gh workflow run ci-cd.yml

# Ver logs
gh run list
gh run view <run-id>
```

### **Docker Tests**
```bash
# Tests con Docker
npm run docker:test

# Build y test
docker-compose -f docker-compose.test.yml up --build
```

## 🎯 Beneficios

### **Para Desarrolladores**
- ✅ **Feedback rápido**: Tests automáticos en cada commit
- ✅ **Calidad garantizada**: Linting y formateo automático
- ✅ **Confianza**: Tests de integración y patrones
- ✅ **Productividad**: Automatización de tareas repetitivas

### **Para el Proyecto**
- ✅ **Arquitectura robusta**: Validación de patrones de diseño
- ✅ **Código limpio**: Estándares de calidad automáticos
- ✅ **Deployment seguro**: Tests antes de producción
- ✅ **Mantenibilidad**: Monitoreo continuo de calidad

### **Para la Organización**
- ✅ **Visibilidad**: Métricas y reportes automáticos
- ✅ **Eficiencia**: Reducción de bugs en producción
- ✅ **Escalabilidad**: Procesos automatizados
- ✅ **Innovación**: Foco en funcionalidades, no en procesos

## 🔮 Próximos Pasos

1. **Implementar más métricas**: Performance, seguridad, accesibilidad
2. **Automatizar más procesos**: Documentación, versionado, changelog
3. **Integrar más herramientas**: SonarQube, CodeClimate, etc.
4. **Mejorar reportes**: Dashboards, alertas inteligentes
5. **Expandir testing**: E2E tests, load testing, security testing

---

**¡El sistema SGU ahora cuenta con CI/CD completo para garantizar la calidad y automatización de todos los procesos de desarrollo!** 🎉
