import React, { useState } from "react";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EnrollmentStatusBadge } from "./enrollment-status-badge";
import { Enrollment, EnrollmentStatus } from "@/models/enrollment.model";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { enrollmentService } from "@/services/enrollment.service";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Award,
  PauseCircle,
  PlayCircle,
  XCircle,
  History,
  Calendar,
  School,
  ArrowRightLeft,
} from "lucide-react";
import { formatKhmerDate } from "@/lib/utils";

interface EnrollmentHistoryTableProps {
  enrollments: Enrollment[];
  classrooms: Classroom[];
  packages: StudyPackage[];
  teachers: User[];
  onRefresh: () => void;
}

export const EnrollmentHistoryTable: React.FC<EnrollmentHistoryTableProps> = ({
  enrollments,
  classrooms,
  packages,
  teachers,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [targetEnrollment, setTargetEnrollment] = useState<Enrollment | null>(
    null
  );
  const [actionType, setActionType] = useState<
    "complete" | "pause" | "resume" | "cancel" | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const getClassroom = (classroomId: string) => {
    return classrooms.find((c) => c.id === classroomId);
  };

  const getPackage = (packageId: string) => {
    return packages.find((p) => p.id === packageId);
  };

  const getTeacher = (teacherId?: string) => {
    if (!teacherId) return null;
    return teachers.find((u) => u.id === teacherId);
  };

  const handleActionConfirm = async () => {
    if (!targetEnrollment || !actionType) return;
    setIsProcessing(true);

    try {
      if (actionType === "complete") {
        await enrollmentService.setEnrollmentStatus(
          targetEnrollment.id,
          "completed",
          user
        );
        toast.success(t("enrollment.completedSuccess"));
      } else if (actionType === "pause") {
        await enrollmentService.setEnrollmentStatus(
          targetEnrollment.id,
          "paused",
          user
        );
        toast.success(t("enrollment.pauseSuccess"));
      } else if (actionType === "resume") {
        await enrollmentService.setEnrollmentStatus(
          targetEnrollment.id,
          "active",
          user
        );
        toast.success(t("enrollment.resumeSuccess"));
      } else if (actionType === "cancel") {
        await enrollmentService.setEnrollmentStatus(
          targetEnrollment.id,
          "cancelled",
          user
        );
        toast.success(t("enrollment.cancelSuccess"));
      }

      onRefresh();
    } catch (err: any) {
      console.error("Action error:", err);
      if (err.message === "UNAUTHORIZED_BRANCH") {
        toast.error(t("common.unauthorizedBranch", { defaultValue: "មិនមានសិទ្ធិចាត់ចែងសាខានេះទេ (Unauthorized branch)" }));
      } else if (err.message === "ACTIVE_ENROLLMENT_EXISTS") {
        toast.error(t("enrollment.activeExists"));
      } else {
        toast.error(err.message || t("common.error"));
      }
    } finally {
      setIsProcessing(false);
      setTargetEnrollment(null);
      setActionType(null);
    }
  };

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-card rounded-2xl border border-dashed">
        <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
          <History className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-foreground font-khmer">
          {t("enrollment.noHistory")}
        </h4>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 font-khmer">
          {t("enrollment.noActiveEnrollmentDesc")}
        </p>
      </div>
    );
  }

  const getConfirmTitle = () => {
    switch (actionType) {
      case "complete":
        return t("enrollment.markCompleted");
      case "pause":
        return t("enrollment.pause");
      case "resume":
        return t("enrollment.resume");
      case "cancel":
        return t("enrollment.cancel");
      default:
        return "";
    }
  };

  const getConfirmDescription = () => {
    if (!targetEnrollment) return "";
    const cls = getClassroom(targetEnrollment.classroomId);
    const className = cls ? `${cls.code} - ${cls.name}` : "";

    switch (actionType) {
      case "complete":
        return t("enrollment.completedConfirm");
      case "pause":
        return t("enrollment.pauseConfirm", { className });
      case "resume":
        return t("enrollment.resumeConfirm");
      case "cancel":
        return t("enrollment.cancelConfirm");
      default:
        return "";
    }
  };

  return (
    <>
      <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b">
                <TableHead className="font-semibold text-xs font-khmer min-w-[160px]">
                  {t("classes.classColumn")}
                </TableHead>
                <TableHead className="font-semibold text-xs font-khmer min-w-[140px]">
                  {t("enrollment.studyPackage")}
                </TableHead>
                <TableHead className="font-semibold text-xs font-khmer min-w-[120px]">
                  {t("enrollment.teacher")}
                </TableHead>
                <TableHead className="font-semibold text-xs font-khmer">
                  {t("enrollment.startDate")}
                </TableHead>
                <TableHead className="font-semibold text-xs font-khmer">
                  {t("enrollment.expectedEndDate")}
                </TableHead>
                <TableHead className="font-semibold text-xs font-khmer">
                  {t("enrollment.actualEndDate")}
                </TableHead>
                <TableHead className="font-semibold text-xs font-khmer">
                  {t("common.status")}
                </TableHead>
                <TableHead className="font-semibold text-xs font-khmer max-w-[150px]">
                  {t("students.note")}
                </TableHead>
                <TableHead className="text-right font-semibold text-xs font-khmer w-[80px]">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enr) => {
                const cls = getClassroom(enr.classroomId);
                const pkg = getPackage(enr.packageId || cls?.packageId || "");
                const teacher = getTeacher(cls?.assignedTeacherId);

                return (
                  <TableRow key={enr.id} className="hover:bg-muted/30">
                    {/* Class */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-foreground font-mono">
                          {cls?.code || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {cls?.name || "-"}
                        </div>
                      </div>
                    </TableCell>

                    {/* Study Package */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-semibold text-xs text-foreground">
                          {pkg?.nameKh || "-"}
                        </span>
                        {pkg?.code && (
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {pkg.code}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Teacher */}
                    <TableCell className="text-xs text-foreground font-medium">
                      {teacher ? teacher.name : "-"}
                    </TableCell>

                    {/* Start Date */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatKhmerDate(enr.startDate)}
                    </TableCell>

                    {/* Expected End Date */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatKhmerDate(enr.expectedEndDate)}
                    </TableCell>

                    {/* Actual End Date */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {enr.actualEndDate ? formatKhmerDate(enr.actualEndDate) : "-"}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="space-y-1">
                        <EnrollmentStatusBadge status={enr.status} />
                        {enr.status === "transferred" && (
                          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-khmer flex items-center gap-1">
                            <ArrowRightLeft className="h-2.5 w-2.5 shrink-0" />
                            <span>
                              {t("transfer.transferredBadge", { defaultValue: "បានផ្ទេរចេញ" })}
                              {(() => {
                                const targetEnr = enr.transferredToEnrollmentId
                                  ? enrollments.find((e) => e.id === enr.transferredToEnrollmentId)
                                  : null;
                                const targetCls = targetEnr
                                  ? getClassroom(targetEnr.classroomId)
                                  : null;
                                return targetCls ? (
                                  <> ({targetCls.code})</>
                                ) : null;
                              })()}
                            </span>
                          </div>
                        )}
                        {enr.transferredFromEnrollmentId && (
                          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-khmer flex items-center gap-1">
                            <ArrowRightLeft className="h-2.5 w-2.5 shrink-0" />
                            <span>
                              {t("transfer.transferredInBadge", { defaultValue: "ផ្ទេរចូលពីថ្នាក់ចាស់" })}
                              {(() => {
                                const sourceEnr = enr.transferredFromEnrollmentId
                                  ? enrollments.find((e) => e.id === enr.transferredFromEnrollmentId)
                                  : null;
                                const sourceCls = sourceEnr
                                  ? getClassroom(sourceEnr.classroomId)
                                  : null;
                                return sourceCls ? (
                                  <> ({sourceCls.code})</>
                                ) : null;
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Note */}
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={enr.note}>
                      {enr.note || "-"}
                    </TableCell>

                    {/* Actions */}
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
                        <DropdownMenuContent align="end" className="w-48 font-khmer">
                          {enr.status === "active" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setTargetEnrollment(enr);
                                  setActionType("complete");
                                }}
                                className="gap-2 text-sky-600 focus:text-sky-600 cursor-pointer"
                              >
                                <Award className="h-4 w-4" />
                                <span>{t("enrollment.markCompleted")}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setTargetEnrollment(enr);
                                  setActionType("pause");
                                }}
                                className="gap-2 text-amber-600 focus:text-amber-600 cursor-pointer"
                              >
                                <PauseCircle className="h-4 w-4" />
                                <span>{t("enrollment.pause")}</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setTargetEnrollment(enr);
                                  setActionType("cancel");
                                }}
                                className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
                              >
                                <XCircle className="h-4 w-4" />
                                <span>{t("enrollment.cancel")}</span>
                              </DropdownMenuItem>
                            </>
                          )}

                          {enr.status === "paused" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setTargetEnrollment(enr);
                                  setActionType("resume");
                                }}
                                className="gap-2 text-emerald-600 focus:text-emerald-600 cursor-pointer"
                              >
                                <PlayCircle className="h-4 w-4" />
                                <span>{t("enrollment.resume")}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setTargetEnrollment(enr);
                                  setActionType("complete");
                                }}
                                className="gap-2 text-sky-600 focus:text-sky-600 cursor-pointer"
                              >
                                <Award className="h-4 w-4" />
                                <span>{t("enrollment.markCompleted")}</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setTargetEnrollment(enr);
                                  setActionType("cancel");
                                }}
                                className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
                              >
                                <XCircle className="h-4 w-4" />
                                <span>{t("enrollment.cancel")}</span>
                              </DropdownMenuItem>
                            </>
                          )}

                          {(enr.status === "completed" || enr.status === "cancelled") && (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                              {enr.status === "completed"
                                ? t("enrollment.statusCompleted")
                                : t("enrollment.statusCancelled")}
                            </div>
                          )}
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

      {/* Confirm Action Dialog */}
      <ConfirmDialog
        open={actionType !== null}
        onOpenChange={(open) => !open && setActionType(null)}
        title={getConfirmTitle()}
        description={getConfirmDescription()}
        confirmLabel={t("common.confirm")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleActionConfirm}
        isLoading={isProcessing}
      />
    </>
  );
};
