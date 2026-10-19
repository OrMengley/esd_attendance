export type BranchStatus = "active" | "inactive";

export interface Branch {
  id: string;
  code: string;           // Unique branch identifier (e.g., "ESD-MAIN", "ESD-PP")
  nameKh: string;         // Khmer name (e.g., "សាខាកណ្តាល", "សាខាភ្នំពេញ")
  nameEn?: string;        // English name (e.g., "Main Campus", "Phnom Penh Branch")
  phone?: string;         // Contact phone number
  email?: string;         // Contact email address
  address?: string;       // Physical location / street address
  isMain: boolean;        // Whether this is the primary/headquarters branch (default: false)
  status: BranchStatus;   // "active" | "inactive"
  createdAt: string;      // ISO 8601
  updatedAt?: string;     // ISO 8601
  createdBy?: string;
  updatedBy?: string;
}
