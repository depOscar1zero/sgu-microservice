/**
 * Domain Service: EnrollmentDomainService
 * Contiene lógica de dominio que no pertenece a una entidad específica
 * Aplicando principios de Domain-Driven Design (DDD)
 */

const { EnrollmentStatus } = require('../value-objects/EnrollmentStatus');

class EnrollmentDomainService {
  /**
   * Verifica si un estudiante puede inscribirse a un curso
   * @param {string} studentId - ID del estudiante
   * @param {string} courseId - ID del curso
   * @param {Array} existingEnrollments - Inscripciones existentes del estudiante
   * @param {Object} courseInfo - Información del curso
   * @param {Object} prerequisites - Prerrequisitos del curso
   * @returns {Object} - Resultado de la validación
   */
  static canStudentEnroll(
    studentId,
    courseId,
    existingEnrollments,
    courseInfo,
    prerequisites
  ) {
    const errors = [];
    const warnings = [];

    // Verificar si ya está inscrito en el curso
    const alreadyEnrolled = existingEnrollments.find(
      enrollment =>
        enrollment.courseId === courseId &&
        [
          EnrollmentStatus.PENDING,
          EnrollmentStatus.CONFIRMED,
          EnrollmentStatus.PAID,
        ].includes(enrollment.status)
    );

    if (alreadyEnrolled) {
      errors.push('El estudiante ya está inscrito en este curso');
    }

    // Verificar capacidad del curso
    if (courseInfo.enrolled >= courseInfo.capacity) {
      errors.push('El curso está lleno');
    }

    // Verificar prerrequisitos
    if (prerequisites && prerequisites.length > 0) {
      const completedCourses = existingEnrollments
        .filter(enrollment => enrollment.status === EnrollmentStatus.COMPLETED)
        .map(enrollment => enrollment.courseId);

      const missingPrerequisites = prerequisites.filter(
        prerequisite => !completedCourses.includes(prerequisite)
      );

      if (missingPrerequisites.length > 0) {
        errors.push(
          `Faltan prerrequisitos: ${missingPrerequisites.join(', ')}`
        );
      }
    }

    // Verificar límite de inscripciones activas
    const activeEnrollments = existingEnrollments.filter(enrollment =>
      [
        EnrollmentStatus.PENDING,
        EnrollmentStatus.CONFIRMED,
        EnrollmentStatus.PAID,
      ].includes(enrollment.status)
    );

    if (activeEnrollments.length >= 8) {
      // Límite configurable
      errors.push('Has alcanzado el límite máximo de inscripciones activas');
    }

    // Verificar si el curso está disponible
    if (courseInfo.status !== 'ACTIVE') {
      errors.push('El curso no está disponible para inscripción');
    }

    // Verificar si el curso es visible
    if (!courseInfo.isVisible) {
      errors.push('El curso no está visible para inscripción');
    }

    return {
      canEnroll: errors.length === 0,
      errors,
      warnings,
      missingPrerequisites: prerequisites
        ? prerequisites.filter(
            prerequisite =>
              !existingEnrollments
                .filter(
                  enrollment => enrollment.status === EnrollmentStatus.COMPLETED
                )
                .map(enrollment => enrollment.courseId)
                .includes(prerequisite)
          )
        : [],
    };
  }

  /**
   * Calcula el monto total de inscripciones de un estudiante
   * @param {Array} enrollments - Inscripciones del estudiante
   * @returns {Object} - Resumen financiero
   */
  static calculateStudentFinancialSummary(enrollments) {
    const summary = {
      totalEnrollments: enrollments.length,
      activeEnrollments: 0,
      completedEnrollments: 0,
      cancelledEnrollments: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      refundedAmount: 0,
    };

    enrollments.forEach(enrollment => {
      if (
        [
          EnrollmentStatus.PENDING,
          EnrollmentStatus.CONFIRMED,
          EnrollmentStatus.PAID,
        ].includes(enrollment.status)
      ) {
        summary.activeEnrollments++;
      } else if (enrollment.status === EnrollmentStatus.COMPLETED) {
        summary.completedEnrollments++;
      } else if (enrollment.status === EnrollmentStatus.CANCELLED) {
        summary.cancelledEnrollments++;
      }

      summary.totalAmount += enrollment.amount || 0;

      if (enrollment.paymentStatus === 'Paid') {
        summary.paidAmount += enrollment.amount || 0;
      } else if (enrollment.paymentStatus === 'Pending') {
        summary.pendingAmount += enrollment.amount || 0;
      } else if (enrollment.paymentStatus === 'Refunded') {
        summary.refundedAmount += enrollment.amount || 0;
      }
    });

    return summary;
  }

