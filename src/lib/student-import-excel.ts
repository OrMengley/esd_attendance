import ExcelJS from "exceljs";
import type { Student, StudentStatus } from "../models/student.model";

export interface ParsedStudentRow {
  rowNumber: number;
  raw: Record<string, any>;
  data: Partial<Omit<Student, "id" | "createdAt" | "updatedAt">>;
  isValid: boolean;
  errors: RowValidationError[];
}

export interface RowValidationError {
  field: string;
  fieldLabelKh: string;
  fieldLabelEn: string;
  messageKey: string;
  message: string;
}

export interface ImportValidationResult {
  totalRows: number;
  validRows: ParsedStudentRow[];
  invalidRows: ParsedStudentRow[];
  allRows: ParsedStudentRow[];
  hasErrors: boolean;
}

// Brand color palette matching design system
const COLOR_NAVY = "FF1E347B";
const COLOR_GOLD = "FFF3B51B";
const COLOR_NAVY_DARK = "FF16213D";
const COLOR_WHITE = "FFFFFFFF";
const COLOR_BORDER = "FFE0E0E0";
const COLOR_BORDER_DARK = "FFB0BEC5";
const COLOR_ERROR_BG = "FFFFEBEE";
const COLOR_ERROR_TEXT = "FFC62828";
const COLOR_VALID_BG = "FFE8F5E9";

/**
 * Standard column definitions for the Excel template & parser
 */
export const IMPORT_COLUMNS = [
  { key: "studentCode", kh: "អត្តលេខសិស្ស", en: "Student Code", required: true, example: "STU-001" },
  { key: "nameKh", kh: "គោត្តនាម និងនាម", en: "Khmer Full Name", required: true, example: "សុខ សាន" },
  { key: "nameEn", kh: "ឈ្មោះជាឡាតាំង", en: "English Full Name", required: false, example: "Sok San" },
  { key: "gender", kh: "ភេទ", en: "Gender", required: true, example: "ប្រុស" },
  { key: "dateOfBirth", kh: "ថ្ងៃខែឆ្នាំកំណើត", en: "Date of Birth (YYYY-MM-DD)", required: false, example: "2008-04-12" },
  { key: "phone", kh: "លេខទូរស័ព្ទសិស្ស", en: "Student Phone", required: false, example: "012345678" },
  { key: "birthCertificateStatus", kh: "សំបុត្រកំណើត", en: "Birth Certificate (has_certificate/no_certificate)", required: false, example: "មាន" },
  { key: "village", kh: "ភូមិ", en: "Village", required: false, example: "ស្វាយប៉ោ" },
  { key: "commune", kh: "ឃុំ/សង្កាត់", en: "Commune", required: false, example: "ស្វាយប៉ោ" },
  { key: "district", kh: "ក្រុង/ស្រុក/ខណ្ឌ", en: "District", required: false, example: "ក្រុងបាត់ដំបង" },
  { key: "province", kh: "រាជធានី/ខេត្ត", en: "Province", required: false, example: "បាត់ដំបង" },
  { key: "fatherName", kh: "ឈ្មោះឪពុក", en: "Father Name", required: false, example: "សុខ ផល" },
  { key: "fatherOccupation", kh: "មុខរបរឪពុក", en: "Father Occupation", required: false, example: "អាជីវករ" },
  { key: "fatherPhone", kh: "ទូរស័ព្ទឪពុក", en: "Father Phone", required: false, example: "012998877" },
  { key: "motherName", kh: "ឈ្មោះម្តាយ", en: "Mother Name", required: false, example: "កែវ ណារ៉ា" },
  { key: "motherOccupation", kh: "មុខរបរម្តាយ", en: "Mother Occupation", required: false, example: "មេផ្ទះ" },
  { key: "motherPhone", kh: "ទូរស័ព្ទម្តាយ", en: "Mother Phone", required: false, example: "096778899" },
  { key: "status", kh: "ស្ថានភាពសិស្ស", en: "Status (active/inactive/archived)", required: false, example: "active" },
  { key: "note", kh: "កំណត់សម្គាល់", en: "Note", required: false, example: "" },
] as const;

/**
 * Normalizes gender value to 'male' or 'female'
 */
export function normalizeGender(val: any): "male" | "female" | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim().toLowerCase();
  if (["male", "m", "ប្រុស", "1"].includes(str)) return "male";
  if (["female", "f", "ស្រី", "2"].includes(str)) return "female";
  return null;
}

