import { api } from '@/lib/api';
import type { Material, MaterialBooking, MaterialBookingPayload, MaterialPayload } from '@/types/material';
export async function getMaterials(q=''){ return (await api.get<Material[]>('/materials',{params:{q}})).data; }
export async function createMaterial(payload:MaterialPayload){ return (await api.post<Material>('/materials',payload)).data; }
export async function updateMaterial(id:string,payload:MaterialPayload){ return (await api.put<Material>(`/materials/${id}`,payload)).data; }
export async function getProjectMaterialBookings(projectId:string){ return (await api.get<MaterialBooking[]>(`/materials/projects/${projectId}`)).data; }
export async function createMaterialBooking(projectId:string,payload:MaterialBookingPayload){ return (await api.post<MaterialBooking>(`/materials/projects/${projectId}/bookings`,payload)).data; }
export async function deleteMaterialBooking(id:string){ await api.delete(`/materials/bookings/${id}`); }
