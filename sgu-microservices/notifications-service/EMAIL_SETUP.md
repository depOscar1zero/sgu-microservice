# 📧 Configuración de Email Real para Notifications Service

## 🔧 Pasos para configurar Gmail SMTP

### 1. **Configurar Gmail**

1. **Abrir Gmail** en tu navegador
2. **Ir a Configuración** → **Cuenta e importación**
3. **Habilitar la autenticación de 2 factores**:
   - Ir a **Seguridad** → **Verificación en 2 pasos**
   - Seguir las instrucciones para habilitarla

### 2. **Generar contraseña de aplicación**

1. **Ir a Google Account** (https://myaccount.google.com/)
2. **Seguridad** → **Verificación en 2 pasos**
3. **Contraseñas de aplicaciones**
4. **Seleccionar aplicación**: "Correo"
5. **Seleccionar dispositivo**: "Otro (nombre personalizado)"
6. **Escribir**: "SGU Notifications Service"
7. **Copiar la contraseña generada** (16 caracteres)

### 3. **Actualizar archivo .env**

```bash
# Reemplazar estos valores en el archivo .env
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicación-16-caracteres
EMAIL_FROM=tu-email@gmail.com
```

### 4. **Probar configuración**

```bash
# Ejecutar el script de prueba
node test-email.js
```

## 🔒 Seguridad

- **NUNCA** compartas tu contraseña de aplicación
- **NUNCA** la subas a Git
- Usa variables de entorno en producción
- Considera usar servicios como SendGrid para producción

## 📧 Tipos de notificaciones configuradas

- ✅ **Registro de usuario** → Email de bienvenida
- ✅ **Inscripción a curso** → Email de confirmación
- ✅ **Pago exitoso** → Email de confirmación
- ✅ **Pago pendiente** → Email de recordatorio

## 🧪 Pruebas

Para probar el envío de emails:

1. **Registrar un usuario** en el sistema
2. **Inscribirse a un curso**
3. **Realizar un pago**
4. **Verificar emails** en la bandeja de entrada

## 🚨 Solución de problemas

### Error: "Authentication failed"

- Verificar que la autenticación de 2 factores esté habilitada
- Verificar que la contraseña de aplicación sea correcta
- Verificar que el email sea correcto

### Error: "Connection timeout"

- Verificar conexión a internet
- Verificar que el puerto 587 esté abierto
- Verificar configuración de firewall

### Error: "Invalid credentials"

- Regenerar contraseña de aplicación
- Verificar que no haya espacios en la contraseña
- Verificar que el email esté bien escrito
