import apiService from '../api';
import type { Phrase, ApiResponse } from './types';

export async function getPhrase(id: number): Promise<Phrase> {
  const response = await apiService.api.get<ApiResponse<Phrase>>(`/phrases/${id}`);
  if (!response.data.data) {
    throw new Error('Phrase not found');
  }
  return response.data.data;
}
