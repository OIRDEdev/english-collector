import apiService from '../api';
import type { ApiResponse } from './types';

export async function deletePhrase(id: number): Promise<void> {
  const response = await apiService.api.delete<ApiResponse<null>>(`/phrases/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to delete phrase');
  }
}
