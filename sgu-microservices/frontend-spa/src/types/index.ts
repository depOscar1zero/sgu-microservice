// Tipos para el Sistema de Gestión Universitaria (SGU)

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "student" | "admin" | "teacher";
  studentId?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  credits: number;
  semester: string;
  year: number;
  teacherId: string;
  teacherName: string;
  maxStudents: number;
  currentStudents: number;
  isActive: boolean;
  schedule: CourseSchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseSchedule {
  id: string;
  dayOfWeek: number; // 0-6 (Domingo-Sábado)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  classroom: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  enrollmentDate: string;
  approvedDate?: string;
  rejectedDate?: string;
  cancelledDate?: string;
  reason?: string;
  course: Course;
  student: User;
}

export interface Payment {
  id: string;
  studentId: string;
  enrollmentId: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  paymentMethod: "credit_card" | "debit_card" | "bank_transfer" | "cash";
  stripePaymentIntentId?: string;
  description: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedAt?: string;
  refundedAt?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  studentId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para estadísticas
export interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
  totalPayments: number;
  pendingEnrollments: number;
  completedPayments: number;
  monthlyRevenue: number;
}

// Tipos para filtros y búsquedas
export interface CourseFilters {
  semester?: string;
  year?: number;
  teacherId?: string;
  isActive?: boolean;
  search?: string;
}

export interface EnrollmentFilters {
  studentId?: string;
  courseId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaymentFilters {
  studentId?: string;
  status?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
}
