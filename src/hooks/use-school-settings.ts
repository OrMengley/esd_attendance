import { useState, useEffect } from "react";
import { SchoolSettings } from "@/models/setting.model";
import { settingService, defaultSettings } from "@/services/setting.service";

export function useSchoolSettings() {
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    try {
      const saved = localStorage.getItem("esd_school_settings");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    settingService.getSettings().then((data) => {
      if (data) setSettings(data);
    });

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SchoolSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      }
    };

    window.addEventListener("school-settings-updated", handleUpdate);
    return () => {
      window.removeEventListener("school-settings-updated", handleUpdate);
    };
  }, []);

  return settings;
}
