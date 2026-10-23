import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  School,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  Filter,
  GraduationCap,
  History,
  ArrowRight,
  Loader2,
  UserCheck,
} from "lucide-react";
import {
  studentAttendanceService,
  StudentListItemWithMeta,
  toKhmerNum,
} from "@/services/student-attendance.service";
import { classroomService } from "@/services/classroom.service";
import { Classroom } from "@/models/classroom.model";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const StudentAttendanceListPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { currentBranchId } = useBranch();
  const navigate = useNavigate();

  const [studentsWithMeta, setStudentsWithMeta] = useState<StudentListItemWithMeta[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const isKm = i18n.language === "km";
  const isTeacher = user?.role === "teacher";

  useEffect(() => {
    loadData();
  }, [user, currentBranchId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [list, allClasses] = await Promise.all([
        studentAttendanceService.getPermittedStudentsList(user, currentBranchId),
        classroomService.getClassrooms(currentBranchId),
      ]);

      const accessibleClasses = isTeacher
        ? allClasses.filter(
          (c) =>
            c.assignedTeacherId === user?.id ||
            user?.assignedClassroomIds?.includes(c.id)
        )
        : allClasses;

      setStudentsWithMeta(list);
      setClassrooms(accessibleClasses);
    } catch (e) {
      console.error("Failed to load student attendance list:", e);
      toast.error(t("studentAttendance.fetchError", { defaultValue: "មិនអាចទាញយកបញ្ជីសិស្សបានទេ" }));
    } finally {
      setIsLoading(false);
    }
  };

  // Filter list
  const filteredStudents = useMemo(() => {
    return studentsWithMeta.filter((item) => {
      const { student, latestClassroom } = item;

      // 1. Text Search (Student Code, Khmer Name, English Name, Phone)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const codeMatch = student.studentCode?.toLowerCase().includes(query);
        const khNameMatch = student.nameKh?.toLowerCase().includes(query);
        const enNameMatch = student.nameEn?.toLowerCase().includes(query);
        const phoneMatch = student.phone?.toLowerCase().includes(query);

        if (!codeMatch && !khNameMatch && !enNameMatch && !phoneMatch) {
          return false;
        }
      }

      // 2. Classroom Filter
      if (selectedClassId !== "all") {
        if (latestClassroom?.id !== selectedClassId) {
          return false;
        }
      }

      // 3. Status Filter
      if (selectedStatus !== "all") {
        if (student.status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [studentsWithMeta, searchQuery, selectedClassId, selectedStatus]);

  const handleViewHistory = (studentId: string) => {
    navigate(`/student-attendance/${studentId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t("studentAttendance.title", { defaultValue: "វត្តមានតាមសិស្ស" })}
        description={t("studentAttendance.subtitle", {
          defaultValue: "ស្វែងរក និងពិនិត្យមើលប្រវត្តិនៃការកត់ត្រាវត្តមានផ្ទាល់ខ្លួនរបស់សិស្សគ្រប់វគ្គសិក្សា",
        })}
      />

      {/* Filter Bar */}
      <Card className="border border-border/80 shadow-xs rounded-2xl bg-card">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Search Input */}
            <div className="lg:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 font-khmer">
                <Search className="h-3.5 w-3.5 text-primary" />
                <span>{t("studentAttendance.searchStudents", { defaultValue: "ស្វែងរកសិស្ស" })}</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("studentAttendance.searchPlaceholder", {
                    defaultValue: "ស្វែងរកតាមអត្តលេខ ឈ្មោះសិស្ស លេខទូរស័ព្ទ...",
                  })}
                  className="pl-9 h-10 rounded-xl bg-background border-border/80 text-xs"
                />
              </div>
            </div>

            {/* Classroom Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 font-khmer">
                <School className="h-3.5 w-3.5 text-primary" />
                <span>{t("studentAttendance.class", { defaultValue: "ថ្នាក់រៀន" })}</span>
              </Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs">
                  <SelectValue placeholder={t("studentAttendance.allClasses", { defaultValue: "ថ្នាក់រៀនទាំងអស់" })} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all" className="text-xs">
                    {t("studentAttendance.allClasses", { defaultValue: "ថ្នាក់រៀនទាំងអស់" })}
                  </SelectItem>
                  {classrooms.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Status Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 font-khmer">
                <Filter className="h-3.5 w-3.5 text-primary" />
                <span>{t("studentAttendance.status", { defaultValue: "ស្ថានភាព" })}</span>
              </Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs">
                  <SelectValue placeholder={t("studentAttendance.allStatuses", { defaultValue: "ស្ថានភាពទាំងអស់" })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    {t("studentAttendance.allStatuses", { defaultValue: "ស្ថានភាពទាំងអស់" })}
                  </SelectItem>
                  <SelectItem value="active" className="text-xs">
                    {t("status.active", { defaultValue: "កំពុងសិក្សា (សកម្ម)" })}
                  </SelectItem>
                  <SelectItem value="inactive" className="text-xs">
                    {t("status.inactive", { defaultValue: "អសកម្ម" })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List Table & Responsive Cards */}
      <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
        {/* Table Header Bar */}
        <div className="px-5 py-4 border-b border-border/70 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold font-khmer text-foreground">
              {t("studentAttendance.studentsList", { defaultValue: "បញ្ជីសិស្ស" })}
            </h2>
            <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">
              {isKm ? toKhmerNum(filteredStudents.length) : filteredStudents.length}
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-khmer">
              {t("common.loading", { defaultValue: "កំពុងផ្ទុកទិន្នន័យសិស្ស..." })}
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold font-khmer text-foreground">
              {t("studentAttendance.noStudentsFound", { defaultValue: "រកមិនឃើញសិស្សតាមលក្ខខណ្ឌស្វែងរកទេ" })}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {t("studentAttendance.noStudentsFoundDesc", {
                defaultValue: "សូមសាកល្បងផ្លាស់ប្តូរពាក្យគន្លឹះស្វែងរក ឬជ្រើសរើសថ្នាក់រៀនផ្សេងទៀត។",
              })}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#1E347B] text-white">
                    <th className="py-3 px-4 font-semibold text-center w-12">#</th>
                    <th className="py-3 px-4 font-semibold min-w-[180px]">
                      {t("studentAttendance.student", { defaultValue: "សិស្ស" })}
                    </th>
                    <th className="py-3 px-3 font-semibold text-center w-28">
                      {t("studentAttendance.studentCode", { defaultValue: "អត្តលេខ" })}
                    </th>
                    <th className="py-3 px-3 font-semibold min-w-[150px]">
                      {t("studentAttendance.latestClass", { defaultValue: "ថ្នាក់រៀនបច្ចុប្បន្ន / ចុងក្រោយ" })}
                    </th>
                    <th className="py-3 px-3 font-semibold w-36">
                      {t("studentAttendance.teacher", { defaultValue: "គ្រូបង្រៀន" })}
                    </th>
                    <th className="py-3 px-3 font-semibold text-center w-28">
                      {t("studentAttendance.enrollmentStatus", { defaultValue: "ស្ថានភាពចុះឈ្មោះ" })}
                    </th>
                    <th className="py-3 px-3 font-semibold text-center w-28">
                      {t("studentAttendance.attendanceRate", { defaultValue: "អត្រាវត្តមាន" })}
                    </th>
                    <th className="py-3 px-4 font-semibold text-right w-36">
                      {t("studentAttendance.actions", { defaultValue: "សកម្មភាព" })}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredStudents.map((item, index) => {
                    const { student, latestEnrollment, latestClassroom, latestTeacher, attendanceRate } = item;
                    const isEven = index % 2 === 0;

                    return (
                      <tr
                        key={student.id}
                        className={cn(
                          "transition-colors hover:bg-primary/5",
                          isEven ? "bg-card" : "bg-muted/15"
                        )}
                      >
                        <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                          {isKm ? toKhmerNum(index + 1) : index + 1}
                        </td>

                        {/* Student Name & Avatar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-9 w-9 ring-1 ring-border/80 shrink-0">
                              <AvatarImage src={student.avatarUrl} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                {student.nameKh?.charAt(0) || "S"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate font-khmer">
                                {student.nameKh}
                              </p>
                              {student.nameEn && (
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {student.nameEn}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Student Code */}
                        <td className="py-3 px-3 text-center font-mono font-semibold text-foreground">
                          {student.studentCode}
                        </td>

                        {/* Latest Class */}
                        <td className="py-3 px-3">
                          {latestClassroom ? (
                            <div>
                              <span className="font-semibold text-foreground block truncate">
                                {latestClassroom.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {latestClassroom.code}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </td>

                        {/* Teacher */}
                        <td className="py-3 px-3">
                          {latestTeacher ? (
                            <span className="font-medium text-foreground truncate block">
                              {latestTeacher.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Enrollment Status */}
                        <td className="py-3 px-3 text-center">
                          {latestEnrollment ? (
                            <Badge
                              variant={
                                latestEnrollment.status === "active"
                                  ? "success"
                                  : latestEnrollment.status === "completed"
                                    ? "default"
                                    : latestEnrollment.status === "transferred"
                                      ? "gold"
                                      : "secondary"
                              }
                              className="text-[10px] py-0 px-2 font-medium"
                            >
                              {latestEnrollment.status === "active"
                                ? t("status.active", { defaultValue: "Active" })
                                : latestEnrollment.status === "completed"
                                  ? t("classes.statusCompleted", { defaultValue: "Completed" })
                                  : latestEnrollment.status === "transferred"
                                    ? t("transfer.transferredBadge", { defaultValue: "Transferred" })
                                    : latestEnrollment.status}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] py-0 px-2 text-muted-foreground">
                              {t("studentAttendance.noClass", { defaultValue: "No Class" })}
                            </Badge>
                          )}
                        </td>

                        {/* Attendance Rate */}
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          <span
                            className={cn(
                              "inline-block px-2 py-0.5 rounded-md text-xs",
                              attendanceRate >= 85
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : attendanceRate >= 70
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            )}
                          >
                            {isKm ? `${toKhmerNum(attendanceRate)}%` : `${attendanceRate}%`}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleViewHistory(student.id)}
                            className="h-8 gap-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs transition-all shadow-xs"
                          >
                            <History className="h-3.5 w-3.5" />
                            <span>{t("studentAttendance.viewHistory", { defaultValue: "ប្រវត្តិវត្តមាន" })}</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border/60">
              {filteredStudents.map((item) => {
                const { student, latestEnrollment, latestClassroom, latestTeacher, attendanceRate } = item;

                return (
                  <div key={student.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-1 ring-border/80">
                          <AvatarImage src={student.avatarUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {student.nameKh?.charAt(0) || "S"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-foreground text-sm font-khmer">
                            {student.nameKh}
                          </h4>
                          <p className="text-xs font-mono text-muted-foreground font-semibold">
                            {student.studentCode} {student.nameEn && `• ${student.nameEn}`}
                          </p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-xs font-mono font-bold",
                          attendanceRate >= 85
                            ? "bg-emerald-50 text-emerald-700"
                            : attendanceRate >= 70
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                        )}
                      >
                        {isKm ? `${toKhmerNum(attendanceRate)}%` : `${attendanceRate}%`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-xl border border-border/60">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">
                          {t("studentAttendance.latestClass", { defaultValue: "ថ្នាក់រៀន" })}
                        </span>
                        <span className="font-semibold text-foreground truncate block">
                          {latestClassroom?.name || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block">
                          {t("studentAttendance.teacher", { defaultValue: "គ្រូ" })}
                        </span>
                        <span className="font-semibold text-foreground truncate block">
                          {latestTeacher?.name || "—"}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleViewHistory(student.id)}
                      className="w-full h-9 rounded-xl gap-2 font-semibold text-xs"
                    >
                      <History className="h-4 w-4" />
                      <span>{t("studentAttendance.viewHistory", { defaultValue: "មើលប្រវត្តិវត្តមាន" })}</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
