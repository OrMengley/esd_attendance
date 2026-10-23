import ExcelJS from "exceljs";
import { classroomService } from "./classroom.service";
import { studyPackageService } from "./study-package.service";
import { userService } from "./user.service";
import { studentService } from "./student.service";
import { enrollmentService } from "./enrollment.service";
import { attendanceService } from "./attendance.service";
import { schoolHolidayService } from "./school-holiday.service";
import {
  AbsenceLateFilters,
  AbsenceLateReportData,
} from "@/models/absence-late-report.model";
import { calculateAbsenceLateReport } from "@/lib/absence-late-report-calculator";
import {
  getEffectiveBranchId,
  filterClassesByBranch,
  filterEnrollmentsByBranch,
  filterStudentsByBranch,
  filterAttendanceByBranch,
} from "@/lib/branch-scoping";
import { User } from "@/models/user.model";

export const absenceLateReportService = {
  /**
   * Fetches required collections and computes the Absence & Late Report.
   */
  async generateReport(
    filters: AbsenceLateFilters,
    currentUserName?: string,
    branchId?: string | null,
    currentUser?: User | null
  ): Promise<AbsenceLateReportData> {
    const effectiveBranch = currentUser
      ? getEffectiveBranchId(currentUser, branchId)
      : branchId && branchId !== "all"
      ? branchId
      : null;

    let [
      classrooms,
      studyPackages,
      users,
      students,
      enrollments,
      attendance,
      holidays,
    ] = await Promise.all([
      classroomService.getClassrooms(),
      studyPackageService.getStudyPackages(),
      userService.getUsers(),
      studentService.getStudents(),
      enrollmentService.getEnrollments(effectiveBranch),
      attendanceService.getAttendance(),
      schoolHolidayService.getActiveSchoolHolidays(),
    ]);

    if (effectiveBranch && effectiveBranch !== "all") {
      classrooms = filterClassesByBranch(classrooms, effectiveBranch);
      enrollments = filterEnrollmentsByBranch(enrollments, classrooms, students, effectiveBranch);
      students = filterStudentsByBranch(students, enrollments, classrooms, effectiveBranch);
      attendance = filterAttendanceByBranch(attendance, classrooms, effectiveBranch);
    }

    return calculateAbsenceLateReport({
      filters,
      students,
      enrollments,
      classrooms,
      studyPackages,
      users,
      attendance,
      holidays,
      currentUserName,
    });
  },

  /**
   * Exports the filtered Absence & Late Report rows to an Excel (.xlsx) file.
   */
  async exportToExcel(
    reportData: AbsenceLateReportData,
    language: "km" | "en" = "km"
  ): Promise<void> {
    const { selectedMonth, monthNameKm, monthNameEn, filters, students, summary, generatedAt, generatedBy } =
      reportData;

    const isKm = language === "km";
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ESD Attendance System";
    workbook.created = new Date();

    const sheetName = isKm ? "អវត្តមាន & មកយឺត" : "Absence & Late Report";
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ state: "frozen", xSplit: 3, ySplit: 6 }],
      pageSetup: {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9, // A4
      },
    });

    const totalCols = 15;

    const COLOR_NAVY = "FF1E347B";
    const COLOR_NAVY_DARK = "FF16213D";
    const COLOR_GOLD = "FFF3B51B";
    const COLOR_WHITE = "FFFFFFFF";
    const COLOR_BORDER = "FFE0E0E0";
    const COLOR_BORDER_DARK = "FFB0BEC5";

    // 1. School Title Row (Merged)
    worksheet.mergeCells(1, 1, 1, totalCols);
    const row1 = worksheet.getRow(1);
    row1.height = 30;
    const cell1 = worksheet.getCell(1, 1);
    cell1.value = isKm
      ? "មជ្ឈមណ្ឌលបណ្តុះបណ្តាលកុំព្យូទ័រ វត្តសុរិយារាម (Wat Soriyaram Computer Training School)"
      : "WAT SORIYARAM COMPUTER TRAINING SCHOOL";
    cell1.font = { name: "Arial", size: 13, bold: true, color: { argb: COLOR_WHITE } };
    cell1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_NAVY } };
    cell1.alignment = { horizontal: "center", vertical: "middle" };

    // 2. Report Title Row (Merged)
    worksheet.mergeCells(2, 1, 2, totalCols);
    const row2 = worksheet.getRow(2);
    row2.height = 24;
    const cell2 = worksheet.getCell(2, 1);
    cell2.value = isKm
      ? `របាយការណ៍សិស្សអវត្តមាន និងមកយឺត • ${monthNameKm}`
      : `ABSENCE & LATE REPORT • ${monthNameEn}`;
    cell2.font = { name: "Arial", size: 11, bold: true, color: { argb: COLOR_NAVY_DARK } };
    cell2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_GOLD } };
    cell2.alignment = { horizontal: "center", vertical: "middle" };

    // 3. Metadata Row 1
    const reportTypeLabel =
      filters.reportType === "absent_only"
        ? isKm ? "អវត្តមានប៉ុណ្ណោះ" : "Absence Only"
        : filters.reportType === "late_only"
        ? isKm ? "មកយឺតប៉ុណ្ណោះ" : "Late Only"
        : isKm ? "អវត្តមាន ឬមកយឺត" : "Absence or Late";

    worksheet.mergeCells(3, 1, 3, 5);
    worksheet.getCell(3, 1).value = `${isKm ? "ខែ/ឆ្នាំ" : "Month"}: ${isKm ? monthNameKm : monthNameEn} | ${isKm ? "ប្រភេទ" : "Type"}: ${reportTypeLabel} (≥ ${filters.minOccurrences})`;
    worksheet.getCell(3, 1).font = { bold: true, size: 9 };

    worksheet.mergeCells(3, 6, 3, totalCols);
    worksheet.getCell(3, 6).value = `${isKm ? "សិស្សជាប់លក្ខខណ្ឌសរុប" : "Total Flagged"}: ${summary.studentsFlagged} ${isKm ? "នាក់" : "students"} | ${isKm ? "អវត្តមានសរុប" : "Total Absences"}: ${summary.totalAbsences} | ${isKm ? "មកយឺតសរុប" : "Total Lates"}: ${summary.totalLates}`;
    worksheet.getCell(3, 6).font = { bold: true, size: 9 };
    worksheet.getCell(3, 6).alignment = { horizontal: "right" };

    // 4. Metadata Row 2
    worksheet.mergeCells(4, 1, 4, 5);
    worksheet.getCell(4, 1).value = `${isKm ? "កាលវិភាគ" : "Schedule"}: ${
      filters.selectedSchedule === "weekday"
        ? isKm ? "ចន្ទ - សុក្រ (Weekday)" : "Monday - Friday"
        : filters.selectedSchedule === "weekend"
        ? isKm ? "សៅរ៍ - អាទិត្យ (Weekend)" : "Saturday - Sunday"
        : isKm ? "កាលវិភាគទាំងអស់" : "All Schedules"
    }`;
    worksheet.getCell(4, 1).font = { size: 9 };

    worksheet.mergeCells(4, 6, 4, totalCols);
    worksheet.getCell(4, 6).value = `${isKm ? "កាលបរិច្ឆេទបង្កើត" : "Generated"}: ${generatedAt}${generatedBy ? ` (${generatedBy})` : ""}`;
    worksheet.getCell(4, 6).font = { size: 8, color: { argb: "FF666666" } };
    worksheet.getCell(4, 6).alignment = { horizontal: "right" };

    // Blank row 5
    worksheet.getRow(5).height = 8;

    // 5. Table Headers (Row 6)
    const headerRow = worksheet.getRow(6);
    headerRow.height = 26;

    const headers: string[] = [
      isKm ? "ល.រ" : "Rank",
      isKm ? "គោត្តនាម-នាម" : "Student Name",
      isKm ? "អត្តលេខ" : "Student Code",
      isKm ? "ថ្នាក់រៀន" : "Current Class",
      isKm ? "កូដថ្នាក់" : "Class Code",
      isKm ? "គ្រូបង្រៀន" : "Teacher",
      isKm ? "កាលវិភាគ" : "Schedule",
      isKm ? "វគ្គគ្រោងទុក" : "Planned Sessions",
      isKm ? "វគ្គគិតវត្តមាន" : "Counted Sessions",
      isKm ? "វត្តមាន" : "Present",
      isKm ? "អវត្តមាន" : "Absent",
      isKm ? "មកយឺត" : "Late",
      isKm ? "អត្រាវត្តមាន" : "Attendance Rate",
      isKm ? "កាលបរិច្ឆេទលើកចុងក្រោយ" : "Last Incident Date",
      isKm ? "ស្ថានភាពលើកចុងក្រោយ" : "Last Incident Status",
    ];

    headers.forEach((h, index) => {
      const colIndex = index + 1;
      const cell = worksheet.getCell(6, colIndex);
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

    // 6. Data Rows (Starting Row 7)
    students.forEach((row, rIndex) => {
      const rowNum = 7 + rIndex;
      const excelRow = worksheet.getRow(rowNum);
      excelRow.height = 20;

      const scheduleLabel =
        row.scheduleTypeText === "weekday"
          ? isKm ? "ចន្ទ - សុក្រ" : "Weekday"
          : isKm ? "សៅរ៍ - អាទិត្យ" : "Weekend";

      const lastStatusLabel =
        row.lastIncidentStatus === "absent"
          ? isKm ? "អវត្តមាន" : "Absent"
          : row.lastIncidentStatus === "late"
          ? isKm ? "មកយឺត" : "Late"
          : "—";

      const rateDisplay = row.attendanceRate !== null ? `${row.attendanceRate}%` : "—";

      const rowData = [
        row.rank,
        row.student.nameKh + (row.student.nameEn ? ` (${row.student.nameEn})` : ""),
        row.student.studentCode,
        row.currentClass.name,
        row.currentClass.code,
        row.assignedTeacher?.name || "—",
        scheduleLabel,
        row.plannedSessions,
        row.elapsedSessions,
        row.presentCount,
        row.absentCount,
        row.lateCount,
        rateDisplay,
        row.lastIncidentDate || "—",
        lastStatusLabel,
      ];

      rowData.forEach((val, cIndex) => {
        const colIndex = cIndex + 1;
        const cell = worksheet.getCell(rowNum, colIndex);
        cell.value = val;
        cell.font = { name: "Arial", size: 9 };
        cell.alignment = { horizontal: "center", vertical: "middle" };

        // Left align names
        if (colIndex === 2 || colIndex === 4 || colIndex === 6) {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        }

        // Semantic highlighting for absent & late
        if (colIndex === 11 && row.absentCount > 0) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEBEE" } };
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFC62828" } };
        } else if (colIndex === 12 && row.lateCount > 0) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF8E1" } };
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFEF6C00" } };
        } else if (colIndex === 13) {
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLOR_NAVY } };
        }

        cell.border = {
          top: { style: "thin", color: { argb: COLOR_BORDER } },
          left: { style: "thin", color: { argb: COLOR_BORDER } },
          bottom: { style: "thin", color: { argb: COLOR_BORDER } },
          right: { style: "thin", color: { argb: COLOR_BORDER } },
        };
      });
    });

    // 7. Totals Row
    const totalsRowNum = 7 + students.length;
    const totalsRow = worksheet.getRow(totalsRowNum);
    totalsRow.height = 22;

    worksheet.mergeCells(totalsRowNum, 1, totalsRowNum, 7);
    const totalCell = worksheet.getCell(totalsRowNum, 1);
    totalCell.value = isKm ? "សរុបរួម (Overall Totals)" : "Overall Totals";
    totalCell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLOR_NAVY_DARK } };
    totalCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8ECF4" } };
    totalCell.alignment = { horizontal: "center", vertical: "middle" };

    const sumPlanned = students.reduce((sum, r) => sum + r.plannedSessions, 0);
    const sumElapsed = students.reduce((sum, r) => sum + r.elapsedSessions, 0);
    const sumPresent = students.reduce((sum, r) => sum + r.presentCount, 0);

    const sumVals: Record<number, any> = {
      8: sumPlanned,
      9: sumElapsed,
      10: sumPresent,
      11: summary.totalAbsences,
      12: summary.totalLates,
      13: "",
      14: "",
      15: "",
    };

    for (let c = 8; c <= totalCols; c++) {
      const cell = worksheet.getCell(totalsRowNum, c);
      cell.value = sumVals[c] !== undefined ? sumVals[c] : "";
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLOR_NAVY_DARK } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDE4F0" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "medium", color: { argb: COLOR_NAVY } },
        left: { style: "thin", color: { argb: COLOR_BORDER } },
        bottom: { style: "medium", color: { argb: COLOR_NAVY } },
        right: { style: "thin", color: { argb: COLOR_BORDER } },
      };
    }

    // 8. Signatures Block
    const sigStartRow = totalsRowNum + 3;

    worksheet.getCell(sigStartRow, 2).value = isKm ? "រៀបចំដោយ (Prepared By)" : "Prepared By:";
    worksheet.getCell(sigStartRow, 2).font = { bold: true, size: 9 };
    worksheet.getCell(sigStartRow + 3, 2).value = "............................................";

    const midCol = Math.floor(totalCols / 2);
    worksheet.getCell(sigStartRow, midCol).value = isKm ? "ហត្ថលេខាគ្រូបង្រៀន (Teacher Signature)" : "Teacher Signature:";
    worksheet.getCell(sigStartRow, midCol).font = { bold: true, size: 9 };
    worksheet.getCell(sigStartRow + 3, midCol).value = "............................................";

    const rightCol = totalCols - 2;
    worksheet.getCell(sigStartRow, rightCol).value = isKm ? "ប្រធានមជ្ឈមណ្ឌល / រដ្ឋបាល (Director / Admin)" : "Director / Admin Signature:";
    worksheet.getCell(sigStartRow, rightCol).font = { bold: true, size: 9 };
    worksheet.getCell(sigStartRow + 3, rightCol).value = "............................................";

    // Set Column Widths
    worksheet.getColumn(1).width = 7; // Rank
    worksheet.getColumn(2).width = 24; // Name
    worksheet.getColumn(3).width = 14; // Code
    worksheet.getColumn(4).width = 22; // Class
    worksheet.getColumn(5).width = 15; // Class Code
    worksheet.getColumn(6).width = 18; // Teacher
    worksheet.getColumn(7).width = 14; // Schedule
    worksheet.getColumn(8).width = 15; // Planned
    worksheet.getColumn(9).width = 15; // Elapsed
    worksheet.getColumn(10).width = 10; // Present
    worksheet.getColumn(11).width = 10; // Absent
    worksheet.getColumn(12).width = 10; // Late
    worksheet.getColumn(13).width = 14; // Rate
    worksheet.getColumn(14).width = 16; // Last Date
    worksheet.getColumn(15).width = 16; // Last Status

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `Absence_Late_Report_${selectedMonth}.xlsx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  },
};
