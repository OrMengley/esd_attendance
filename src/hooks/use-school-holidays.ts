import { useState, useEffect, useCallback } from "react";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { schoolHolidayService } from "@/services/school-holiday.service";

export function useSchoolHolidays() {
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [activeHolidays, setActiveHolidays] = useState<SchoolHoliday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHolidays = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const all = await schoolHolidayService.getSchoolHolidays();
      setHolidays(all);
      setActiveHolidays(all.filter((h) => h.status === "active"));
    } catch (err: any) {
      console.error("Failed to load school holidays:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  return {
    holidays,
    activeHolidays,
    isLoading,
    error,
    refresh: fetchHolidays,
  };
}
