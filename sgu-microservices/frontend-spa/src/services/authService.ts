import api from "../utils/api";
import type {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../types";

export class AuthService {
  /**
   * Iniciar sesión
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al iniciar sesión"
      );
    }
  }

  /**
   * Registrarse
   */
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al registrarse");
    }
  }

  /**
   * Cerrar sesión
   */
  static async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      // Limpiar tokens del localStorage
      localStorage.removeItem("sgu_auth_token");
      localStorage.removeItem("sgu_refresh_token");
    }
  }

  /**
   * Obtener perfil del usuario
   */
  static async getProfile(): Promise<User> {
    try {
      const response = await api.get("/auth/profile");
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al obtener el perfil"
      );
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem("sgu_auth_token");
    return !!token;
  }

  /**
   * Obtener token de autenticación
   */
  static getToken(): string | null {
    return localStorage.getItem("sgu_auth_token");
  }

  /**
   * Establecer tokens de autenticación
   */
  static setTokens(token: string, refreshToken: string): void {
    localStorage.setItem("sgu_auth_token", token);
    localStorage.setItem("sgu_refresh_token", refreshToken);
  }
}