/**
 * Normalizes birth certificate status
 */
export function normalizeBirthCertificateStatus(val: any): "has_certificate" | "no_certificate" {
  if (!val) return "has_certificate";
  const str = String(val).trim().toLowerCase();
  if (["has_certificate", "មាន", "yes", "true", "1"].includes(str)) return "has_certificate";
  if (["no_certificate", "គ្មាន", "no", "false", "0"].includes(str)) return "no_certificate";
  return "has_certificate";
}

/**
 * Normalizes student status
 */
export function normalizeStudentStatus(val: any): StudentStatus {
  if (!val) return "active";
  const str = String(val).trim().toLowerCase();
  if (["inactive", "អសកម្ម"].includes(str)) return "inactive";
  if (["archived", "បណ្ណសារ"].includes(str)) return "archived";
  return "active";
}

/**
 * Normalizes date to YYYY-MM-DD
 */
export function normalizeDate(val: any): string | null {
  if (val === null || val === undefined || val === "") return null;

  // If it's a JavaScript Date object from ExcelJS
  if (val instanceof Date && !isNaN(val.getTime())) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, "0");
    const day = String(val.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const str = String(val).trim();
  if (!str) return null;

  // Match YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  // Handle Excel Serial Number (e.g. 39550)
  const num = Number(str);
  if (!isNaN(num) && num > 1000 && num < 100000) {
    // Excel base date: Dec 30 1899
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + num * 86400000);
    if (!isNaN(jsDate.getTime())) {
      const year = jsDate.getUTCFullYear();
      const month = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
      const day = String(jsDate.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

/**
 * Normalizes phone numbers (preserving leading 0)
 */
export function normalizePhone(val: any): string {
  if (val === null || val === undefined) return "";
  let str = String(val).trim().replace(/[\s-]/g, "");
  // If user entered e.g. 12345678 as a number in Excel, add leading 0
  if (/^\d{8,9}$/.test(str) && !str.startsWith("0")) {
    str = "0" + str;
  }
  return str;
}

/**
 * Generates and triggers browser download of the official bilingual Excel template
 */
export async function downloadStudentImportTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Wat Soriyaram Computer Training School";
  workbook.created = new Date();

  // 1. Data Worksheet
  const sheet = workbook.addWorksheet("Students", {
    views: [{ state: "frozen", ySplit: 2 }],
  });

  // Top header: Khmer & English dual header
  const headerKh = IMPORT_COLUMNS.map((c) => (c.required ? `* ${c.kh}` : c.kh));
  const headerEn = IMPORT_COLUMNS.map((c) => (c.required ? `* ${c.en}` : c.en));
  const exampleRow = IMPORT_COLUMNS.map((c) => c.example);

  sheet.addRow(headerKh);
  sheet.addRow(headerEn);
  sheet.addRow(exampleRow);

  // Style Row 1 (Khmer Header)
  const row1 = sheet.getRow(1);
  row1.height = 26;
  row1.eachCell((cell, colNum) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_NAVY } };
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_WHITE } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: COLOR_BORDER_DARK } },
      bottom: { style: "thin", color: { argb: COLOR_BORDER_DARK } },
    };
  });

  // Style Row 2 (English Header)
  const row2 = sheet.getRow(2);
  row2.height = 22;
  row2.eachCell((cell, colNum) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_NAVY_DARK } };
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLOR_GOLD } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      bottom: { style: "medium", color: { argb: COLOR_NAVY } },
    };
  });

  // Style Row 3 (Sample data row)
  const row3 = sheet.getRow(3);
  row3.height = 20;
  row3.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF666666" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9F9F9" } };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    cell.border = {
      bottom: { style: "thin", color: { argb: COLOR_BORDER } },
    };
  });

  // Column widths
  IMPORT_COLUMNS.forEach((col, idx) => {
    const colNumber = idx + 1;
    let width = 16;
    if (["studentCode", "gender"].includes(col.key)) width = 14;
    if (["nameKh", "nameEn"].includes(col.key)) width = 22;
    if (["dateOfBirth", "phone", "fatherPhone", "motherPhone"].includes(col.key)) width = 16;
    if (["village", "commune", "district", "province"].includes(col.key)) width = 18;
    if (col.key === "note") width = 28;
    sheet.getColumn(colNumber).width = width;
  });

  // 2. Instructions Worksheet
  const guideSheet = workbook.addWorksheet("Instructions");
  guideSheet.views = [{ state: "frozen", ySplit: 1 }];

  guideSheet.addRow(["Field (វាលទិន្នន័យ)", "Required (ទាមទារ)", "Allowed Values & Format (ទម្រង់និងតម្លៃដែលអនុញ្ញាត)"]);
  guideSheet.getRow(1).height = 24;
  guideSheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_NAVY } };
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_WHITE } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  const instructions = [
    ["Student Code / អត្តលេខ", "Yes (បាទ/ចាស)", "Unique identifier (e.g. STU-001). Must not duplicate existing records."],
    ["Khmer Full Name / គោត្តនាម-នាម", "Yes (បាទ/ចាស)", "Khmer name of student."],
    ["English Full Name / ឈ្មោះឡាតាំង", "Optional (ស្រេចចិត្ត)", "English/Latin name."],
    ["Gender / ភេទ", "Yes (បាទ/ចាស)", "Allowed: ប្រុស, ស្រី, Male, Female, M, F"],
    ["Date of Birth / ថ្ងៃខែឆ្នាំកំណើត", "Optional (ស្រេចចិត្ត)", "Format: YYYY-MM-DD (e.g. 2008-04-12) or standard Excel date."],
    ["Student Phone / លេខទូរស័ព្ទសិស្ស", "Optional (ស្រេចចិត្ត)", "e.g. 012345678"],
    ["Birth Certificate / សំបុត្រកំណើត", "Optional (ស្រេចចិត្ត)", "Allowed: មាន, គ្មាន, has_certificate, no_certificate (Default: មាន)"],
    ["Address / អាសយដ្ឋាន", "Optional (ស្រេចចិត្ត)", "Village, Commune, District, Province (Default province: បាត់ដំបង)"],
    ["Parents Info / ព័ត៌មានឪពុកម្តាយ", "Optional (ស្រេចចិត្ត)", "Father/Mother names, occupations, and contact numbers."],
    ["Status / ស្ថានភាព", "Optional (ស្រេចចិត្ត)", "Allowed: active, inactive, archived, សកម្ម, អសកម្ម (Default: active)"],
  ];

  instructions.forEach(([field, req, desc]) => {
    const row = guideSheet.addRow([field, req, desc]);
    row.height = 20;
    row.getCell(1).font = { bold: true, size: 9 };
    row.getCell(2).font = { size: 9, color: { argb: req.startsWith("Yes") ? "FFC62828" : "FF666666" } };
    row.getCell(3).font = { size: 9 };
    row.eachCell((c) => {
      c.border = { bottom: { style: "thin", color: { argb: COLOR_BORDER } } };
    });
  });

  guideSheet.getColumn(1).width = 30;
  guideSheet.getColumn(2).width = 20;
  guideSheet.getColumn(3).width = 65;

  // Export buffer & download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Student_Import_Template.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Parses an Excel file array buffer and validates all rows against domain rules
 * and existing database student codes.
 */
