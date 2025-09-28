import api from "../utils/api";
import type { Enrollment, EnrollmentFilters } from "../types";

export class EnrollmentsService {
  /**
   * Obtener inscripciones del usuario
   */
  static async getEnrollments(
    filters?: EnrollmentFilters
  ): Promise<Enrollment[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`/enrollments?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al obtener las inscripciones"
      );
    }
  }

  /**
   * Inscribirse en un curso
   */
  static async enrollInCourse(courseId: string): Promise<Enrollment> {
    try {
      const response = await api.post("/enrollments", { courseId });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al inscribirse en el curso"
      );
    }
  }

  /**
   * Cancelar inscripción
   */
  static async cancelEnrollment(
    enrollmentId: string,
    reason?: string
  ): Promise<void> {
    try {
      await api.delete(`/enrollments/${enrollmentId}`, {
        data: { reason },
      });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al cancelar la inscripción"
      );
    }
  }

  /**
   * Obtener una inscripción por ID
   */
  static async getEnrollment(id: string): Promise<Enrollment> {
    try {
      const response = await api.get(`/enrollments/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al obtener la inscripción"
      );
    }
  }

  /**
   * Obtener estadísticas de inscripciones
   */
  static async getEnrollmentStats(): Promise<any> {
    try {
      const response = await api.get("/enrollments/stats");
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al obtener las estadísticas"
      );
    }
  }
}
