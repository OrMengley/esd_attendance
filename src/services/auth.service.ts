import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { User } from "../models/user.model";
import { initialMockUsers } from "../data/users.mock";

const STORAGE_KEY = "esd_current_user";
const USERS_STORAGE_KEY = "esd_local_users";

function getLocalUsers(): User[] {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return initialMockUsers;
}

function saveLocalUsers(users: User[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export const authService = {
  getCurrentUser(): User | null {
    try {
      const userJson = localStorage.getItem(STORAGE_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  async login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const trimmedUsername = username.trim();

    try {
      // 1. Try querying Firestore users collection
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", trimmedUsername));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const userData = { id: docSnap.id, ...docSnap.data() } as User;

        if (userData.status === "inactive") {
          return { success: false, error: "គណនីនេះត្រូវបានបិទ" };
        }

        if (userData.password !== password) {
          return { success: false, error: "លេខសម្ងាត់មិនត្រឹមត្រូវ" };
        }

        // Update lastLogin
        try {
          await updateDoc(doc(db, "users", docSnap.id), {
            lastLogin: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("Could not update lastLogin in Firestore:", err);
        }

        const authenticatedUser = {
          ...userData,
          lastLogin: new Date().toISOString(),
        };

        this.setCurrentUser(authenticatedUser);
        return { success: true, user: authenticatedUser };
      }
    } catch (firestoreError) {
      console.warn("Firestore auth query failed or offline, checking local accounts:", firestoreError);
    }

    // 2. Fallback to local accounts (including seed data)
    const localUsers = getLocalUsers();
    const foundUser = localUsers.find(
      (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase()
    );

    if (!foundUser) {
      return { success: false, error: "រកមិនឃើញគណនីអ្នកប្រើប្រាស់" };
    }

    if (foundUser.status === "inactive") {
      return { success: false, error: "គណនីនេះត្រូវបានបិទ" };
    }

    if (foundUser.password !== password) {
      return { success: false, error: "លេខសម្ងាត់មិនត្រឹមត្រូវ" };
    }

    const updatedUser: User = {
      ...foundUser,
      lastLogin: new Date().toISOString(),
    };

    const updatedList = localUsers.map((u) => (u.id === foundUser.id ? updatedUser : u));
    saveLocalUsers(updatedList);
    this.setCurrentUser(updatedUser);

    return { success: true, user: updatedUser };
  },

  logout(): void {
    this.setCurrentUser(null);
  },
};
