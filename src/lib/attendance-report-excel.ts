import ExcelJS from "exceljs";
import { MonthlyAttendanceReportData } from "@/models/attendance-report.model";

export async function exportAttendanceReportToExcel(
  reportData: MonthlyAttendanceReportData,
  language: "km" | "en" = "km"
): Promise<void> {
  const {
    classroom,
    studyPackage,
    teacher,
    selectedMonth,
    monthNameEn,
    monthNameKm,
    dateColumns,
    studentRows,
    summaryMetrics,
    generatedAt,
    generatedBy,
  } = reportData;

  const isKm = language === "km";
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Wat Soriyaram Computer Training School";
  workbook.created = new Date();

  const sheetName = isKm ? "វត្តមានប្រចាំខែ" : "Monthly Attendance";
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", xSplit: 5, ySplit: 6 }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9, // A4
    },
  });

  // Calculate total columns
  const baseColCount = 5; // No, Code, NameKh, NameEn, Gender
  const dateColCount = dateColumns.length;
  const summaryColCount = 6; // P, A, L, E, Total, Rate
  const totalCols = baseColCount + dateColCount + summaryColCount;

  // Colors
  const COLOR_NAVY = "FF1E347B";
  const COLOR_GOLD = "FFF3B51B";
  const COLOR_GOLD_LIGHT = "FFFFF9C4";
  const COLOR_NAVY_DARK = "FF16213D";
  const COLOR_WHITE = "FFFFFFFF";
  const COLOR_BORDER = "FFE0E0E0";
  const COLOR_BORDER_DARK = "FFB0BEC5";

  // 1. School Header Row (Merged)
  worksheet.mergeCells(1, 1, 1, totalCols);
  const row1 = worksheet.getRow(1);
  row1.height = 30;
  const cell1 = worksheet.getCell(1, 1);
  cell1.value = isKm
    ? "មជ្ឈមណ្ឌលបណ្តុះបណ្តាលកុំព្យូទ័រ វត្តសុរិយារាម (Wat Soriyaram Computer Training School)"
    : "WAT SORIYARAM COMPUTER TRAINING SCHOOL";
  cell1.font = { name: "Arial", size: 14, bold: true, color: { argb: COLOR_WHITE } };
  cell1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_NAVY } };
  cell1.alignment = { horizontal: "center", vertical: "middle" };

  // 2. Report Title Row (Merged)
  worksheet.mergeCells(2, 1, 2, totalCols);
  const row2 = worksheet.getRow(2);
  row2.height = 24;
  const cell2 = worksheet.getCell(2, 1);
  cell2.value = isKm
    ? `របាយការណ៍វត្តមានប្រចាំខែ • ${monthNameKm} (${classroom.name})`
    : `MONTHLY ATTENDANCE REPORT • ${monthNameEn} (${classroom.name})`;
  cell2.font = { name: "Arial", size: 11, bold: true, color: { argb: COLOR_NAVY_DARK } };
  cell2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_GOLD } };
  cell2.alignment = { horizontal: "center", vertical: "middle" };

  // 3. Metadata Info Row 1 (Row 3)
  const isWeekday = classroom.scheduleDays.length === 5;
  const scheduleText = isKm
    ? isWeekday
      ? "ចន្ទ ដល់ សុក្រ (Mon-Fri)"
      : "សៅរ៍ និង អាទិត្យ (Sat-Sun)"
    : isWeekday
    ? "Monday - Friday"
    : "Saturday - Sunday";

  worksheet.mergeCells(3, 1, 3, 3);
  worksheet.getCell(3, 1).value = `${isKm ? "ថ្នាក់រៀន (Class)" : "Class"}: ${classroom.name} (${classroom.code})`;
  worksheet.getCell(3, 1).font = { bold: true, size: 9 };

  worksheet.mergeCells(3, 4, 3, 8);
  worksheet.getCell(3, 4).value = `${isKm ? "កញ្ចប់សិក្សា (Package)" : "Package"}: ${studyPackage?.nameKh || studyPackage?.nameEn || "-"}`;
  worksheet.getCell(3, 4).font = { bold: true, size: 9 };

  worksheet.mergeCells(3, 9, 3, totalCols);
  worksheet.getCell(3, 9).value = `${isKm ? "ខែ/ឆ្នាំ (Month)" : "Month"}: ${isKm ? monthNameKm : monthNameEn}`;
  worksheet.getCell(3, 9).font = { bold: true, size: 9 };
  worksheet.getCell(3, 9).alignment = { horizontal: "right" };

  // 4. Metadata Info Row 2 (Row 4)
  worksheet.mergeCells(4, 1, 4, 3);
  worksheet.getCell(4, 1).value = `${isKm ? "គ្រូបង្រៀន (Teacher)" : "Teacher"}: ${teacher?.name || "-"}`;
  worksheet.getCell(4, 1).font = { size: 9 };

  worksheet.mergeCells(4, 4, 4, 8);
  worksheet.getCell(4, 4).value = `${isKm ? "កាលវិភាគ (Schedule)" : "Schedule"}: ${scheduleText} • ${classroom.startTime} - ${classroom.endTime}`;
  worksheet.getCell(4, 4).font = { size: 9 };

  worksheet.mergeCells(4, 9, 4, totalCols);
  worksheet.getCell(4, 9).value = `${isKm ? "កាលបរិច្ឆេទបង្កើត" : "Generated"}: ${generatedAt}${generatedBy ? ` (${generatedBy})` : ""}`;
  worksheet.getCell(4, 9).font = { size: 8, color: { argb: "FF666666" } };
  worksheet.getCell(4, 9).alignment = { horizontal: "right" };

  // Row 5 is blank spacing
  worksheet.getRow(5).height = 8;

  // 5. Table Header (Row 6)
  const headerRow = worksheet.getRow(6);
  headerRow.height = 26;

  const headers: string[] = [
    isKm ? "ល.រ" : "No.",
    isKm ? "អត្តលេខ" : "Code",
    isKm ? "គោត្តនាម-នាម" : "Student Name (Kh)",
    isKm ? "ឈ្មោះជាឡាតាំង" : "Student Name (En)",
    isKm ? "ភេទ" : "Gender",
  ];

  // Dynamic Date Columns
  dateColumns.forEach((col) => {
    headers.push(isKm ? col.shortHeaderKm : col.shortHeaderEn);
  });

  // Summary Columns
  headers.push(
    isKm ? "វត្តមាន (P)" : "Present (P)",
    isKm ? "អវត្តមាន (A)" : "Absent (A)",
    isKm ? "យឺត (L)" : "Late (L)",
    isKm ? "ច្បាប់ (E)" : "Permission (E)",
    isKm ? "សរុប" : "Total",
    isKm ? "ភាគរយ (%)" : "Rate (%)"
  );

  headers.forEach((h, index) => {
    const colIndex = index + 1;
    const cell = worksheet.getCell(6, colIndex);
    cell.value = h;
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLOR_WHITE } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

    // Header styling
    if (colIndex > baseColCount && colIndex <= baseColCount + dateColCount) {
      const dateCol = dateColumns[colIndex - baseColCount - 1];
      if (dateCol.isHoliday) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF795548" } }; // Brown/Gold for holiday header
      } else {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF263E89" } };
      }
    } else if (colIndex > baseColCount + dateColCount) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D47A1" } }; // Darker blue for summary
    } else {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_NAVY } };
    }

    cell.border = {
      top: { style: "thin", color: { argb: COLOR_BORDER_DARK } },
      left: { style: "thin", color: { argb: COLOR_BORDER_DARK } },
      bottom: { style: "medium", color: { argb: COLOR_NAVY_DARK } },
      right: { style: "thin", color: { argb: COLOR_BORDER_DARK } },
    };
  });

  // 6. Student Data Rows (Starting Row 7)
  studentRows.forEach((row, rIndex) => {
    const rowNum = 7 + rIndex;
    const excelRow = worksheet.getRow(rowNum);
    excelRow.height = 20;

    const rowData: any[] = [
      rIndex + 1,
      row.student.studentCode,
      row.student.nameKh,
      row.student.nameEn || "",
      row.student.gender === "female" ? (isKm ? "ស្រី" : "F") : isKm ? "ប្រុស" : "M",
    ];

    // Status cells
    dateColumns.forEach((col) => {
      const cellData = row.cells[col.dateStr];
      rowData.push(cellData?.code || "•");
    });

    // Summary counts
    rowData.push(
      row.presentCount,
      row.absentCount,
      row.lateCount,
      row.permissionCount,
      row.recordedSessionCount,
      `${row.attendanceRate}%`
    );

    rowData.forEach((val, cIndex) => {
      const colIndex = cIndex + 1;
      const cell = worksheet.getCell(rowNum, colIndex);
      cell.value = val;
      cell.font = { name: "Arial", size: 8.5 };
      cell.alignment = { horizontal: "center", vertical: "middle" };

      // Left-align names
      if (colIndex === 3 || colIndex === 4) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }

      // Semantic Color Formatting for Date Cells
      if (colIndex > baseColCount && colIndex <= baseColCount + dateColCount) {
        const dateCol = dateColumns[colIndex - baseColCount - 1];
        const cellData = row.cells[dateCol.dateStr];

        if (cellData?.code === "P") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F5E9" } }; // Light green
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF2E7D32" } }; // Green text
        } else if (cellData?.code === "A") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEBEE" } }; // Light red
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFC62828" } }; // Red text
        } else if (cellData?.code === "L") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF8E1" } }; // Light amber
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFEF6C00" } }; // Amber text
        } else if (cellData?.code === "E") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE3F2FD" } }; // Light blue
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF1565C0" } }; // Blue text
        } else if (cellData?.code === "H") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_GOLD_LIGHT } }; // Light gold
          cell.font = { name: "Arial", size: 8.5, bold: true, color: { argb: "FFF57F17" } };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
          cell.font = { name: "Arial", size: 8.5, color: { argb: "FF9E9E9E" } };
        }
      }

      // Summary columns styling
      if (colIndex > baseColCount + dateColCount) {
        cell.font = { name: "Arial", size: 8.5, bold: true };
        if (colIndex === totalCols) {
          // Attendance Rate
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F4FF" } };
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF1E347B" } };
        }
      }

      cell.border = {
        top: { style: "thin", color: { argb: COLOR_BORDER } },
        left: { style: "thin", color: { argb: COLOR_BORDER } },
        bottom: { style: "thin", color: { argb: COLOR_BORDER } },
        right: { style: "thin", color: { argb: COLOR_BORDER } },
      };
    });
  });

  // 7. Totals Summary Row
  const totalsRowNum = 7 + studentRows.length;
  const totalsRow = worksheet.getRow(totalsRowNum);
  totalsRow.height = 22;

  worksheet.mergeCells(totalsRowNum, 1, totalsRowNum, 5);
  const totalLabelCell = worksheet.getCell(totalsRowNum, 1);
  totalLabelCell.value = isKm ? "សរុបវត្តមានទូទៅ (Total Overall)" : "Overall Totals";
  totalLabelCell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLOR_NAVY_DARK } };
  totalLabelCell.alignment = { horizontal: "center", vertical: "middle" };
  totalLabelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8ECF4" } };

  // Date column totals (Present count on each date)
  dateColumns.forEach((col, cIdx) => {
    const colIndex = baseColCount + cIdx + 1;
    const cell = worksheet.getCell(totalsRowNum, colIndex);
    if (col.isHoliday) {
      cell.value = "H";
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_GOLD_LIGHT } };
    } else {
      const presentOnDate = studentRows.filter((r) => r.cells[col.dateStr]?.code === "P").length;
      cell.value = presentOnDate > 0 ? presentOnDate : "-";
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8ECF4" } };
    }
    cell.font = { name: "Arial", size: 8.5, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "medium", color: { argb: COLOR_NAVY } },
      left: { style: "thin", color: { argb: COLOR_BORDER } },
      bottom: { style: "medium", color: { argb: COLOR_NAVY } },
      right: { style: "thin", color: { argb: COLOR_BORDER } },
    };
  });

  // Summary Column Totals
  const sumCols = [
    summaryMetrics.totalPresent,
    summaryMetrics.totalAbsent,
    summaryMetrics.totalLate,
    summaryMetrics.totalPermission,
    summaryMetrics.totalRecordedStudentSessions,
    `${summaryMetrics.overallAttendanceRate}%`,
  ];

  sumCols.forEach((val, sIdx) => {
    const colIndex = baseColCount + dateColCount + sIdx + 1;
    const cell = worksheet.getCell(totalsRowNum, colIndex);
    cell.value = val;
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLOR_NAVY_DARK } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDE4F0" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "medium", color: { argb: COLOR_NAVY } },
      left: { style: "thin", color: { argb: COLOR_BORDER } },
      bottom: { style: "medium", color: { argb: COLOR_NAVY } },
      right: { style: "thin", color: { argb: COLOR_BORDER } },
    };
  });

  // 8. Signatures Block
  const sigStartRow = totalsRowNum + 3;

  // Prepared by
  worksheet.getCell(sigStartRow, 2).value = isKm ? "រៀបចំដោយ (Prepared By)" : "Prepared By:";
  worksheet.getCell(sigStartRow, 2).font = { bold: true, size: 9 };
  worksheet.getCell(sigStartRow + 3, 2).value = "............................................";

  // Teacher signature
  const midCol = Math.floor(totalCols / 2);
  worksheet.getCell(sigStartRow, midCol).value = isKm ? "ហត្ថលេខាគ្រូបង្រៀន (Teacher Signature)" : "Teacher Signature:";
  worksheet.getCell(sigStartRow, midCol).font = { bold: true, size: 9 };
  worksheet.getCell(sigStartRow + 3, midCol).value = "............................................";

  // Director / Admin Signature
  const rightCol = totalCols - 2;
  worksheet.getCell(sigStartRow, rightCol).value = isKm ? "ប្រធានមជ្ឈមណ្ឌល / រដ្ឋបាល (Director / Admin)" : "Director / Admin Signature:";
  worksheet.getCell(sigStartRow, rightCol).font = { bold: true, size: 9 };
  worksheet.getCell(sigStartRow + 3, rightCol).value = "............................................";

  // Set intelligent column widths
  worksheet.getColumn(1).width = 5; // No
  worksheet.getColumn(2).width = 14; // Code
  worksheet.getColumn(3).width = 20; // Name Kh
  worksheet.getColumn(4).width = 18; // Name En
  worksheet.getColumn(5).width = 8; // Gender

  for (let i = 0; i < dateColCount; i++) {
    worksheet.getColumn(baseColCount + i + 1).width = 7.5;
  }

  worksheet.getColumn(baseColCount + dateColCount + 1).width = 11; // Present
  worksheet.getColumn(baseColCount + dateColCount + 2).width = 11; // Absent
  worksheet.getColumn(baseColCount + dateColCount + 3).width = 9; // Late
  worksheet.getColumn(baseColCount + dateColCount + 4).width = 13; // Permission
  worksheet.getColumn(baseColCount + dateColCount + 5).width = 8; // Total
  worksheet.getColumn(baseColCount + dateColCount + 6).width = 12; // Rate

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Attendance_Report_${classroom.code || classroom.id}_${selectedMonth}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
