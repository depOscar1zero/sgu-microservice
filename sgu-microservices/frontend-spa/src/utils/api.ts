import axios, { AxiosInstance, AxiosResponse } from "axios";
import type {
  User,
  Course,
  Enrollment,
  Payment,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
  PaginatedResponse,
  DashboardStats,
  CourseFilters,
  EnrollmentFilters,
  PaymentFilters,
} from "@/types";

// Configuración de la API
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const AUTH_TOKEN_KEY = "sgu_auth_token";
const REFRESH_TOKEN_KEY = "sgu_refresh_token";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Interceptor para agregar token de autenticación
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para manejar respuestas y errores
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expirado, intentar refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Reintentar la petición original
            return this.client.request(error.config);
          } else {
            // Si no se puede refrescar, redirigir al login
            this.clearAuth();
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Métodos de autenticación
  private getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  private setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  private clearAuth(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      if (response.data.success) {
        this.setTokens(
          response.data.data.token,
          response.data.data.refreshToken
        );
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Métodos de autenticación
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> =
      await this.client.post("/auth/login", credentials);
    if (response.data.success && response.data.data) {
      this.setTokens(response.data.data.token, response.data.data.refreshToken);
      return response.data.data;
    }
    throw new Error(response.data.message || "Error en el login");
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> =
      await this.client.post("/auth/register", userData);
    if (response.data.success && response.data.data) {
      this.setTokens(response.data.data.token, response.data.data.refreshToken);
      return response.data.data;
    }
    throw new Error(response.data.message || "Error en el registro");
  }

  async logout(): Promise<void> {
    try {
      await this.client.post("/auth/logout");
    } finally {
      this.clearAuth();
    }
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.get(
      "/auth/profile"
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Error al obtener el perfil");
  }

  // Métodos para cursos
  async getCourses(filters?: CourseFilters): Promise<Course[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response: AxiosResponse<ApiResponse<Course[]>> =
      await this.client.get(`/courses?${params.toString()}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Error al obtener los cursos");
  }

  async getCourse(id: string): Promise<Course> {
    const response: AxiosResponse<ApiResponse<Course>> = await this.client.get(
      `/courses/${id}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Error al obtener el curso");
  }

  // Métodos para inscripciones
  async getEnrollments(filters?: EnrollmentFilters): Promise<Enrollment[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response: AxiosResponse<ApiResponse<Enrollment[]>> =
      await this.client.get(`/enrollments?${params.toString()}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(
      response.data.message || "Error al obtener las inscripciones"
    );
  }

  async enrollInCourse(courseId: string): Promise<Enrollment> {
    const response: AxiosResponse<ApiResponse<Enrollment>> =
      await this.client.post("/enrollments", { courseId });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(
      response.data.message || "Error al inscribirse en el curso"
    );
  }

  async cancelEnrollment(enrollmentId: string, reason?: string): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await this.client.delete(
      `/enrollments/${enrollmentId}`,
      {
        data: { reason },
      }
    );
    if (!response.data.success) {
      throw new Error(
        response.data.message || "Error al cancelar la inscripción"
      );
    }
  }

  // Métodos para pagos
  async getPayments(filters?: PaymentFilters): Promise<Payment[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response: AxiosResponse<ApiResponse<Payment[]>> =
      await this.client.get(`/payments?${params.toString()}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Error al obtener los pagos");
  }

  async createPayment(
    enrollmentId: string,
    amount: number,
    paymentMethod: string
  ): Promise<Payment> {
    const response: AxiosResponse<ApiResponse<Payment>> =
      await this.client.post("/payments", {
        enrollmentId,
        amount,
        paymentMethod,
      });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Error al crear el pago");
  }

  async processPayment(paymentId: string, paymentData: any): Promise<Payment> {
    const response: AxiosResponse<ApiResponse<Payment>> =
      await this.client.post(`/payments/${paymentId}/process`, paymentData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Error al procesar el pago");
  }

  // Métodos para estadísticas
  async getDashboardStats(): Promise<DashboardStats> {
    const response: AxiosResponse<ApiResponse<DashboardStats>> =
      await this.client.get("/dashboard/stats");
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(
      response.data.message || "Error al obtener las estadísticas"
    );
  }
}

// Instancia singleton
export const apiClient = new ApiClient();
export default apiClient;
