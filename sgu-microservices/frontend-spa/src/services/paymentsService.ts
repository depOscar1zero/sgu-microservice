import api from "../utils/api";
import type { Payment, PaymentFilters } from "../types";

export class PaymentsService {
  /**
   * Obtener pagos del usuario
   */
  static async getPayments(filters?: PaymentFilters): Promise<Payment[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`/payments?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al obtener los pagos"
      );
    }
  }

  /**
   * Crear un nuevo pago
   */
  static async createPayment(
    enrollmentId: string,
    amount: number,
    paymentMethod: string
  ): Promise<Payment> {
    try {
      const response = await api.post("/payments", {
        enrollmentId,
        amount,
        paymentMethod,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al crear el pago"
      );
    }
  }

  /**
   * Procesar un pago
   */
  static async processPayment(
    paymentId: string,
    paymentData: any
  ): Promise<Payment> {
    try {
      const response = await api.post(
        `/payments/${paymentId}/process`,
        paymentData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al procesar el pago"
      );
    }
  }

  /**
   * Obtener un pago por ID
   */
  static async getPayment(id: string): Promise<Payment> {
    try {
      const response = await api.get(`/payments/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al obtener el pago"
      );
    }
  }

  /**
   * Reembolsar un pago
   */
  static async refundPayment(
    paymentId: string,
    reason?: string
  ): Promise<Payment> {
    try {
      const response = await api.post(`/payments/${paymentId}/refund`, {
        reason,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al reembolsar el pago"
      );
    }
  }

  /**
   * Obtener estadísticas de pagos
   */
  static async getPaymentStats(): Promise<any> {
    try {
      const response = await api.get("/payments/stats");
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al obtener las estadísticas"
      );
    }
  }
}
