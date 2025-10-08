# Investigación de Patrones, Anti‑patrones y CI/CD

> Proyecto: Sistema de Gestión Universitaria (SGU)

---

## 1) Patrones de diseño GoF

### 1.1 Creacionales

- **Factory Method**
  - Ventajas: Desacopla la creación del uso; facilita extensibilidad; permite seleccionar implementaciones en tiempo de ejecución.
  - Desventajas: Más clases y jerarquías; puede agregar complejidad innecesaria en casos simples.
  - Ejemplos: Drivers de BD, clientes HTTP; frameworks UI crean widgets con factorías.
- **Abstract Factory**
  - Ventajas: Crea familias de objetos relacionados garantizando compatibilidad; cambia "temas" completos de implementación.
  - Desventajas: Curva de aprendizaje; difícil agregar nuevos productos.
  - Ejemplos: Render engines (OpenGL/DirectX), familias de repositorios (SQL/NoSQL).
- **Builder**
  - Ventajas: Construcción paso a paso de objetos complejos; mejora legibilidad; evita telescoping constructors.
  - Desventajas: Boilerplate adicional; puede ser redundante con lenguajes con parámetros nombrados.
  - Ejemplos: Constructores de peticiones HTTP (RequestBuilder), ORMs al componer queries.
- **Prototype**
  - Ventajas: Clonado eficiente de objetos costosos; evita dependencias de subclases.
  - Desventajas: Copias profundas vs superficiales; mantener invariantes.
  - Ejemplos: Clonado de configuraciones por tenant; escenas en motores de juego.
- **Singleton** (usar con cuidado)
  - Ventajas: Única instancia global controlada; útil para caches o registros.
  - Desventajas: Oculta dependencias; dificulta testing; alta acoplamiento global.
  - Ejemplos: Logger global, proveedor de configuración.

### 1.2 Estructurales

- **Adapter**
  - Ventajas: Integra APIs incompatibles; facilita migraciones.
  - Desventajas: Puede esconder deuda técnica; encadena adaptadores.
  - Ejemplos: Adaptar SDKs de pagos; controladores entre capas.
- **Facade**
  - Ventajas: Simplifica subsistemas complejos con una API simple; reduce acoplamiento.
  - Desventajas: Riesgo de convertirse en "Dios" si crece sin control.
  - Ejemplos: Servicio de "BillingService" que orquesta múltiples microservicios.
- **Composite**
  - Ventajas: Tratar estructuras jerárquicas uniformemente; operaciones recursivas simples.
  - Desventajas: Puede exponer operaciones no aplicables a hojas; validaciones más complejas.
  - Ejemplos: Árboles de menús, planes de estudio con módulos y cursos.
- **Decorator**
  - Ventajas: Añade responsabilidades dinámicamente; favorece composición sobre herencia.
  - Desventajas: Demasiados decoradores complican el seguimiento; orden importa.
  - Ejemplos: Añadir caching, logging, retry a repositorios/servicios.
- **Proxy**
  - Ventajas: Controla acceso; lazy-loading; remoting.
  - Desventajas: Complejidad de sincronización y fallas remotas.
  - Ejemplos: Proxies de repositorio, clients gRPC/HTTP, virtual proxy para cargas diferidas.

### 1.3 De comportamiento

- **Strategy**
  - Ventajas: Intercambiabilidad de algoritmos; testabilidad; OCP.
  - Desventajas: Muchas clases; selección de estrategia debe gestionarse.
  - Ejemplos: Políticas de validación de inscripción (ya utilizado en SGU), descuentos, reglas de negocio por rol.
- **Observer**
  - Ventajas: Desacopla emisores de subscriptores; soporta eventos.
  - Desventajas: Orden de notificación no determinista; fugas si no se desuscriben.
  - Ejemplos: Notificaciones de inscripción, websockets, dominio-eventos.
- **Command**
  - Ventajas: Encapsula operaciones; colas, retries, undo.
  - Desventajas: Boilerplate adicional; requiere infraestructura.
  - Ejemplos: Jobs de envío de correos, comandos de facturación.
- **Chain of Responsibility**
  - Ventajas: Pipeline de handlers; separación de responsabilidades.
  - Desventajas: Difícil depurar; fin de cadena no evidente.
  - Ejemplos: Middlewares HTTP, pipelines de validación.
- **Template Method**
  - Ventajas: Define esqueleto del algoritmo; reutilización con pasos personalizables.
  - Desventajas: Herencia rígida; puede violar LSP si no se diseña bien.
  - Ejemplos: Flujos de importación/exportación, generación de reportes.

---

## 2) Patrones emergentes

- **MVC**
  - Cuándo: Apps web con separación clara de presentación; controladores ligeros.
  - Beneficios: Separación de intereses, testabilidad de controladores.
- **DAO**
  - Cuándo: Acceso a datos con múltiples fuentes o necesidad de mocks/fakes.
  - Beneficios: Aísla persistencia; facilita pruebas y cambios de motor.
