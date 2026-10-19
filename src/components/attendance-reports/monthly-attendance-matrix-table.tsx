import React from "react";
import { useTranslation } from "react-i18next";
import { MonthlyAttendanceReportData } from "@/models/attendance-report.model";
import { AttendanceStatus } from "@/models/attendance.model";
import { toKhmerNumber } from "@/services/attendance-report.service";
import { getCambodiaToday } from "@/lib/attendance-time-lock";
import { cn } from "@/lib/utils";

interface MonthlyAttendanceMatrixTableProps {
  reportData: MonthlyAttendanceReportData;
  language?: "km" | "en";
  isAdmin?: boolean;
  onCorrectRecord?: (target: {
    attendanceDocId?: string;
    student: any;
    date: string;
    previousStatus: AttendanceStatus | null;
  }) => void;
}

export const MonthlyAttendanceMatrixTable: React.FC<MonthlyAttendanceMatrixTableProps> = ({
  reportData,
  language = "km",
  isAdmin = false,
  onCorrectRecord,
}) => {
  const { t } = useTranslation();
  const isKm = language === "km";
  const cambodiaToday = getCambodiaToday();

  return (
    <div className="space-y-4">
      {/* 1. Status Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs">
        <span className="font-bold font-khmer text-slate-700 dark:text-slate-300 text-[11px]">
          {isKm ? "សម្គាល់វត្តមាន:" : "Status Legend:"}
        </span>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium">
            <span className="font-bold">P</span> = {isKm ? "វត្តមាន" : "Present"}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 font-medium">
            <span className="font-bold">A</span> = {isKm ? "អវត្តមាន" : "Absent"}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 font-medium">
            <span className="font-bold">L</span> = {isKm ? "យឺត" : "Late"}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-300 font-medium">
            <span className="font-bold">E</span> = {isKm ? "ច្បាប់" : "Permission"}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 border border-amber-400 font-medium">
            <span className="font-bold">H</span> = {isKm ? "ថ្ងៃឈប់សម្រាក" : "Holiday"}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 border border-slate-300 font-medium">
            <span className="font-bold">•</span> = {isKm ? "មិនទាន់កត់ត្រា" : "Pending"}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 border border-slate-300 font-medium">
            <span className="font-bold">—</span> = {isKm ? "ក្រៅវគ្គ" : "Off-session"}
          </span>
        </div>
      </div>

      {/* 2. Full Dynamic Attendance Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs">
        <table className="w-full text-xs text-left border-collapse border border-slate-300 dark:border-slate-800 min-w-[900px] bg-card">
          <thead>
            <tr className="bg-[#1E347B] text-white">
              {/* Sticky Screen Headers */}
              <th className="py-2.5 px-2 text-center border border-slate-400/80 w-10 sticky left-0 z-10 bg-[#1E347B] print:static">
                {isKm ? "ល.រ" : "No."}
              </th>
              <th className="py-2.5 px-2 text-center border border-slate-400/80 w-24 sticky left-10 z-10 bg-[#1E347B] print:static">
                {isKm ? "អត្តលេខ" : "Code"}
              </th>
              <th className="py-2.5 px-3 text-left border border-slate-400/80 min-w-[140px] sticky left-34 z-10 bg-[#1E347B] print:static font-khmer">
                {isKm ? "គោត្តនាម-នាម" : "Student Name"}
              </th>
              <th className="py-2.5 px-1.5 text-center border border-slate-400/80 w-12">
                {isKm ? "ភេទ" : "Sex"}
              </th>

              {/* Dynamic Date Headers */}
              {reportData.dateColumns.map((col) => (
                <th
                  key={col.dateStr}
                  title={
                    col.isHoliday
                      ? `${isKm ? "ថ្ងៃឈប់សម្រាក" : "Holiday"}: ${
                          (isKm ? col.holiday?.nameKm : col.holiday?.nameEn) || ""
                        }`
                      : col.dateStr
                  }
                  className={cn(
                    "py-1.5 px-0.5 text-center border border-slate-400/80 min-w-[34px]",
                    col.isHoliday ? "bg-amber-700 text-amber-50" : "bg-[#263E89] text-white"
                  )}
                >
                  <div className="font-bold text-[11px] leading-tight font-mono">
                    {isKm ? toKhmerNumber(col.dayNumber) : col.dayNumber}
                  </div>
                  <div className="text-[8px] opacity-90 leading-tight">
                    {isKm ? col.dayNameKm : col.dayNameEn}
                  </div>
                </th>
              ))}

              {/* Summary Columns */}
              <th className="py-2.5 px-1.5 text-center border border-slate-400/80 w-10 bg-[#16213D] text-emerald-300 font-bold">
                P
              </th>
              <th className="py-2.5 px-1.5 text-center border border-slate-400/80 w-10 bg-[#16213D] text-rose-300 font-bold">
                A
              </th>
              <th className="py-2.5 px-1.5 text-center border border-slate-400/80 w-10 bg-[#16213D] text-amber-300 font-bold">
                L
              </th>
              <th className="py-2.5 px-1.5 text-center border border-slate-400/80 w-10 bg-[#16213D] text-blue-300 font-bold">
                E
              </th>
              <th className="py-2.5 px-1.5 text-center border border-slate-400/80 w-12 bg-[#16213D] text-white font-bold">
                {isKm ? "សរុប" : "Total"}
              </th>
              <th className="py-2.5 px-2 text-center border border-slate-400/80 w-14 bg-[#16213D] text-[#F3B51B] font-extrabold">
                %
              </th>
            </tr>
          </thead>

          <tbody>
            {reportData.studentRows.length === 0 ? (
              <tr>
                <td
                  colSpan={4 + reportData.dateColumns.length + 6}
                  className="py-10 text-center text-slate-500 font-khmer text-xs"
                >
                  {t("attendanceReports.noStudentsFound", {
                    defaultValue: "មិនមានទិន្នន័យសិស្សចុះឈ្មោះក្នុងថ្នាក់នេះសម្រាប់ខែនេះទេ",
                  })}
                </td>
              </tr>
            ) : (
              reportData.studentRows.map((row, index) => {
                const isEven = index % 2 === 0;
                return (
                  <tr
                    key={row.student.id}
                    className={cn(
                      "transition-colors",
                      isEven ? "bg-white dark:bg-card" : "bg-slate-50/70 dark:bg-muted/30"
                    )}
                  >
                    {/* Frozen Columns on Screen */}
                    <td
                      className={cn(
                        "py-2 px-2 text-center border border-slate-300 dark:border-slate-800 font-mono text-slate-600 dark:text-slate-400 sticky left-0 z-1 print:static",
                        isEven ? "bg-white dark:bg-card" : "bg-slate-50 dark:bg-card"
                      )}
                    >
                      {isKm ? toKhmerNumber(index + 1) : index + 1}
                    </td>
                    <td
                      className={cn(
                        "py-2 px-2 text-center border border-slate-300 dark:border-slate-800 font-mono font-semibold text-slate-900 dark:text-slate-100 sticky left-10 z-1 print:static",
                        isEven ? "bg-white dark:bg-card" : "bg-slate-50 dark:bg-card"
                      )}
                    >
                      {row.student.studentCode}
                    </td>
                    <td
                      className={cn(
                        "py-2 px-3 border border-slate-300 dark:border-slate-800 font-medium text-slate-900 dark:text-slate-100 sticky left-34 z-1 print:static font-khmer",
                        isEven ? "bg-white dark:bg-card" : "bg-slate-50 dark:bg-card"
                      )}
                    >
                      <div className="truncate max-w-[150px]">
                        {row.student.nameKh}
                        {row.student.nameEn && (
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-sans truncate">
                            {row.student.nameEn}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-1.5 text-center border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      {row.student.gender === "female"
                        ? isKm
                          ? "ស្រី"
                          : "F"
                        : isKm
                        ? "ប្រុស"
                        : "M"}
                    </td>

                    {/* Date Status Cells */}
                    {reportData.dateColumns.map((col) => {
                      const cellData = row.cells[col.dateStr];
                      const code = cellData?.code || "•";
                      const isClickableCorrection =
                        isAdmin &&
                        Boolean(onCorrectRecord) &&
                        cellData?.hasRecord &&
                        col.dateStr <= cambodiaToday;

                      return (
                        <td
                          key={col.dateStr}
                          onClick={() => {
                            if (isClickableCorrection && onCorrectRecord) {
                              onCorrectRecord({
                                attendanceDocId: cellData.attendanceDocId,
                                student: row.student,
                                date: col.dateStr,
                                previousStatus: (cellData.status as AttendanceStatus) || null,
                              });
                            }
                          }}
                          className={cn(
                            "py-1.5 px-0.5 text-center border border-slate-300 dark:border-slate-800 font-bold text-[11px]",
                            col.isHoliday && "bg-amber-50/70 dark:bg-amber-950/20",
                            isClickableCorrection &&
                              "cursor-pointer hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors"
                          )}
                          title={
                            cellData?.isHoliday
                              ? `${isKm ? "ថ្ងៃឈប់សម្រាក" : "Holiday"}: ${
                                  (isKm ? cellData.holidayNameKm : cellData.holidayNameEn) || ""
                                }`
                              : isClickableCorrection
                              ? `${code}: ${cellData?.remark || ""}${cellData?.remark ? " — " : ""}${
                                  isKm ? "ចុចដើម្បីកែប្រែវត្តមាន" : "Click to correct attendance"
                                }`
                              : cellData?.remark
                              ? `${code}: ${cellData.remark}`
                              : undefined
                          }
                        >
                          {code === "P" ? (
                            <span className="inline-flex items-center justify-center h-5.5 w-5.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold text-[11px]">
                              P
                            </span>
                          ) : code === "A" ? (
                            <span className="inline-flex items-center justify-center h-5.5 w-5.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 font-bold text-[11px]">
                              A
                            </span>
                          ) : code === "L" ? (
                            <span className="inline-flex items-center justify-center h-5.5 w-5.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-bold text-[11px]">
                              L
                            </span>
                          ) : code === "E" ? (
                            <span className="inline-flex items-center justify-center h-5.5 w-5.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 font-bold text-[11px]">
                              E
                            </span>
                          ) : code === "H" ? (
                            <span className="inline-flex items-center justify-center h-5.5 w-5.5 rounded-md bg-amber-200/80 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 font-bold text-[10px]">
                              H
                            </span>
                          ) : code === "—" ? (
                            <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600 text-xs">•</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Summary Columns */}
                    <td className="py-2 px-1.5 text-center border border-slate-300 dark:border-slate-800 font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                      {isKm ? toKhmerNumber(row.presentCount) : row.presentCount}
                    </td>
                    <td className="py-2 px-1.5 text-center border border-slate-300 dark:border-slate-800 font-mono font-semibold text-rose-700 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20">
                      {isKm ? toKhmerNumber(row.absentCount) : row.absentCount}
                    </td>
                    <td className="py-2 px-1.5 text-center border border-slate-300 dark:border-slate-800 font-mono font-semibold text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20">
                      {isKm ? toKhmerNumber(row.lateCount) : row.lateCount}
                    </td>
                    <td className="py-2 px-1.5 text-center border border-slate-300 dark:border-slate-800 font-mono font-semibold text-blue-700 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20">
                      {isKm ? toKhmerNumber(row.permissionCount) : row.permissionCount}
                    </td>
                    <td className="py-2 px-1.5 text-center border border-slate-300 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/50">
                      {isKm ? toKhmerNumber(row.recordedSessionCount) : row.recordedSessionCount}
                    </td>
                    <td className="py-2 px-2 text-center border border-slate-300 dark:border-slate-800 font-mono font-extrabold text-[#1E347B] dark:text-amber-400 bg-[#1E347B]/10 dark:bg-[#1E347B]/30">
                      {isKm ? `${toKhmerNumber(row.attendanceRate)}%` : `${row.attendanceRate}%`}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Totals Summary Footer */}
          {reportData.studentRows.length > 0 && (
            <tfoot>
              <tr className="bg-slate-200 dark:bg-slate-800/90 font-bold border-t-2 border-slate-500 text-slate-900 dark:text-slate-100">
                <td
                  colSpan={4}
                  className="py-2.5 px-3 text-center border border-slate-400/80 dark:border-slate-700 font-khmer sticky left-0 z-1 bg-slate-200 dark:bg-slate-850 print:static"
                >
                  {isKm ? "សរុបវត្តមានទូទៅ (Overall Totals)" : "Overall Totals"}
                </td>

                {/* Per-Date Sum */}
                {reportData.dateColumns.map((col) => {
                  if (col.isHoliday) {
                    return (
                      <td
                        key={col.dateStr}
                        className="py-2 px-0.5 text-center border border-slate-400/80 dark:border-slate-700 font-mono text-[11px] text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-950/40"
                      >
                        H
                      </td>
                    );
                  }
                  const presentCount = reportData.studentRows.filter(
                    (r) => r.cells[col.dateStr]?.code === "P"
                  ).length;
                  return (
                    <td
                      key={col.dateStr}
                      className="py-2 px-0.5 text-center border border-slate-400/80 dark:border-slate-700 font-mono text-[11px] text-slate-900 dark:text-slate-100"
                    >
                      {presentCount > 0
                        ? isKm
                          ? toKhmerNumber(presentCount)
                          : presentCount
                        : "-"}
                    </td>
                  );
                })}

                <td className="py-2.5 px-1.5 text-center border border-slate-400/80 dark:border-slate-700 font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50">
                  {isKm
                    ? toKhmerNumber(reportData.summaryMetrics.totalPresent)
                    : reportData.summaryMetrics.totalPresent}
                </td>
                <td className="py-2.5 px-1.5 text-center border border-slate-400/80 dark:border-slate-700 font-mono font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/50">
                  {isKm
                    ? toKhmerNumber(reportData.summaryMetrics.totalAbsent)
                    : reportData.summaryMetrics.totalAbsent}
                </td>
                <td className="py-2.5 px-1.5 text-center border border-slate-400/80 dark:border-slate-700 font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50">
                  {isKm
                    ? toKhmerNumber(reportData.summaryMetrics.totalLate)
                    : reportData.summaryMetrics.totalLate}
                </td>
                <td className="py-2.5 px-1.5 text-center border border-slate-400/80 dark:border-slate-700 font-mono font-bold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/50">
                  {isKm
                    ? toKhmerNumber(reportData.summaryMetrics.totalPermission)
                    : reportData.summaryMetrics.totalPermission}
                </td>
                <td className="py-2.5 px-1.5 text-center border border-slate-400/80 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-300 dark:bg-slate-700">
                  {isKm
                    ? toKhmerNumber(reportData.summaryMetrics.totalRecordedStudentSessions)
                    : reportData.summaryMetrics.totalRecordedStudentSessions}
                </td>
                <td className="py-2.5 px-2 text-center border border-slate-400/80 dark:border-slate-700 font-mono font-extrabold text-[#1E347B] dark:text-[#F3B51B] bg-[#F3B51B]/30 dark:bg-[#F3B51B]/20">
                  {isKm
                    ? `${toKhmerNumber(reportData.summaryMetrics.overallAttendanceRate)}%`
                    : `${reportData.summaryMetrics.overallAttendanceRate}%`}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
