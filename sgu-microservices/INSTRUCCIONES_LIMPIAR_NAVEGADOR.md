# 🔧 Instrucciones para Limpiar el Navegador

## ⚠️ PROBLEMA ACTUAL:
- El navegador tiene cache antiguo del frontend
- WebSockets de Vite/Astro están causando conflictos
- `ERR_CONNECTION_RESET` al intentar login

---

## ✅ SOLUCIÓN - PASOS A SEGUIR:

### 1️⃣ **Abrir las Herramientas de Desarrollo (F12)**
Ya lo tienes abierto ✓

### 2️⃣ **Limpiar Cache y Storage Completamente:**

**Opción A - Desde DevTools (RECOMENDADO):**
1. Con DevTools abierto (F12), haz clic derecho en el botón de **Recargar** (🔄) de la barra de navegación
2. Selecciona **"Vaciar caché y volver a cargar de manera forzada"** o **"Hard Reload"**

**Opción B - Desde Application Tab:**
1. En DevTools, ve a la pestaña **"Application"** (puede llamarse "Almacenamiento" en español)
2. En el panel izquierdo, bajo **"Storage"**, haz clic en **"Clear site data"**
3. Marca todas las opciones:
   - ✅ Cookies and site data
   - ✅ Cache storage
   - ✅ Local storage
   - ✅ Session storage
   - ✅ IndexedDB
4. Haz clic en **"Clear site data"**

**Opción C - Desde Configuración del Navegador:**
1. Presiona `Ctrl + Shift + Delete`
2. Selecciona:
   - ✅ Cookies y otros datos de sitio
   - ✅ Imágenes y archivos en caché
3. Rango de tiempo: **"Última hora"**
4. Haz clic en **"Borrar datos"**

### 3️⃣ **Cerrar TODAS las pestañas de localhost:3005**
- Cierra todas las pestañas del SGU
- Cierra DevTools

### 4️⃣ **Reiniciar el Frontend (en Docker):**
```powershell
# Ejecutar en PowerShell:
cd "C:\Users\dep-o\OneDrive\Documentos\Universidad\7to\ARQ SOFT\Arq REAL\sgu-microservices"
docker-compose restart frontend-spa
```

### 5️⃣ **Esperar 10 segundos y abrir nueva pestaña:**
- Abre una **NUEVA pestaña** (Ctrl + T)
- Ve a: `http://localhost:3005/login`
- Abre DevTools (F12)
- Ve a la pestaña **"Network"**
- Marca ✅ **"Disable cache"** (en la parte superior de Network)

### 6️⃣ **Intentar login nuevamente:**
- Email: `admin@universidad.edu`
- Password: `Admin123!`

---

## 🔍 **QUÉ VERIFICAR EN NETWORK TAB:**

Cuando hagas clic en "Iniciar sesión", deberías ver:

✅ **Petición POST a login:**
```
POST http://localhost:3000/api/auth/login
Status: 200 OK
```

❌ **NO deberías ver:**
```
ERR_CONNECTION_RESET
ERR_FAILED
```

---

## 🆘 **SI AÚN NO FUNCIONA:**

### Verificar que los servicios estén corriendo:
```powershell
docker-compose ps
```

Todos deberían mostrar `Up`:
- ✅ sgu-api-gateway (puerto 3000)
- ✅ sgu-auth-service (puerto 3001)
- ✅ sgu-frontend (puerto 3005)

### Ver logs en tiempo real:
```powershell
# En una terminal:
docker-compose logs -f api-gateway

# En otra terminal:
docker-compose logs -f frontend-spa
```

Luego intenta el login y observa qué sucede en los logs.

---

## 📊 **ALTERNATIVA - Probar Login Directamente:**

Si el navegador sigue fallando, puedes probar el API directamente con PowerShell:

```powershell
$body = @{
    email = "admin@universidad.edu"
    password = "Admin123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body $body
```

Esto debería devolver:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

Si funciona aquí pero no en el navegador, el problema es 100% de cache/WebSocket del navegador.

---

## ✅ **SEÑALES DE ÉXITO:**

Después de limpiar cache:
1. ✅ NO hay errores de WebSocket en consola
2. ✅ NO hay `ERR_CONNECTION_RESET`
3. ✅ Petición POST a `/api/auth/login` con status 200
4. ✅ Redirección automática al dashboard (`/`)
5. ✅ Usuario se muestra en el header
6. ✅ "Último acceso" se muestra correctamente

