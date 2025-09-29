// Script de autenticación para el frontend
class AuthService {
  static async login(credentials) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al iniciar sesión");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(error.message || "Error al iniciar sesión");
    }
  }

  static async register(userData) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrarse");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(error.message || "Error al registrarse");
    }
  }

  static async logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      this.clearAuth();
    }
  }

  static async getProfile() {
    try {
      const response = await fetch("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener el perfil");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(error.message || "Error al obtener el perfil");
    }
  }

  static isAuthenticated() {
    const token = localStorage.getItem("sgu_auth_token");
    return !!token;
  }

  static getToken() {
    return localStorage.getItem("sgu_auth_token");
  }

  static setTokens(token, refreshToken) {
    localStorage.setItem("sgu_auth_token", token);
    localStorage.setItem("sgu_refresh_token", refreshToken);
  }

  static clearAuth() {
    localStorage.removeItem("sgu_auth_token");
    localStorage.removeItem("sgu_refresh_token");
  }
}

// Exportar para uso global
window.AuthService = AuthService;
