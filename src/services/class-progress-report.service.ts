import ExcelJS from "exceljs";
import i18n from "@/i18n";
import { classroomService } from "./classroom.service";
import { studyPackageService } from "./study-package.service";
import { userService } from "./user.service";
import { enrollmentService } from "./enrollment.service";
import { schoolHolidayService } from "./school-holiday.service";
import {
  ClassProgressFilters,
  ClassProgressHealth,
  ClassProgressReportData,
} from "@/models/class-progress-report.model";
import { calculateClassProgressReport } from "@/lib/class-progress-calculator";
import { getCambodiaToday } from "@/lib/attendance-time-lock";
import {
  formatLearningDays,
  getAppliedFilterEntries,
  getClassStatusLabel,
  getHealthLabel,
  getPackageDisplayName,
  getScheduleTypeLabel,
} from "@/lib/class-progress-labels";

const HEALTH_CELL_COLORS: Record<ClassProgressHealth, { fill: string; font: string }> = {
  not_started: { fill: "FFF1F3F5", font: "FF495057" },
  on_track: { fill: "FFE3F2FD", font: "FF1565C0" },
  near_completion: { fill: "FFFFF8E1", font: "FFEF6C00" },
  overdue: { fill: "FFFFEBEE", font: "FFC62828" },
  completed: { fill: "FFE8F5E9", font: "FF2E7D32" },
};

import { getEffectiveBranchId } from "@/lib/branch-scoping";
import { User } from "@/models/user.model";

