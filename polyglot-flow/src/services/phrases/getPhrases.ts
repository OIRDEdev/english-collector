import apiService from '../api';
import type { PhraseWithDetails, PaginatedResult, PaginationParams } from './types';

export async function getPhrases(params?: PaginationParams): Promise<PaginatedResult<PhraseWithDetails>> {
  const queryParams = new URLSearchParams();
  
  if (params?.cursor) {
    queryParams.set('cursor', params.cursor);
  }
  if (params?.limit) {
    queryParams.set('limit', params.limit.toString());
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/phrases?${queryString}` : '/phrases';
  
  const response = await apiService.api.get<PaginatedResult<PhraseWithDetails>>(url);
  return response.data;
}
