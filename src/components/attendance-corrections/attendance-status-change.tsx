import React from "react";
import { useTranslation } from "react-i18next";
import { AttendanceStatus } from "@/models/attendance.model";
import { StatusBadge } from "@/components/shared/status-badge";
import { ArrowRight, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AttendanceStatusChangeProps {
  previousStatus: AttendanceStatus | null | undefined;
  newStatus: AttendanceStatus;
  size?: "sm" | "default";
}

export const AttendanceStatusChange: React.FC<AttendanceStatusChangeProps> = ({
  previousStatus,
  newStatus,
  size = "default",
}) => {
  const { t } = useTranslation();

  return (
    <div className="inline-flex items-center gap-2">
      {previousStatus ? (
        <StatusBadge attendanceStatus={previousStatus} className={size === "sm" ? "text-[11px] py-0 px-2" : ""} />
      ) : (
        <Badge variant="secondary" className="gap-1 text-slate-500 font-normal">
          <HelpCircle className="h-3 w-3" />
          <span>{t("attendanceCorrection.noRecord", { defaultValue: "No Record" })}</span>
        </Badge>
      )}

      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

      <StatusBadge attendanceStatus={newStatus} className={size === "sm" ? "text-[11px] py-0 px-2 font-bold" : "font-bold"} />
    </div>
  );
};
