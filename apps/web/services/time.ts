import { api } from '@/lib/api';
import type { ManualTimePayload, StartTimePayload, TimeEntry } from '@/types/time';

export async function getProjectTimeEntries(projectId: string): Promise<TimeEntry[]> {
  const response = await api.get<TimeEntry[]>(`/time/projects/${projectId}`);
  return response.data;
}

export async function getCurrentTimeEntry(): Promise<TimeEntry | null> {
  const response = await api.get<TimeEntry | null>('/time/current');
  return response.data;
}

export async function startTimeEntry(projectId: string, payload: StartTimePayload): Promise<TimeEntry> {
  const response = await api.post<TimeEntry>(`/time/projects/${projectId}/start`, payload);
  return response.data;
}

export async function pauseTimeEntry(id: string): Promise<TimeEntry> {
  const response = await api.post<TimeEntry>(`/time/${id}/pause`);
  return response.data;
}

export async function resumeTimeEntry(id: string): Promise<TimeEntry> {
  const response = await api.post<TimeEntry>(`/time/${id}/resume`);
  return response.data;
}

export async function stopTimeEntry(id: string): Promise<TimeEntry> {
  const response = await api.post<TimeEntry>(`/time/${id}/stop`);
  return response.data;
}

export async function createManualTimeEntry(projectId: string, payload: ManualTimePayload): Promise<TimeEntry> {
  const response = await api.post<TimeEntry>(`/time/projects/${projectId}/manual`, payload);
  return response.data;
}

export async function updateTimeEntry(id: string, payload: ManualTimePayload): Promise<TimeEntry> {
  const response = await api.put<TimeEntry>(`/time/${id}`, payload);
  return response.data;
}

export async function deleteTimeEntry(id: string): Promise<void> {
  await api.delete(`/time/${id}`);
}