  /**
   * Verifica si un estudiante puede cancelar una inscripción
   * @param {Object} enrollment - Inscripción a cancelar
   * @param {Date} currentDate - Fecha actual
   * @returns {Object} - Resultado de la validación
   */
  static canCancelEnrollment(enrollment, currentDate = new Date()) {
    const errors = [];
    const warnings = [];

    // Verificar si la inscripción puede ser cancelada
    if (!enrollment.canBeCancelled()) {
      errors.push('Esta inscripción no puede ser cancelada');
    }

    // Verificar si ha pasado el plazo de cancelación (24 horas)
    const enrollmentDate = new Date(enrollment.enrollmentDate);
    const hoursSinceEnrollment =
      (currentDate - enrollmentDate) / (1000 * 60 * 60);

    if (hoursSinceEnrollment > 24) {
      warnings.push('Ha pasado el plazo de cancelación (24 horas)');
    }

    // Verificar si ya se ha pagado
    if (enrollment.paymentStatus === 'Paid') {
      warnings.push('La inscripción ya ha sido pagada, se requerirá reembolso');
    }

    return {
      canCancel: errors.length === 0,
      errors,
      warnings,
      hoursSinceEnrollment: Math.round(hoursSinceEnrollment * 100) / 100,
    };
  }

  /**
   * Calcula estadísticas de un curso
   * @param {Array} enrollments - Inscripciones del curso
   * @returns {Object} - Estadísticas del curso
   */
  static calculateCourseStatistics(enrollments) {
    const stats = {
      totalEnrollments: enrollments.length,
      activeEnrollments: 0,
      completedEnrollments: 0,
      cancelledEnrollments: 0,
      averageGrade: 0,
      averageAttendance: 0,
      totalRevenue: 0,
      paidRevenue: 0,
    };

    let totalGrades = 0;
    let totalAttendance = 0;
    let gradeCount = 0;
    let attendanceCount = 0;

    enrollments.forEach(enrollment => {
      if (
        [
          EnrollmentStatus.PENDING,
          EnrollmentStatus.CONFIRMED,
          EnrollmentStatus.PAID,
        ].includes(enrollment.status)
      ) {
        stats.activeEnrollments++;
      } else if (enrollment.status === EnrollmentStatus.COMPLETED) {
        stats.completedEnrollments++;
      } else if (enrollment.status === EnrollmentStatus.CANCELLED) {
        stats.cancelledEnrollments++;
      }

      stats.totalRevenue += enrollment.amount || 0;

      if (enrollment.paymentStatus === 'Paid') {
        stats.paidRevenue += enrollment.amount || 0;
      }

      if (enrollment.grade !== null && enrollment.grade !== undefined) {
        totalGrades += enrollment.grade;
        gradeCount++;
      }

      if (
        enrollment.attendancePercentage !== null &&
        enrollment.attendancePercentage !== undefined
      ) {
        totalAttendance += enrollment.attendancePercentage;
        attendanceCount++;
      }
    });

    if (gradeCount > 0) {
      stats.averageGrade = Math.round((totalGrades / gradeCount) * 100) / 100;
    }

    if (attendanceCount > 0) {
      stats.averageAttendance =
        Math.round((totalAttendance / attendanceCount) * 100) / 100;
    }

    return stats;
  }

  /**
   * Verifica si un estudiante cumple con los prerrequisitos
   * @param {Array} prerequisites - Prerrequisitos del curso
   * @param {Array} completedCourses - Cursos completados por el estudiante
   * @returns {Object} - Resultado de la verificación
   */
  static checkPrerequisites(prerequisites, completedCourses) {
    if (!prerequisites || prerequisites.length === 0) {
      return {
        meetsPrerequisites: true,
        missingPrerequisites: [],
      };
    }

    const missingPrerequisites = prerequisites.filter(
      prerequisite => !completedCourses.includes(prerequisite)
    );

    return {
      meetsPrerequisites: missingPrerequisites.length === 0,
      missingPrerequisites,
    };
  }
}

module.exports = EnrollmentDomainService;
