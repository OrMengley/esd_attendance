import React from "react";
import { useTranslation } from "react-i18next";
import { Student } from "@/models/student.model";
import { Enrollment } from "@/models/enrollment.model";
import { AttendanceStatus } from "@/models/attendance.model";
import { AttendanceStatusControl } from "./attendance-status-control";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Phone, UserX } from "lucide-react";

export interface StudentAttendanceItem {
  student: Student;
  enrollment: Enrollment;
  status: AttendanceStatus;
  remark: string;
}

interface AttendanceStudentTableProps {
  items: StudentAttendanceItem[];
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onRemarkChange: (studentId: string, remark: string) => void;
  disabled?: boolean;
}

export const AttendanceStudentTable: React.FC<AttendanceStudentTableProps> = ({
  items,
  onStatusChange,
  onRemarkChange,
  disabled = false,
}) => {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-card rounded-2xl border border-dashed">
        <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
          <UserX className="w-6 h-6 text-slate-400" />
        </div>
        <h4 className="text-sm font-semibold text-foreground font-khmer">
          {t("attendance.noStudents", { defaultValue: "មិនមានសិស្សសកម្មក្នុងថ្នាក់នេះទេ" })}
        </h4>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 font-khmer">
          {t("attendance.noStudentsDesc", {
            defaultValue: "សូមចុះឈ្មោះសិស្សចូលរៀនក្នុងថ្នាក់នេះជាមុនសិន។",
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-b border-border/60">
              <TableHead className="w-12 text-center text-xs font-semibold font-khmer">
                {t("common.no", { defaultValue: "ល.រ" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer min-w-[200px]">
                {t("students.student", { defaultValue: "សិស្ស" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer w-[130px]">
                {t("students.studentCode", { defaultValue: "អត្តលេខ" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer min-w-[140px]">
                {t("students.parentContact", { defaultValue: "ទំនាក់ទំនងអាណាព្យាបាល" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer min-w-[340px] text-center">
                {t("common.status", { defaultValue: "ស្ថានភាព" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer min-w-[180px]">
                {t("attendance.remark", { defaultValue: "ចំណាំ" })}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const { student, status, remark } = item;
              const parentPhone =
                student.fatherPhone ||
                student.motherPhone ||
                student.phone ||
                "-";

              return (
                <TableRow
                  key={student.id}
                  className="hover:bg-muted/30 border-b border-border/40 transition-colors"
                >
                  {/* 1. Index */}
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">
                    {index + 1}
                  </TableCell>

                  {/* 2. Student Info */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-xl ring-1 ring-border/80 shrink-0">
                        <AvatarImage src={student.avatarUrl} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs rounded-xl">
                          {student.nameKh.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-foreground font-khmer truncate">
                          {student.nameKh}
                        </div>
                        {student.nameEn && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {student.nameEn}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* 3. Student Code */}
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                      {student.studentCode}
                    </span>
                  </TableCell>

                  {/* 4. Parent Contact */}
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{parentPhone}</span>
                    </div>
                  </TableCell>

                  {/* 5. Attendance Status Control */}
                  <TableCell className="text-center">
                    <AttendanceStatusControl
                      value={status}
                      onChange={(newStatus) => onStatusChange(student.id, newStatus)}
                      disabled={disabled}
                    />
                  </TableCell>

                  {/* 6. Remark Input */}
                  <TableCell>
                    <Input
                      type="text"
                      value={remark}
                      onChange={(e) => onRemarkChange(student.id, e.target.value)}
                      placeholder={t("attendance.remarkPlaceholder", {
                        defaultValue: "ចំណាំបន្ថែម...",
                      })}
                      disabled={disabled}
                      className="text-xs h-9 bg-background rounded-lg font-khmer"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3">
        {items.map((item, index) => {
          const { student, status, remark } = item;
          const parentPhone =
            student.fatherPhone ||
            student.motherPhone ||
            student.phone ||
            "-";

          return (
            <Card
              key={student.id}
              className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-9 w-9 rounded-xl ring-1 ring-border/80 shrink-0">
                      <AvatarImage src={student.avatarUrl} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs rounded-xl">
                        {student.nameKh.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-foreground font-khmer truncate">
                        {index + 1}. {student.nameKh}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                        <span className="font-bold text-primary">{student.studentCode}</span>
                        <span>•</span>
                        <span>{parentPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Buttons */}
                <div className="pt-1 overflow-x-auto pb-1">
                  <AttendanceStatusControl
                    value={status}
                    onChange={(newStatus) => onStatusChange(student.id, newStatus)}
                    disabled={disabled}
                  />
                </div>

                {/* Remark */}
                <div>
                  <Input
                    type="text"
                    value={remark}
                    onChange={(e) => onRemarkChange(student.id, e.target.value)}
                    placeholder={t("attendance.remarkPlaceholder", {
                      defaultValue: "ចំណាំបន្ថែម...",
                    })}
                    disabled={disabled}
                    className="text-xs h-9 bg-background rounded-lg font-khmer"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
