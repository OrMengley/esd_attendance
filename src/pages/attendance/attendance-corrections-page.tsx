import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { AttendanceCorrectionFilters } from "@/components/attendance-corrections/attendance-correction-filters";
import {
  AttendanceCorrectionTable,
  AttendanceWithDetails,
} from "@/components/attendance-corrections/attendance-correction-table";
import { attendanceService } from "@/services/attendance.service";
import { classroomService } from "@/services/classroom.service";
import { studentService } from "@/services/student.service";
import { userService } from "@/services/user.service";
import { Classroom } from "@/models/classroom.model";
import { Student } from "@/models/student.model";
import { User } from "@/models/user.model";
import { Attendance, AttendanceStatus } from "@/models/attendance.model";
import { getCambodiaToday } from "@/lib/attendance-time-lock";
import { toast } from "sonner";
import {
  Edit3,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from "lucide-react";

export const AttendanceCorrectionsPage: React.FC = () => {
  const { t } = useTranslation();

  // Current month default range
  const today = getCambodiaToday();
  const currentYearMonth = today.substring(0, 7);
  const defaultStartDate = `${currentYearMonth}-01`;
  const defaultEndDate = today;

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | "all">("all");
  const [correctedOnly, setCorrectedOnly] = useState(false);

  // Entities
  const [records, setRecords] = useState<AttendanceWithDetails[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [attList, classList, studentList, userList] = await Promise.all([
        attendanceService.getAttendance(),
        classroomService.getClassrooms(),
        studentService.getStudents(),
        userService.getUsers(),
      ]);

      const studentMap = new Map<string, Student>();
      studentList.forEach((s) => studentMap.set(s.id, s));

      const classMap = new Map<string, Classroom>();
      classList.forEach((c) => classMap.set(c.id, c));

      const teacherUsers = userList.filter(
        (u) => u.role === "teacher" || u.role === "admin" || u.role === "super_admin"
      );
      const teacherMap = new Map<string, User>();
      userList.forEach((u) => teacherMap.set(u.id, u));

      const enriched: AttendanceWithDetails[] = attList.map((att) => {
        const cls = classMap.get(att.classroomId);
        const st = studentMap.get(att.studentId);
        const tc = cls?.assignedTeacherId ? teacherMap.get(cls.assignedTeacherId) : undefined;
        return {
          ...att,
          attendanceDocId: att.attendanceDocId || att.id,
          student: st,
          classroom: cls,
          teacher: tc,
        };
      });

      // Sort newest date first
      enriched.sort((a, b) =>
        (b.attendanceDate || b.date || "").localeCompare(a.attendanceDate || a.date || "")
      );

      setRecords(enriched);
      setClassrooms(classList);
      setStudents(studentList);
      setTeachers(teacherUsers);
    } catch (e) {
      console.error("Failed to load attendance records:", e);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordCorrected = (updated?: Attendance) => {
    if (updated) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === updated.id
            ? {
                ...r,
                ...updated,
                attendanceDocId: updated.id,
                status: updated.status,
                lastCorrectedAt: updated.lastCorrectedAt || new Date().toISOString(),
                lastCorrectedById: updated.lastCorrectedById,
                lastCorrectedByName: updated.lastCorrectedByName,
                lastCorrectedByUsername: updated.lastCorrectedByUsername,
                lastCorrectionReason: updated.lastCorrectionReason,
                lastCorrectionNote: updated.lastCorrectionNote,
                remark: updated.remark,
              }
            : r
        )
      );
    }
    // Also re-fetch in background to ensure total consistency with Firestore
    loadData();
  };

  const handleResetFilters = () => {
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setSearchQuery("");
    setSelectedClassId("all");
    setSelectedTeacherId("all");
    setSelectedStatus("all");
    setCorrectedOnly(false);
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const date = r.attendanceDate || r.date || "";

      // Date range
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;

      // Class
      if (selectedClassId !== "all" && r.classroomId !== selectedClassId) {
        return false;
      }

      // Teacher
      if (selectedTeacherId !== "all") {
        if (r.classroom?.assignedTeacherId !== selectedTeacherId) {
          return false;
        }
      }

      // Status
      if (selectedStatus !== "all" && r.status !== selectedStatus) {
        return false;
      }

      // Corrected Only
      if (correctedOnly && !r.lastCorrectedAt) {
        return false;
      }

      // Universal search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const studentCode = (r.student?.studentCode || "").toLowerCase();
        const studentNameKh = (r.student?.nameKh || "").toLowerCase();
        const studentNameEn = (r.student?.nameEn || "").toLowerCase();
        const classCode = (r.classroom?.code || "").toLowerCase();
        const className = (r.classroom?.name || "").toLowerCase();

        const match =
          studentCode.includes(q) ||
          studentNameKh.includes(q) ||
          studentNameEn.includes(q) ||
          classCode.includes(q) ||
          className.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [
    records,
    startDate,
    endDate,
    selectedClassId,
    selectedTeacherId,
    selectedStatus,
    correctedOnly,
    searchQuery,
  ]);

  // Stat metrics
  const totalCount = filteredRecords.length;
  const presentCount = filteredRecords.filter((r) => r.status === "present").length;
  const absentCount = filteredRecords.filter((r) => r.status === "absent").length;
  const lateCount = filteredRecords.filter((r) => r.status === "late").length;
  const permissionCount = filteredRecords.filter((r) => r.status === "permission").length;
  const correctedCount = filteredRecords.filter((r) => !!r.lastCorrectedAt).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("attendanceCorrectionsPage.title", { defaultValue: "Attendance Corrections" })}
        description={t("attendanceCorrectionsPage.description", {
          defaultValue: "Quickly find and correct locked or past attendance records",
        })}
      />

      {/* QUICK STATS CHIPS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/80">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <CalendarCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("common.all", { defaultValue: "Total" })}</p>
            <p className="text-base font-bold text-foreground">{totalCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/80">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("attendanceStatus.present")}</p>
            <p className="text-base font-bold text-foreground">{presentCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/80">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
            <XCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("attendanceStatus.absent")}</p>
            <p className="text-base font-bold text-foreground">{absentCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/80">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("attendanceStatus.late")}</p>
            <p className="text-base font-bold text-foreground">{lateCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/80">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("attendanceStatus.permission")}</p>
            <p className="text-base font-bold text-foreground">{permissionCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/80">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400">
            <Edit3 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("attendanceCorrection.badgeCorrected", { defaultValue: "Corrected" })}</p>
            <p className="text-base font-bold text-foreground">{correctedCount}</p>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <AttendanceCorrectionFilters
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        selectedClassId={selectedClassId}
        onClassIdChange={setSelectedClassId}
        selectedTeacherId={selectedTeacherId}
        onTeacherIdChange={setSelectedTeacherId}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        correctedOnly={correctedOnly}
        onCorrectedOnlyChange={setCorrectedOnly}
        classrooms={classrooms}
        teachers={teachers}
        onReset={handleResetFilters}
      />

      {/* TABLE */}
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
        </div>
      ) : (
        <AttendanceCorrectionTable
          records={filteredRecords}
          onRefresh={loadData}
          onRecordCorrected={handleRecordCorrected}
        />
      )}
    </div>
  );
};
