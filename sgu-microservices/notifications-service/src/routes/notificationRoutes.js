const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const templateController = require("../controllers/templateController");
const authMiddleware = require("../middleware/authMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");

// Middleware de autenticación para todas las rutas
router.use(authMiddleware.authenticateToken);

// Rutas de notificaciones
router.post(
  "/",
  validationMiddleware.validateNotification,
  notificationController.createNotification
);
router.get("/user/:userId", notificationController.getUserNotifications);
router.get("/:id", notificationController.getNotificationById);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/:id/cancel", notificationController.cancelNotification);
router.post("/:id/resend", notificationController.resendNotification);
router.get("/stats", notificationController.getStats);
router.post(
  "/send-immediate",
  validationMiddleware.validateImmediateNotification,
  notificationController.sendImmediateNotification
);
router.post(
  "/process-pending",
  notificationController.processPendingNotifications
);

// Rutas de templates
router.post(
  "/templates",
  validationMiddleware.validateTemplate,
  templateController.createTemplate
);
router.get("/templates", templateController.getTemplates);
router.get("/templates/:id", templateController.getTemplateById);
router.get("/templates/name/:name", templateController.getTemplateByName);
router.put("/templates/:id", templateController.updateTemplate);
router.delete("/templates/:id", templateController.deleteTemplate);
router.post("/templates/:id/render", templateController.renderTemplate);
router.get(
  "/templates/category/:category",
  templateController.getTemplatesByCategory
);
router.get("/templates/type/:type", templateController.getTemplatesByType);
router.post("/templates/:id/duplicate", templateController.duplicateTemplate);

module.exports = router;
