import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Classroom } from "@/models/classroom.model";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Sparkles,
  ArrowRight,
  School,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";

interface TeacherNextClassCardProps {
  nextClass: Classroom | null;
  selectedDate: string;
}

export const TeacherNextClassCard: React.FC<TeacherNextClassCardProps> = ({
  nextClass,
  selectedDate,
}) => {
  const { t } = useTranslation();

  if (!nextClass) {
    return (
      <div className="rounded-2xl border bg-card/60 p-5 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground font-khmer">
              {t("dashboard.noMoreClassesToday", { defaultValue: "No more classes today" })}
            </h4>
            <p className="text-xs text-muted-foreground font-khmer">
              {t("dashboard.allClassesDoneDesc", {
                defaultValue: "You have completed all scheduled teaching sessions for today.",
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const startTime = nextClass.startTime || "00:00";
  const endTime = nextClass.endTime || "00:00";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-r from-primary/5 via-card to-card p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary font-mono">
                {t("dashboard.upNext", { defaultValue: "Up Next" })}
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {startTime} - {endTime}
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground font-khmer mt-1">
              {nextClass.name}
            </h3>
            <p className="text-xs font-mono text-muted-foreground">
              {nextClass.code}
            </p>
          </div>
        </div>

        <Button
          asChild
          size="sm"
          className="h-9 px-4 rounded-xl text-xs gap-1.5 font-khmer bg-primary text-primary-foreground shadow-xs self-start sm:self-auto"
        >
          <Link to={`/attendance?classroomId=${nextClass.id}&date=${selectedDate}`}>
            <span>{t("dashboard.openClassAttendance", { defaultValue: "Open Class" })}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
};
