import { apiClient } from './client';

export interface DatasetImportResponse {
  success: boolean;
  message: string;
  results: {
    total: number;
    success: number;
    skipped: number;
    failed: number;
  };
}

export const datasetApi = {
  importDataset: async (zipUrl: string, maxCompanies?: number): Promise<DatasetImportResponse> => {
    const response = await apiClient.post('/dataset', { 
      irsZipUrl: zipUrl,
      maxCompanies: maxCompanies || undefined
    });
    return response.data;
  }
};
