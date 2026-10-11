import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { SchoolHoliday, SchoolHolidayStatus } from "../models/school-holiday.model";
import { hasOverlappingHoliday, calculateClassroomExpectedEndDate } from "../lib/holiday-calendar";
import { classroomService } from "./classroom.service";
import { studyPackageService } from "./study-package.service";

const HOLIDAYS_STORAGE_KEY = "esd_local_school_holidays";

function getLocalHolidays(): SchoolHoliday[] {
  try {
    const saved = localStorage.getItem(HOLIDAYS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse local school holidays:", e);
  }
  return [];
}

function saveLocalHolidays(holidays: SchoolHoliday[]) {
  try {
    localStorage.setItem(HOLIDAYS_STORAGE_KEY, JSON.stringify(holidays));
  } catch (e) {
    console.error("Failed to save school holidays to localStorage:", e);
  }
}

export const schoolHolidayService = {
  /**
   * Fetch all school holidays (ordered by startDate desc)
   */
  async getSchoolHolidays(): Promise<SchoolHoliday[]> {
    try {
      const snap = await getDocs(collection(db, "school_holidays"));
      if (!snap.empty) {
        const list = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as SchoolHoliday)
        );
        const sorted = list.sort(
          (a, b) => b.startDate.localeCompare(a.startDate)
        );
        saveLocalHolidays(sorted);
        return sorted;
      }
    } catch (e) {
      console.warn("Firestore getSchoolHolidays fallback to local:", e);
    }
    const local = getLocalHolidays();
    return local.sort((a, b) => b.startDate.localeCompare(a.startDate));
  },

  /**
   * Fetch only active school holidays
   */
  async getActiveSchoolHolidays(): Promise<SchoolHoliday[]> {
    const all = await this.getSchoolHolidays();
    return all.filter((h) => h.status === "active");
  },

  /**
   * Fetch a single school holiday by ID
   */
  async getSchoolHolidayById(id: string): Promise<SchoolHoliday | null> {
    try {
      const snap = await getDoc(doc(db, "school_holidays", id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as SchoolHoliday;
      }
    } catch (e) {
      console.warn("Firestore getSchoolHolidayById fallback to local:", e);
    }
    const local = getLocalHolidays();
    return local.find((h) => h.id === id) || null;
  },

  /**
   * Create a new school holiday with overlap validation and classroom end-date auto-recalculation
   */
  async createSchoolHoliday(
    data: Omit<SchoolHoliday, "id" | "createdAt" | "updatedAt" | "createdBy"> & {
      createdBy?: string;
    },
    currentUserId?: string
  ): Promise<SchoolHoliday> {
    if (!data.nameKm?.trim()) {
      throw new Error("HOLIDAY_NAME_REQUIRED");
    }
    if (!data.startDate || !data.endDate) {
      throw new Error("HOLIDAY_DATES_REQUIRED");
    }
    if (data.endDate < data.startDate) {
      throw new Error("HOLIDAY_END_BEFORE_START");
    }

    const all = await this.getSchoolHolidays();

    // If active, validate overlapping active holidays
    if (data.status === "active") {
      const overlapCheck = hasOverlappingHoliday(
        { startDate: data.startDate, endDate: data.endDate },
        all
      );
      if (overlapCheck.overlaps) {
        throw new Error("HOLIDAY_OVERLAPPING_DATES");
      }
    }

    const now = new Date().toISOString();
    const newRecord: Omit<SchoolHoliday, "id"> = {
      nameKm: data.nameKm.trim(),
      nameEn: data.nameEn?.trim() || "",
      startDate: data.startDate,
      endDate: data.endDate,
      note: data.note?.trim() || "",
      status: data.status || "active",
      createdAt: now,
      updatedAt: now,
      createdBy: currentUserId || "system",
      updatedBy: currentUserId || "system",
    };

    let created: SchoolHoliday;

    try {
      const docRef = await addDoc(collection(db, "school_holidays"), newRecord);
      created = { id: docRef.id, ...newRecord };
    } catch (e) {
      console.warn("Firestore createSchoolHoliday fallback to local:", e);
      created = { id: `hol-${Date.now()}`, ...newRecord };
    }

    const local = getLocalHolidays();
    saveLocalHolidays([created, ...local]);

    // Recalculate active classroom expected end dates if holiday is active
    if (created.status === "active") {
      const updatedActiveHolidays = [created, ...all.filter((h) => h.status === "active")];
      await this.recalculateActiveClassroomEndDates(updatedActiveHolidays, currentUserId);
    }

    return created;
  },

  /**
   * Update an existing school holiday record
   */
  async updateSchoolHoliday(
    id: string,
    updates: Partial<SchoolHoliday>,
    currentUserId?: string
  ): Promise<SchoolHoliday> {
    const existing = await this.getSchoolHolidayById(id);
    if (!existing) {
      throw new Error("HOLIDAY_NOT_FOUND");
    }

    const updatedStartDate = updates.startDate || existing.startDate;
    const updatedEndDate = updates.endDate || existing.endDate;
    const updatedStatus = updates.status || existing.status;

    if (updatedEndDate < updatedStartDate) {
      throw new Error("HOLIDAY_END_BEFORE_START");
    }

    const all = await this.getSchoolHolidays();

    // If active, validate overlapping active holidays
    if (updatedStatus === "active") {
      const overlapCheck = hasOverlappingHoliday(
        { id, startDate: updatedStartDate, endDate: updatedEndDate },
        all
      );
      if (overlapCheck.overlaps) {
        throw new Error("HOLIDAY_OVERLAPPING_DATES");
      }
    }

    const now = new Date().toISOString();
    const payload: Partial<SchoolHoliday> = {
      ...updates,
      updatedAt: now,
      updatedBy: currentUserId || "system",
    };

    try {
      await updateDoc(doc(db, "school_holidays", id), payload);
    } catch (e) {
      console.warn("Firestore updateSchoolHoliday fallback to local:", e);
    }

    const local = getLocalHolidays();
    let updatedObj: SchoolHoliday = { ...existing, ...payload };
    const list = local.map((item) => {
      if (item.id === id) {
        updatedObj = { ...item, ...payload };
        return updatedObj;
      }
      return item;
    });
    saveLocalHolidays(list);

    // Recalculate active classroom expected end dates
    const activeHolidays = list.filter((h) => h.status === "active");
    await this.recalculateActiveClassroomEndDates(activeHolidays, currentUserId);

    return updatedObj;
  },

  /**
   * Activate or deactivate a school holiday record
   */
  async setSchoolHolidayStatus(
    id: string,
    status: SchoolHolidayStatus,
    currentUserId?: string
  ): Promise<SchoolHoliday> {
    return this.updateSchoolHoliday(id, { status }, currentUserId);
  },

  /**
   * Automatically recalculates expectedEndDate for all active classrooms
   */
  async recalculateActiveClassroomEndDates(
    activeHolidays: SchoolHoliday[],
    currentUserId?: string
  ): Promise<void> {
    try {
      const [allClassrooms, allPackages] = await Promise.all([
        classroomService.getClassrooms(),
        studyPackageService.getStudyPackages(),
      ]);

      const activeClassrooms = allClassrooms.filter((c) => c.status === "active");

      for (const cls of activeClassrooms) {
        const pkg = allPackages.find((p) => p.id === cls.packageId);
        const totalPlannedHours = pkg?.totalPlannedHours || 40;

        const newExpectedEndDate = calculateClassroomExpectedEndDate({
          startDate: cls.startDate,
          totalPlannedHours,
          scheduleDays: cls.scheduleDays,
          sessionMinutes: cls.sessionMinutes || 60,
          activeHolidays,
        });

        if (newExpectedEndDate && newExpectedEndDate !== cls.expectedEndDate) {
          await classroomService.updateClassroom(
            cls.id,
            { expectedEndDate: newExpectedEndDate },
            currentUserId
          );
        }
      }
    } catch (e) {
      console.warn("Failed to recalculate active classroom expected end dates:", e);
    }
  },
};
