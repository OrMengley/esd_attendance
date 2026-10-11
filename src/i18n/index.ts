import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import kmTranslation from "./locales/km.json";
import enTranslation from "./locales/en.json";

const STORAGE_KEY = "esd_language";

const savedLanguage = (localStorage.getItem(STORAGE_KEY) as "km" | "en") || "km";

const resources = {
  km: {
    translation: kmTranslation,
  },
  en: {
    translation: enTranslation,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: "km",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

// Sync html lang attribute
if (typeof document !== "undefined") {
  document.documentElement.lang = savedLanguage;
}

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng;
  }
});

export default i18n;
