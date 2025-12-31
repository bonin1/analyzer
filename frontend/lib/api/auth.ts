import { apiClient } from './client';
import type { AuthResponse, LoginData, RegisterData, User } from '@/types/auth';

export const authApi = {
  async register(data: RegisterData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', data);
  },

  async login(data: LoginData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', data);
  },

  async logout(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/logout');
  },

  async getProfile(): Promise<{ user: User }> {
    return apiClient.get<{ user: User }>('/auth/profile');
  },
};
