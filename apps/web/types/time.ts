export type TimeEntryStatus = 'RUNNING' | 'PAUSED' | 'COMPLETED';
export type TimeEntryType = 'WORK' | 'TRAVEL' | 'TRAINING' | 'OFFICE' | 'OTHER';

export interface TimeBreak {
  id: string;
  startTime: string;
  endTime: string | null;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  status: TimeEntryStatus;
  type: TimeEntryType;
  note: string | null;
  manuallyEdited: boolean;
  grossMinutes: number;
  breakMinutes: number;
  netMinutes: number;
  breaks: TimeBreak[];
  user: { id: string; firstName: string; lastName: string; role: string };
  project: { id: string; projectNumber: string; name: string };
  task?: { id: string; title: string } | null;
}

export interface StartTimePayload {
  type: TimeEntryType;
  note?: string;
  taskId?: string | null;
}

export interface ManualTimePayload {
  startTime: string;
  endTime: string;
  breakMinutes: number;
  type: TimeEntryType;
  note?: string;
}
