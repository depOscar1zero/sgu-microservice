// Script de prueba para verificar configuración de email
require("dotenv").config({ path: "./.env" });
const nodemailer = require("nodemailer");

console.log("📧 Probando configuración de email...");
console.log(`📧 SMTP Host: ${process.env.SMTP_HOST}`);
console.log(`📧 SMTP Port: ${process.env.SMTP_PORT}`);
console.log(`📧 SMTP User: ${process.env.SMTP_USER}`);
console.log(`📧 Email From: ${process.env.EMAIL_FROM}`);

// Crear transportador
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Función para probar conexión
async function testConnection() {
  try {
    console.log("\n🔍 Probando conexión SMTP...");
    await transporter.verify();
    console.log("✅ Conexión SMTP exitosa");
    return true;
  } catch (error) {
    console.error("❌ Error de conexión SMTP:", error.message);
    return false;
  }
}

// Función para enviar email de prueba
async function sendTestEmail() {
  try {
    console.log("\n📧 Enviando email de prueba...");

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER, // Enviar a ti mismo
      subject: "🧪 Prueba de Notifications Service - SGU",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🧪 Prueba de Notifications Service</h2>
          <p>¡Hola!</p>
          <p>Este es un email de prueba del <strong>Sistema de Gestión Universitaria (SGU)</strong>.</p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>📊 Información del Sistema:</h3>
            <ul>
              <li><strong>Servicio:</strong> Notifications Service</li>
              <li><strong>Versión:</strong> 1.0.0</li>
              <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
              <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</li>
            </ul>
          </div>
          
          <p>Si recibes este email, significa que la configuración de SMTP está funcionando correctamente.</p>
          
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Este es un email automático del Sistema de Gestión Universitaria.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email enviado exitosamente");
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📧 Enviado a: ${process.env.SMTP_USER}`);
    return true;
  } catch (error) {
    console.error("❌ Error enviando email:", error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log("🚀 Iniciando prueba de configuración de email...\n");

  // Verificar variables de entorno
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("❌ Variables de entorno faltantes:");
    console.error("   - SMTP_USER:", process.env.SMTP_USER ? "✅" : "❌");
    console.error("   - SMTP_PASS:", process.env.SMTP_PASS ? "✅" : "❌");
    console.error(
      "\n📝 Por favor, configura estas variables en el archivo .env"
    );
    process.exit(1);
  }

  // Probar conexión
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error("\n❌ No se pudo establecer conexión SMTP");
    console.error("📝 Verifica tu configuración de Gmail:");
    console.error("   1. Autenticación de 2 factores habilitada");
    console.error("   2. Contraseña de aplicación generada");
    console.error("   3. Variables correctas en .env");
    process.exit(1);
  }

  // Enviar email de prueba
  const emailSent = await sendTestEmail();
  if (!emailSent) {
    console.error("\n❌ No se pudo enviar email de prueba");
    process.exit(1);
  }

  console.log("\n🎉 ¡Configuración de email exitosa!");
  console.log("📧 Revisa tu bandeja de entrada para ver el email de prueba");
  console.log(
    "🔔 El Notifications Service está listo para enviar notificaciones reales"
  );
}

// Ejecutar prueba
main().catch(console.error);
