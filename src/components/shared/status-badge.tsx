import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/models/user.model";
import { AttendanceStatus } from "@/models/attendance.model";
import { ShieldAlert, ShieldCheck, GraduationCap, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status?: "active" | "inactive" | string;
  role?: UserRole;
  attendanceStatus?: AttendanceStatus;
  gender?: "male" | "female";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  role,
  attendanceStatus,
  gender,
  className,
}) => {
  const { t } = useTranslation();

  if (role) {
    switch (role) {
      case "super_admin":
        return (
          <Badge variant="gold" className={`gap-1 font-medium ${className || ""}`}>
            <ShieldAlert className="h-3 w-3" />
            {t("roles.super_admin")}
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="info" className={`gap-1 font-medium ${className || ""}`}>
            <ShieldCheck className="h-3 w-3" />
            {t("roles.admin")}
          </Badge>
        );
      case "teacher":
        return (
          <Badge variant="success" className={`gap-1 font-medium ${className || ""}`}>
            <GraduationCap className="h-3 w-3" />
            {t("roles.teacher")}
          </Badge>
        );
    }
  }

  if (attendanceStatus) {
    switch (attendanceStatus) {
      case "present":
        return (
          <Badge variant="success" className={`gap-1 ${className || ""}`}>
            <CheckCircle2 className="h-3 w-3" />
            {t("attendanceStatus.present")}
          </Badge>
        );
      case "absent":
        return (
          <Badge variant="destructive" className={`gap-1 ${className || ""}`}>
            <XCircle className="h-3 w-3" />
            {t("attendanceStatus.absent")}
          </Badge>
        );
      case "late":
        return (
          <Badge variant="warning" className={`gap-1 ${className || ""}`}>
            <Clock className="h-3 w-3" />
            {t("attendanceStatus.late")}
          </Badge>
        );
      case "permission":
        return (
          <Badge variant="info" className={`gap-1 ${className || ""}`}>
            <AlertCircle className="h-3 w-3" />
            {t("attendanceStatus.permission")}
          </Badge>
        );
    }
  }

  if (gender) {
    return gender === "female" ? (
      <span className="inline-flex items-center rounded-md bg-pink-50 px-2 py-0.5 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-700/10 dark:bg-pink-950/30 dark:text-pink-400">
        {t("gender.female")}
      </span>
    ) : (
      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-950/30 dark:text-blue-400">
        {t("gender.male")}
      </span>
    );
  }

  if (status) {
    return status === "active" ? (
      <Badge variant="success" className={className}>
        {t("status.active")}
      </Badge>
    ) : (
      <Badge variant="secondary" className={`text-slate-500 ${className || ""}`}>
        {t("status.inactive")}
      </Badge>
    );
  }

  return null;
};
