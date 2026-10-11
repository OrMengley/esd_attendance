import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { schoolHolidayService } from "@/services/school-holiday.service";
import { SchoolHoliday, SchoolHolidayStatus } from "@/models/school-holiday.model";
import { calculateHolidayDays, hasOverlappingHoliday } from "@/lib/holiday-calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Palmtree,
  Calendar,
  CalendarRange,
  FileText,
  Info,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

interface HolidayFormPageProps {
  mode?: "create" | "edit";
}

export const HolidayFormPage: React.FC<HolidayFormPageProps> = ({ mode: explicitMode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const isEditMode = explicitMode ? explicitMode === "edit" : Boolean(id);

  // Data loading states
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingHolidays, setExistingHolidays] = useState<SchoolHoliday[]>([]);

  // Form states
  const [nameKm, setNameKm] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<SchoolHolidayStatus>("active");
  const [note, setNote] = useState("");

  // Load existing holiday & list for validation
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const allHolidays = await schoolHolidayService.getSchoolHolidays();
        if (!isMounted) return;
        setExistingHolidays(allHolidays);

        if (isEditMode && id) {
          const item = await schoolHolidayService.getSchoolHolidayById(id);
          if (!isMounted) return;
          if (item) {
            setNameKm(item.nameKm || "");
            setNameEn(item.nameEn || "");
            setStartDate(item.startDate || "");
            setEndDate(item.endDate || "");
            setStatus(item.status || "active");
            setNote(item.note || "");
          } else {
            toast.error(t("holidays.notFound", { defaultValue: "រកមិនឃើញថ្ងៃឈប់សម្រាកនេះទេ" }));
            navigate("/holidays");
          }
        }
      } catch (err) {
        console.error("Failed to load holiday data:", err);
        toast.error(t("holidays.fetchError", { defaultValue: "មានបញ្ហាក្នុងការទាញយកទិន្នន័យ" }));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isEditMode, id, navigate, t]);

  // Days count calculation
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return calculateHolidayDays(startDate, endDate);
  }, [startDate, endDate]);

  // Check if dates are invalid
  const isDateRangeInvalid = useMemo(() => {
    if (!startDate || !endDate) return false;
    return endDate < startDate;
  }, [startDate, endDate]);

  // Overlap warning check in real-time
  const overlapWarning = useMemo(() => {
    if (status !== "active" || !startDate || !endDate || isDateRangeInvalid) {
      return null;
    }
    const checkResult = hasOverlappingHoliday(
      { startDate, endDate, id: isEditMode ? id : undefined },
      existingHolidays
    );
    return checkResult.overlaps ? checkResult.conflictingHoliday : null;
  }, [status, startDate, endDate, isDateRangeInvalid, existingHolidays, isEditMode, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanNameKm = nameKm.trim();
    const cleanNameEn = nameEn.trim();
    const cleanNote = note.trim();

    if (!cleanNameKm) {
      toast.error(t("holidays.nameKmRequired", { defaultValue: "សូមបញ្ចូលឈ្មោះថ្ងៃឈប់សម្រាកជាភាសាខ្មែរ" }));
      return;
    }

    if (!startDate || !endDate) {
      toast.error(t("holidays.datesRequired", { defaultValue: "សូមជ្រើសរើសថ្ងៃចាប់ផ្តើម និងថ្ងៃបញ្ចប់" }));
      return;
    }

    if (endDate < startDate) {
      toast.error(
        t("holidays.endDateAfterStartDateError", {
          defaultValue: "ថ្ងៃបញ្ចប់មិនអាចនៅមុនថ្ងៃចាប់ផ្តើមបានទេ",
        })
      );
      return;
    }

    if (overlapWarning) {
      toast.error(
        t("holidays.overlappingDates", {
          defaultValue: `កាលបរិច្ឆេទនេះជាន់គ្នាជាមួយថ្ងៃឈប់សម្រាកសកម្ម "${overlapWarning.nameKm}" (${overlapWarning.startDate} ដល់ ${overlapWarning.endDate})!`,
        })
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        await schoolHolidayService.updateSchoolHoliday(
          id,
          {
            nameKm: cleanNameKm,
            nameEn: cleanNameEn || undefined,
            startDate,
            endDate,
            status,
            note: cleanNote || undefined,
          },
          user?.id
        );
        toast.success(
          t("holidays.updateSuccess", { defaultValue: "បានកែប្រែថ្ងៃឈប់សម្រាកដោយជោគជ័យ" })
        );
      } else {
        await schoolHolidayService.createSchoolHoliday(
          {
            nameKm: cleanNameKm,
            nameEn: cleanNameEn || undefined,
            startDate,
            endDate,
            status,
            note: cleanNote || undefined,
          },
          user?.id
        );
        toast.success(
          t("holidays.createSuccess", { defaultValue: "បានបង្កើតថ្ងៃឈប់សម្រាកដោយជោគជ័យ" })
        );
      }

      navigate("/holidays");
    } catch (err: any) {
      console.error(err);
      if (err?.message === "OVERLAPPING_ACTIVE_HOLIDAY") {
        toast.error(
          t("holidays.overlappingDates", {
            defaultValue: "កាលបរិច្ឆេទនេះជាន់គ្នាជាមួយថ្ងៃឈប់សម្រាកសកម្មផ្សេងទៀត!",
          })
        );
      } else {
        toast.error(t("holidays.saveError", { defaultValue: "មិនអាចរក្សាទុកបានទេ សូមព្យាយាមម្តងទៀត" }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-6">
        <div className="h-10 w-48 bg-muted/50 rounded-lg animate-pulse" />
        <div className="space-y-4">
          <div className="h-44 bg-card rounded-2xl border animate-pulse" />
          <div className="h-44 bg-card rounded-2xl border animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/holidays")}
            className="h-10 w-10 rounded-xl hover:bg-muted shrink-0"
            title={t("common.back", { defaultValue: "ត្រឡប់ក្រោយ" })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-khmer text-foreground tracking-tight">
              {isEditMode
                ? t("holidays.editHoliday", { defaultValue: "កែប្រែថ្ងៃឈប់សម្រាក" })
                : t("holidays.addHoliday", { defaultValue: "បន្ថែមថ្ងៃឈប់សម្រាក" })}
            </h1>
            <p className="text-xs text-muted-foreground font-khmer mt-0.5">
              {t("holidays.formDesc", {
                defaultValue: "កំណត់ព័ត៌មានថ្ងៃឈប់សម្រាក និងការបិទសាលាផ្លូវការ",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/holidays")}
            disabled={isSubmitting}
            className="text-xs font-khmer"
          >
            {t("common.cancel", { defaultValue: "បោះបង់" })}
          </Button>

          <Button
            type="submit"
            form="holiday-form"
            variant="gradient"
            disabled={isSubmitting || isDateRangeInvalid || Boolean(overlapWarning)}
            className="gap-2 shadow-sm text-xs font-khmer"
          >
            <Save className="h-4 w-4" />
            {isSubmitting
              ? t("common.loading", { defaultValue: "កំពុងរក្សាទុក..." })
              : t("common.save", { defaultValue: "រក្សាទុក" })}
          </Button>
        </div>
      </div>

      {/* Overlap Warning Banner if exists */}
      {overlapWarning && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-khmer">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">
              {t("holidays.overlappingDates", {
                defaultValue: "កាលបរិច្ឆេទជាន់គ្នាជាមួយថ្ងៃឈប់សម្រាកសកម្មផ្សេងទៀត!",
              })}
            </div>
            <div className="text-[11px] mt-0.5 opacity-90">
              {overlapWarning.nameKm} ({overlapWarning.startDate} ដល់ {overlapWarning.endDate})
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form id="holiday-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Holiday Information */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold font-khmer flex items-center gap-2">
              <Palmtree className="h-4 w-4 text-amber-500" />
              {t("holidays.basicInfo", { defaultValue: "ព័ត៌មានថ្ងៃឈប់សម្រាក" })}
            </CardTitle>
            <CardDescription className="text-xs font-khmer">
              {t("holidays.basicInfoDesc", {
                defaultValue: "បញ្ចូលឈ្មោះថ្ងៃឈប់សម្រាកជាភាសាខ្មែរ និងអង់គ្លេស",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="holiday-name-km" className="text-xs font-khmer">
                  {t("holidays.nameKm", { defaultValue: "ឈ្មោះថ្ងៃឈប់សម្រាក (ខ្មែរ)" })}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="holiday-name-km"
                  placeholder={t("holidays.nameKmPlaceholder", {
                    defaultValue: "ឧ. ពិធីបុណ្យចូលឆ្នាំខ្មែរ",
                  })}
                  value={nameKm}
                  onChange={(e) => setNameKm(e.target.value)}
                  className="text-xs font-khmer"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="holiday-name-en" className="text-xs font-khmer">
                  {t("holidays.nameEn", { defaultValue: "ឈ្មោះថ្ងៃឈប់សម្រាក (English)" })}
                </Label>
                <Input
                  id="holiday-name-en"
                  placeholder={t("holidays.nameEnPlaceholder", {
                    defaultValue: "e.g. Khmer New Year",
                  })}
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="text-xs font-sans"
                />
              </div>
            </div>

            <div className="space-y-2 max-w-lg">
              <Label htmlFor="holiday-status" className="text-xs font-khmer font-semibold">
                {t("holidays.status", { defaultValue: "ស្ថានភាព" })}
              </Label>
              <Select
                value={status}
                onValueChange={(val: SchoolHolidayStatus) => setStatus(val)}
              >
                <SelectTrigger id="holiday-status" className="text-xs font-khmer h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-khmer">
                  <SelectItem value="active">
                    {t("holidays.active", { defaultValue: "សកម្ម" })}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {t("holidays.inactive", { defaultValue: "អសកម្ម" })}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground font-khmer leading-relaxed">
                {status === "active"
                  ? t("holidays.activeHolidayHelp", {
                      defaultValue: "ថ្ងៃឈប់សម្រាកសកម្ម នឹងបិទសាលា និងចាក់សោរវត្តមានដោយស្វ័យប្រវត្តិនៅពេលដល់កាលបរិច្ឆេទកំណត់។",
                    })
                  : t("holidays.inactiveHolidayHelp", {
                      defaultValue: "ថ្ងៃឈប់សម្រាកអសកម្ម ត្រូវបានបិទដំណើរការ ហើយមិនប៉ះពាល់ដល់កាលវិភាគថ្នាក់ ឬការកត់ត្រាវត្តមានឡើយ។",
                    })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Date Range & Summary */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold font-khmer flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" />
              {t("holidays.dateRange", { defaultValue: "កាលបរិច្ឆេទឈប់សម្រាក" })}
            </CardTitle>
            <CardDescription className="text-xs font-khmer">
              {t("holidays.dateRangeDesc", {
                defaultValue: "កំណត់កាលបរិច្ឆេទចាប់ផ្តើម និងបញ្ចប់នៃការបិទសាលា",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start-date" className="text-xs font-khmer">
                  {t("holidays.startDate", { defaultValue: "ថ្ងៃចាប់ផ្តើម" })}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-9 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="end-date" className="text-xs font-khmer">
                  {t("holidays.endDate", { defaultValue: "ថ្ងៃបញ្ចប់" })}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`pl-9 text-xs font-mono ${
                      isDateRangeInvalid ? "border-destructive focus-visible:ring-destructive" : ""
                    }`}
                    required
                  />
                </div>
              </div>
            </div>

            {isDateRangeInvalid && (
              <div className="text-xs text-destructive font-khmer flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>
                  {t("holidays.endDateAfterStartDateError", {
                    defaultValue: "ថ្ងៃបញ្ចប់មិនអាចនៅមុនថ្ងៃចាប់ផ្តើមបានទេ",
                  })}
                </span>
              </div>
            )}

            {/* Dynamic Days Summary Box */}
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-khmer">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                <span>
                  {t("holidays.closureSummary", {
                    days: totalDays,
                    defaultValue: `ការឈប់សម្រាកនេះមានរយៈពេល ${totalDays} ថ្ងៃប្រតិទិន។`,
                  })}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-bold">
                  {totalDays} {t("classes.daysUnit", { defaultValue: "ថ្ងៃ" })}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground font-khmer flex items-start gap-1.5 bg-muted/30 p-2.5 rounded-lg border border-border/40">
              <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                {t("holidays.recalcHint", {
                  defaultValue:
                    "នៅពេលរក្សាទុក កាលវិភាគថ្ងៃបញ្ចប់ប៉ាន់ស្មាន (Expected End Date) នៃថ្នាក់រៀនសកម្មទាំងអស់ នឹងត្រូវគណនាឡើងវិញដោយស្វ័យប្រវត្តិ។",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Notes */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold font-khmer flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {t("students.note", { defaultValue: "ចំណាំបន្ថែម" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-1.5">
              <Textarea
                id="holiday-note"
                placeholder={t("holidays.notePlaceholder", {
                  defaultValue: "កំណត់ចំណាំអំពីការបិទសាលា ឬលិខិតផ្លូវការ...",
                })}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-xs font-khmer min-h-[90px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/holidays")}
            disabled={isSubmitting}
            className="text-xs font-khmer"
          >
            {t("common.cancel", { defaultValue: "បោះបង់" })}
          </Button>

          <Button
            type="submit"
            variant="gradient"
            disabled={isSubmitting || isDateRangeInvalid || Boolean(overlapWarning)}
            className="gap-2 shadow-sm text-xs font-khmer"
          >
            <Save className="h-4 w-4" />
            {isSubmitting
              ? t("common.loading", { defaultValue: "កំពុងរក្សាទុក..." })
              : t("common.save", { defaultValue: "រក្សាទុក" })}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default HolidayFormPage;