export async function parseAndValidateStudentExcel(
  buffer: ArrayBuffer,
  existingStudentCodes: string[]
): Promise<ImportValidationResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // Take the first worksheet
  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount < 2) {
    return {
      totalRows: 0,
      validRows: [],
      invalidRows: [],
      allRows: [],
      hasErrors: true,
    };
  }

  // Existing student codes set (case-insensitive)
  const existingCodesSet = new Set(
    existingStudentCodes.map((c) => c.trim().toLowerCase())
  );

  // Detect header row: find row containing studentCode or អត្តលេខ
  let headerRowIndex = 1;
  let headerKeys: Record<number, string> = {};

  for (let r = 1; r <= Math.min(5, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r);
    let foundCodeCol = false;

    row.eachCell((cell, colNumber) => {
      const val = String(cell.value || "").trim().toLowerCase();
      if (
        val.includes("student code") ||
        val.includes("studentcode") ||
        val.includes("អត្តលេខ")
      ) {
        foundCodeCol = true;
      }
    });

    if (foundCodeCol) {
      headerRowIndex = r;
      // Map columns using flexible matching
      row.eachCell((cell, colNumber) => {
        const text = String(cell.value || "").trim().toLowerCase();
        const cleanText = text.replace(/[^a-z0-9\u1780-\u17FF]/g, "");

        for (const col of IMPORT_COLUMNS) {
          const cleanKey = col.key.toLowerCase().replace(/[^a-z0-9]/g, "");
          const cleanEn = col.en.toLowerCase().replace(/[^a-z0-9]/g, "");
          const cleanKh = col.kh.toLowerCase().replace(/[^a-z0-9\u1780-\u17FF]/g, "");

          if (
            cleanText === cleanKey ||
            cleanText.includes(cleanKey) ||
            cleanText.includes(cleanKh) ||
            cleanKh.includes(cleanText) ||
            cleanText.includes(cleanEn) ||
            cleanEn.includes(cleanText)
          ) {
            headerKeys[colNumber] = col.key;
            break;
          }
        }
      });
      break;
    }
  }

  // Fallback: If header mapping failed, assume column order from IMPORT_COLUMNS
  if (Object.keys(headerKeys).length === 0) {
    headerRowIndex = 2; // Default template has 2 header rows
    IMPORT_COLUMNS.forEach((col, idx) => {
      headerKeys[idx + 1] = col.key;
    });
  }

  // If the next row is English header (like in template), skip it
  let dataStartRow = headerRowIndex + 1;
  const nextRow = worksheet.getRow(dataStartRow);
  const nextRowFirstCell = String(nextRow.getCell(1).value || "").trim().toLowerCase();
  if (
    nextRowFirstCell.includes("student code") ||
    nextRowFirstCell.includes("studentcode")
  ) {
    dataStartRow++;
  }

  const parsedRows: ParsedStudentRow[] = [];
  const fileCodesCount: Record<string, number> = {};

  // First pass: collect raw values and detect duplicate student codes within file
  for (let r = dataStartRow; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const raw: Record<string, any> = {};
    let hasAnyData = false;

    Object.entries(headerKeys).forEach(([colNumStr, key]) => {
      const colNum = parseInt(colNumStr, 10);
      const cell = row.getCell(colNum);
      let val = cell.value;
      if (val !== null && val !== undefined && String(val).trim() !== "") {
        hasAnyData = true;
      }
      raw[key] = val;
    });

    // Skip entirely blank rows
    if (!hasAnyData) continue;

    // Track student code occurrences
    const code = raw.studentCode ? String(raw.studentCode).trim().toLowerCase() : "";
    if (code) {
      fileCodesCount[code] = (fileCodesCount[code] || 0) + 1;
    }

    parsedRows.push({
      rowNumber: r,
      raw,
      data: {},
      isValid: true,
      errors: [],
    });
  }

  // Second pass: validate each row
  parsedRows.forEach((rowItem) => {
    const raw = rowItem.raw;
    const errors: RowValidationError[] = [];

    // 1. Student Code (Required, Unique in file, Unique in DB)
    const codeStr = raw.studentCode ? String(raw.studentCode).trim() : "";
    if (!codeStr) {
      errors.push({
        field: "studentCode",
        fieldLabelKh: "អត្តលេខសិស្ស",
        fieldLabelEn: "Student Code",
        messageKey: "errors.studentCodeRequired",
        message: "Student Code is required",
      });
    } else {
      const lowerCode = codeStr.toLowerCase();
      // Check duplicate in file
      if (fileCodesCount[lowerCode] > 1) {
        errors.push({
          field: "studentCode",
          fieldLabelKh: "អត្តលេខសិស្ស",
          fieldLabelEn: "Student Code",
          messageKey: "errors.duplicateInFile",
          message: `Student Code "${codeStr}" appears multiple times in this file`,
        });
      }
      // Check duplicate in DB
      if (existingCodesSet.has(lowerCode)) {
        errors.push({
          field: "studentCode",
          fieldLabelKh: "អត្តលេខសិស្ស",
          fieldLabelEn: "Student Code",
          messageKey: "errors.codeAlreadyExists",
          message: `Student Code "${codeStr}" already exists in the system`,
        });
      }
    }

    // 2. Khmer Name (Required)
    const nameKhStr = raw.nameKh ? String(raw.nameKh).trim() : "";
    if (!nameKhStr) {
      errors.push({
        field: "nameKh",
        fieldLabelKh: "គោត្តនាម និងនាម",
        fieldLabelEn: "Khmer Name",
        messageKey: "errors.nameKhRequired",
        message: "Khmer Name is required",
      });
    }

    // 3. Gender (Required, Male / Female)
    const gender = normalizeGender(raw.gender);
    if (!gender) {
      errors.push({
        field: "gender",
        fieldLabelKh: "ភេទ",
        fieldLabelEn: "Gender",
        messageKey: "errors.invalidGender",
        message: "Gender must be Male (ប្រុស) or Female (ស្រី)",
      });
    }

    // 4. Date of Birth (Optional, valid date)
    let dateOfBirth: string = "";
    if (raw.dateOfBirth !== undefined && raw.dateOfBirth !== null && String(raw.dateOfBirth).trim() !== "") {
      const normalizedDob = normalizeDate(raw.dateOfBirth);
      if (!normalizedDob) {
        errors.push({
          field: "dateOfBirth",
          fieldLabelKh: "ថ្ងៃខែឆ្នាំកំណើត",
          fieldLabelEn: "Date of Birth",
          messageKey: "errors.invalidDob",
          message: "Date of Birth must be in YYYY-MM-DD format",
        });
      } else {
        dateOfBirth = normalizedDob;
      }
    }

    // Cleaned fields
    const nameEn = raw.nameEn ? String(raw.nameEn).trim() : "";
    const phone = normalizePhone(raw.phone);
    const birthCertificateStatus = normalizeBirthCertificateStatus(raw.birthCertificateStatus);
    const status = normalizeStudentStatus(raw.status);

    const address = {
      village: raw.village ? String(raw.village).trim() : "",
      commune: raw.commune ? String(raw.commune).trim() : "",
      district: raw.district ? String(raw.district).trim() : "",
      province: raw.province ? String(raw.province).trim() : "បាត់ដំបង",
    };

    const fatherName = raw.fatherName ? String(raw.fatherName).trim() : "";
    const fatherOccupation = raw.fatherOccupation ? String(raw.fatherOccupation).trim() : "";
    const fatherPhone = normalizePhone(raw.fatherPhone);

    const motherName = raw.motherName ? String(raw.motherName).trim() : "";
    const motherOccupation = raw.motherOccupation ? String(raw.motherOccupation).trim() : "";
    const motherPhone = normalizePhone(raw.motherPhone);

    const note = raw.note ? String(raw.note).trim() : "";

    rowItem.errors = errors;
    rowItem.isValid = errors.length === 0;
    rowItem.data = {
      studentCode: codeStr,
      nameKh: nameKhStr,
      nameEn,
      gender: gender || "male",
      dateOfBirth,
      birthCertificateStatus,
      phone,
      avatarUrl: "",
      address,
      fatherName,
      fatherOccupation,
      fatherPhone,
      motherName,
      motherOccupation,
      motherPhone,
      note,
      status,
    };
  });

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  return {
    totalRows: parsedRows.length,
    validRows,
    invalidRows,
    allRows: parsedRows,
    hasErrors: invalidRows.length > 0,
  };
}

