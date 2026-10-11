export type ClassroomStatus = "active" | "completed" | "inactive";

export interface Classroom {
  id: string;
  code: string;
  name: string;
  packageId: string;
  assignedTeacherId: string;
  scheduleDays: number[]; // 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
  startTime: string; // e.g. "07:00"
  endTime: string; // e.g. "08:00"
  sessionMinutes: number;
  hoursPerWeek: number;
  startDate: string; // YYYY-MM-DD
  expectedEndDate: string; // YYYY-MM-DD
  actualEndDate?: string;
  capacity?: number;
  status: ClassroomStatus;
  note?: string;
  subjectId?: string; // Legacy field
  schedule?: string; // Legacy string display
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
