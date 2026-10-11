export type SchoolHolidayStatus = "active" | "inactive";

export interface SchoolHoliday {
  id: string;
  nameKm: string;
  nameEn?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  note?: string;
  status: SchoolHolidayStatus;

  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}
