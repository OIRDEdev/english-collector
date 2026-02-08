import apiService from '../api';
import type { Group, UpdateGroupInput, ApiResponse } from './types';

export async function updateGroup(id: number, input: UpdateGroupInput): Promise<Group> {
  const response = await apiService.api.put<ApiResponse<Group>>(`/groups/${id}`, input);
  if (!response.data.data) {
    throw new Error(response.data.error || 'Failed to update group');
  }
  return response.data.data;
}
