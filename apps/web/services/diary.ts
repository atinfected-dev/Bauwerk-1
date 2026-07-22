import { api } from '@/lib/api';
import type { DiaryEntry, DiaryEntryPayload } from '@/types/diary';

export async function getDiaryEntries(projectId: string): Promise<DiaryEntry[]> {
  const response = await api.get<DiaryEntry[]>(`/diary/projects/${projectId}`);
  return response.data;
}

export async function createDiaryEntry(projectId: string, payload: DiaryEntryPayload): Promise<DiaryEntry> {
  const response = await api.post<DiaryEntry>(`/diary/projects/${projectId}`, payload);
  return response.data;
}

export async function updateDiaryEntry(id: string, payload: DiaryEntryPayload): Promise<DiaryEntry> {
  const response = await api.put<DiaryEntry>(`/diary/${id}`, payload);
  return response.data;
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  await api.delete(`/diary/${id}`);
}
