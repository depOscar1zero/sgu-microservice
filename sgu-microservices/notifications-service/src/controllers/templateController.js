const NotificationTemplate = require("../models/NotificationTemplate");
const logger = require("../utils/logger");

class TemplateController {
  // Crear template
  async createTemplate(req, res) {
    try {
      const {
        name,
        description,
        type,
        category,
        subject,
        content,
        htmlContent,
        variables = [],
        settings = {},
        tags = [],
      } = req.body;

      // Validar datos requeridos
      if (!name || !type || !category || !subject || !content) {
        return res.status(400).json({
          success: false,
          message: "Faltan datos requeridos",
        });
      }

      // Verificar si el template ya existe
      const existingTemplate = await NotificationTemplate.findOne({ name });
      if (existingTemplate) {
        return res.status(409).json({
          success: false,
          message: "Ya existe un template con este nombre",
        });
      }

      // Crear template
      const template = new NotificationTemplate({
        name,
        description,
        type,
        category,
        subject,
        content,
        htmlContent,
        variables,
        settings,
        tags,
        createdBy: req.user?.id || "system",
      });

      await template.save();

      logger.info("Template created successfully", {
        templateId: template._id,
        name,
        type,
        category,
      });

      res.status(201).json({
        success: true,
        data: template,
        message: "Template creado exitosamente",
      });
    } catch (error) {
      logger.error("Failed to create template:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Obtener todos los templates
  async getTemplates(req, res) {
    try {
      const {
        type,
        category,
        isActive = true,
        limit = 50,
        skip = 0,
      } = req.query;

      let query = { isActive: isActive === "true" };

      if (type) {
        query.type = type;
      }

      if (category) {
        query.category = category;
      }

      const templates = await NotificationTemplate.find(query)
        .sort({ name: 1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await NotificationTemplate.countDocuments(query);

      res.json({
        success: true,
        data: templates,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error("Failed to get templates:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Obtener template por ID
  async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const template = await NotificationTemplate.findById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template no encontrado",
        });
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      logger.error("Failed to get template:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Obtener template por nombre
  async getTemplateByName(req, res) {
    try {
      const { name } = req.params;
      const template = await NotificationTemplate.findByName(name);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template no encontrado",
        });
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      logger.error("Failed to get template by name:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Actualizar template
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const template = await NotificationTemplate.findById(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template no encontrado",
        });
      }

      // Actualizar campos
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          template[key] = updateData[key];
        }
      });

      template.lastModifiedBy = req.user?.id || "system";
      await template.save();

      logger.info("Template updated successfully", {
        templateId: template._id,
        name: template.name,
      });

      res.json({
        success: true,
        data: template,
        message: "Template actualizado exitosamente",
      });
    } catch (error) {
      logger.error("Failed to update template:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Eliminar template
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const template = await NotificationTemplate.findById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template no encontrado",
        });
      }

      // Soft delete - marcar como inactivo
      template.isActive = false;
      await template.save();

      logger.info("Template deleted successfully", {
        templateId: template._id,
        name: template.name,
      });

      res.json({
        success: true,
        message: "Template eliminado exitosamente",
      });
    } catch (error) {
      logger.error("Failed to delete template:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Renderizar template
  async renderTemplate(req, res) {
    try {
      const { id } = req.params;
      const { variables = {} } = req.body;

      const template = await NotificationTemplate.findById(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template no encontrado",
        });
      }

      // Validar variables requeridas
      try {
        template.validateVariables(variables);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      // Renderizar template
      const rendered = template.render(variables);

      res.json({
        success: true,
        data: rendered,
        message: "Template renderizado exitosamente",
      });
    } catch (error) {
      logger.error("Failed to render template:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Obtener templates por categoría
  async getTemplatesByCategory(req, res) {
    try {
      const { category } = req.params;
      const { isActive = true } = req.query;

      const templates = await NotificationTemplate.findByCategory(
        category,
        isActive === "true"
      );

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      logger.error("Failed to get templates by category:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Obtener templates por tipo
  async getTemplatesByType(req, res) {
    try {
      const { type } = req.params;
      const { isActive = true } = req.query;

      const templates = await NotificationTemplate.findByType(
        type,
        isActive === "true"
      );

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      logger.error("Failed to get templates by type:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Duplicar template
  async duplicateTemplate(req, res) {
    try {
      const { id } = req.params;
      const { newName } = req.body;

      const originalTemplate = await NotificationTemplate.findById(id);
      if (!originalTemplate) {
        return res.status(404).json({
          success: false,
          message: "Template no encontrado",
        });
      }

      // Verificar si el nuevo nombre ya existe
      const existingTemplate = await NotificationTemplate.findOne({
        name: newName,
      });
      if (existingTemplate) {
        return res.status(409).json({
          success: false,
          message: "Ya existe un template con este nombre",
        });
      }

      // Crear copia del template
      const duplicatedTemplate = new NotificationTemplate({
        ...originalTemplate.toObject(),
        _id: undefined,
        name: newName,
        version: 1,
        createdBy: req.user?.id || "system",
        lastModifiedBy: req.user?.id || "system",
      });

      await duplicatedTemplate.save();

      logger.info("Template duplicated successfully", {
        originalId: originalTemplate._id,
        newId: duplicatedTemplate._id,
        newName,
      });

      res.status(201).json({
        success: true,
        data: duplicatedTemplate,
        message: "Template duplicado exitosamente",
      });
    } catch (error) {
      logger.error("Failed to duplicate template:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }
}

module.exports = new TemplateController();
