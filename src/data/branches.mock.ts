import { Branch } from "../models/branch.model";

export const initialMockBranches: Branch[] = [
  {
    id: "branch-001",
    code: "ESD-MAIN",
    nameKh: "សាខាកណ្តាល (Main Campus)",
    nameEn: "Main Campus",
    phone: "012 345 678",
    email: "main.campus@esd.edu.kh",
    address: "វត្តសូរិយារាម ស្រុកដំបង ខេត្តបាត់ដំបង",
    isMain: true,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    createdBy: "system",
  },
  {
    id: "branch-002",
    code: "ESD-BTB",
    nameKh: "សាខាក្រុងបាត់ដំបង",
    nameEn: "Battambang City Branch",
    phone: "098 765 432",
    email: "btb.city@esd.edu.kh",
    address: "ក្រុងបាត់ដំបង ខេត្តបាត់ដំបង",
    isMain: false,
    status: "active",
    createdAt: "2026-01-15T00:00:00.000Z",
    createdBy: "system",
  },
];
