import api from "../utils/api";
import type { Course, CourseFilters } from "../types";

export class CoursesService {
  /**
   * Obtener todos los cursos
   */
  static async getCourses(filters?: CourseFilters): Promise<Course[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`/courses?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al obtener los cursos"
      );
    }
  }

  /**
   * Obtener un curso por ID
   */
  static async getCourse(id: string): Promise<Course> {
    try {
      const response = await api.get(`/courses/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al obtener el curso"
      );
    }
  }

  /**
   * Crear un nuevo curso (solo administradores)
   */
  static async createCourse(courseData: Partial<Course>): Promise<Course> {
    try {
      const response = await api.post("/courses", courseData);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al crear el curso"
      );
    }
  }

  /**
   * Actualizar un curso (solo administradores)
   */
  static async updateCourse(
    id: string,
    courseData: Partial<Course>
  ): Promise<Course> {
    try {
      const response = await api.put(`/courses/${id}`, courseData);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al actualizar el curso"
      );
    }
  }

  /**
   * Eliminar un curso (solo administradores)
   */
  static async deleteCourse(id: string): Promise<void> {
    try {
      await api.delete(`/courses/${id}`);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al eliminar el curso"
      );
    }
  }

  /**
   * Obtener estadísticas de cursos
   */
  static async getCourseStats(): Promise<any> {
    try {
      const response = await api.get("/courses/stats");
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al obtener las estadísticas"
      );
    }
  }
}