- **CQRS**
  - Cuándo: Lecturas y escrituras con requerimientos distintos (escalado, modelos distintos).
  - Beneficios: Escala consultas; simplifica modelos; combinado con eventos.
- **DDD**
  - Cuándo: Dominios complejos con reglas ricas; múltiples bounded contexts.
  - Beneficios: Lenguaje ubicuo, agregados, módulos claros, alineación negocio-dev.
- **MVVM**
  - Cuándo: UIs ricas (desktop/mobile/web reactive) con data-binding.
  - Beneficios: Pruebas de lógica de presentación, menos código de UI.

---

## 3) Anti‑patrones

- **God Object (Objeto Dios)**
  - Daño: Alta responsabilidad, acoplamiento, cambios riesgosos, baja testabilidad.
  - Evitar: SRP, dividir en servicios/aggregates, inyección de dependencias, límites de contexto.
- **Spaghetti Code**
  - Daño: Flujo ininteligible, dependencias circulares, mantenimiento costoso.
  - Evitar: Arquitectura por capas, linters, revisiones de PR, pruebas y refactor continuo.
- (Extra) **Golden Hammer**
  - Daño: Usar una solución para todo; desajuste con el problema.
  - Evitar: Evaluación de trade-offs, decisiones ADR, prototipos.

---

## 4) CI/CD

- **¿Qué es?**
  - CI: Integración continua de cambios con build + test automáticos.
  - CD (Delivery): Artefactos listos para release; despliegue manual controlado.
  - CD (Deployment): Despliegue automático hasta producción.

- **Herramientas**: GitHub Actions, GitLab CI, Jenkins, CircleCI, ArgoCD, Tekton.

- **Pipelines típicos**
  - Build + Lint + Unit Tests en PR.
  - Análisis estático y escaneo de vulnerabilidades.
  - Build de imagen Docker y push a registry.
  - Deploy a staging con migraciones de BD.
  - Deploy a prod con estrategia blue/green o canary.

- **Beneficios**
  - Feedback rápido, calidad consistente, menos regresiones, release predecibles, trazabilidad.

- **Ejemplo YAML (GitHub Actions, Node.js)**
```yaml
name: ci
on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install
        run: npm ci
      - name: Lint
        run: npm run lint --if-present
      - name: Test
        run: npm test -- --ci --reporters=default --coverage
      - name: Build Docker
        run: |
          docker build -t ghcr.io/org/sgu-api:${{ github.sha }} .
      - name: Push Docker
        if: github.ref == 'refs/heads/main'
        run: |
          echo ${{ secrets.GHCR_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/org/sgu-api:${{ github.sha }}
  deploy-staging:
    needs: build-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        uses: azure/k8s-deploy@v4
        with:
          manifests: manifests/staging/*.yaml
          images: ghcr.io/org/sgu-api:${{ github.sha }}
```

- **Explicación breve**
  - "build-test": checkout, Node 20, instala, lint, tests, construye/push Docker.
  - "deploy-staging": despliega a Kubernetes en staging con la nueva imagen.

---

## 5) Selección personal de 4 patrones e integración en SGU

- **Creacional: Factory Method**
  - Justificación: Permite crear repositorios/servicios específicos por contexto (p. ej., `EnrollmentRepository`, `PaymentsRepository`) o por proveedor (SQL/NoSQL) sin cambiar consumidores.
  - Integración: En `sgu-*` services, una factoría selecciona implementación por `NODE_ENV`/config. Útil para pruebas (mocks) y para multi‑tenant.

- **Estructural: Decorator**
  - Justificación: Añadir capacidades transversales sin herencia: logging estructurado, métricas, retry con backoff, circuit breaker.
  - Integración: Decoradores sobre DAOs y clients HTTP (pagos, notificaciones). Ej.: `RetryingPaymentsClient`, `CachedCourseCatalog`.

- **De comportamiento: Strategy**
  - Justificación: Ya adoptado en validaciones de inscripción; facilita nuevas reglas por período/rol.
  - Integración: Mantener `EnrollmentValidationContext` con estrategias ordenadas por prioridad; añadir estrategias para antifraude de pagos o reglas académicas.

- **Emergente: DDD**
  - Justificación: Dominios ricos (Inscripciones, Cursos, Pagos). DDD aporta agregados, invariantes y lenguaje ubicuo.
  - Integración: Definir bounded contexts: `Enrollment`, `CourseCatalog`, `Billing`. Cada contexto con sus entidades/servicios de dominio, publicando eventos de dominio (p. ej., `EnrollmentConfirmed`). CQRS opcional para consultas de catálogos.

---

## Conclusiones

- Usar Strategy, Decorator y Factory Method alinea el SGU con SOLID y mejora testabilidad/extensibilidad.
- DDD guía la modularización en microservicios y reduce acoplamiento entre contextos.
- Un pipeline CI/CD temprano asegura calidad y despliegues confiables.
