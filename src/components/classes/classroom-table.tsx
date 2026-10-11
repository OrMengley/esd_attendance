import React from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { ClassroomStatusBadge } from "./classroom-status-badge";
import {
  MoreHorizontal,
  Eye,
  Edit2,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
} from "lucide-react";

interface ClassroomTableProps {
  classrooms: Classroom[];
  studyPackages: StudyPackage[];
  teachers: User[];
  onViewDetails: (cls: Classroom) => void;
  onEdit: (cls: Classroom) => void;
  onToggleStatus: (cls: Classroom) => void;
  onMarkCompleted: (cls: Classroom) => void;
}

export const ClassroomTable: React.FC<ClassroomTableProps> = ({
  classrooms,
  studyPackages,
  teachers,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onMarkCompleted,
}) => {
  const { t } = useTranslation();

  const packageMap = React.useMemo(() => {
    const map = new Map<string, StudyPackage>();
    studyPackages.forEach((p) => map.set(p.id, p));
    return map;
  }, [studyPackages]);

  const teacherMap = React.useMemo(() => {
    const map = new Map<string, User>();
    teachers.forEach((u) => map.set(u.id, u));
    return map;
  }, [teachers]);

  const formatScheduleText = (cls: Classroom) => {
    const isWeekday = cls.scheduleDays.length === 5;
    const daysLabel = isWeekday ? t("classes.mondayToFriday") : t("classes.saturdaySunday");
    const timeRange = `${cls.startTime || "07:00"} - ${cls.endTime || "08:00"}`;
    return { daysLabel, timeRange };
  };

  return (
    <div className="space-y-4">
      {/* 1. Desktop Table View (hidden on small screens) */}
      <div className="hidden md:block rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40 font-khmer">
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[200px] font-bold text-xs">
                {t("classes.classColumn")}
              </TableHead>
              <TableHead className="min-w-[170px] font-bold text-xs">
                {t("classes.package")}
              </TableHead>
              <TableHead className="min-w-[160px] font-bold text-xs">
                {t("classes.teacher")}
              </TableHead>
              <TableHead className="min-w-[170px] font-bold text-xs">
                {t("classes.schedule")}
              </TableHead>
              <TableHead className="min-w-[190px] font-bold text-xs">
                {t("classes.studyPeriod")}
              </TableHead>
              <TableHead className="w-[110px] text-center font-bold text-xs">
                {t("classes.status")}
              </TableHead>
              <TableHead className="w-[60px] text-right font-bold text-xs pr-4">
                {t("common.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {classrooms.map((cls) => {
              const pkg = packageMap.get(cls.packageId);
              const teacher = teacherMap.get(cls.assignedTeacherId);
              const { daysLabel, timeRange } = formatScheduleText(cls);

              return (
                <TableRow key={cls.id} className="hover:bg-muted/30 transition-colors">
                  {/* 1. Class: Name + Code */}
                  <TableCell>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => onViewDetails(cls)}
                        className="text-left font-bold text-xs sm:text-sm text-foreground font-khmer hover:text-primary hover:underline transition-colors line-clamp-1"
                      >
                        {cls.name}
                      </button>
                      <span className="font-mono text-[11px] font-semibold text-primary/90 mt-0.5">
                        {cls.code}
                      </span>
                    </div>
                  </TableCell>

                  {/* 2. Study Package: Name + Total hours */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-foreground font-khmer truncate">
                        {pkg?.nameKh || cls.packageId}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {pkg?.totalPlannedHours || 40} {t("classes.hoursUnit")}
                      </span>
                    </div>
                  </TableCell>

                  {/* 3. Teacher: Avatar + Name + Username */}
                  <TableCell>
                    {teacher ? (
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-7 w-7 ring-1 ring-border shrink-0">
                          <AvatarImage src={teacher.avatarUrl} />
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-[10px]">
                            {teacher.name ? teacher.name.charAt(0) : "T"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {teacher.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono truncate">
                            @{teacher.username}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-muted text-muted-foreground font-khmer">
                        {t("dashboard.unassigned")}
                      </span>
                    )}
                  </TableCell>

                  {/* 4. Schedule: Days · Time + Hours/week */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-foreground font-khmer">
                        {daysLabel} · <span className="font-mono">{timeRange}</span>
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {cls.hoursPerWeek} {t("classes.hoursUnit")}/wk ({cls.sessionMinutes} {t("classes.minsUnit")})
                      </span>
                    </div>
                  </TableCell>

                  {/* 5. Study Period: startDate → expectedEndDate */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-muted-foreground">
                      <span className="text-foreground">{cls.startDate}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-bold text-primary">{cls.expectedEndDate}</span>
                    </div>
                  </TableCell>

                  {/* 6. Status Badge */}
                  <TableCell className="text-center">
                    <ClassroomStatusBadge status={cls.status} />
                  </TableCell>

                  {/* 7. Actions Dropdown */}
                  <TableCell className="text-right pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-muted"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 z-50">
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground font-mono">
                          {cls.code}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => onViewDetails(cls)}
                          className="cursor-pointer text-xs font-khmer gap-2"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-500" />
                          <span>{t("classes.viewDetails")}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => onEdit(cls)}
                          className="cursor-pointer text-xs font-khmer gap-2"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-amber-500" />
                          <span>{t("classes.editClass")}</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {cls.status === "active" && (
                          <DropdownMenuItem
                            onClick={() => onMarkCompleted(cls)}
                            className="cursor-pointer text-xs font-khmer gap-2 text-primary dark:text-blue-400"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{t("classes.markCompleted")}</span>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => onToggleStatus(cls)}
                          className={
                            cls.status === "active"
                              ? "cursor-pointer text-xs font-khmer gap-2 text-rose-600 dark:text-rose-400"
                              : "cursor-pointer text-xs font-khmer gap-2 text-emerald-600 dark:text-emerald-400"
                          }
                        >
                          {cls.status === "active" ? (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              <span>{t("classes.deactivate")}</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{t("classes.activate")}</span>
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 2. Mobile Responsive Card View (shown on screens < md) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {classrooms.map((cls) => {
          const pkg = packageMap.get(cls.packageId);
          const teacher = teacherMap.get(cls.assignedTeacherId);
          const { daysLabel, timeRange } = formatScheduleText(cls);

          return (
            <div
              key={cls.id}
              className="p-4 rounded-xl border bg-card shadow-xs space-y-3"
            >
              {/* Top: Name, Code & Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <button
                    type="button"
                    onClick={() => onViewDetails(cls)}
                    className="font-bold text-sm text-foreground font-khmer text-left hover:text-primary"
                  >
                    {cls.name}
                  </button>
                  <p className="font-mono text-xs font-semibold text-primary mt-0.5">
                    {cls.code}
                  </p>
                </div>
                <ClassroomStatusBadge status={cls.status} />
              </div>

              {/* Package & Teacher */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                <div>
                  <span className="text-muted-foreground text-[11px] font-khmer block">
                    {t("classes.package")}
                  </span>
                  <span className="font-semibold text-foreground font-khmer truncate block mt-0.5">
                    {pkg?.nameKh || cls.packageId}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {pkg?.totalPlannedHours || 40} {t("classes.hoursUnit")}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground text-[11px] font-khmer block">
                    {t("classes.teacher")}
                  </span>
                  <span className="font-semibold text-foreground truncate block mt-0.5">
                    {teacher?.name || t("dashboard.unassigned")}
                  </span>
                  {teacher?.username && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      @{teacher.username}
                    </span>
                  )}
                </div>
              </div>

              {/* Schedule & Study Period */}
              <div className="p-2.5 rounded-lg bg-muted/40 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-khmer">
                  <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-blue-500" />
                    {daysLabel}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-foreground">
                    {timeRange}
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono text-[11px] pt-1 border-t border-border/40">
                  <span className="text-muted-foreground">{cls.startDate}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-bold text-primary">{cls.expectedEndDate}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(cls)}
                  className="text-xs font-khmer h-8 gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5 text-blue-500" />
                  {t("classes.viewDetails")}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(cls)}
                  className="text-xs font-khmer h-8 gap-1.5"
                >
                  <Edit2 className="h-3.5 w-3.5 text-amber-500" />
                  {t("common.edit")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
