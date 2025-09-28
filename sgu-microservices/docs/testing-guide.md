# 🧪 Guía de Testing - SGU Microservices

Esta guía explica cómo ejecutar y mantener los tests en el sistema SGU.

## 📋 Tipos de Tests

### 1. **Tests Unitarios**

- **Propósito**: Probar funciones y métodos individuales
- **Alcance**: Un solo servicio a la vez
- **Velocidad**: Rápidos (< 1 segundo por test)
- **Dependencias**: Mínimas (mocks)

### 2. **Tests de Integración**

- **Propósito**: Probar comunicación entre servicios
- **Alcance**: Múltiples servicios
- **Velocidad**: Moderados (1-5 segundos por test)
- **Dependencias**: Servicios reales

### 3. **Tests End-to-End (E2E)**

- **Propósito**: Probar flujos completos de usuario
- **Alcance**: Todo el sistema
- **Velocidad**: Lentos (5-30 segundos por test)
- **Dependencias**: Frontend + Backend + Base de datos

## 🚀 Ejecutar Tests

### Comandos Básicos

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch (desarrollo)
npm run test:watch

# Tests específicos por servicio
npm run test:auth
npm run test:courses
npm run test:enrollment
npm run test:payments

# Tests de integración
npm run test:integration

# Tests E2E
npm run test:e2e

# Todos los tests (incluyendo E2E)
npm run test:all
```

### Comandos para CI/CD

```bash
# Tests para CI (sin watch, con cobertura)
npm run test:ci

# Script personalizado para CI
node scripts/test-ci.js unit
node scripts/test-ci.js integration
node scripts/test-ci.js e2e
node scripts/test-ci.js all
```

## 📁 Estructura de Tests

```
sgu-microservices/
├── tests/
│   ├── setup.js                    # Configuración global
│   ├── integration/                 # Tests de integración
│   │   └── services-integration.test.js
│   └── e2e/                        # Tests E2E
│       └── user-journey.test.js
├── auth-service/
│   └── tests/
│       └── auth.test.js
├── courses-service/
│   └── tests/
│       └── courses.test.js
├── enrollment-service/
│   └── tests/
│       └── enrollment.test.js
├── payments-service/
│   └── tests/
│       └── payments.test.js
├── jest.config.js                  # Configuración de Jest
└── scripts/
    └── test-ci.js                  # Script para CI/CD
