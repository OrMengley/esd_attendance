import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StudentStatusBadge } from "./student-status-badge";
import { EnrollmentDialog } from "./enrollment-dialog";
import { Student, StudentStatus } from "@/models/student.model";
import { Enrollment } from "@/models/enrollment.model";
import { Classroom } from "@/models/classroom.model";
import { studentService } from "@/services/student.service";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Eye,
  Edit2,
  UserPlus,
  Archive,
  Phone,
  School,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
} from "lucide-react";

interface StudentTableProps {
  students: Student[];
  activeEnrollments: Record<string, Enrollment>; // studentId -> active Enrollment
  classrooms: Classroom[];
  onRefresh: () => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  activeEnrollments,
  classrooms,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [studentToEnroll, setStudentToEnroll] = useState<Student | null>(null);
  const [studentToArchive, setStudentToArchive] = useState<Student | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const getClassroom = (classroomId?: string) => {
    if (!classroomId) return null;
    return classrooms.find((c) => c.id === classroomId);
  };

  const handleToggleStatus = async (student: Student) => {
    const newStatus: StudentStatus =
      student.status === "active" ? "inactive" : "active";
    try {
      await studentService.setStudentStatus(student.id, newStatus, user?.id);
      toast.success(t("students.updated"));
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message || t("common.error"));
    }
  };

  const handleArchive = async () => {
    if (!studentToArchive) return;
    setIsArchiving(true);
    try {
      await studentService.setStudentStatus(
        studentToArchive.id,
        "archived",
        user?.id
      );
      toast.success(t("students.archiveSuccess"));
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message || t("common.error"));
    } finally {
      setIsArchiving(false);
      setStudentToArchive(null);
    }
  };

  const getParentPhone = (student: Student) => {
    if (student.fatherPhone && student.motherPhone) {
      return `${student.fatherPhone} / ${student.motherPhone}`;
    }
    return student.fatherPhone || student.motherPhone || student.phone || "-";
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-b">
              {/* 1. Student */}
              <TableHead className="font-semibold text-xs font-khmer min-w-[200px]">
                {t("students.studentName")}
              </TableHead>
              {/* 2. Student Code */}
              <TableHead className="font-semibold text-xs font-khmer min-w-[120px]">
                {t("students.studentCode")}
              </TableHead>
              {/* 3. Gender */}
              <TableHead className="font-semibold text-xs font-khmer min-w-[80px]">
                {t("students.gender")}
              </TableHead>
              {/* 4. Active Class */}
              <TableHead className="font-semibold text-xs font-khmer min-w-[180px]">
                {t("students.activeClass")}
              </TableHead>
              {/* 5. Parent Contact */}
              <TableHead className="font-semibold text-xs font-khmer min-w-[140px]">
                {t("students.parentContact")}
              </TableHead>
              {/* 6. Status */}
              <TableHead className="font-semibold text-xs font-khmer min-w-[100px]">
                {t("common.status")}
              </TableHead>
              {/* 7. Actions */}
              <TableHead className="text-right font-semibold text-xs font-khmer w-[80px]">
                {t("common.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => {
              const activeEnr = activeEnrollments[student.id];
              const activeClass = activeEnr
                ? getClassroom(activeEnr.classroomId)
                : null;
              const parentPhone = getParentPhone(student);

              return (
                <TableRow key={student.id} className="hover:bg-muted/30">
                  {/* Student Name & Avatar */}
                  <TableCell>
                    <Link
                      to={`/students/${student.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <Avatar className="h-10 w-10 ring-1 ring-border group-hover:ring-primary/40 transition-all shrink-0">
                        <AvatarImage src={student.avatarUrl} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                          {student.nameKh.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 space-y-0.5">
                        <span className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors block truncate">
                          {student.nameKh}
                        </span>
                        {student.nameEn && (
                          <span className="text-[11px] text-muted-foreground block truncate">
                            {student.nameEn}
                          </span>
                        )}
                      </div>
                    </Link>
                  </TableCell>

                  {/* Student Code */}
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md border">
                      {student.studentCode}
                    </span>
                  </TableCell>

                  {/* Gender */}
                  <TableCell className="text-xs text-muted-foreground">
                    {student.gender === "female"
                      ? t("gender.female")
                      : t("gender.male")}
                  </TableCell>

                  {/* Active Class */}
                  <TableCell>
                    {activeClass ? (
                      <Link
                        to={`/classes/${activeClass.id}`}
                        className="inline-flex flex-col group/cls"
                      >
                        <span className="font-bold text-xs text-foreground group-hover/cls:text-primary transition-colors font-mono">
                          {activeClass.code}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                          {activeClass.name}
                        </span>
                      </Link>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-[10px] text-muted-foreground font-normal bg-muted/60"
                      >
                        {t("students.notEnrolled")}
                      </Badge>
                    )}
                  </TableCell>

                  {/* Parent Contact */}
                  <TableCell>
                    {parentPhone !== "-" ? (
                      <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {parentPhone}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <StudentStatusBadge status={student.status} />
                  </TableCell>

                  {/* Actions Dropdown */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 font-khmer">
                        <DropdownMenuItem
                          onClick={() => navigate(`/students/${student.id}`)}
                          className="gap-2 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 text-blue-500" />
                          <span>{t("students.viewStudent")}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => navigate(`/students/${student.id}/edit`)}
                          className="gap-2 cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4 text-amber-500" />
                          <span>{t("students.editStudent")}</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => setStudentToEnroll(student)}
                          className="gap-2 cursor-pointer text-primary focus:text-primary"
                        >
                          <UserPlus className="h-4 w-4 text-primary" />
                          <span>{t("students.enrollInClass")}</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(student)}
                          className="gap-2 cursor-pointer"
                        >
                          {student.status === "active" ? (
                            <>
                              <ToggleLeft className="h-4 w-4 text-slate-500" />
                              <span>{t("students.statusInactive")}</span>
                            </>
                          ) : (
                            <>
                              <ToggleRight className="h-4 w-4 text-emerald-500" />
                              <span>{t("students.statusActive")}</span>
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => setStudentToArchive(student)}
                          className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
                        >
                          <Archive className="h-4 w-4 text-rose-500" />
                          <span>{t("students.archiveStudent")}</span>
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {students.map((student) => {
          const activeEnr = activeEnrollments[student.id];
          const activeClass = activeEnr
            ? getClassroom(activeEnr.classroomId)
            : null;
          const parentPhone = getParentPhone(student);

          return (
            <div
              key={student.id}
              className="p-4 rounded-2xl border bg-card hover:border-border/80 transition-all space-y-3 shadow-xs"
            >
              {/* Top row: Avatar + Name + Status */}
              <div className="flex items-start justify-between gap-3">
                <Link
                  to={`/students/${student.id}`}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <Avatar className="h-11 w-11 ring-1 ring-border shrink-0">
                    <AvatarImage src={student.avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                      {student.nameKh.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {student.nameKh}
                    </h4>
                    {student.nameEn && (
                      <p className="text-xs text-muted-foreground truncate">
                        {student.nameEn}
                      </p>
                    )}
                    <span className="font-mono text-[11px] font-semibold text-primary">
                      {student.studentCode}
                    </span>
                  </div>
                </Link>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StudentStatusBadge status={student.status} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 font-khmer">
                      <DropdownMenuItem
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="gap-2 cursor-pointer"
                      >
                        <Eye className="h-4 w-4 text-blue-500" />
                        <span>{t("students.viewStudent")}</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => navigate(`/students/${student.id}/edit`)}
                        className="gap-2 cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4 text-amber-500" />
                        <span>{t("students.editStudent")}</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setStudentToEnroll(student)}
                        className="gap-2 cursor-pointer text-primary focus:text-primary"
                      >
                        <UserPlus className="h-4 w-4 text-primary" />
                        <span>{t("students.enrollInClass")}</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(student)}
                        className="gap-2 cursor-pointer"
                      >
                        {student.status === "active" ? (
                          <>
                            <ToggleLeft className="h-4 w-4 text-slate-500" />
                            <span>{t("students.statusInactive")}</span>
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-4 w-4 text-emerald-500" />
                            <span>{t("students.statusActive")}</span>
                          </>
                        )}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setStudentToArchive(student)}
                        className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
                      >
                        <Archive className="h-4 w-4 text-rose-500" />
                        <span>{t("students.archiveStudent")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Middle row: Active Class & Contact */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
                <div>
                  <span className="text-[11px] text-muted-foreground block font-khmer">
                    {t("students.activeClass")}:
                  </span>
                  {activeClass ? (
                    <span className="font-semibold text-foreground font-mono">
                      {activeClass.code}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      {t("students.notEnrolled")}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[11px] text-muted-foreground block font-khmer">
                    {t("students.parentContact")}:
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {parentPhone}
                  </span>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs font-khmer h-8"
                >
                  <Link to={`/students/${student.id}`}>
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    {t("common.viewDetails")}
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStudentToEnroll(student)}
                  className="text-xs font-khmer h-8 gap-1 text-primary dark:text-blue-400"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {t("students.enrollInClass")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enrollment Dialog */}
      <EnrollmentDialog
        open={studentToEnroll !== null}
        onOpenChange={(open) => !open && setStudentToEnroll(null)}
        student={studentToEnroll}
        onSuccess={() => {
          onRefresh();
        }}
      />

      {/* Archive Student Confirmation */}
      <ConfirmDialog
        open={studentToArchive !== null}
        onOpenChange={(open) => !open && setStudentToArchive(null)}
        title={t("students.archiveStudent")}
        description={t("students.archiveConfirm", {
          name: studentToArchive?.nameKh || "",
        })}
        confirmLabel={t("students.archiveStudent")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleArchive}
        isLoading={isArchiving}
      />
    </>
  );
};
