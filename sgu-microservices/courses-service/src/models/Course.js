const mongoose = require("mongoose");

/**
 * Schema para Cursos
 * Representa los cursos disponibles en la universidad
 */
const courseSchema = new mongoose.Schema(
  {
    // Información básica del curso
    code: {
      type: String,
      required: [true, "Código del curso es requerido"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [
        /^[A-Z]{2,4}\d{3,4}$/,
        "Formato de código inválido (ej: MATH101)",
      ],
    },

    name: {
      type: String,
      required: [true, "Nombre del curso es requerido"],
      trim: true,
      maxlength: [100, "Nombre no puede exceder 100 caracteres"],
    },

    description: {
      type: String,
      required: [true, "Descripción del curso es requerida"],
      trim: true,
      maxlength: [1000, "Descripción no puede exceder 1000 caracteres"],
    },

    // Información académica
    department: {
      type: String,
      required: [true, "Departamento es requerido"],
      trim: true,
      enum: [
        "Ingeniería",
        "Matemáticas",
        "Ciencias",
        "Humanidades",
        "Administración",
        "Derecho",
        "Medicina",
        "Arquitectura",
      ],
    },

    credits: {
      type: Number,
      required: [true, "Créditos son requeridos"],
      min: [1, "Mínimo 1 crédito"],
      max: [12, "Máximo 12 créditos"],
    },

    level: {
      type: String,
      required: [true, "Nivel es requerido"],
      enum: ["Pregrado", "Posgrado", "Maestría", "Doctorado"],
    },

    // Configuración del curso
    capacity: {
      type: Number,
      required: [true, "Capacidad es requerida"],
      min: [5, "Capacidad mínima de 5 estudiantes"],
      max: [200, "Capacidad máxima de 200 estudiantes"],
    },

    availableSlots: {
      type: Number,
      required: true,
      min: [0, "Cupos disponibles no puede ser negativo"],
      validate: {
        validator: function (v) {
          return v <= this.capacity;
        },
        message: "Cupos disponibles no puede exceder la capacidad",
      },
    },

    // Costos
    price: {
      type: Number,
      required: [true, "Precio es requerido"],
      min: [0, "Precio no puede ser negativo"],
    },

    currency: {
      type: String,
      required: true,
      default: "USD",
      enum: ["USD", "MXN", "EUR"],
    },

    // Horarios y fechas
    schedule: {
      days: [
        {
          type: String,
          enum: [
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado",
            "Domingo",
          ],
        },
      ],
      startTime: {
        type: String,
        required: [true, "Hora de inicio es requerida"],
        match: [
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "Formato de hora inválido (HH:MM)",
        ],
      },
      endTime: {
        type: String,
        required: [true, "Hora de fin es requerida"],
        match: [
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "Formato de hora inválido (HH:MM)",
        ],
      },
    },

    semester: {
      type: String,
      required: [true, "Semestre es requerido"],
      match: [
        /^(Primavera|Verano|Otoño|Invierno)\s\d{4}$/,
        'Formato: "Primavera 2025"',
      ],
    },

    startDate: {
      type: Date,
      required: [true, "Fecha de inicio es requerida"],
    },

    endDate: {
      type: Date,
      required: [true, "Fecha de fin es requerida"],
      validate: {
        validator: function (v) {
          return v > this.startDate;
        },
        message: "Fecha de fin debe ser posterior a fecha de inicio",
      },
    },

    // Prerrequisitos
    prerequisites: [
      {
        courseCode: {
          type: String,
          uppercase: true,
          trim: true,
        },
        courseName: {
          type: String,
          trim: true,
        },
      },
    ],

    // Instructor
    instructor: {
      name: {
        type: String,
        required: [true, "Nombre del instructor es requerido"],
        trim: true,
      },
      email: {
        type: String,
        required: [true, "Email del instructor es requerido"],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Email inválido"],
      },
      department: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // Estado y metadata
    status: {
      type: String,
      required: true,
      default: "Activo",
      enum: ["Activo", "Inactivo", "Lleno", "Cancelado"],
    },

    isVisible: {
      type: Boolean,
      default: true,
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Información adicional
    syllabus: {
      type: String,
      trim: true,
    },

    materials: [
      {
        name: String,
        type: {
          type: String,
          enum: [
            "Libro",
            "Manual",
            "Software",
            "Material de laboratorio",
            "Otro",
          ],
        },
        required: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt
    versionKey: false, // Elimina __v
  }
);

// Índices para optimizar búsquedas
courseSchema.index({ code: 1 });
courseSchema.index({ department: 1, level: 1 });
courseSchema.index({ status: 1, isVisible: 1 });
courseSchema.index({ semester: 1 });
courseSchema.index({ name: "text", description: "text" }); // Índice de texto para búsqueda

// Virtual para estudiantes inscritos (calculado)
courseSchema.virtual("enrolledCount").get(function () {
  return this.capacity - this.availableSlots;
});

// Virtual para verificar si está lleno
courseSchema.virtual("isFull").get(function () {
  return this.availableSlots === 0;
});

// Método para reservar cupos
courseSchema.methods.reserveSlots = function (quantity = 1) {
  if (this.availableSlots >= quantity) {
    this.availableSlots -= quantity;
    if (this.availableSlots === 0) {
      this.status = "Lleno";
    }
    return true;
  }
  return false;
};

// Método para liberar cupos
courseSchema.methods.releaseSlots = function (quantity = 1) {
  this.availableSlots += quantity;
  if (this.availableSlots > this.capacity) {
    this.availableSlots = this.capacity;
  }
  if (this.status === "Lleno" && this.availableSlots > 0) {
    this.status = "Activo";
  }
};

// Incluir virtuals en JSON
courseSchema.set("toJSON", { virtuals: true });
courseSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Course", courseSchema);
