import type { UserRole } from "./role.model";
export type { UserRole };

export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  assignedClassroomIds: string[];
  status: UserStatus;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