```

## ⚙️ Configuración

### Variables de Entorno para Testing

```env
NODE_ENV=test
JWT_SECRET=test-secret-key
DATABASE_URL=sqlite::memory:
MONGODB_URI=mongodb://localhost:27017/sgu_test
REDIS_URL=redis://localhost:6379/1
```

### Jest Configuration

El archivo `jest.config.js` está configurado para:

- **Proyectos múltiples**: Cada servicio tiene su propia configuración
- **Cobertura**: Genera reportes de cobertura
- **Timeouts**: 30 segundos para tests de integración
- **Setup**: Configuración global en `tests/setup.js`

## 🛠️ Escribir Tests

### Test Unitario Ejemplo

```javascript
describe("User Model", () => {
  test("should create user with valid data", async () => {
    const userData = testUtils.generateUser();
    const user = await User.create(userData);

    expect(user.id).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.password).not.toBe(userData.password); // Debe estar hasheado
  });
});
```

### Test de Integración Ejemplo

```javascript
describe("Services Integration", () => {
  test("should complete user registration and enrollment flow", async () => {
    // 1. Register user
    const userResponse = await request(AUTH_SERVICE_URL)
      .post("/api/auth/register")
      .send(userData);

    // 2. Create course
    const courseResponse = await request(COURSES_SERVICE_URL)
      .post("/api/courses")
      .set("Authorization", `Bearer ${userResponse.body.data.token}`)
      .send(courseData);

    // 3. Enroll in course
    const enrollmentResponse = await request(ENROLLMENT_SERVICE_URL)
      .post("/api/enrollments")
      .set("Authorization", `Bearer ${userResponse.body.data.token}`)
      .send({ courseId: courseResponse.body.data.id });
  });
});
```

### Test E2E Ejemplo

```javascript
describe("User Journey", () => {
  test("should complete user registration flow", async () => {
    await page.goto("http://localhost:3005/register");
    await page.type('input[name="email"]', "test@example.com");
    await page.type('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.waitForNavigation();
    expect(page.url()).toContain("/dashboard");
  });
});
```

## 📊 Cobertura de Código

### Generar Reporte de Cobertura

```bash
npm run test:coverage
```

### Interpretar Cobertura

- **Statements**: Porcentaje de líneas ejecutadas
- **Branches**: Porcentaje de ramas condicionales ejecutadas
- **Functions**: Porcentaje de funciones ejecutadas
- **Lines**: Porcentaje de líneas ejecutadas

### Metas de Cobertura

- **Mínimo**: 80% de cobertura
- **Objetivo**: 90% de cobertura
- **Crítico**: 95% para servicios de pago

## 🐛 Debugging Tests

### Tests que Fallan

```bash
# Ejecutar un test específico con debug
npm test -- --testNamePattern="should create user"

# Ejecutar con verbose output
npm test -- --verbose

# Ejecutar con debug de Node.js
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Logs de Tests

```bash
# Ver logs detallados
DEBUG=* npm test

# Ver logs de un servicio específico
DEBUG=sgu:* npm test
```

## 🔧 Mantenimiento de Tests

### Mejores Prácticas

1. **Nombres descriptivos**: `should return 404 for non-existent user`
2. **Un test, una funcionalidad**: No mezclar múltiples casos en un test
3. **Setup y cleanup**: Limpiar datos entre tests
4. **Mocks apropiados**: Mock servicios externos, no internos
5. **Datos de prueba**: Usar `testUtils` para generar datos consistentes

### Actualizar Tests

```bash
# Actualizar snapshots
npm test -- --updateSnapshot

# Ejecutar tests que cambiaron
npm test -- --onlyChanged

# Ejecutar tests relacionados a archivos modificados
npm test -- --findRelatedTests src/models/User.js
```

## 🚨 Troubleshooting

### Problemas Comunes

#### Tests Lentos

```bash
# Ejecutar tests en paralelo
npm test -- --maxWorkers=4

# Ejecutar tests secuencialmente
npm test -- --runInBand
```

#### Tests que Fallan Intermitentemente

```bash
# Ejecutar tests múltiples veces
npm test -- --repeat=3

# Ejecutar con timeout mayor
npm test -- --testTimeout=60000
```

#### Problemas de Memoria

```bash
# Limpiar cache de Jest
npm test -- --clearCache

# Ejecutar con menos workers
npm test -- --maxWorkers=2
```

### Logs y Debugging

```bash
# Ver logs de servicios durante tests
docker-compose logs -f auth-service &
npm test

# Debug de tests E2E
DEBUG=puppeteer:* npm run test:e2e
```

## 📈 Métricas de Testing

### KPIs Importantes

- **Cobertura de código**: > 80%
- **Tiempo de ejecución**: < 10 minutos para todos los tests
- **Tests que pasan**: > 95%
- **Tests E2E**: > 90% de flujos críticos cubiertos

### Reportes

```bash
# Generar reporte HTML de cobertura
npm run test:coverage
open coverage/lcov-report/index.html

# Generar reporte de tests
npm test -- --json --outputFile=test-results.json
```

## 🤝 Contribuir a Tests

### Agregar Nuevos Tests

1. **Identificar funcionalidad**: ¿Qué necesita ser probado?
2. **Elegir tipo de test**: Unit, Integration, o E2E?
3. **Escribir test**: Seguir patrones existentes
4. **Verificar cobertura**: ¿El test cubre el código?
5. **Ejecutar tests**: Asegurar que pasen

### Code Review de Tests

- ✅ ¿El test es legible y mantenible?
- ✅ ¿Cubre casos edge y errores?
- ✅ ¿Usa mocks apropiados?
- ✅ ¿Limpia datos después de ejecutar?
- ✅ ¿Tiene nombre descriptivo?

---

## 📞 Soporte

Para preguntas sobre testing:

- **Documentación**: Ver esta guía
- **Issues**: Crear issue en el repositorio
- **Slack**: Canal #testing en el workspace del equipo
