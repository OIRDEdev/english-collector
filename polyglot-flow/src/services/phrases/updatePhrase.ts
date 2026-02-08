import apiService from '../api';
import type { Phrase, UpdatePhraseInput, ApiResponse } from './types';

export async function updatePhrase(id: number, input: UpdatePhraseInput): Promise<Phrase> {
  const response = await apiService.api.put<ApiResponse<Phrase>>(`/phrases/${id}`, input);
  if (!response.data.data) {
    throw new Error(response.data.error || 'Failed to update phrase');
  }
  return response.data.data;
}
