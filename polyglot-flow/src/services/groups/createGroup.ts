import apiService from '../api';
import type { Group, CreateGroupInput, ApiResponse } from './types';

export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const response = await apiService.api.post<ApiResponse<Group>>('/groups', input);
  if (!response.data.data) {
    throw new Error(response.data.error || 'Failed to create group');
  }
  return response.data.data;
}
