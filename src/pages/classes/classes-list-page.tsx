import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { ClassroomTable } from "@/components/classes/classroom-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { classroomService } from "@/services/classroom.service";
import { studyPackageService } from "@/services/study-package.service";
import { userService } from "@/services/user.service";
import { branchService } from "@/services/branch.service";
import { Classroom, ClassroomStatus } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { Branch } from "@/models/branch.model";
import { getScheduleType } from "@/lib/classroom-schedule";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { toast } from "sonner";
import {
  Plus,
  Search,
  School,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

export const ClassesListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentBranchId } = useBranch();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [studyPackages, setStudyPackages] = useState<StudyPackage[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(currentBranchId || "all");
  const [selectedPackage, setSelectedPackage] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [selectedScheduleType, setSelectedScheduleType] = useState<"all" | "weekday" | "weekend">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | ClassroomStatus>("all");

  useEffect(() => {
    setSelectedBranch(currentBranchId || "all");
  }, [currentBranchId]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [clsList, pkgList, usrList, brList] = await Promise.all([
        classroomService.getClassrooms(),
        studyPackageService.getStudyPackages(),
        userService.getTeachers(),
        branchService.getBranches(),
      ]);

      setClassrooms(clsList);
      setStudyPackages(pkgList);
      setTeachers(usrList);
      setBranches(brList);
    } catch (error) {
      console.error("Failed to load classes data:", error);
      toast.error(t("classes.fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Classrooms
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter((cls) => {
      // Status filter
      if (selectedStatus !== "all" && cls.status !== selectedStatus) {
        return false;
      }

      // Branch filter
      if (selectedBranch !== "all" && cls.branchId !== selectedBranch) {
        return false;
      }

      // Package filter
      if (selectedPackage !== "all" && cls.packageId !== selectedPackage) {
        return false;
      }

      // Teacher filter
      if (selectedTeacher !== "all" && cls.assignedTeacherId !== selectedTeacher) {
        return false;
      }

      // Schedule Type filter
      if (selectedScheduleType !== "all") {
        const sType = getScheduleType(cls.scheduleDays);
        if (sType !== selectedScheduleType) {
          return false;
        }
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchCode = cls.code.toLowerCase().includes(query);
        const matchName = cls.name.toLowerCase().includes(query);
        if (!matchCode && !matchName) {
          return false;
        }
      }

      return true;
    });
  }, [
    classrooms,
    selectedStatus,
    selectedPackage,
    selectedTeacher,
    selectedScheduleType,
    searchQuery,
  ]);

  // Statistics counters
  const activeCount = useMemo(
    () => classrooms.filter((c) => c.status === "active").length,
    [classrooms]
  );
  const completedCount = useMemo(
    () => classrooms.filter((c) => c.status === "completed").length,
    [classrooms]
  );

  // Handlers
  const handleToggleStatus = async (cls: Classroom) => {
    const nextStatus: ClassroomStatus = cls.status === "active" ? "inactive" : "active";
    try {
      await classroomService.setClassroomStatus(cls.id, nextStatus, user?.id);
      toast.success(t("classes.statusUpdateSuccess"));
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error(t("common.error"));
    }
  };

  const handleMarkCompleted = async (cls: Classroom) => {
    try {
      await classroomService.setClassroomStatus(cls.id, "completed", user?.id);
      toast.success(t("classes.markCompletedSuccess"));
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error(t("common.error"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("classes.title")}
        description={t("classes.description")}
      >
        <Button asChild variant="gradient" className="gap-2 shadow-sm font-khmer text-xs sm:text-sm">
          <Link to="/classes/new">
            <Plus className="h-4 w-4" />
            {t("classes.addClass")}
          </Link>
        </Button>
      </PageHeader>

      {/* Summary Stats Badges */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-card px-3.5 py-2 rounded-xl border border-border/80 shadow-xs text-xs font-khmer">
          <School className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">{t("classes.totalClasses")}:</span>
          <strong className="text-foreground text-sm font-mono">{classrooms.length}</strong>
        </div>

        <div className="flex items-center gap-2 bg-card px-3.5 py-2 rounded-xl border border-border/80 shadow-xs text-xs font-khmer">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">{t("classes.activeClasses")}:</span>
          <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-mono">
            {activeCount}
          </strong>
        </div>

        <div className="flex items-center gap-2 bg-card px-3.5 py-2 rounded-xl border border-border/80 shadow-xs text-xs font-khmer">
          <CheckCircle2 className="h-4 w-4 text-blue-500" />
          <span className="text-muted-foreground">{t("classes.completedClasses")}:</span>
          <strong className="text-blue-600 dark:text-blue-400 text-sm font-mono">
            {completedCount}
          </strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border border-border/80 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("classes.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs sm:text-sm bg-background/70 h-9"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Branch Filter */}
            {branches.length > 0 && (
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[150px] text-xs font-khmer h-9">
                  <SelectValue placeholder={t("branches.allBranches")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs font-khmer">
                    {t("branches.allBranches")}
                  </SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs font-khmer">
                      {b.nameKh}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Package Filter */}
            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger className="w-[160px] text-xs font-khmer h-9">
                <SelectValue placeholder={t("classes.allPackages")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-khmer">
                  {t("classes.allPackages")}
                </SelectItem>
                {studyPackages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id} className="text-xs font-khmer">
                    {pkg.nameKh}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Teacher Filter */}
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger className="w-[150px] text-xs h-9">
                <SelectValue placeholder={t("classes.allTeachers")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-khmer">
                  {t("classes.allTeachers")}
                </SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id} className="text-xs">
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Schedule Type Filter */}
            <Select
              value={selectedScheduleType}
              onValueChange={(val: "all" | "weekday" | "weekend") =>
                setSelectedScheduleType(val)
              }
            >
              <SelectTrigger className="w-[145px] text-xs font-khmer h-9">
                <SelectValue placeholder={t("classes.allScheduleTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-khmer">
                  {t("classes.allScheduleTypes")}
                </SelectItem>
                <SelectItem value="weekday" className="text-xs font-khmer">
                  {t("classes.weekday")}
                </SelectItem>
                <SelectItem value="weekend" className="text-xs font-khmer">
                  {t("classes.weekend")}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={selectedStatus}
              onValueChange={(val: "all" | ClassroomStatus) => setSelectedStatus(val)}
            >
              <SelectTrigger className="w-[130px] text-xs font-khmer h-9">
                <SelectValue placeholder={t("classes.allStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-khmer">
                  {t("classes.allStatus")}
                </SelectItem>
                <SelectItem value="active" className="text-xs font-khmer">
                  {t("classes.activeStatus")}
                </SelectItem>
                <SelectItem value="completed" className="text-xs font-khmer">
                  {t("classes.completedStatus")}
                </SelectItem>
                <SelectItem value="inactive" className="text-xs font-khmer">
                  {t("classes.inactiveStatus")}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh button */}
            <Button
              variant="outline"
              size="icon"
              onClick={loadData}
              title={t("common.refresh")}
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 w-full bg-muted/40 animate-pulse rounded-xl border border-border/50"
            />
          ))}
        </div>
      ) : classrooms.length === 0 ? (
        <EmptyState
          icon={School}
          title={t("classes.noClassesTitle")}
          description={t("classes.noClassesDesc")}
          actionLabel={t("classes.addClass")}
          onAction={() => navigate("/classes/new")}
        />
      ) : filteredClassrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card/50 rounded-2xl border border-dashed border-border/80">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
            <School className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground font-khmer">
            {t("common.noData")}
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 font-khmer">
            {t("common.noDataDesc")}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedPackage("all");
              setSelectedTeacher("all");
              setSelectedScheduleType("all");
              setSelectedStatus("all");
            }}
            className="mt-3 text-xs text-primary font-khmer"
          >
            {t("common.refresh")}
          </Button>
        </div>
      ) : (
        <ClassroomTable
          classrooms={filteredClassrooms}
          studyPackages={studyPackages}
          teachers={teachers}
          branches={branches}
          onViewDetails={(cls) => navigate(`/classes/${cls.id}`)}
          onEdit={(cls) => navigate(`/classes/${cls.id}/edit`)}
          onToggleStatus={handleToggleStatus}
          onMarkCompleted={handleMarkCompleted}
        />
      )}
    </div>
  );
};

export default ClassesListPage;
