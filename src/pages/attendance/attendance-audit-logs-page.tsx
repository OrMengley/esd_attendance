import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { AuditLogFilters } from "@/components/attendance-corrections/audit-log-filters";
import { AuditLogTable } from "@/components/attendance-corrections/audit-log-table";
import { attendanceAuditLogService } from "@/services/attendance-audit-log.service";
import { classroomService } from "@/services/classroom.service";
import { userService } from "@/services/user.service";
import { AttendanceAuditLog, CorrectionReason } from "@/models/attendance-audit-log.model";
import { Classroom } from "@/models/classroom.model";
import { User } from "@/models/user.model";
import { AttendanceStatus } from "@/models/attendance.model";
import { getCambodiaToday } from "@/lib/attendance-time-lock";
import { toast } from "sonner";
import {
  FileText,
  ShieldCheck,
  CalendarCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const AttendanceAuditLogsPage: React.FC = () => {
  const { t } = useTranslation();

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [classroomId, setClassroomId] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [correctedById, setCorrectedById] = useState("all");
  const [previousStatus, setPreviousStatus] = useState<AttendanceStatus | "all">("all");
  const [newStatus, setNewStatus] = useState<AttendanceStatus | "all">("all");
  const [correctionReason, setCorrectionReason] = useState<CorrectionReason | "all">("all");

  // Data
  const [logs, setLogs] = useState<AttendanceAuditLog[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allLogs, allClassrooms, allUsers] = await Promise.all([
        attendanceAuditLogService.getAuditLogs(),
        classroomService.getClassrooms(),
        userService.getUsers(),
      ]);

      const admins = allUsers.filter(
        (u) => u.role === "admin" || u.role === "super_admin"
      );

      setLogs(allLogs);
      setClassrooms(allClassrooms);
      setAdminUsers(admins);
    } catch (e) {
      console.error("Failed to load audit logs:", e);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setClassroomId("all");
    setStudentSearch("");
    setCorrectedById("all");
    setPreviousStatus("all");
    setNewStatus("all");
    setCorrectionReason("all");
  };

  // In-memory filter
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Date range
      if (startDate && log.attendanceDate < startDate) return false;
      if (endDate && log.attendanceDate > endDate) return false;

      // Classroom
      if (classroomId !== "all" && log.classroomId !== classroomId) {
        return false;
      }

      // Admin user
      if (correctedById !== "all" && log.correctedById !== correctedById) {
        return false;
      }

      // Previous status
      if (previousStatus !== "all" && log.previousStatus !== previousStatus) {
        return false;
      }

      // New status
      if (newStatus !== "all" && log.newStatus !== newStatus) {
        return false;
      }

      // Reason
      if (correctionReason !== "all" && log.correctionReason !== correctionReason) {
        return false;
      }

      // Student search
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase().trim();
        const code = (log.studentSnapshot?.studentCode || "").toLowerCase();
        const nameKh = (log.studentSnapshot?.fullNameKm || "").toLowerCase();
        const nameEn = (log.studentSnapshot?.fullNameEn || "").toLowerCase();
        const match = code.includes(q) || nameKh.includes(q) || nameEn.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    logs,
    startDate,
    endDate,
    classroomId,
    studentSearch,
    correctedById,
    previousStatus,
    newStatus,
    correctionReason,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("attendanceAuditLogs.title", { defaultValue: "Attendance Audit Logs" })}
        description={t("attendanceAuditLogs.description", {
          defaultValue: "Immutable history of all attendance corrections made by administrators",
        })}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isLoading}
          className="gap-2 shadow-xs text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>{t("common.refresh", { defaultValue: "Refresh" })}</span>
        </Button>
      </PageHeader>

      {/* FILTER BAR */}
      <AuditLogFilters
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        classroomId={classroomId}
        onClassroomIdChange={setClassroomId}
        studentSearch={studentSearch}
        onStudentSearchChange={setStudentSearch}
        correctedById={correctedById}
        onCorrectedByIdChange={setCorrectedById}
        previousStatus={previousStatus}
        onPreviousStatusChange={setPreviousStatus}
        newStatus={newStatus}
        onNewStatusChange={setNewStatus}
        correctionReason={correctionReason}
        onCorrectionReasonChange={setCorrectionReason}
        classrooms={classrooms}
        adminUsers={adminUsers}
        onReset={handleResetFilters}
      />

      {/* TABLE */}
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
        </div>
      ) : (
        <AuditLogTable logs={filteredLogs} />
      )}
    </div>
  );
};
