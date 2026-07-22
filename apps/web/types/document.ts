export type DocumentCategory = 'OFFER'|'ORDER'|'INVOICE'|'DELIVERY_NOTE'|'TEST_REPORT'|'PLAN'|'PHOTO'|'OTHER';
export interface ProjectDocument {
  id:string; projectId:string; taskId:string|null; diaryEntryId:string|null; groupId:string; version:number;
  name:string; originalName:string; mimeType:string; size:number; category:DocumentCategory; description:string|null;
  createdAt:string; previewUrl:string; downloadUrl:string;
  uploadedBy:{id:string;firstName:string;lastName:string}; task?:{id:string;title:string}|null;
}
