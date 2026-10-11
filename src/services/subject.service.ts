import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { Subject } from "../models/subject.model";
import { initialMockSubjects } from "../data/subjects.mock";

const SUBJECTS_STORAGE_KEY = "esd_local_subjects";

function getLocalSubjects(): Subject[] {
  try {
    const saved = localStorage.getItem(SUBJECTS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return initialMockSubjects;
}

function saveLocalSubjects(subjects: Subject[]) {
  localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(subjects));
}

export const subjectService = {
  async getSubjects(): Promise<Subject[]> {
    try {
      const snap = await getDocs(collection(db, "subjects"));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subject));
      }
    } catch (e) {
      console.warn("Firestore getSubjects fallback to local:", e);
    }
    return getLocalSubjects();
  },

  async createSubject(subjectData: Omit<Subject, "id">): Promise<Subject> {
    try {
      const docRef = await addDoc(collection(db, "subjects"), subjectData);
      const newSub: Subject = { id: docRef.id, ...subjectData };
      const local = getLocalSubjects();
      saveLocalSubjects([newSub, ...local]);
      return newSub;
    } catch (e) {
      console.warn("Firestore createSubject fallback to local:", e);
      const newId = `sub-${Date.now()}`;
      const newSub: Subject = { id: newId, ...subjectData };
      const local = getLocalSubjects();
      saveLocalSubjects([newSub, ...local]);
      return newSub;
    }
  },

  async updateSubject(id: string, updates: Partial<Subject>): Promise<Subject> {
    try {
      await updateDoc(doc(db, "subjects", id), updates);
    } catch (e) {
      console.warn("Firestore updateSubject fallback to local:", e);
    }
    const local = getLocalSubjects();
    let updated: Subject | null = null;
    const list = local.map((s) => {
      if (s.id === id) {
        updated = { ...s, ...updates };
        return updated;
      }
      return s;
    });
    saveLocalSubjects(list);
    return updated || ({ id, ...updates } as Subject);
  },

  async deleteSubject(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "subjects", id));
    } catch (e) {
      console.warn("Firestore deleteSubject fallback to local:", e);
    }
    const local = getLocalSubjects();
    saveLocalSubjects(local.filter((s) => s.id !== id));
    return true;
  },
};
