import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { StudyPackage, PackageStatus } from "../models/study-package.model";

const PACKAGES_STORAGE_KEY = "esd_local_study_packages";

export const initialMockPackage: StudyPackage = {
  id: "pkg-esd-computer-001",
  code: "ESD-COMPUTER-001",
  nameKh: "កញ្ចប់សិក្សាកុំព្យូទ័រ",
  nameEn: "Computer Study Package",
  totalPlannedHours: 40,
  description: "កញ្ចប់សិក្សាមូលដ្ឋានកុំព្យូទ័រ រួមមានការវាយអក្សរ និង Microsoft Office",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function getLocalPackages(): StudyPackage[] {
  try {
    const saved = localStorage.getItem(PACKAGES_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return [initialMockPackage];
}

function saveLocalPackages(packages: StudyPackage[]) {
  try {
    localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
  } catch (e) {
    console.error("Failed to save packages to localStorage:", e);
  }
}

export const studyPackageService = {
  async getStudyPackages(): Promise<StudyPackage[]> {
    try {
      const snap = await getDocs(collection(db, "study_packages"));
      if (!snap.empty) {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as StudyPackage[];
        saveLocalPackages(items);
        return items;
      } else {
        // If Firestore is empty, seed the initial package
        try {
          const docRef = await addDoc(collection(db, "study_packages"), {
            code: initialMockPackage.code,
            nameKh: initialMockPackage.nameKh,
            nameEn: initialMockPackage.nameEn,
            totalPlannedHours: initialMockPackage.totalPlannedHours,
            description: initialMockPackage.description,
            status: initialMockPackage.status,
            createdAt: initialMockPackage.createdAt,
            updatedAt: initialMockPackage.createdAt,
            createdBy: "system",
            updatedBy: "system",
          });
          const created = { ...initialMockPackage, id: docRef.id };
          saveLocalPackages([created]);
          return [created];
        } catch (seedErr) {
          console.warn("Seeding initial study package failed:", seedErr);
        }
      }
    } catch (e) {
      console.warn("Firestore getStudyPackages fallback to local:", e);
    }
    return getLocalPackages();
  },

  async getStudyPackageById(id: string): Promise<StudyPackage | null> {
    try {
      const snap = await getDoc(doc(db, "study_packages", id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as StudyPackage;
      }
    } catch (e) {
      console.warn("Firestore getStudyPackageById fallback to local:", e);
    }
    const local = getLocalPackages();
    return local.find((p) => p.id === id) || null;
  },

  async createStudyPackage(
    data: Omit<StudyPackage, "id" | "createdAt" | "updatedAt">,
    currentUserId?: string
  ): Promise<StudyPackage> {
    const existing = await this.getStudyPackages();
    const codeExists = existing.some(
      (p) => p.code.trim().toUpperCase() === data.code.trim().toUpperCase()
    );
    if (codeExists) {
      throw new Error("PACKAGE_CODE_EXISTS");
    }

    const now = new Date().toISOString();
    const newPackageData = {
      ...data,
      code: data.code.trim().toUpperCase(),
      nameKh: data.nameKh.trim(),
      nameEn: data.nameEn ? data.nameEn.trim() : "",
      totalPlannedHours: Number(data.totalPlannedHours) || 0,
      description: data.description ? data.description.trim() : "",
      status: data.status || "active",
      createdAt: now,
      updatedAt: now,
      createdBy: currentUserId || "system",
      updatedBy: currentUserId || "system",
    };

    try {
      const docRef = await addDoc(collection(db, "study_packages"), newPackageData);
      const created: StudyPackage = {
        id: docRef.id,
        ...newPackageData,
      };
      const local = getLocalPackages();
      saveLocalPackages([created, ...local]);
      return created;
    } catch (e) {
      console.warn("Firestore createStudyPackage fallback to local:", e);
      const newId = `pkg-${Date.now()}`;
      const created: StudyPackage = {
        id: newId,
        ...newPackageData,
      };
      const local = getLocalPackages();
      saveLocalPackages([created, ...local]);
      return created;
    }
  },

  async updateStudyPackage(
    id: string,
    data: Partial<StudyPackage>,
    currentUserId?: string
  ): Promise<StudyPackage> {
    if (data.code) {
      const existing = await this.getStudyPackages();
      const codeExists = existing.some(
        (p) =>
          p.id !== id &&
          p.code.trim().toUpperCase() === data.code!.trim().toUpperCase()
      );
      if (codeExists) {
        throw new Error("PACKAGE_CODE_EXISTS");
      }
    }

    const updates: Partial<StudyPackage> = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserId || "system",
    };

    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }
    if (updates.totalPlannedHours !== undefined) {
      updates.totalPlannedHours = Number(updates.totalPlannedHours);
    }

    try {
      await updateDoc(doc(db, "study_packages", id), updates);
    } catch (e) {
      console.warn("Firestore updateStudyPackage fallback to local:", e);
    }

    const local = getLocalPackages();
    let updatedObj: StudyPackage | null = null;
    const list = local.map((item) => {
      if (item.id === id) {
        updatedObj = { ...item, ...updates };
        return updatedObj;
      }
      return item;
    });
    saveLocalPackages(list);
    return updatedObj || ({ id, ...updates } as StudyPackage);
  },

  async setStudyPackageStatus(
    id: string,
    status: PackageStatus,
    currentUserId?: string
  ): Promise<StudyPackage> {
    return this.updateStudyPackage(id, { status }, currentUserId);
  },
};
