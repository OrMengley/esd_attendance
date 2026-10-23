import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { classroomService } from "@/services/classroom.service";
import { studyPackageService } from "@/services/study-package.service";
import { userService } from "@/services/user.service";
import { enrollmentService } from "@/services/enrollment.service";
import {
  Search,
  School,
  BookOpen,
  GraduationCap,
  Calendar,
  Clock,
  Users,
  Check,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { formatKhmerDate } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

interface ClassSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClassroomId?: string;
  onSelect: (classroom: Classroom) => void;
}

export const ClassSelectionDialog: React.FC<ClassSelectionDialogProps> = ({
  open,
  onOpenChange,
  selectedClassroomId,
  onSelect,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [packages, setPackages] = useState<StudyPackage[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classEnrollmentCounts, setClassEnrollmentCounts] = useState<
    Record<string, number>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const effectiveBranch = user?.role === "super_admin" ? null : user?.branchId;
      const [clsList, pkgList, usrList, allEnrollments] = await Promise.all([
        classroomService.getClassrooms(effectiveBranch),
        studyPackageService.getStudyPackages(),
        userService.getUsers(),
        enrollmentService.getEnrollments(user),
      ]);

      // Only active classrooms
      const activeClasses = clsList.filter((c) => c.status === "active");
      setClassrooms(activeClasses);
      setPackages(pkgList);
      setTeachers(usrList);

      // Calculate active enrollments count per classroom
      const counts: Record<string, number> = {};
      allEnrollments.forEach((e) => {
        if (e.status === "active") {
          counts[e.classroomId] = (counts[e.classroomId] || 0) + 1;
        }
      });
      setClassEnrollmentCounts(counts);
    } catch (e) {
      console.error("Failed to load class selection data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const getPackageName = (packageId: string) => {
    const pkg = packages.find((p) => p.id === packageId);
    return pkg ? `${pkg.code} - ${pkg.nameKh}` : packageId;
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((u) => u.id === teacherId);
    return teacher ? teacher.name : "-";
  };

  const filteredClassrooms = useMemo(() => {
    if (!searchQuery.trim()) return classrooms;
    const q = searchQuery.toLowerCase().trim();

    return classrooms.filter((cls) => {
      const matchCode = cls.code.toLowerCase().includes(q);
      const matchName = cls.name.toLowerCase().includes(q);
      const pkgName = getPackageName(cls.packageId).toLowerCase();
      const matchPkg = pkgName.includes(q);
      const teacherName = getTeacherName(cls.assignedTeacherId).toLowerCase();
      const matchTeacher = teacherName.includes(q);

      return matchCode || matchName || matchPkg || matchTeacher;
    });
  }, [classrooms, searchQuery, packages, teachers]);

  const handleSelect = (classroom: Classroom) => {
    onSelect(classroom);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[96vw] max-h-[88vh] flex flex-col p-5 sm:p-7 z-[60] rounded-2xl sm:rounded-3xl">
        <DialogHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <School className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold font-khmer">
                {t("enrollment.selectClass")}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm font-khmer text-muted-foreground mt-0.5">
                {t("enrollment.selectClassPrompt")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search Input */}
        <div className="pt-2 pb-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("classes.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-xs sm:text-sm h-10 bg-background rounded-xl border-border/80 focus-visible:ring-primary/20"
              autoFocus
            />
          </div>
        </div>

        {/* Classes List */}
        <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 min-h-[300px]">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-muted/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredClassrooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                <School className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-semibold text-foreground font-khmer">
                  {t("enrollment.noActiveClasses")}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md font-khmer">
                  {t("classes.noClassesDesc")}
                </p>
              </div>
              <Button
                asChild
                size="sm"
                className="text-xs font-khmer gap-1.5 mt-2"
              >
                <Link to="/classes/new" onClick={() => onOpenChange(false)}>
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t("classes.addClass")}</span>
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClassrooms.map((cls) => {
                const isSelected = selectedClassroomId === cls.id;
                const enrolledCount = classEnrollmentCounts[cls.id] || 0;
                const capacity = cls.capacity;
                const isFull = capacity ? enrolledCount >= capacity : false;
                const spotsLeft = capacity ? Math.max(0, capacity - enrolledCount) : null;
                const isWeekday = cls.scheduleDays.length === 5;
                const daysText = isWeekday
                  ? t("classes.mondayToFriday")
                  : t("classes.saturdaySunday");

                return (
                  <div
                    key={cls.id}
                    onClick={() => {
                      if (!isFull || isSelected) {
                        handleSelect(cls);
                      }
                    }}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-sm"
                        : isFull
                        ? "bg-muted/30 border-border/50 opacity-70 cursor-not-allowed"
                        : "bg-card hover:bg-muted/30 border-border/80 hover:border-primary/40 hover:shadow-xs cursor-pointer"
                    }`}
                  >
                    <div className="flex flex-col gap-3.5">
                      {/* Card Header: Code, Name, Badges & Action Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono font-bold text-xs bg-muted/80 text-foreground px-2.5 py-1 rounded-lg border border-border/60">
                            {cls.code}
                          </span>
                          <span className="font-bold text-sm sm:text-base text-foreground font-khmer">
                            {cls.name}
                          </span>
                          {isSelected && (
                            <Badge className="bg-primary text-primary-foreground text-[11px] py-0.5 px-2.5 gap-1 font-khmer shadow-xs">
                              <Check className="h-3.5 w-3.5" />
                              {t("common.selected", { defaultValue: "បានជ្រើសរើស" })}
                            </Badge>
                          )}
                          {isFull && (
                            <Badge variant="destructive" className="text-[11px] py-0.5 px-2.5 font-khmer">
                              {t("enrollment.full")}
                            </Badge>
                          )}
                        </div>

                        {/* Top Right Action Button */}
                        <div className="shrink-0 self-end sm:self-center">
                          <Button
                            type="button"
                            size="sm"
                            disabled={isFull && !isSelected}
                            variant={isSelected ? "default" : "outline"}
                            className="text-xs font-khmer h-8 sm:h-9 px-4 shadow-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isFull || isSelected) {
                                handleSelect(cls);
                              }
                            }}
                          >
                            {isSelected
                              ? t("common.selected", { defaultValue: "បានជ្រើសរើស" })
                              : t("classes.selectAction")}
                          </Button>
                        </div>
                      </div>

                      {/* Details Grid (4 Columns on Desktop) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/40 text-xs text-muted-foreground">
                        {/* 1. Study Package */}
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[11px] font-semibold text-muted-foreground/80 font-khmer flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>{t("enrollment.studyPackage")}:</span>
                          </span>
                          <p className="font-medium text-foreground truncate pl-5">
                            {getPackageName(cls.packageId)}
                          </p>
                        </div>

                        {/* 2. Teacher */}
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[11px] font-semibold text-muted-foreground/80 font-khmer flex items-center gap-1.5">
                            <GraduationCap className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span>{t("enrollment.teacher")}:</span>
                          </span>
                          <p className="font-medium text-foreground truncate pl-5">
                            {getTeacherName(cls.assignedTeacherId)}
                          </p>
                        </div>

                        {/* 3. Schedule & Time */}
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[11px] font-semibold text-muted-foreground/80 font-khmer flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span>{t("enrollment.schedule")}:</span>
                          </span>
                          <p className="font-medium text-foreground truncate pl-5">
                            {daysText} ({cls.startTime} - {cls.endTime})
                          </p>
                        </div>

                        {/* 4. Study Period */}
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[11px] font-semibold text-muted-foreground/80 font-khmer flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>{t("classes.startDate")}:</span>
                          </span>
                          <p className="font-medium text-foreground truncate pl-5">
                            {formatKhmerDate(cls.startDate)} → {formatKhmerDate(cls.expectedEndDate)}
                          </p>
                        </div>
                      </div>

                      {/* Footer Info: Capacity & Enrollment Counts */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-khmer">
                            {t("enrollment.enrolled")}:{" "}
                            <span className="font-bold text-foreground font-mono">
                              {enrolledCount}
                            </span>
                            {capacity ? (
                              <>
                                {" "}
                                /{" "}
                                <span className="font-bold text-foreground font-mono">
                                  {capacity}
                                </span>{" "}
                                {t("classes.studentsUnit")}
                              </>
                            ) : (
                              ` ${t("classes.studentsUnit")}`
                            )}
                          </span>
                        </div>

                        {capacity ? (
                          isFull ? (
                            <span className="text-xs font-bold text-rose-500 font-khmer bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                              {t("enrollment.full")}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-khmer bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              {t("enrollment.spotsLeft", { count: spotsLeft })}
                            </span>
                          )
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
