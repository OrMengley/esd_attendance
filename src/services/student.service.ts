import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Student, StudentStatus } from "../models/student.model";
import { initialMockStudents } from "../data/students.mock";

const STUDENTS_STORAGE_KEY = "esd_local_students";

function getLocalStudents(): Student[] {
  try {
    const saved = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return initialMockStudents;
}

function saveLocalStudents(students: Student[]) {
  try {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
  } catch (e) {
    console.error("Failed to save students to localStorage:", e);
  }
}

export const studentService = {
  /**
   * Fetch all students from Firestore with local fallback
   */
  async getStudents(): Promise<Student[]> {
    try {
      const snap = await getDocs(collection(db, "students"));
      if (!snap.empty) {
        const firestoreList = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Student)
        );
        // Sort by studentCode
        const sorted = firestoreList.sort((a, b) =>
          a.studentCode.localeCompare(b.studentCode, undefined, { numeric: true })
        );
        saveLocalStudents(sorted);
        return sorted;
      }
    } catch (e) {
      console.warn("Firestore getStudents fallback to local:", e);
    }
    return getLocalStudents();
  },

  /**
   * Fetch single student by document ID
   */
  async getStudentById(id: string): Promise<Student | null> {
    try {
      const snap = await getDoc(doc(db, "students", id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Student;
      }
    } catch (e) {
      console.warn("Firestore getStudentById fallback to local:", e);
    }
    const local = getLocalStudents();
    return local.find((s) => s.id === id) || null;
  },

  /**
   * Fetch single student by unique student code
   */
  async getStudentByCode(studentCode: string): Promise<Student | null> {
    const trimmed = studentCode.trim();
    if (!trimmed) return null;

    try {
      const q = query(
        collection(db, "students"),
        where("studentCode", "==", trimmed)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as Student;
      }
    } catch (e) {
      console.warn("Firestore getStudentByCode fallback to local:", e);
    }

    const local = getLocalStudents();
    return local.find((s) => s.studentCode.trim().toLowerCase() === trimmed.toLowerCase()) || null;
  },

  /**
   * Create a new student
   */
  async createStudent(
    data: Omit<Student, "id" | "createdAt" | "updatedAt">,
    currentUserId?: string
  ): Promise<Student> {
    const cleanCode = data.studentCode.trim();
    if (!cleanCode) {
      throw new Error("STUDENT_CODE_REQUIRED");
    }

    const existing = await this.getStudentByCode(cleanCode);
    if (existing) {
      throw new Error("STUDENT_CODE_EXISTS");
    }

    const now = new Date().toISOString();
    const newStudentData: Omit<Student, "id"> = {
      ...data,
      studentCode: cleanCode,
      nameKh: data.nameKh.trim(),
      nameEn: data.nameEn ? data.nameEn.trim() : "",
      gender: data.gender,
      dateOfBirth: data.dateOfBirth || "",
      birthCertificateStatus: data.birthCertificateStatus || "has_certificate",
      phone: data.phone ? String(data.phone).trim() : "",
      avatarUrl: data.avatarUrl || "",
      address: {
        village: data.address?.village?.trim() || "",
        commune: data.address?.commune?.trim() || "",
        district: data.address?.district?.trim() || "",
        province: data.address?.province?.trim() || "",
      },
      fatherName: data.fatherName ? data.fatherName.trim() : "",
      fatherOccupation: data.fatherOccupation ? data.fatherOccupation.trim() : "",
      fatherPhone: data.fatherPhone ? String(data.fatherPhone).trim() : "",
      motherName: data.motherName ? data.motherName.trim() : "",
      motherOccupation: data.motherOccupation ? data.motherOccupation.trim() : "",
      motherPhone: data.motherPhone ? String(data.motherPhone).trim() : "",
      note: data.note ? data.note.trim() : "",
      status: data.status || "active",
      createdAt: now,
      updatedAt: now,
      createdBy: currentUserId || "system",
      updatedBy: currentUserId || "system",
    };

    try {
      const docRef = await addDoc(collection(db, "students"), newStudentData);
      const created: Student = { id: docRef.id, ...newStudentData };
      const local = getLocalStudents();
      saveLocalStudents([created, ...local]);
      return created;
    } catch (e) {
      console.warn("Firestore createStudent fallback to local:", e);
      const newId = `std-${Date.now()}`;
      const created: Student = { id: newId, ...newStudentData };
      const local = getLocalStudents();
      saveLocalStudents([created, ...local]);
      return created;
    }
  },

  /**
   * Update student information
   */
  async updateStudent(
    id: string,
    updates: Partial<Student>,
    currentUserId?: string
  ): Promise<Student> {
    if (updates.studentCode) {
      const cleanCode = updates.studentCode.trim();
      const existing = await this.getStudentByCode(cleanCode);
      if (existing && existing.id !== id) {
        throw new Error("STUDENT_CODE_EXISTS");
      }
      updates.studentCode = cleanCode;
    }

    const now = new Date().toISOString();
    const updateData: Partial<Student> = {
      ...updates,
      updatedAt: now,
      updatedBy: currentUserId || "system",
    };

    if (updateData.nameKh) updateData.nameKh = updateData.nameKh.trim();
    if (updateData.nameEn !== undefined) updateData.nameEn = updateData.nameEn.trim();
    if (updateData.phone !== undefined) updateData.phone = String(updateData.phone).trim();
    if (updateData.fatherPhone !== undefined) updateData.fatherPhone = String(updateData.fatherPhone).trim();
    if (updateData.motherPhone !== undefined) updateData.motherPhone = String(updateData.motherPhone).trim();

    try {
      await updateDoc(doc(db, "students", id), updateData);
    } catch (e) {
      console.warn("Firestore updateStudent fallback to local:", e);
    }

    const local = getLocalStudents();
    let updatedStudent: Student | null = null;
    const updatedList = local.map((s) => {
      if (s.id === id) {
        updatedStudent = { ...s, ...updateData };
        return updatedStudent;
      }
      return s;
    });
    saveLocalStudents(updatedList);
    return updatedStudent || ({ id, ...updateData } as Student);
  },

  /**
   * Set student status (active, inactive, archived) - Soft delete / state change
   */
  async setStudentStatus(
    id: string,
    status: StudentStatus,
    currentUserId?: string
  ): Promise<Student> {
    return this.updateStudent(id, { status }, currentUserId);
  },

  /**
   * Insert test student (helper)
   */
  async insertTestStudent(currentUserId?: string): Promise<{ success: boolean; student?: Student; error?: string }> {
    const randomCode = `STU-${Math.floor(100 + Math.random() * 900)}`;
    try {
      const created = await this.createStudent(
        {
          studentCode: randomCode,
          nameKh: "ស៊ឹម ចាន់ណា",
          nameEn: "Sim Channa",
          gender: "female",
          dateOfBirth: "2008-04-12",
          birthCertificateStatus: "has_certificate",
          phone: "0967788990",
          address: {
            village: "ស្វាយប៉ោ",
            commune: "ស្វាយប៉ោ",
            district: "ក្រុងបាត់ដំបង",
            province: "បាត់ដំបង",
          },
          fatherName: "ស៊ឹម សុផាត",
          fatherOccupation: "អាជីវករ",
          fatherPhone: "012334455",
          motherName: "កែវ ណារ៉ា",
          motherOccupation: "មេផ្ទះ",
          motherPhone: "0967788990",
          status: "active",
          avatarUrl: "",
        },
        currentUserId
      );
      return { success: true, student: created };
    } catch (e: any) {
      return { success: false, error: e?.message || "FAILED" };
    }
  },
};
