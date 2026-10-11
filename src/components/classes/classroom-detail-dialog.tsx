import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { ClassroomStatusBadge } from "./classroom-status-badge";
import { formatKhmerDate } from "@/lib/utils";
import {
  School,
  BookOpen,
  GraduationCap,
  Calendar,
  Clock,
  Users,
  CalendarCheck,
  FileText,
  Edit2,
  Sparkles,
} from "lucide-react";

interface ClassroomDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroom: Classroom | null;
  studyPackage?: StudyPackage | null;
  teacher?: User | null;
  onEdit?: (cls: Classroom) => void;
}

export const ClassroomDetailDialog: React.FC<ClassroomDetailDialogProps> = ({
  open,
  onOpenChange,
  classroom,
  studyPackage,
  teacher,
  onEdit,
}) => {
  const { t } = useTranslation();

  if (!classroom) return null;

  const isWeekday = classroom.scheduleDays.length === 5;
  const daysText = isWeekday
    ? t("classes.mondayToFriday") + " (Mon - Fri)"
    : t("classes.saturdaySunday") + " (Sat - Sun)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <School className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-lg font-bold font-khmer">
                    {classroom.name}
                  </DialogTitle>
                  <ClassroomStatusBadge status={classroom.status} />
                </div>
                <DialogDescription className="text-xs font-mono text-primary font-semibold mt-0.5">
                  {classroom.code}
                </DialogDescription>
              </div>
            </div>

            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(classroom);
                }}
                className="gap-1.5 text-xs font-khmer self-start sm:self-auto"
              >
                <Edit2 className="h-3.5 w-3.5" />
                {t("classes.editClass")}
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Content Details */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 text-xs">
          {/* Section 1: Study Package & Teacher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Study Package */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
              <span className="text-muted-foreground font-khmer flex items-center gap-1.5 text-[11px]">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                {t("classes.package")}
              </span>
              <div className="font-bold text-foreground font-khmer text-sm">
                {studyPackage?.nameKh || classroom.packageId}
              </div>
              {studyPackage?.nameEn && (
                <div className="text-[11px] text-muted-foreground">
                  {studyPackage.nameEn}
                </div>
              )}
              <div className="pt-1 flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono bg-background">
                  {studyPackage?.code || classroom.packageId}
                </Badge>
                <span className="text-[11px] text-primary dark:text-blue-400 font-semibold font-khmer">
                  {studyPackage?.totalPlannedHours || 40} {t("classes.hoursUnit")}
                </span>
              </div>
            </div>

            {/* Assigned Teacher */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
              <span className="text-muted-foreground font-khmer flex items-center gap-1.5 text-[11px]">
                <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                {t("classes.teacher")}
              </span>
              <div className="font-bold text-foreground font-khmer text-sm">
                {teacher?.name || t("dashboard.unassigned")}
              </div>
              {teacher?.username && (
                <div className="text-[11px] text-muted-foreground">
                  @{teacher.username}
                </div>
              )}
              {teacher?.phone && (
                <div className="text-[11px] text-muted-foreground font-mono">
                  {teacher.phone}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Schedule & Time */}
          <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-3">
            <h4 className="font-bold font-khmer text-xs flex items-center gap-2 text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              {t("classes.schedule")} & {t("classes.time")}
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <span className="text-muted-foreground text-[11px] font-khmer block">
                  {t("classes.learningDays")}
                </span>
                <span className="font-semibold text-foreground font-khmer text-xs mt-0.5 block">
                  {daysText}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground text-[11px] font-khmer block">
                  {t("classes.time")}
                </span>
                <span className="font-semibold text-foreground font-mono text-xs mt-0.5 block">
                  {classroom.startTime} - {classroom.endTime}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground text-[11px] font-khmer block">
                  {t("classes.sessionDuration")}
                </span>
                <span className="font-semibold text-foreground text-xs mt-0.5 block">
                  {classroom.sessionMinutes} {t("classes.sessionMinutes")}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground text-[11px] font-khmer block">
                  {t("classes.hoursPerWeek")}
                </span>
                <span className="font-semibold text-primary dark:text-blue-400 font-mono text-xs mt-0.5 block">
                  {classroom.hoursPerWeek} {t("classes.hoursUnit")}/wk
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Course Dates */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
            <h4 className="font-bold font-khmer text-xs flex items-center gap-2 text-primary">
              <CalendarCheck className="h-4 w-4 text-primary" />
              {t("classes.startDate")} & {t("classes.expectedEndDate")}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-background/80 p-2.5 rounded-lg border border-border/40">
                <span className="text-muted-foreground text-[11px] font-khmer block">
                  {t("classes.startDate")}
                </span>
                <span className="font-bold text-foreground font-mono text-xs mt-0.5 block">
                  {classroom.startDate}
                </span>
              </div>

              <div className="bg-background/80 p-2.5 rounded-lg border border-primary/30">
                <span className="text-primary font-semibold text-[11px] font-khmer flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {t("classes.expectedEndDate")}
                </span>
                <span className="font-bold text-primary font-mono text-xs mt-0.5 block">
                  {classroom.expectedEndDate}
                </span>
              </div>
            </div>

            {classroom.actualEndDate && (
              <div className="bg-background/80 p-2.5 rounded-lg border border-border/40">
                <span className="text-muted-foreground text-[11px] font-khmer block">
                  {t("classes.actualEndDate")}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs mt-0.5 block">
                  {classroom.actualEndDate}
                </span>
              </div>
            )}
          </div>

          {/* Section 4: Capacity & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <span className="text-muted-foreground text-[11px] font-khmer flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                {t("classes.capacity")}
              </span>
              <span className="font-bold text-foreground text-xs mt-1 block">
                {classroom.capacity
                  ? `${classroom.capacity} ${t("classes.studentsUnit")}`
                  : "-"}
              </span>
            </div>

            <div className="sm:col-span-2 p-3 rounded-xl bg-muted/40 border border-border/60">
              <span className="text-muted-foreground text-[11px] font-khmer flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                {t("classes.note")}
              </span>
              <p className="text-xs text-foreground font-khmer mt-1 whitespace-pre-wrap">
                {classroom.note || "-"}
              </p>
            </div>
          </div>

          {/* Section 5: Audit details */}
          <div className="pt-2 text-[10px] text-muted-foreground/70 flex flex-wrap gap-4 border-t border-border/40 font-khmer">
            {classroom.createdAt && (
              <span>
                {t("packages.createdAt")}: {formatKhmerDate(classroom.createdAt)}
              </span>
            )}
            {classroom.updatedAt && (
              <span>
                កែប្រែចុងក្រោយ: {formatKhmerDate(classroom.updatedAt)}
              </span>
            )}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs font-khmer"
          >
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
