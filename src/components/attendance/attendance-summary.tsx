import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface AttendanceSummaryProps {
  totalCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  permissionCount: number;
}

export const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({
  totalCount,
  presentCount,
  absentCount,
  lateCount,
  permissionCount,
}) => {
  const { t } = useTranslation();

  const stats = [
    {
      id: "total",
      label: t("attendance.totalStudents", { defaultValue: "សិស្សសរុប" }),
      count: totalCount,
      icon: Users,
      colorClasses: "text-slate-600 dark:text-slate-300 bg-slate-500/10 border-slate-500/20",
      accentBg: "bg-slate-500/10",
      accentText: "text-slate-600 dark:text-slate-400",
    },
    {
      id: "present",
      label: t("attendance.present", { defaultValue: "វត្តមាន" }),
      count: presentCount,
      icon: CheckCircle2,
      colorClasses: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      accentBg: "bg-emerald-500/15",
      accentText: "text-emerald-600 dark:text-emerald-400",
    },
    {
      id: "absent",
      label: t("attendance.absent", { defaultValue: "អវត្តមាន" }),
      count: absentCount,
      icon: XCircle,
      colorClasses: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
      accentBg: "bg-rose-500/15",
      accentText: "text-rose-600 dark:text-rose-400",
    },
    {
      id: "late",
      label: t("attendance.late", { defaultValue: "មកយឺត" }),
      count: lateCount,
      icon: Clock,
      colorClasses: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
      accentBg: "bg-amber-500/15",
      accentText: "text-amber-600 dark:text-amber-400",
    },
    {
      id: "permission",
      label: t("attendance.permission", { defaultValue: "ច្បាប់" }),
      count: permissionCount,
      icon: AlertCircle,
      colorClasses: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
      accentBg: "bg-blue-500/15",
      accentText: "text-blue-600 dark:text-blue-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((item) => {
        const Icon = item.icon;
        const percentage =
          totalCount > 0 && item.id !== "total"
            ? Math.round((item.count / totalCount) * 100)
            : null;

        return (
          <Card
            key={item.id}
            className={`rounded-2xl border transition-all shadow-xs ${item.colorClasses}`}
          >
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold font-khmer truncate">
                  {item.label}
                </span>
                <div
                  className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 ${item.accentBg} ${item.accentText}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                  {item.count}
                </span>
                {percentage !== null && (
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {percentage}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
