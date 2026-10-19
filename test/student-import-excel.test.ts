import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {
  normalizeGender,
  normalizeDate,
  normalizePhone,
  normalizeBirthCertificateStatus,
  normalizeStudentStatus,
  parseAndValidateStudentExcel,
} from "../src/lib/student-import-excel.ts";

describe("Student Excel Import Unit Tests", () => {
  it("normalizes gender tokens correctly", () => {
    assert.strictEqual(normalizeGender("Male"), "male");
    assert.strictEqual(normalizeGender("M"), "male");
    assert.strictEqual(normalizeGender("ប្រុស"), "male");
    assert.strictEqual(normalizeGender("Female"), "female");
    assert.strictEqual(normalizeGender("F"), "female");
    assert.strictEqual(normalizeGender("ស្រី"), "female");
    assert.strictEqual(normalizeGender("other"), null);
    assert.strictEqual(normalizeGender(""), null);
    assert.strictEqual(normalizeGender(null), null);
  });

  it("normalizes dates correctly", () => {
    assert.strictEqual(normalizeDate("2008-04-12"), "2008-04-12");
    assert.strictEqual(normalizeDate("12/04/2008"), "2008-04-12");
    assert.strictEqual(normalizeDate("12-04-2008"), "2008-04-12");
    // Date object
    const d = new Date(2008, 3, 12); // April 12
    assert.strictEqual(normalizeDate(d), "2008-04-12");
    // Invalid date
    assert.strictEqual(normalizeDate("invalid-date"), null);
    assert.strictEqual(normalizeDate(""), null);
  });

  it("normalizes phone numbers and enums", () => {
    assert.strictEqual(normalizePhone("012 345 678"), "012345678");
    assert.strictEqual(normalizePhone("12345678"), "012345678");
    assert.strictEqual(normalizeBirthCertificateStatus("មាន"), "has_certificate");
    assert.strictEqual(normalizeBirthCertificateStatus("គ្មាន"), "no_certificate");
    assert.strictEqual(normalizeStudentStatus("active"), "active");
    assert.strictEqual(normalizeStudentStatus("inactive"), "inactive");
  });

  it("parses valid Excel sheet and extracts student records", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");
    sheet.addRow(["Student Code", "Khmer Full Name", "English Full Name", "Gender", "Date of Birth", "Student Phone"]);
    sheet.addRow(["STU-101", "សុខ សាន", "Sok San", "ប្រុស", "2008-04-12", "012345678"]);
    sheet.addRow(["STU-102", "ចាន់ ធីតា", "Chan Thida", "ស្រី", "2009-08-20", "096778899"]);

    const buffer = await workbook.xlsx.writeBuffer();
    const result = await parseAndValidateStudentExcel(buffer as ArrayBuffer, []);

    assert.strictEqual(result.totalRows, 2);
    assert.strictEqual(result.validRows.length, 2);
    assert.strictEqual(result.invalidRows.length, 0);
    assert.strictEqual(result.hasErrors, false);

    assert.strictEqual(result.validRows[0].data.studentCode, "STU-101");
    assert.strictEqual(result.validRows[0].data.nameKh, "សុខ សាន");
    assert.strictEqual(result.validRows[0].data.gender, "male");
    assert.strictEqual(result.validRows[0].data.dateOfBirth, "2008-04-12");

    assert.strictEqual(result.validRows[1].data.studentCode, "STU-102");
    assert.strictEqual(result.validRows[1].data.nameKh, "ចាន់ ធីតា");
    assert.strictEqual(result.validRows[1].data.gender, "female");
  });

  it("detects missing required fields (code, nameKh, gender)", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");
    sheet.addRow(["Student Code", "Khmer Full Name", "English Full Name", "Gender"]);
    // Row 1: missing student code
    sheet.addRow(["", "សុខ សាន", "Sok San", "ប្រុស"]);
    // Row 2: missing nameKh
    sheet.addRow(["STU-103", "", "Chan Thida", "ស្រី"]);
    // Row 3: invalid gender
    sheet.addRow(["STU-104", "កែវ វិបុល", "Keo Vibul", "UnknownGender"]);

    const buffer = await workbook.xlsx.writeBuffer();
    const result = await parseAndValidateStudentExcel(buffer as ArrayBuffer, []);

    assert.strictEqual(result.totalRows, 3);
    assert.strictEqual(result.validRows.length, 0);
    assert.strictEqual(result.invalidRows.length, 3);
    assert.strictEqual(result.hasErrors, true);

    assert.ok(result.invalidRows[0].errors.some((e) => e.field === "studentCode"));
    assert.ok(result.invalidRows[1].errors.some((e) => e.field === "nameKh"));
    assert.ok(result.invalidRows[2].errors.some((e) => e.field === "gender"));
  });

  it("detects duplicate student codes within the file", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");
    sheet.addRow(["Student Code", "Khmer Full Name", "Gender"]);
    sheet.addRow(["STU-DUPLICATE", "សិស្សទីមួយ", "ប្រុស"]);
    sheet.addRow(["STU-UNIQUE", "សិស្សទីពីរ", "ស្រី"]);
    sheet.addRow(["STU-DUPLICATE", "សិស្សទីបី", "ស្រី"]);

    const buffer = await workbook.xlsx.writeBuffer();
    const result = await parseAndValidateStudentExcel(buffer as ArrayBuffer, []);

    assert.strictEqual(result.totalRows, 3);
    assert.strictEqual(result.validRows.length, 1);
    assert.strictEqual(result.validRows[0].data.studentCode, "STU-UNIQUE");

    assert.strictEqual(result.invalidRows.length, 2);
    assert.ok(result.invalidRows[0].errors.some((e) => e.messageKey === "errors.duplicateInFile"));
    assert.ok(result.invalidRows[1].errors.some((e) => e.messageKey === "errors.duplicateInFile"));
  });

  it("detects duplicate student codes against existing database codes", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");
    sheet.addRow(["Student Code", "Khmer Full Name", "Gender"]);
    sheet.addRow(["STU-EXISTING", "សិស្សចាស់", "ប្រុស"]);
    sheet.addRow(["STU-NEW", "សិស្សថ្មី", "ស្រី"]);

    const buffer = await workbook.xlsx.writeBuffer();
    const existingDbCodes = ["STU-EXISTING", "STU-OTHER"];
    const result = await parseAndValidateStudentExcel(buffer as ArrayBuffer, existingDbCodes);

    assert.strictEqual(result.totalRows, 2);
    assert.strictEqual(result.validRows.length, 1);
    assert.strictEqual(result.validRows[0].data.studentCode, "STU-NEW");

    assert.strictEqual(result.invalidRows.length, 1);
    assert.ok(result.invalidRows[0].errors.some((e) => e.messageKey === "errors.codeAlreadyExists"));
  });
});
