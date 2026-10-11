import React from "react";
import { useTranslation } from "react-i18next";
import { AttendanceStatus } from "@/models/attendance.model";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface AttendanceStatusControlProps {
  value: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  disabled?: boolean;
}

export const AttendanceStatusControl: React.FC<AttendanceStatusControlProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { t } = useTranslation();

  const options: {
    id: AttendanceStatus;
    label: string;
    icon: React.ElementType;
    activeClasses: string;
    inactiveClasses: string;
  }[] = [
    {
      id: "present",
      label: t("attendance.present", { defaultValue: "វត្តមាន" }),
      icon: CheckCircle2,
      activeClasses:
        "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600 dark:bg-emerald-600",
      inactiveClasses:
        "text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 bg-emerald-500/5",
    },
    {
      id: "absent",
      label: t("attendance.absent", { defaultValue: "អវត្តមាន" }),
      icon: XCircle,
      activeClasses:
        "bg-rose-600 text-white shadow-sm ring-1 ring-rose-600 dark:bg-rose-600",
      inactiveClasses:
        "text-rose-700 dark:text-rose-300 hover:bg-rose-500/15 bg-rose-500/5",
    },
    {
      id: "late",
      label: t("attendance.late", { defaultValue: "មកយឺត" }),
      icon: Clock,
      activeClasses:
        "bg-amber-500 text-white shadow-sm ring-1 ring-amber-500 dark:bg-amber-600",
      inactiveClasses:
        "text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 bg-amber-500/5",
    },
    {
      id: "permission",
      label: t("attendance.permission", { defaultValue: "ច្បាប់" }),
      icon: AlertCircle,
      activeClasses:
        "bg-blue-600 text-white shadow-sm ring-1 ring-blue-600 dark:bg-blue-600",
      inactiveClasses:
        "text-blue-700 dark:text-blue-300 hover:bg-blue-500/15 bg-blue-500/5",
    },
  ];

  return (
    <div className="inline-flex items-center p-1 rounded-xl bg-muted/50 border border-border/60 gap-1">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold font-khmer transition-all duration-150 ${
              isSelected ? opt.activeClasses : opt.inactiveClasses
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
