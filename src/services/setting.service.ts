import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { SchoolSettings } from "../models/setting.model";

const SETTINGS_STORAGE_KEY = "esd_school_settings";

export const defaultSettings: SchoolSettings = {
    centerName: "សាលាបណ្តុះបណ្តាលកុំព្យូទ័រ វត្តសុរិយារាម",
    phone: "012 345 678 / 098 765 432",
    email: "info@watsoriyaram.edu.kh",
    address: "វត្តសុរិយារាម, ខេត្តបាត់ដំបង",
    logoUrl: "/images/Logo-Wat-Soriyaram-Training-Computer-School.png",
};

function getLocalSettings(): SchoolSettings {
    try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.error(e);
    }
    return defaultSettings;
}

function saveLocalSettings(settings: SchoolSettings) {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        window.dispatchEvent(
            new CustomEvent("school-settings-updated", { detail: settings })
        );
    } catch (e) {
        console.error("Failed to save settings to localStorage:", e);
    }
}

export const settingService = {
    async getSettings(): Promise<SchoolSettings> {
        try {
            const docRef = doc(db, "settings", "general");
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data() as SchoolSettings;
                saveLocalSettings(data);
                return data;
            }
        } catch (e) {
            console.warn("Firestore getSettings fallback to local:", e);
        }
        return getLocalSettings();
    },

    async saveSettings(settingsData: SchoolSettings): Promise<SchoolSettings> {
        const updatedData: SchoolSettings = {
            ...settingsData,
            updatedAt: new Date().toISOString(),
        };
        try {
            const docRef = doc(db, "settings", "general");
            await setDoc(docRef, updatedData, { merge: true });
        } catch (e) {
            console.warn("Firestore saveSettings fallback to local:", e);
        }
        saveLocalSettings(updatedData);
        return updatedData;
    },
};