export const classProgressReportService = {
  /**
   * Fetches required collections once (no per-class reads) and computes the report.
   */
  async generateReport(
    filters: ClassProgressFilters,
    currentUserName?: string,
    branchId?: string | null,
    currentUser?: User | null
  ): Promise<ClassProgressReportData> {
    const effectiveBranch = currentUser
      ? getEffectiveBranchId(currentUser, branchId)
      : branchId && branchId !== "all"
      ? branchId
      : null;

    let [classrooms, studyPackages, users, enrollments, holidays] = await Promise.all([
      classroomService.getClassrooms(),
      studyPackageService.getStudyPackages(),
      userService.getUsers(),
      enrollmentService.getEnrollments(effectiveBranch),
      schoolHolidayService.getActiveSchoolHolidays(),
    ]);

    if (effectiveBranch && effectiveBranch !== "all") {
      classrooms = classrooms.filter((c) => c.branchId === effectiveBranch);
    }

    return calculateClassProgressReport({
      filters,
      classrooms,
      studyPackages,
      users,
      enrollments,
      holidays,
      currentUserName,
    });
  },

  /**
   * Exports exactly the currently filtered classes to an Excel (.xlsx) file.
   */
  async exportToExcel(
    reportData: ClassProgressReportData,
    language: "km" | "en" = "km"
  ): Promise<void> {
    const t = i18n.getFixedT(language);
    const isKm = language === "km";
    const { rows, generatedAt, generatedBy } = reportData;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ESD Attendance System";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(t("classProgressReport.excel.sheetName"), {
      views: [{ state: "frozen", xSplit: 2, ySplit: 6 }],
      pageSetup: {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9, // A4
      },
    });

    const totalCols = 22;

    const COLOR_NAVY = "FF1E347B";
    const COLOR_NAVY_DARK = "FF16213D";
    const COLOR_GOLD = "FFF3B51B";
    const COLOR_WHITE = "FFFFFFFF";
    const COLOR_BORDER = "FFE0E0E0";
    const COLOR_BORDER_DARK = "FFB0BEC5";

    // 1. School title (merged)
    worksheet.mergeCells(1, 1, 1, totalCols);
    worksheet.getRow(1).height = 30;
    const cell1 = worksheet.getCell(1, 1);
    cell1.value = isKm
      ? "មជ្ឈមណ្ឌលបណ្តុះបណ្តាលកុំព្យូទ័រ វត្តសុរិយារាម (Wat Soriyaram Computer Training School)"
      : "WAT SORIYARAM COMPUTER TRAINING SCHOOL";
    cell1.font = { name: "Arial", size: 13, bold: true, color: { argb: COLOR_WHITE } };
    cell1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_NAVY } };
    cell1.alignment = { horizontal: "center", vertical: "middle" };

    // 2. Report title (merged)
    worksheet.mergeCells(2, 1, 2, totalCols);
    worksheet.getRow(2).height = 24;
    const cell2 = worksheet.getCell(2, 1);
    cell2.value = t("classProgressReport.title");
    cell2.font = { name: "Arial", size: 11, bold: true, color: { argb: COLOR_NAVY_DARK } };
    cell2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_GOLD } };
    cell2.alignment = { horizontal: "center", vertical: "middle" };

    // 3. Generated date/time
    worksheet.mergeCells(3, 1, 3, totalCols);
    const cell3 = worksheet.getCell(3, 1);
    cell3.value = `${t("classProgressReport.print.generated")}: ${generatedAt}${
      generatedBy ? ` (${generatedBy})` : ""
    }`;
    cell3.font = { name: "Arial", size: 9, color: { argb: "FF666666" } };
    cell3.alignment = { horizontal: "left", vertical: "middle" };

    // 4. Applied filters
    worksheet.mergeCells(4, 1, 4, totalCols);
    worksheet.getRow(4).height = 30;
    const cell4 = worksheet.getCell(4, 1);
    cell4.value = `${t("classProgressReport.print.appliedFilters")}: ${getAppliedFilterEntries(
      t,
      reportData,
      language
    )
      .map((entry) => `${entry.label}: ${entry.value}`)
      .join(" | ")}`;
    cell4.font = { name: "Arial", size: 9, bold: true };
    cell4.alignment = { horizontal: "left", vertical: "middle", wrapText: true };

    // Blank row 5
    worksheet.getRow(5).height = 8;

    // 5. Header row (row 6)
    worksheet.getRow(6).height = 32;
    const headers: string[] = [
      t("classProgressReport.table.no"),
      t("classProgressReport.excel.className"),
      t("classProgressReport.excel.classCode"),
      t("classProgressReport.excel.studyPackage"),
      t("classProgressReport.excel.teacherName"),
      t("classProgressReport.excel.teacherUsername"),
      t("classProgressReport.excel.scheduleType"),
      t("classProgressReport.excel.learningDays"),
      t("classProgressReport.excel.startTime"),
      t("classProgressReport.excel.endTime"),
      t("classProgressReport.excel.startDate"),
      t("classProgressReport.excel.expectedEndDate"),
      t("classProgressReport.excel.plannedHours"),
      t("classProgressReport.excel.completedHours"),
      t("classProgressReport.excel.remainingHours"),
      t("classProgressReport.excel.progressPercent"),
      t("classProgressReport.excel.enrolledStudents"),
      t("classProgressReport.excel.capacity"),
      t("classProgressReport.excel.availableSeats"),
      t("classProgressReport.excel.capacityPercent"),
      t("classProgressReport.excel.status"),
      t("classProgressReport.excel.health"),
    ];

    headers.forEach((h, index) => {
      const cell = worksheet.getCell(6, index + 1);
      cell.value = h;
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLOR_WHITE } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_NAVY } };
      cell.border = {
        top: { style: "thin", color: { argb: COLOR_BORDER_DARK } },
        left: { style: "thin", color: { argb: COLOR_BORDER_DARK } },
        bottom: { style: "medium", color: { argb: COLOR_NAVY_DARK } },
        right: { style: "thin", color: { argb: COLOR_BORDER_DARK } },
      };
    });

    // 6. Data rows (starting row 7)
    const LEFT_ALIGNED_COLS = new Set([2, 4, 5, 6, 8]);
    const HEALTH_COL = 22;

    rows.forEach((row, rIndex) => {
      const rowNum = 7 + rIndex;
      worksheet.getRow(rowNum).height = 22;

      const rowData: (string | number)[] = [
        rIndex + 1,
        row.classroom.name,
        row.classroom.code,
        getPackageDisplayName(row.studyPackage, language) || "—",
        row.teacher?.name || t("classProgressReport.table.unassigned"),
        row.teacher?.username ? `@${row.teacher.username}` : "—",
        getScheduleTypeLabel(t, row.scheduleType),
        formatLearningDays(t, row.classroom),
        row.classroom.startTime || "—",
        row.classroom.endTime || "—",
        row.classroom.startDate || "—",
        row.expectedEndDate || "—",
        row.plannedHours,
        row.completedHours,
        row.remainingHours,
        row.progressPercent,
        row.enrolledStudents,
        row.capacity ?? "—",
        row.availableSeats ?? "—",
        row.capacity !== null ? row.capacityPercent : "—",
        getClassStatusLabel(t, row.classroom.status),
        getHealthLabel(t, row.health),
      ];

      rowData.forEach((val, cIndex) => {
        const colIndex = cIndex + 1;
        const cell = worksheet.getCell(rowNum, colIndex);
        cell.value = val;
        cell.font = { name: "Arial", size: 9 };
        cell.alignment = {
          horizontal: LEFT_ALIGNED_COLS.has(colIndex) ? "left" : "center",
          vertical: "middle",
        };
        cell.border = {
          top: { style: "thin", color: { argb: COLOR_BORDER } },
          left: { style: "thin", color: { argb: COLOR_BORDER } },
          bottom: { style: "thin", color: { argb: COLOR_BORDER } },
          right: { style: "thin", color: { argb: COLOR_BORDER } },
        };

        if (colIndex === 16 || colIndex === 20) {
          if (typeof val === "number") cell.numFmt = "0.0";
        }
        if ((colIndex === 13 || colIndex === 14 || colIndex === 15) && typeof val === "number") {
          cell.numFmt = "0.##";
        }

        if (colIndex === 16) {
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLOR_NAVY } };
        }

        if (colIndex === HEALTH_COL) {
          const colors = HEALTH_CELL_COLORS[row.health];
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.fill } };
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: colors.font } };
        }
      });
    });

    // 7. Column widths
    const widths = [6, 26, 14, 24, 20, 16, 14, 18, 11, 11, 13, 15, 11, 11, 11, 11, 11, 10, 11, 11, 14, 18];
    widths.forEach((w, i) => {
      worksheet.getColumn(i + 1).width = w;
    });

    // 8. Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `Class_Progress_Report_${getCambodiaToday()}.xlsx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  },
};
