import { api } from '@/lib/api';
import type { Project, ProjectPayload, ProjectStatus } from '@/types/project';

interface ProjectFilters {
  search?: string;
  status?: ProjectStatus | 'ALL';
}

export async function getProjects(filters: ProjectFilters = {}): Promise<Project[]> {
  const response = await api.get<Project[]>('/projects', {
    params: {
      ...(filters.search ? { q: filters.search } : {}),
      ...(filters.status && filters.status !== 'ALL'
        ? { status: filters.status }
        : {}),
    },
  });

  return response.data;
}

export async function getProject(id: string): Promise<Project> {
  const response = await api.get<Project>(`/projects/${id}`);
  return response.data;
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const response = await api.post<Project>('/projects', payload);
  return response.data;
}

export async function updateProject(
  id: string,
  payload: ProjectPayload,
): Promise<Project> {
  const response = await api.put<Project>(`/projects/${id}`, payload);
  return response.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}
