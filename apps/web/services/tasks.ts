import { api } from '@/lib/api';
import type { ProjectTask, TaskPayload, TaskStatus, TaskUser, TaskComment } from '@/types/task';
export async function getProjectTasks(projectId:string){ return (await api.get<ProjectTask[]>(`/tasks/projects/${projectId}`)).data; }
export async function getTaskUsers(){ return (await api.get<TaskUser[]>('/tasks/users')).data; }
export async function createTask(projectId:string,payload:TaskPayload){ return (await api.post<ProjectTask>(`/tasks/projects/${projectId}`,payload)).data; }
export async function updateTask(id:string,payload:TaskPayload){ return (await api.put<ProjectTask>(`/tasks/${id}`,payload)).data; }
export async function moveTask(id:string,status:TaskStatus,position=0){ return (await api.patch<ProjectTask>(`/tasks/${id}/status`,{status,position})).data; }
export async function addTaskComment(id:string,comment:string){ return (await api.post<TaskComment>(`/tasks/${id}/comments`,{comment})).data; }
export async function deleteTask(id:string){ await api.delete(`/tasks/${id}`); }
