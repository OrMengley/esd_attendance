export type StudentStatus = "active" | "inactive" | "archived";

export interface StudentAddress {
  village?: string;
  commune?: string;
  district?: string;
  province?: string;
}

export interface Student {
  id: string;
  studentCode: string;

  nameKh: string;
  nameEn?: string;
  gender: "male" | "female";
  dateOfBirth?: string;
  birthCertificateStatus?: "has_certificate" | "no_certificate";

  phone?: string;
  avatarUrl?: string;
  address?: StudentAddress;

  fatherName?: string;
  fatherOccupation?: string;
  fatherPhone?: string;

  motherName?: string;
  motherOccupation?: string;
  motherPhone?: string;

  note?: string;
  status: StudentStatus;

  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
