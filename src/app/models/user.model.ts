export interface User {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  college: string;
  contact: string;
  role?: string; // Add role field for admin/student differentiation
}

export interface Admin {
  adminId: number;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  token: string | null;
  user: User | Admin | null;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  college: string;
  contact: string;
}
