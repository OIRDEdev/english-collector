import apiService from '../api';
import type { Group, ApiResponse } from './types';

export async function getGroup(id: number): Promise<Group> {
  const response = await apiService.api.get<ApiResponse<Group>>(`/groups/${id}`);
  if (!response.data.data) {
    throw new Error('Group not found');
  }
  return response.data.data;
}
