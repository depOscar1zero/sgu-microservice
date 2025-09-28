const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * Modelo de Inscripción
 * Representa la inscripción de un estudiante a un curso
 */
const Enrollment = sequelize.define(
  "Enrollment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Referencias a otros servicios
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "ID del usuario desde el Auth Service",
      field: "user_id",
    },

    courseId: {
      type: DataTypes.STRING(24), // MongoDB ObjectId format
      allowNull: false,
      comment: "ID del curso desde el Courses Service",
      field: "course_id",
    },

    // Información del estudiante (desnormalizada para performance)
    studentEmail: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },

    studentName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    studentId: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    // Información del curso (desnormalizada)
    courseCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
      uppercase: true,
    },

    courseName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    courseCredits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12,
      },
    },

    courseSemester: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    // Estado de la inscripción
    status: {
      type: DataTypes.ENUM(
        "Pending", // Pendiente de confirmación
        "Confirmed", // Confirmada
        "Paid", // Pagada
        "Cancelled", // Cancelada
        "Completed", // Completada
        "Failed" // Falló por alguna razón
      ),
      allowNull: false,
      defaultValue: "Pending",
    },

    // Información de pago
    paymentStatus: {
      type: DataTypes.ENUM("Pending", "Paid", "Failed", "Refunded"),
      allowNull: false,
      defaultValue: "Pending",
    },

    paymentId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "ID de la transacción de pago",
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },

    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "USD",
    },

    // Fechas importantes
    enrollmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    confirmationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    cancellationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Información adicional
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    cancellationReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    // Metadatos para auditoría
    enrolledBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment:
        "ID del usuario que realizó la inscripción (puede ser diferente al estudiante)",
      field: "enrolled_by",
    },

    grade: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
      comment: "Calificación final del curso",
    },

    attendancePercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
      field: "attendance_percentage",
    },
  },
  {
    tableName: "enrollments",
    indexes: [
      {
        unique: true,
        fields: ["user_id", "course_id"], // Un estudiante no puede inscribirse dos veces al mismo curso
        name: "unique_user_course_enrollment",
      },
      {
        fields: ["user_id"],
      },
      {
        fields: ["course_id"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["payment_status"],
      },
      {
        fields: ["enrollment_date"],
      },
      {
        fields: ["course_semester"],
      },
    ],
  }
);

/**
 * Métodos de instancia
 */

// Confirmar inscripción
Enrollment.prototype.confirm = async function () {
  this.status = "Confirmed";
  this.confirmationDate = new Date();
  await this.save();
};

// Marcar como pagada
Enrollment.prototype.markAsPaid = async function (paymentId) {
  this.status = "Paid";
  this.paymentStatus = "Paid";
  this.paymentId = paymentId;
  this.paymentDate = new Date();
  await this.save();
};

// Cancelar inscripción
Enrollment.prototype.cancel = async function (reason, cancelledBy) {
  this.status = "Cancelled";
  this.cancellationDate = new Date();
  this.cancellationReason = reason;
  if (cancelledBy) {
    this.enrolledBy = cancelledBy;
  }
  await this.save();
};

// Completar curso
Enrollment.prototype.complete = async function (grade, attendance) {
  this.status = "Completed";
  if (grade !== undefined) this.grade = grade;
  if (attendance !== undefined) this.attendancePercentage = attendance;
  await this.save();
};

// Verificar si puede ser cancelada
Enrollment.prototype.canBeCancelled = function () {
  return ["Pending", "Confirmed", "Paid"].includes(this.status);
};

// Verificar si requiere pago
Enrollment.prototype.requiresPayment = function () {
  return (
    this.paymentStatus === "Pending" &&
    ["Confirmed", "Pending"].includes(this.status)
  );
};

// Obtener información para respuesta pública
Enrollment.prototype.toPublicJSON = function () {
  const enrollment = this.toJSON();
  delete enrollment.notes; // Información sensible
  return enrollment;
};

/**
 * Métodos estáticos
 */

// Buscar inscripciones activas de un usuario
Enrollment.findActiveByUser = function (userId) {
  return this.findAll({
    where: {
      userId,
      status: ["Pending", "Confirmed", "Paid"],
    },
    order: [["enrollmentDate", "DESC"]],
  });
};

// Buscar inscripciones de un curso
Enrollment.findByCourse = function (courseId) {
  return this.findAll({
    where: {
      courseId,
      status: ["Confirmed", "Paid", "Completed"],
    },
    order: [["enrollmentDate", "ASC"]],
  });
};

// Contar inscripciones activas por semestre
Enrollment.countBySemester = function (semester) {
  return this.count({
    where: {
      courseSemester: semester,
      status: ["Confirmed", "Paid", "Completed"],
    },
  });
};

module.exports = Enrollment;
