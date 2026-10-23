import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EnrollmentStatusBadge } from "@/components/students/enrollment-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ClassCapacityMetrics } from "@/models/class-progress-report.model";
import { Classroom } from "@/models/classroom.model";
import { Student } from "@/models/student.model";
import { Enrollment } from "@/models/enrollment.model";
import { enrollmentService } from "@/services/enrollment.service";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Eye,
  MoreHorizontal,
  XCircle,
  Phone,
  AlertCircle,
} from "lucide-react";

export interface EnrolledStudentItem {
  enrollment: Enrollment;
  student: Student;
}

interface EnrolledStudentsCardProps {
  classroom: Classroom;
  enrolledStudents: EnrolledStudentItem[];
  capacityMetrics: ClassCapacityMetrics;
  isLoading: boolean;
  onAddStudent: () => void;
  onRefresh: () => void;
}

export const EnrolledStudentsCard: React.FC<EnrolledStudentsCardProps> = ({
  classroom,
  enrolledStudents,
  capacityMetrics,
  isLoading,
  onAddStudent,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [enrollmentToCancel, setEnrollmentToCancel] = useState<EnrolledStudentItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const isFull =
    capacityMetrics.capacity !== null &&
    capacityMetrics.capacity > 0 &&
    capacityMetrics.enrolledStudents >= capacityMetrics.capacity;
  const canAdd = classroom.status === "active" && !isFull;

  const handleCancelEnrollment = async () => {
    if (!enrollmentToCancel) return;
    setIsCancelling(true);
    try {
      await enrollmentService.setEnrollmentStatus(
        enrollmentToCancel.enrollment.id,
        "cancelled",
        user
      );
      toast.success(t("classes.students.cancelEnrollmentSuccess"));
      onRefresh();
    } catch (err: any) {
      console.error("Failed to cancel enrollment:", err);
      if (err.message === "UNAUTHORIZED_BRANCH") {
        toast.error(t("common.unauthorizedBranch", { defaultValue: "មិនមានសិទ្ធិចាត់ចែងសាខានេះទេ (Unauthorized branch)" }));
      } else {
        toast.error(err?.message || t("common.error"));
      }
    } finally {
      setIsCancelling(false);
      setEnrollmentToCancel(null);
    }
  };

  return (
    <>
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base font-bold font-khmer text-foreground">
                    {t("classes.students.title")}
                  </CardTitle>
                  <Badge variant="outline" className="font-mono text-xs bg-muted/30">
                    {t("classes.students.enrolledCount", {
                      enrolled: capacityMetrics.enrolledStudents,
                      capacity: capacityMetrics.capacity ?? "—",
                    })}
                  </Badge>
                </div>
                <CardDescription className="text-xs font-khmer text-muted-foreground mt-0.5">
                  {t("classes.students.description")}
                </CardDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onAddStudent}
              disabled={!canAdd}
              className="text-xs font-khmer h-9 gap-1.5 shadow-sm self-start sm:self-auto"
              title={
                !canAdd
                  ? isFull
                    ? t("classes.students.classFullWarning", { capacity: capacityMetrics.capacity })
                    : t("classes.students.classNotActiveWarning")
                  : undefined
              }
            >
              <UserPlus className="h-4 w-4" />
              <span>{t("classes.students.addStudent")}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={t("classes.students.noStudentsTitle")}
                description={t("classes.students.noStudentsDesc")}
                icon={Users}
                actionLabel={canAdd ? t("classes.students.addFirstStudent") : undefined}
                onAction={canAdd ? onAddStudent : undefined}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/40 border-b">
                  <tr className="text-muted-foreground font-khmer">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[200px]">{t("students.studentName")}</th>
                    <th className="py-2.5 px-3 w-28">{t("students.studentCode")}</th>
                    <th className="py-2.5 px-3 w-16 text-center">{t("students.gender")}</th>
                    <th className="py-2.5 px-3 w-28">{t("students.phone")}</th>
                    <th className="py-2.5 px-3 w-28">{t("classes.students.enrolledDate")}</th>
                    <th className="py-2.5 px-3 w-24 text-center">{t("common.status")}</th>
                    <th className="py-2.5 px-3 w-16 text-center">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {enrolledStudents.map((item, idx) => {
                    const { student, enrollment } = item;
                    return (
                      <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 rounded-lg shrink-0">
                              <AvatarImage src={student.avatarUrl} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs rounded-lg">
                                {student.nameKh?.charAt(0) || "S"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-semibold text-xs font-khmer text-foreground truncate">
                                {student.nameKh}
                              </div>
                              {student.nameEn && (
                                <div className="text-[11px] text-muted-foreground truncate">
                                  {student.nameEn}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                          {student.studentCode}
                        </td>
                        <td className="py-2.5 px-3 text-center font-khmer text-muted-foreground">
                          {student.gender === "female" ? "ស្រី" : "ប្រុស"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                          {student.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground/70" />
                              {student.phone}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                          {enrollment.startDate || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <EnrollmentStatusBadge status={enrollment.status} />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs font-khmer">
                              <DropdownMenuItem
                                onClick={() => navigate(`/students/${student.id}`)}
                                className="gap-2 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-primary" />
                                <span>{t("classes.students.viewProfile")}</span>
                              </DropdownMenuItem>

                              {enrollment.status === "active" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setEnrollmentToCancel(item)}
                                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span>{t("classes.students.cancelEnrollment")}</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Dropping/Cancelling Enrollment */}
      {enrollmentToCancel && (
        <ConfirmDialog
          open={!!enrollmentToCancel}
          onOpenChange={(open) => !open && setEnrollmentToCancel(null)}
          title={t("classes.students.cancelEnrollment")}
          description={t("classes.students.cancelEnrollmentConfirm", {
            name: enrollmentToCancel.student.nameKh || enrollmentToCancel.student.studentCode,
          })}
          confirmLabel={t("common.confirm")}
          onConfirm={handleCancelEnrollment}
          isLoading={isCancelling}
        />
      )}
    </>
  );
};
