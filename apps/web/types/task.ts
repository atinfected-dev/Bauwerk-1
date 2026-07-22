export type TaskStatus = 'OPEN'|'PLANNED'|'IN_PROGRESS'|'WAITING'|'DONE'|'ACCEPTED';
export type TaskPriority = 'LOW'|'NORMAL'|'HIGH'|'CRITICAL';
export interface TaskUser { id:string; firstName:string; lastName:string; role?:string }
export interface TaskChecklistItem { id:string; text:string; done:boolean; position:number }
export interface TaskComment { id:string; comment:string; createdAt:string; user:TaskUser }
export interface ProjectTask { id:string; projectId:string; title:string; description:string|null; status:TaskStatus; priority:TaskPriority; assigneeId:string|null; assignee:TaskUser|null; createdBy:TaskUser; plannedHours:number|null; actualHours:number; dueDate:string|null; completedAt:string|null; position:number; checklist:TaskChecklistItem[]; comments:TaskComment[]; createdAt:string; updatedAt:string }
export interface TaskPayload { title:string; description?:string|null; status:TaskStatus; priority:TaskPriority; assigneeId?:string|null; plannedHours?:number|null; dueDate?:string|null; checklist:{text:string;done:boolean}[] }
