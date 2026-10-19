import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { studentService } from "@/services/student.service";
import { classroomService } from "@/services/classroom.service";
import { subjectService } from "@/services/subject.service";
import { userService } from "@/services/user.service";
import { attendanceService } from "@/services/attendance.service";
import { Student } from "@/models/student.model";
import { Classroom } from "@/models/classroom.model";
import { Subject } from "@/models/subject.model";
import { User } from "@/models/user.model";
import { Attendance } from "@/models/attendance.model";
import { toast } from "sonner";
import {
  Search,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Edit3,
} from "lucide-react";
import { AttendanceCorrectionDialog } from "@/components/attendance-corrections/attendance-correction-dialog";
import { formatKhmerDate } from "@/lib/utils";

export const AttendanceHistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentBranchId, isAllBranches } = useBranch();

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState("");

  // Attendance correction state
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<{
    record: Attendance;
    student?: Student;
    classroom?: Classroom;
  } | null>(null);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);

  const isTeacher = user?.role === "teacher";

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attList, stdList, clsList, subList, usrList] = await Promise.all([
        attendanceService.getAttendance(),
        studentService.getStudents(),
        classroomService.getClassrooms(),
        subjectService.getSubjects(),
        userService.getUsers(),
      ]);

      const relevantClassrooms = isTeacher
        ? clsList.filter((c) => c.assignedTeacherId === user?.id)
        : clsList;

      setClassrooms(relevantClassrooms);
      setStudents(stdList);
      setSubjects(subList);
      setTeachers(usrList);
      setAttendance(attList);
    } catch (e) {
      console.error(e);
      toast.error(t("attendanceHistory.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const classroomsMap = useMemo(() => new Map(classrooms.map((c) => [c.id, c])), [classrooms]);

  // Branch and role scoped classrooms
  const scopedClassrooms = useMemo<Classroom[]>(() => {
    let list = classrooms;
    if (isTeacher) {
      list = list.filter((c) => c.assignedTeacherId === user?.id);
    }
    if (!isAllBranches && currentBranchId) {
      list = list.filter((c) => c.branchId === currentBranchId);
    }
    return list;
  }, [classrooms, isTeacher, user?.id, isAllBranches, currentBranchId]);

  const scopedClassroomIds = useMemo(
    () => new Set(scopedClassrooms.map((c) => c.id)),
    [scopedClassrooms]
  );

  // Reset selectedClass if it is no longer in scoped classrooms
  useEffect(() => {
    if (
      selectedClass !== "all" &&
      !scopedClassrooms.some((c) => c.id === selectedClass)
    ) {
      setSelectedClass("all");
    }
  }, [scopedClassrooms, selectedClass]);

  // Filter records
  const filteredAttendance = attendance.filter((record) => {
    // If teacher, only their classes
    if (isTeacher && !scopedClassroomIds.has(record.classroomId)) {
      return false;
    }

    // Branch scoping
    if (!isAllBranches && currentBranchId) {
      const cls = classroomsMap.get(record.classroomId);
      if (cls?.branchId) {
        if (cls.branchId !== currentBranchId) return false;
      } else {
        const student = students.find((s) => s.id === record.studentId);
        if (student?.branchId && student.branchId !== currentBranchId) return false;
      }
    }

    const student = students.find((s) => s.id === record.studentId);
    const matchesSearch =
      !searchQuery ||
      (student &&
        (student.nameKh.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (student.nameEn && student.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
          student.studentCode.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesClass =
      selectedClass === "all" || record.classroomId === selectedClass;

    const matchesStatus =
      selectedStatus === "all" || record.status === selectedStatus;

    const matchesDate = !selectedDate || record.date === selectedDate;

    return matchesSearch && matchesClass && matchesStatus && matchesDate;
  });

  // Summary counts
  const presentCount = filteredAttendance.filter((a) => a.status === "present").length;
  const absentCount = filteredAttendance.filter((a) => a.status === "absent").length;
  const lateCount = filteredAttendance.filter((a) => a.status === "late").length;
  const permCount = filteredAttendance.filter((a) => a.status === "permission").length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("attendanceHistory.title")}
        description={t("attendanceHistory.description")}
      >
        <Button
          variant="outline"
          onClick={handlePrint}
          className="gap-2 shadow-sm"
        >
          <Printer className="h-4 w-4" />
          <span>{t("attendanceHistory.printReport")}</span>
        </Button>
      </PageHeader>

      {/* QUICK STATS CHIPS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-card/80">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("attendanceHistory.totalPresent")}</p>
            <p className="text-lg font-bold text-foreground">{presentCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-card/80">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("attendanceHistory.totalAbsent")}</p>
            <p className="text-lg font-bold text-foreground">{absentCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-card/80">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("attendanceHistory.totalLate")}</p>
            <p className="text-lg font-bold text-foreground">{lateCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-card/80">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("attendanceHistory.totalPermission")}</p>
            <p className="text-lg font-bold text-foreground">{permCount}</p>
          </div>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card p-4 rounded-xl border border-border/80 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("attendanceHistory.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-mono"
          />
        </div>

        <div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder={t("attendanceHistory.allClassrooms")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("attendanceHistory.allClassrooms")}</SelectItem>
              {scopedClassrooms.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder={t("attendanceStatus.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("attendanceStatus.allStatuses")}</SelectItem>
              <SelectItem value="present">{t("attendanceStatus.present")}</SelectItem>
              <SelectItem value="absent">{t("attendanceStatus.absent")}</SelectItem>
              <SelectItem value="late">{t("attendanceStatus.late")}</SelectItem>
              <SelectItem value="permission">{t("attendanceStatus.permission")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ATTENDANCE HISTORY TABLE */}
      {filteredAttendance.length === 0 ? (
        <EmptyState
          title={t("attendanceHistory.noRecordsTitle")}
          description={t("attendanceHistory.noRecordsDesc")}
        />
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-28 text-xs">{t("dashboard.date")}</TableHead>
                <TableHead className="w-24 text-xs">{t("students.studentId")}</TableHead>
                <TableHead className="text-xs">{t("students.studentName")}</TableHead>
                <TableHead className="text-xs">{t("dashboard.class")}</TableHead>
                <TableHead className="text-xs">{t("classes.subject")}</TableHead>
                <TableHead className="w-32 text-xs">{t("common.status")}</TableHead>
                <TableHead className="text-xs">{t("dashboard.remark")}</TableHead>
                {!isTeacher && (
                  <TableHead className="w-24 text-xs text-right">{t("common.actions", { defaultValue: "Actions" })}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.map((record) => {
                const student = students.find((s) => s.id === record.studentId);
                const classroom = classrooms.find((c) => c.id === record.classroomId);
                const subject = subjects.find(
                  (s) =>
                    s.id === record.subjectId ||
                    s.id === classroom?.subjectId ||
                    s.id === classroom?.packageId
                );

                return (
                  <TableRow key={record.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatKhmerDate(record.date)}
                    </TableCell>

                    <TableCell className="font-mono text-xs font-bold">
                      #{student?.studentCode || "-"}
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-xs text-foreground">
                        {student?.nameKh || student?.nameEn || "-"}
                      </span>
                      {student?.nameEn && student?.nameKh && (
                        <span className="text-[11px] text-muted-foreground ml-1.5">
                          ({student.nameEn})
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {classroom?.name || "-"}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {subject?.name || "-"}
                    </TableCell>

                    <TableCell>
                      <StatusBadge attendanceStatus={record.status} />
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground italic">
                      {record.remark || "-"}
                    </TableCell>

                    {!isTeacher && (
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRecordForCorrection({ record, student, classroom });
                            setIsCorrectionOpen(true);
                          }}
                          className="h-7 px-2 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 font-medium gap-1"
                          title={t("attendanceCorrection.buttonLabel", { defaultValue: "Correct Attendance" })}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>{t("attendanceCorrection.buttonLabel", { defaultValue: "Correct" })}</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Correction Dialog */}
      {selectedRecordForCorrection && (
        <AttendanceCorrectionDialog
          open={isCorrectionOpen}
          onOpenChange={setIsCorrectionOpen}
          attendanceDocId={selectedRecordForCorrection.record.attendanceDocId || selectedRecordForCorrection.record.id}
          attendanceId={selectedRecordForCorrection.record.attendanceDocId || selectedRecordForCorrection.record.id}
          classroomId={selectedRecordForCorrection.record.classroomId}
          studentId={selectedRecordForCorrection.record.studentId}
          attendanceDate={selectedRecordForCorrection.record.attendanceDate || selectedRecordForCorrection.record.date || ""}
          previousStatus={selectedRecordForCorrection.record.status}
          classroom={selectedRecordForCorrection.classroom}
          student={selectedRecordForCorrection.student}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};
