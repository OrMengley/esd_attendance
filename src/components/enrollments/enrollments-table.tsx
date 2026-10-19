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
import { EmptyState } from "@/components/shared/empty-state";
import { EnrollmentStatusBadge } from "@/components/students/enrollment-status-badge";
import { EditEnrollmentDialog } from "./edit-enrollment-dialog";
import { TransferClassDialog } from "@/components/students/transfer-class-dialog";
import { Enrollment, EnrollmentStatus } from "@/models/enrollment.model";
import { Student } from "@/models/student.model";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { Branch } from "@/models/branch.model";
import { User } from "@/models/user.model";
import { enrollmentService } from "@/services/enrollment.service";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Edit,
  Eye,
  School,
  ArrowRightLeft,
  PauseCircle,
  PlayCircle,
  Award,
  XCircle,
  Trash2,
  Calendar,
  Layers,
  FileText,
} from "lucide-react";
import { formatKhmerDate } from "@/lib/utils";

interface EnrollmentsTableProps {
  enrollments: Enrollment[];
  students: Student[];
  classrooms: Classroom[];
  packages: StudyPackage[];
  branches: Branch[];
  teachers: User[];
  onRefresh: () => void;
}

export const EnrollmentsTable: React.FC<EnrollmentsTableProps> = ({
  enrollments,
  students,
  classrooms,
  packages,
  branches,
  teachers,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Maps for fast lookups
  const studentsMap = React.useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const classroomsMap = React.useMemo(() => {
    const map = new Map<string, Classroom>();
    classrooms.forEach((c) => map.set(c.id, c));
    return map;
  }, [classrooms]);

  const packagesMap = React.useMemo(() => {
    const map = new Map<string, StudyPackage>();
    packages.forEach((p) => map.set(p.id, p));
    return map;
  }, [packages]);

  const branchesMap = React.useMemo(() => {
    const map = new Map<string, Branch>();
    branches.forEach((b) => map.set(b.id, b));
    return map;
  }, [branches]);

  const teachersMap = React.useMemo(() => {
    const map = new Map<string, User>();
    teachers.forEach((u) => map.set(u.id, u));
    return map;
  }, [teachers]);

  // Dialog states
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [transferringEnrollment, setTransferringEnrollment] = useState<Enrollment | null>(null);

  // Status & Delete action states
  const [targetEnrollment, setTargetEnrollment] = useState<Enrollment | null>(null);
  const [actionType, setActionType] = useState<
    "complete" | "pause" | "resume" | "cancel" | "delete" | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleActionConfirm = async () => {
    if (!targetEnrollment || !actionType) return;
    setIsProcessing(true);

    try {
      if (actionType === "complete") {
        await enrollmentService.setEnrollmentStatus(
          targetEnrollment.id,
          "completed",
          user?.id
        );
        toast.success(t("enrollments.statusUpdateSuccess"));
      } else if (actionType === "pause") {
        await enrollmentService.setEnrollmentStatus(
          targetEnrollment.id,
          "paused",
          user?.id
        );
        toast.success(t("enrollments.statusUpdateSuccess"));
      } else if (actionType === "resume") {
        await enrollmentService.setEnrollmentStatus(
          targetEnrollment.id,
          "active",
          user?.id
        );
        toast.success(t("enrollments.statusUpdateSuccess"));
      } else if (actionType === "cancel") {
        await enrollmentService.setEnrollmentStatus(
          targetEnrollment.id,
          "cancelled",
          user?.id
        );
        toast.success(t("enrollments.statusUpdateSuccess"));
      } else if (actionType === "delete") {
        await enrollmentService.deleteEnrollment(targetEnrollment.id);
        toast.success(t("enrollments.deleteSuccess"));
      }
      onRefresh();
    } catch (err: any) {
      console.error("Action error:", err);
      if (err.message === "ACTIVE_ENROLLMENT_EXISTS") {
        toast.error(t("enrollment.activeExists", { defaultValue: "Student already has another active enrollment" }));
      } else {
        toast.error(t("common.errorOccurred", { defaultValue: "Action failed" }));
      }
    } finally {
      setIsProcessing(false);
      setTargetEnrollment(null);
      setActionType(null);
    }
  };

  if (enrollments.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <EmptyState
          icon={Layers}
          title={t("enrollments.noEnrollments")}
          description={t("enrollments.noEnrollmentsDesc")}
        />
      </div>
    );
  }

  // Pre-calculate data for active transfer dialog
  const activeTransferStudent = transferringEnrollment
    ? studentsMap.get(transferringEnrollment.studentId) || null
    : null;
  const activeTransferClass = transferringEnrollment
    ? classroomsMap.get(transferringEnrollment.classroomId) || null
    : null;
  const activeTransferPackage = transferringEnrollment
    ? packagesMap.get(transferringEnrollment.packageId) ||
    (activeTransferClass?.packageId ? packagesMap.get(activeTransferClass.packageId) || null : null)
    : null;
  const activeTransferTeacher = activeTransferClass?.assignedTeacherId
    ? teachersMap.get(activeTransferClass.assignedTeacherId) || null
    : null;

  return (
    <>
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>{t("enrollments.student")}</TableHead>
                <TableHead>{t("enrollments.class")}</TableHead>
                <TableHead>{t("enrollments.package")}</TableHead>
                {/* <TableHead>{t("enrollments.branch")}</TableHead> */}
                <TableHead>{t("enrollments.dates")}</TableHead>
                <TableHead className="text-center">{t("enrollments.status")}</TableHead>
                <TableHead className="max-w-[150px]">{t("enrollments.note")}</TableHead>
                <TableHead className="w-16 text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment, index) => {
                const student = studentsMap.get(enrollment.studentId);
                const classroom = classroomsMap.get(enrollment.classroomId);
                const pkg =
                  packagesMap.get(enrollment.packageId) ||
                  (classroom?.packageId ? packagesMap.get(classroom.packageId) : null);
                const branch = classroom?.branchId
                  ? branchesMap.get(classroom.branchId)
                  : student?.branchId
                    ? branchesMap.get(student.branchId)
                    : null;

                const isActive = enrollment.status === "active";
                const isPaused = enrollment.status === "paused";

                return (
                  <TableRow key={enrollment.id} className="hover:bg-muted/40 transition-colors">
                    {/* Index */}
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {index + 1}
                    </TableCell>

                    {/* Student Column */}
                    <TableCell>
                      {student ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border shadow-2xs">
                            <AvatarImage src={student.avatarUrl} alt={student.nameKh} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                              {student.nameKh.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link
                              to={`/students/${student.id}`}
                              className="font-medium text-sm text-foreground hover:text-primary transition-colors block truncate"
                            >
                              {student.nameKh}
                            </Link>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className="font-mono">{student.studentCode}</span>
                              {student.nameEn && (
                                <span className="truncate hidden sm:inline">
                                  ({student.nameEn})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          ID: {enrollment.studentId.slice(0, 8)}...
                        </span>
                      )}
                    </TableCell>

                    {/* Classroom Column */}
                    <TableCell>
                      {classroom ? (
                        <div className="min-w-0">
                          <Link
                            to={`/classes/${classroom.id}`}
                            className="font-medium text-sm text-foreground hover:text-primary transition-colors block truncate"
                          >
                            {classroom.name}
                          </Link>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Badge variant="outline" className="font-mono text-[10px] px-1 py-0">
                              {classroom.code}
                            </Badge>
                            <span>
                              {classroom.startTime} - {classroom.endTime}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          Class ID: {enrollment.classroomId.slice(0, 8)}...
                        </span>
                      )}
                    </TableCell>

                    {/* Package Column */}
                    <TableCell>
                      {pkg ? (
                        <div className="min-w-0">
                          <span className="font-medium text-sm block truncate">
                            {pkg.nameKh || pkg.nameEn}
                          </span>
                          <span className="text-xs text-muted-foreground block truncate">
                            {pkg.code}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>

                    {/* Branch Column */}
                    {/* <TableCell>
                      {branch ? (
                        <Badge variant="secondary" className="text-xs font-normal">
                          {branch.nameKh || branch.nameEn}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell> */}

                    {/* Dates Column */}
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="font-mono">{enrollment.startDate || "—"}</span>
                          <span>→</span>
                          <span className="font-mono font-medium text-foreground">
                            {enrollment.actualEndDate || enrollment.expectedEndDate || "—"}
                          </span>
                        </div>
                        {enrollment.transferredAt && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            Transferred: {enrollment.transferredAt.split("T")[0]}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Status Column */}
                    <TableCell className="text-center">
                      <EnrollmentStatusBadge status={enrollment.status} />
                    </TableCell>

                    {/* Notes Column */}
                    <TableCell className="max-w-[150px]">
                      {enrollment.note ? (
                        <span
                          className="text-xs text-muted-foreground truncate block cursor-help"
                          title={enrollment.note}
                        >
                          {enrollment.note}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">—</span>
                      )}
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t("common.actions")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          {/* Edit / Correct Class */}
                          <DropdownMenuItem
                            onClick={() => setEditingEnrollment(enrollment)}
                            className="gap-2 cursor-pointer"
                          >
                            <Edit className="h-4 w-4 text-primary" />
                            <span>{t("enrollments.editEnrollment")}</span>
                          </DropdownMenuItem>

                          {/* Quick Profiles */}
                          {student && (
                            <DropdownMenuItem
                              onClick={() => navigate(`/students/${student.id}`)}
                              className="gap-2 cursor-pointer"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <span>{t("common.viewDetails")}</span>
                            </DropdownMenuItem>
                          )}
                          {classroom && (
                            <DropdownMenuItem
                              onClick={() => navigate(`/classes/${classroom.id}`)}
                              className="gap-2 cursor-pointer"
                            >
                              <School className="h-4 w-4 text-muted-foreground" />
                              <span>{classroom.name}</span>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {/* Transfer (active only) */}
                          {isActive && (
                            <DropdownMenuItem
                              onClick={() => setTransferringEnrollment(enrollment)}
                              className="gap-2 cursor-pointer text-indigo-600 dark:text-indigo-400"
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                              <span>{t("enrollment.transferClass", { defaultValue: "Transfer Class" })}</span>
                            </DropdownMenuItem>
                          )}

                          {/* Complete (active only) */}
                          {isActive && (
                            <DropdownMenuItem
                              onClick={() => {
                                setTargetEnrollment(enrollment);
                                setActionType("complete");
                              }}
                              className="gap-2 cursor-pointer text-sky-600 dark:text-sky-400"
                            >
                              <Award className="h-4 w-4" />
                              <span>{t("enrollment.markCompleted", { defaultValue: "Mark Completed" })}</span>
                            </DropdownMenuItem>
                          )}

                          {/* Pause (active only) */}
                          {isActive && (
                            <DropdownMenuItem
                              onClick={() => {
                                setTargetEnrollment(enrollment);
                                setActionType("pause");
                              }}
                              className="gap-2 cursor-pointer text-amber-600 dark:text-amber-400"
                            >
                              <PauseCircle className="h-4 w-4" />
                              <span>{t("enrollment.pause", { defaultValue: "Pause Study" })}</span>
                            </DropdownMenuItem>
                          )}

                          {/* Resume (paused only) */}
                          {isPaused && (
                            <DropdownMenuItem
                              onClick={() => {
                                setTargetEnrollment(enrollment);
                                setActionType("resume");
                              }}
                              className="gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400"
                            >
                              <PlayCircle className="h-4 w-4" />
                              <span>{t("enrollment.resume", { defaultValue: "Resume Study" })}</span>
                            </DropdownMenuItem>
                          )}

                          {/* Cancel (active or paused) */}
                          {(isActive || isPaused) && (
                            <DropdownMenuItem
                              onClick={() => {
                                setTargetEnrollment(enrollment);
                                setActionType("cancel");
                              }}
                              className="gap-2 cursor-pointer text-rose-600 dark:text-rose-400"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>{t("enrollment.cancel", { defaultValue: "Cancel Enrollment" })}</span>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {/* Delete */}
                          <DropdownMenuItem
                            onClick={() => {
                              setTargetEnrollment(enrollment);
                              setActionType("delete");
                            }}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>{t("common.delete")}</span>
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
      </div>

      {/* Edit Enrollment Dialog */}
      <EditEnrollmentDialog
        open={Boolean(editingEnrollment)}
        onOpenChange={(open) => !open && setEditingEnrollment(null)}
        enrollment={editingEnrollment}
        student={editingEnrollment ? studentsMap.get(editingEnrollment.studentId) || null : null}
        classrooms={classrooms}
        packages={packages}
        onSuccess={onRefresh}
        onSwitchToTransfer={(enr) => {
          setEditingEnrollment(null);
          setTransferringEnrollment(enr);
        }}
      />

      {/* Existing TransferClassDialog */}
      <TransferClassDialog
        open={Boolean(transferringEnrollment)}
        onOpenChange={(open) => !open && setTransferringEnrollment(null)}
        student={activeTransferStudent}
        activeEnrollment={transferringEnrollment}
        activeClass={activeTransferClass}
        activePackage={activeTransferPackage}
        activeTeacher={activeTransferTeacher}
        onSuccess={() => {
          setTransferringEnrollment(null);
          onRefresh();
        }}
      />

      {/* Action Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(targetEnrollment && actionType)}
        onOpenChange={(open) => {
          if (!open) {
            setTargetEnrollment(null);
            setActionType(null);
          }
        }}
        title={
          actionType === "complete"
            ? t("enrollments.confirmCompleteTitle")
            : actionType === "pause"
              ? t("enrollments.confirmPauseTitle")
              : actionType === "resume"
                ? t("enrollments.confirmResumeTitle")
                : actionType === "cancel"
                  ? t("enrollments.confirmCancelTitle")
                  : t("enrollments.confirmDeleteTitle")
        }
        description={
          actionType === "complete"
            ? t("enrollments.confirmCompleteDesc")
            : actionType === "pause"
              ? t("enrollments.confirmPauseDesc")
              : actionType === "resume"
                ? t("enrollments.confirmResumeDesc")
                : actionType === "cancel"
                  ? t("enrollments.confirmCancelDesc")
                  : t("enrollments.confirmDeleteDesc")
        }
        confirmLabel={
          actionType === "delete"
            ? t("common.delete")
            : t("common.confirm", { defaultValue: "Confirm" })
        }
        onConfirm={handleActionConfirm}
        isLoading={isProcessing}
      />
    </>
  );
};