/**
 * Generates an Excel error report with failed rows highlighted and error descriptions
 */
export async function downloadErrorReport(
  invalidRows: ParsedStudentRow[],
  filenamePrefix = "Student_Import_Errors"
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Import Errors");

  // Headers: Row Number, Error Details, then standard columns
  const headerCols = [
    "Row (ជួរដេក)",
    "Errors (បញ្ហាកំហុស)",
    ...IMPORT_COLUMNS.map((c) => `${c.kh} (${c.en})`),
  ];

  sheet.addRow(headerCols);

  const headerRow = sheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell, idx) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: idx <= 2 ? COLOR_ERROR_TEXT : COLOR_NAVY },
    };
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: COLOR_WHITE } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  invalidRows.forEach((rowItem) => {
    const errorMessages = rowItem.errors.map((e) => `[${e.fieldLabelEn}]: ${e.message}`).join("; ");
    const rowValues = [
      rowItem.rowNumber,
      errorMessages,
      ...IMPORT_COLUMNS.map((c) => rowItem.raw[c.key] ?? ""),
    ];

    const r = sheet.addRow(rowValues);
    r.height = 22;

    r.eachCell((cell, colIndex) => {
      cell.font = { name: "Arial", size: 9 };
      cell.border = { bottom: { style: "thin", color: { argb: COLOR_BORDER } } };

      if (colIndex === 2) {
        cell.font = { name: "Arial", size: 9, bold: true, color: { argb: COLOR_ERROR_TEXT } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ERROR_BG } };
      }
    });
  });

  sheet.getColumn(1).width = 12;
  sheet.getColumn(2).width = 45;
  IMPORT_COLUMNS.forEach((col, idx) => {
    sheet.getColumn(idx + 3).width = 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
