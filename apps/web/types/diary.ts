export type WeatherCondition = 'SUNNY' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'STORM' | 'MIXED' | 'UNKNOWN';

export interface DiaryAuthor {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface DiaryEntry {
  id: string;
  projectId: string;
  entryDate: string;
  title: string;
  workDone: string;
  incidents: string | null;
  staffCount: number;
  hoursWorked: number | null;
  weather: WeatherCondition;
  temperature: number | null;
  author: DiaryAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryEntryPayload {
  entryDate: string;
  title: string;
  workDone: string;
  incidents?: string | null;
  staffCount: number;
  hoursWorked?: number | null;
  weather: WeatherCondition;
  temperature?: number | null;
}
