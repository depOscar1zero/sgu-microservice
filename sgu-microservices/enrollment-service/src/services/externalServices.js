const axios = require('axios');
require('dotenv').config();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const COURSES_SERVICE_URL = process.env.COURSES_SERVICE_URL || 'http://localhost:3002';
const SERVICE_TIMEOUT = parseInt(process.env.SERVICE_TIMEOUT) || 5000;

/**
 * Cliente para comunicarse con el Auth Service
 */
class AuthServiceClient {
  /**
   * Verificar token y obtener información del usuario
   */
  static async verifyToken(token) {
    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: SERVICE_TIMEOUT
      });

      return {
        success: true,
        data: response.data.data.user
      };
    } catch (error) {
      console.error('Error verificando token:', error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error verificando autenticación'
      };
    }
  }

  /**
   * Obtener información de un usuario por ID
   */
  static async getUserById(userId, token) {
    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: SERVICE_TIMEOUT
      });

      return {
        success: true,
        data: response.data.data.user
      };
    } catch (error) {
      console.error('Error obteniendo usuario:', error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error obteniendo información del usuario'
      };
    }
  }
}

/**
 * Cliente para comunicarse con el Courses Service
 */
class CoursesServiceClient {
  /**
   * Obtener información de un curso por ID
   */
  static async getCourseById(courseId) {
    try {
      const response = await axios.get(`${COURSES_SERVICE_URL}/api/courses/${courseId}`, {
        timeout: SERVICE_TIMEOUT
      });

      return {
        success: true,
        data: response.data.data.course
      };
    } catch (error) {
      console.error('Error obteniendo curso:', error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error obteniendo información del curso'
      };
    }
  }

  /**
   * Reservar cupos en un curso
   */
  static async reserveSlots(courseId, quantity = 1) {
    try {
      const response = await axios.post(
        `${COURSES_SERVICE_URL}/api/courses/${courseId}/reserve`,
        { quantity },
        { timeout: SERVICE_TIMEOUT }
      );

      return {
        success: true,
        data: response.data.data.course
      };
    } catch (error) {
      console.error('Error reservando cupos:', error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error reservando cupos en el curso'
      };
    }
  }

  /**
   * Liberar cupos en un curso
   */
  static async releaseSlots(courseId, quantity = 1) {
    try {
      const response = await axios.post(
        `${COURSES_SERVICE_URL}/api/courses/${courseId}/release`,
        { quantity },
        { timeout: SERVICE_TIMEOUT }
      );

      return {
        success: true,
        data: response.data.data.course
      };
    } catch (error) {
      console.error('Error liberando cupos:', error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error liberando cupos del curso'
      };
    }
  }

  /**
   * Verificar disponibilidad de un curso
   */
  static async checkCourseAvailability(courseId) {
    try {
      const courseResult = await this.getCourseById(courseId);
      
      if (!courseResult.success) {
        return courseResult;
      }

      const course = courseResult.data;
      
      return {
        success: true,
        data: {
          ...course,
          isAvailable: course.status === 'Activo' && course.availableSlots > 0,
          canEnroll: course.status === 'Activo' && course.availableSlots > 0
        }
      };
    } catch (error) {
      console.error('Error verificando disponibilidad:', error.message);
      return {
        success: false,
        error: 'Error verificando disponibilidad del curso'
      };
    }
  }

  /**
   * Verificar prerrequisitos de un curso
   */
  static async checkPrerequisites(courseId, userId, token) {
    try {
      const courseResult = await this.getCourseById(courseId);
      
      if (!courseResult.success) {
        return courseResult;
      }

      const course = courseResult.data;
      
      // Si no hay prerrequisitos, el estudiante puede inscribirse
      if (!course.prerequisites || course.prerequisites.length === 0) {
        return {
          success: true,
          data: {
            canEnroll: true,
            missingPrerequisites: []
          }
        };
      }

      // TODO: Implementar verificación real de prerrequisitos
      // Por ahora, asumimos que el estudiante cumple todos los prerrequisitos
      return {
        success: true,
        data: {
          canEnroll: true,
          missingPrerequisites: [],
          completedPrerequisites: course.prerequisites
        }
      };
    } catch (error) {
      console.error('Error verificando prerrequisitos:', error.message);
      return {
        success: false,
        error: 'Error verificando prerrequisitos del curso'
      };
    }
  }
}

/**
 * Función de utilidad para manejar errores de servicios externos
 */
const handleServiceError = (error, serviceName) => {
  if (error.code === 'ECONNREFUSED') {
    return `${serviceName} no está disponible`;
  }
  
  if (error.code === 'ENOTFOUND') {
    return `No se puede conectar con ${serviceName}`;
  }
  
  if (error.message.includes('timeout')) {
    return `Tiempo de espera agotado para ${serviceName}`;
  }
  
  return error.response?.data?.message || `Error en ${serviceName}`;
};

module.exports = {
  AuthServiceClient,
  CoursesServiceClient,
  handleServiceError
};