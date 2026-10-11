export type PackageStatus = "active" | "inactive";

export interface StudyPackage {
  id: string;
  code: string;
  nameKh: string;
  nameEn?: string;
  totalPlannedHours: number;
  description?: string;
  status: PackageStatus;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
