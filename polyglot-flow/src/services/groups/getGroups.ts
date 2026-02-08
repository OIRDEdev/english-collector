import apiService from '../api';
import type { Group, ApiResponse } from './types';

export async function getGroups(): Promise<Group[]> {
  const response = await apiService.api.get<ApiResponse<Group[]>>('/groups');
  return response.data.data ?? [];
}
