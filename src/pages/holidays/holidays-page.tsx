import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { useSchoolHolidays } from "@/hooks/use-school-holidays";
import { schoolHolidayService } from "@/services/school-holiday.service";
import { SchoolHoliday, SchoolHolidayStatus } from "@/models/school-holiday.model";
import { HolidayPeriod, getHolidayPeriod } from "@/lib/holiday-period";
import { HolidayListTable } from "@/components/holidays/holiday-list-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Palmtree,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Calendar,
  Clock,
} from "lucide-react";

export const HolidaysPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { holidays, isLoading, refresh } = useSchoolHolidays();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SchoolHolidayStatus>("all");
  const [periodFilter, setPeriodFilter] = useState<"all" | HolidayPeriod>("all");

  // Summary statistics
  const stats = useMemo(() => {
    const total = holidays.length;
    const active = holidays.filter((h) => h.status === "active").length;
    const inactive = holidays.filter((h) => h.status === "inactive").length;
    const upcoming = holidays.filter(
      (h) => getHolidayPeriod(h.startDate, h.endDate) === "upcoming"
    ).length;
    return { total, active, inactive, upcoming };
  }, [holidays]);

  // Filtered list
  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      // 1. Manual Status match (active / inactive)
      if (statusFilter !== "all" && h.status !== statusFilter) {
        return false;
      }
      // 2. Computed Period match (upcoming / today / past)
      if (periodFilter !== "all") {
        const period = getHolidayPeriod(h.startDate, h.endDate);
        if (period !== periodFilter) {
          return false;
        }
      }
      // 3. Search match
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const kmMatch = h.nameKm.toLowerCase().includes(term);
        const enMatch = h.nameEn ? h.nameEn.toLowerCase().includes(term) : false;
        const noteMatch = h.note ? h.note.toLowerCase().includes(term) : false;
        return kmMatch || enMatch || noteMatch;
      }
      return true;
    });
  }, [holidays, statusFilter, periodFilter, searchTerm]);

  // Handle status toggle (active <-> inactive)
  const handleToggleStatus = async (holiday: SchoolHoliday) => {
    const newStatus: SchoolHolidayStatus = holiday.status === "active" ? "inactive" : "active";
    try {
      await schoolHolidayService.setSchoolHolidayStatus(holiday.id, newStatus, user?.id);
      toast.success(
        newStatus === "active"
          ? t("holidays.activatedSuccess", { defaultValue: "បានបើកដំណើរការថ្ងៃឈប់សម្រាកជោគជ័យ" })
          : t("holidays.deactivatedSuccess", { defaultValue: "បានបិទដំណើរការថ្ងៃឈប់សម្រាកជោគជ័យ" })
      );
      await refresh();
    } catch (err: any) {
      if (err?.message === "OVERLAPPING_ACTIVE_HOLIDAY") {
        toast.error(
          t("holidays.overlappingDates", {
            defaultValue: "កាលបរិច្ឆេទនេះជាន់គ្នាជាមួយថ្ងៃឈប់សម្រាកសកម្មផ្សេងទៀត!",
          })
        );
      } else {
        toast.error(t("holidays.statusUpdateError", { defaultValue: "មិនអាចកែប្រែស្ថានភាពបានទេ" }));
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-khmer text-foreground tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Palmtree className="h-6 w-6" />
            </div>
            <span>{t("holidays.title", { defaultValue: "ថ្ងៃឈប់សម្រាក និងបិទសាលា" })}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-khmer mt-1">
            {t("holidays.description", {
              defaultValue:
                "គ្រប់គ្រងថ្ងៃឈប់សម្រាកបុណ្យជាតិ អន្តរជាតិ និងការបិទសាលា ដែលជះឥទ្ធិពលលើកាលវិភាគថ្នាក់ និងវត្តមាន",
            })}
          </p>
        </div>

        <Button
          asChild
          variant="gradient"
          className="shadow-sm text-xs font-khmer gap-2 self-start sm:self-auto"
        >
          <Link to="/holidays/new">
            <Plus className="h-4 w-4" />
            <span>{t("holidays.addHoliday", { defaultValue: "បន្ថែមថ្ងៃឈប់សម្រាក" })}</span>
          </Link>
        </Button>
      </div>

      {/* Stats Cards: Total, Active, Inactive, Upcoming */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-khmer text-muted-foreground">
                {t("holidays.totalHolidays", { defaultValue: "ថ្ងៃឈប់សម្រាកសរុប" })}
              </p>
              <h3 className="text-2xl font-bold font-mono text-foreground mt-1">{stats.total}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-khmer text-muted-foreground">
                {t("holidays.activeHolidays", { defaultValue: "កំពុងសកម្ម" })}
              </p>
              <h3 className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.active}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-khmer text-muted-foreground">
                {t("holidays.inactiveHolidays", { defaultValue: "អសកម្ម" })}
              </p>
              <h3 className="text-2xl font-bold font-mono text-muted-foreground mt-1">
                {stats.inactive}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-muted text-muted-foreground">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-khmer text-muted-foreground">
                {t("holidays.upcomingHolidays", { defaultValue: "ឈប់សម្រាកខាងមុខ" })}
              </p>
              <h3 className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                {stats.upcoming}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-border/70 shadow-xs bg-card">
        <CardContent className="p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("holidays.searchPlaceholder", {
                defaultValue: "ស្វែងរកតាមឈ្មោះថ្ងៃឈប់សម្រាក...",
              })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs font-khmer h-9"
            />
          </div>

          {/* Period Filter Dropdown */}
          <div className="w-full sm:w-44">
            <Select
              value={periodFilter}
              onValueChange={(val: "all" | HolidayPeriod) => setPeriodFilter(val)}
            >
              <SelectTrigger className="text-xs font-khmer h-9">
                <SelectValue placeholder={t("holidays.allPeriods", { defaultValue: "កាលកំណត់ទាំងអស់" })} />
              </SelectTrigger>
              <SelectContent className="font-khmer">
                <SelectItem value="all">{t("holidays.allPeriods", { defaultValue: "កាលកំណត់ទាំងអស់" })}</SelectItem>
                <SelectItem value="upcoming">{t("holidays.upcoming", { defaultValue: "ខាងមុខ" })}</SelectItem>
                <SelectItem value="today">{t("holidays.today", { defaultValue: "ថ្ងៃនេះ" })}</SelectItem>
                <SelectItem value="past">{t("holidays.past", { defaultValue: "កន្លងផុត" })}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Manual Status Filter Dropdown */}
          <div className="w-full sm:w-44">
            <Select
              value={statusFilter}
              onValueChange={(val: "all" | SchoolHolidayStatus) => setStatusFilter(val)}
            >
              <SelectTrigger className="text-xs font-khmer h-9">
                <SelectValue placeholder={t("common.filterStatus", { defaultValue: "ស្ថានភាព" })} />
              </SelectTrigger>
              <SelectContent className="font-khmer">
                <SelectItem value="all">{t("common.allStatus", { defaultValue: "ស្ថានភាពទាំងអស់" })}</SelectItem>
                <SelectItem value="active">{t("holidays.active", { defaultValue: "សកម្ម" })}</SelectItem>
                <SelectItem value="inactive">{t("holidays.inactive", { defaultValue: "អសកម្ម" })}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Holiday Table / List */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-10 bg-muted/40 rounded-xl animate-pulse" />
          <div className="h-32 bg-card rounded-2xl border animate-pulse" />
          <div className="h-32 bg-card rounded-2xl border animate-pulse" />
        </div>
      ) : (
        <HolidayListTable
          holidays={filteredHolidays}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
};

export default HolidaysPage;
