import { apiClient } from './client';
import { CompaniesResponse, CompanyDetail } from '@/types/company';

export const companiesApi = {
  /**
   * Get all companies with search, sort, and pagination
   */
  getAll: async (params?: {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<CompaniesResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get<CompaniesResponse>(
      `/companies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    return response;
  },

  /**
   * Get single company by ID
   */
  getById: async (id: string | number): Promise<CompanyDetail> => {
    const response = await apiClient.get<CompanyDetail>(`/companies/${id}`);
    return response;
  }
};
