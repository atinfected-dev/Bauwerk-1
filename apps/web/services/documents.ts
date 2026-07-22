import { api } from '@/lib/api';
import type { DocumentCategory, ProjectDocument } from '@/types/document';
const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
export function documentContentUrl(path:string){ return `${base}${path}`; }
export async function getProjectDocuments(projectId:string, search='', category='') {
  return (await api.get<ProjectDocument[]>(`/documents/projects/${projectId}`, { params: { search: search || undefined, category: category || undefined } })).data;
}
export async function uploadProjectDocuments(projectId:string, files:File[], category:DocumentCategory, description='') {
  const data = new FormData(); files.forEach((file)=>data.append('files',file)); data.append('category',category); data.append('description',description);
  return (await api.post<ProjectDocument[]>(`/documents/projects/${projectId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
}
export async function uploadDocumentVersion(id:string,file:File){ const data=new FormData(); data.append('file',file); return (await api.post<ProjectDocument>(`/documents/${id}/versions`,data,{headers:{'Content-Type':'multipart/form-data'}})).data; }
export async function getDocumentVersions(id:string){ return (await api.get<ProjectDocument[]>(`/documents/${id}/versions`)).data; }
export async function deleteDocument(id:string){ await api.delete(`/documents/${id}`); }
