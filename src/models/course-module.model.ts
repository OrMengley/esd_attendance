export type CourseModuleStatus = "active" | "inactive";

export interface CourseModule {
  id: string;
  packageId: string;
  code: string;
  nameKh: string;
  nameEn?: string;
  order: number;
  plannedHours?: number;
  description?: string;
  status: CourseModuleStatus;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
