import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { CourseModule } from "../models/course-module.model";

const MODULES_STORAGE_KEY = "esd_local_course_modules";

export const initialMockModules: CourseModule[] = [
  {
    id: "mod-basic-comp",
    packageId: "pkg-esd-computer-001",
    code: "BASIC-COMPUTER",
    nameKh: "មូលដ្ឋានកុំព្យូទ័រ",
    nameEn: "Basic Computer",
    order: 1,
    plannedHours: 6,
    description: "ការយល់ដឹងអំពី Hardware, Software និង Windows",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "mod-typing",
    packageId: "pkg-esd-computer-001",
    code: "TYPING",
    nameKh: "វាយអក្សរ",
    nameEn: "Typing",
    order: 2,
    plannedHours: 6,
    description: "ការហាត់វាយអក្សរខ្មែរ និងអង់គ្លេសល្បឿនលឿន",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "mod-ms-word",
    packageId: "pkg-esd-computer-001",
    code: "MS-WORD",
    nameKh: "Microsoft Word",
    nameEn: "Microsoft Word",
    order: 3,
    plannedHours: 10,
    description: "ការរៀបចំឯកសារ លិខិតរដ្ឋបាល និងតារាង",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "mod-ms-excel",
    packageId: "pkg-esd-computer-001",
    code: "MS-EXCEL",
    nameKh: "Microsoft Excel",
    nameEn: "Microsoft Excel",
    order: 4,
    plannedHours: 10,
    description: "ការគណនារូបមន្ត របាយការណ៍ និងតារាងទិន្នន័យ",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "mod-ms-powerpoint",
    packageId: "pkg-esd-computer-001",
    code: "MS-POWERPOINT",
    nameKh: "Microsoft PowerPoint",
    nameEn: "Microsoft PowerPoint",
    order: 5,
    plannedHours: 8,
    description: "ការបង្កើតស្លាយបទបង្ហាញអាជីព និងគំនូរជីវចល",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function getLocalModules(): CourseModule[] {
  try {
    const saved = localStorage.getItem(MODULES_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return initialMockModules;
}

function saveLocalModules(modules: CourseModule[]) {
  try {
    localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify(modules));
  } catch (e) {
    console.error("Failed to save modules to localStorage:", e);
  }
}

export const courseModuleService = {
  async getCourseModulesByPackageId(packageId: string): Promise<CourseModule[]> {
    try {
      const q = query(
        collection(db, "course_modules"),
        where("packageId", "==", packageId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as CourseModule[];
        // Sort by order
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        return items;
      } else {
        // Check if we should seed default modules for initial computer package
        const isDefaultPkg =
          packageId === "pkg-esd-computer-001" ||
          packageId.toLowerCase().includes("esd-computer-001");
        if (isDefaultPkg || initialMockModules.some((m) => m.packageId === packageId)) {
          try {
            const batch = writeBatch(db);
            const createdModules: CourseModule[] = [];
            for (const item of initialMockModules) {
              const docRef = doc(collection(db, "course_modules"));
              const modData = {
                packageId,
                code: item.code,
                nameKh: item.nameKh,
                nameEn: item.nameEn,
                order: item.order,
                plannedHours: item.plannedHours,
                description: item.description,
                status: item.status,
                createdAt: item.createdAt,
                updatedAt: item.createdAt,
                createdBy: "system",
                updatedBy: "system",
              };
              batch.set(docRef, modData);
              createdModules.push({
                id: docRef.id,
                ...modData,
              });
            }
            await batch.commit();
            const allLocal = getLocalModules();
            saveLocalModules([
              ...allLocal.filter((m) => m.packageId !== packageId),
              ...createdModules,
            ]);
            createdModules.sort((a, b) => (a.order || 0) - (b.order || 0));
            return createdModules;
          } catch (seedErr) {
            console.warn("Seeding initial modules to Firestore failed:", seedErr);
          }
        }
      }
    } catch (e) {
      console.warn("Firestore getCourseModulesByPackageId fallback to local:", e);
    }
    const local = getLocalModules();
    const filtered = local.filter((m) => m.packageId === packageId);
    filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
    return filtered;
  },

  async getAllCourseModules(): Promise<CourseModule[]> {
    try {
      const snap = await getDocs(collection(db, "course_modules"));
      if (!snap.empty) {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as CourseModule[];
        saveLocalModules(items);
        return items;
      }
    } catch (e) {
      console.warn("Firestore getAllCourseModules fallback to local:", e);
    }
    return getLocalModules();
  },

  async createCourseModule(
    data: Omit<CourseModule, "id" | "createdAt" | "updatedAt">,
    currentUserId?: string
  ): Promise<CourseModule> {
    const existing = await this.getCourseModulesByPackageId(data.packageId);
    const codeExists = existing.some(
      (m) => m.code.trim().toUpperCase() === data.code.trim().toUpperCase()
    );
    if (codeExists) {
      throw new Error("MODULE_CODE_EXISTS");
    }

    // Auto calculate next order number
    const maxOrder = existing.reduce((max, m) => Math.max(max, m.order || 0), 0);
    const nextOrder = data.order !== undefined && data.order > 0 ? data.order : maxOrder + 1;

    const now = new Date().toISOString();
    const newModuleData = {
      ...data,
      code: data.code.trim().toUpperCase(),
      nameKh: data.nameKh.trim(),
      nameEn: data.nameEn ? data.nameEn.trim() : "",
      order: nextOrder,
      plannedHours: data.plannedHours !== undefined ? Number(data.plannedHours) : undefined,
      description: data.description ? data.description.trim() : "",
      status: data.status || "active",
      createdAt: now,
      updatedAt: now,
      createdBy: currentUserId || "system",
      updatedBy: currentUserId || "system",
    };

    try {
      const docRef = await addDoc(collection(db, "course_modules"), newModuleData);
      const created: CourseModule = {
        id: docRef.id,
        ...newModuleData,
      };
      const allLocal = getLocalModules();
      saveLocalModules([...allLocal, created]);
      return created;
    } catch (e) {
      console.warn("Firestore createCourseModule fallback to local:", e);
      const newId = `mod-${Date.now()}`;
      const created: CourseModule = {
        id: newId,
        ...newModuleData,
      };
      const allLocal = getLocalModules();
      saveLocalModules([...allLocal, created]);
      return created;
    }
  },

  async updateCourseModule(
    id: string,
    data: Partial<CourseModule>,
    currentUserId?: string
  ): Promise<CourseModule> {
    if (data.code && data.packageId) {
      const existing = await this.getCourseModulesByPackageId(data.packageId);
      const codeExists = existing.some(
        (m) =>
          m.id !== id &&
          m.code.trim().toUpperCase() === data.code!.trim().toUpperCase()
      );
      if (codeExists) {
        throw new Error("MODULE_CODE_EXISTS");
      }
    }

    const updates: Partial<CourseModule> = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserId || "system",
    };

    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }
    if (updates.plannedHours !== undefined) {
      updates.plannedHours = Number(updates.plannedHours);
    }

    try {
      await updateDoc(doc(db, "course_modules", id), updates);
    } catch (e) {
      console.warn("Firestore updateCourseModule fallback to local:", e);
    }

    const allLocal = getLocalModules();
    let updatedObj: CourseModule | null = null;
    const list = allLocal.map((m) => {
      if (m.id === id) {
        updatedObj = { ...m, ...updates };
        return updatedObj;
      }
      return m;
    });
    saveLocalModules(list);
    return updatedObj || ({ id, ...updates } as CourseModule);
  },

  async deleteCourseModule(
    id: string,
    packageId: string,
    currentUserId?: string
  ): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "course_modules", id));
    } catch (e) {
      console.warn("Firestore deleteCourseModule fallback to local:", e);
    }

    const allLocal = getLocalModules();
    const remaining = allLocal.filter((m) => m.id !== id);
    saveLocalModules(remaining);

    // Reorder remaining modules in the same package (1, 2, 3...)
    const packageRemaining = remaining.filter((m) => m.packageId === packageId);
    packageRemaining.sort((a, b) => (a.order || 0) - (b.order || 0));

    await this.reorderCourseModules(packageId, packageRemaining, currentUserId);
    return true;
  },

  async reorderCourseModules(
    packageId: string,
    modules: CourseModule[],
    currentUserId?: string
  ): Promise<CourseModule[]> {
    const updatedList: CourseModule[] = [];

    // Assign 1, 2, 3...
    for (let i = 0; i < modules.length; i++) {
      const targetOrder = i + 1;
      const mod = modules[i];
      if (mod.order !== targetOrder) {
        const updated = await this.updateCourseModule(
          mod.id,
          { order: targetOrder },
          currentUserId
        );
        updatedList.push(updated);
      } else {
        updatedList.push(mod);
      }
    }

    return updatedList;
  },

  async moveModule(
    packageId: string,
    moduleId: string,
    direction: "up" | "down",
    currentUserId?: string
  ): Promise<CourseModule[]> {
    const modules = await this.getCourseModulesByPackageId(packageId);
    modules.sort((a, b) => (a.order || 0) - (b.order || 0));

    const index = modules.findIndex((m) => m.id === moduleId);
    if (index === -1) return modules;

    if (direction === "up" && index > 0) {
      const prev = modules[index - 1];
      const curr = modules[index];
      const tempOrder = prev.order;
      prev.order = curr.order;
      curr.order = tempOrder;
      modules[index - 1] = curr;
      modules[index] = prev;
    } else if (direction === "down" && index < modules.length - 1) {
      const next = modules[index + 1];
      const curr = modules[index];
      const tempOrder = next.order;
      next.order = curr.order;
      curr.order = tempOrder;
      modules[index + 1] = curr;
      modules[index] = next;
    }

    return this.reorderCourseModules(packageId, modules, currentUserId);
  },
};
