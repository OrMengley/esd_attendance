import React, { useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  FileCheck,
  ArrowLeft,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  downloadStudentImportTemplate,
  parseAndValidateStudentExcel,
  downloadErrorReport,
  ImportValidationResult,
  ParsedStudentRow,
} from "@/lib/student-import-excel";
import { studentService } from "@/services/student.service";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImportStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingStudentCodes: string[];
  onImportSuccess: () => void;
}

type ImportStep = "upload" | "preview" | "importing" | "complete";

export const ImportStudentsDialog: React.FC<ImportStudentsDialogProps> = ({
  open,
  onOpenChange,
  existingStudentCodes,
  onImportSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentBranchId, isAllBranches, currentBranch, branches } = useBranch();
  const [selectedImportBranchId, setSelectedImportBranchId] = useState<string>("");

  const effectiveBranchId = useMemo(() => {
    if (!isAllBranches && currentBranchId) return currentBranchId;
    return selectedImportBranchId || branches[0]?.id || "";
  }, [isAllBranches, currentBranchId, selectedImportBranchId, branches]);

  const effectiveBranch = useMemo(() => {
    return branches.find((b) => b.id === effectiveBranchId) || currentBranch;
  }, [branches, effectiveBranchId, currentBranch]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow State
  const [step, setStep] = useState<ImportStep>("upload");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isDownloadingErrors, setIsDownloadingErrors] = useState(false);

  // Validation Result
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "valid" | "errors">("all");

  // Import Progress State
  const [importProgress, setImportProgress] = useState<{ saved: number; total: number }>({
    saved: 0,
    total: 0,
  });
  const [importSummary, setImportSummary] = useState<{
    successCount: number;
    failureCount: number;
  }>({
    successCount: 0,
    failureCount: 0,
  });

  // Reset state when dialog closes
  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen) {
      if (step === "importing") return; // Prevent closing mid-import
      setStep("upload");
      setSelectedFileName("");
      setValidationResult(null);
      setActiveTab("all");
      setImportProgress({ saved: 0, total: 0 });
      setImportSummary({ successCount: 0, failureCount: 0 });
    }
    onOpenChange(newOpen);
  };

  // Download Template Handler
  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await downloadStudentImportTemplate();
      toast.success(t("students.import.downloadTemplate"));
    } catch (e) {
      console.error(e);
      toast.error(t("common.error"));
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Process Selected File
  const processFile = async (file: File) => {
    // 1. File size check (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("students.import.fileSizeError"));
      return;
    }

    // 2. Extension check
    const fileName = file.name;
    const isXlsx = fileName.toLowerCase().endsWith(".xlsx");
    if (!isXlsx) {
      toast.error(t("students.import.fileTypeError"));
      return;
    }

    setSelectedFileName(fileName);
    setIsParsing(true);

    try {
      const buffer = await file.arrayBuffer();
      const result = await parseAndValidateStudentExcel(buffer, existingStudentCodes);

      if (result.totalRows === 0) {
        toast.error(t("students.import.emptyFileError"));
        setIsParsing(false);
        return;
      }

      setValidationResult(result);
      // Auto-select tab: if errors exist, default to all or errors
      setActiveTab(result.hasErrors ? "all" : "valid");
      setStep("preview");
    } catch (err) {
      console.error("Failed to parse Excel file:", err);
      toast.error(t("common.error"));
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Download Error Report
  const handleDownloadErrorReport = async () => {
    if (!validationResult || validationResult.invalidRows.length === 0) return;
    setIsDownloadingErrors(true);
    try {
      await downloadErrorReport(validationResult.invalidRows);
      toast.success(t("students.import.downloadErrors"));
    } catch (e) {
      console.error(e);
      toast.error(t("common.error"));
    } finally {
      setIsDownloadingErrors(false);
    }
  };

  // Execute Import
  const handleConfirmImport = async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;

    setStep("importing");
    setImportProgress({ saved: 0, total: validationResult.validRows.length });

    try {
      const payloadData = validationResult.validRows.map((r) => ({
        ...r.data,
        branchId: effectiveBranchId || undefined,
      } as any));
      const res = await studentService.importStudents(
        payloadData,
        user?.id,
        (saved, total) => {
          setImportProgress({ saved, total });
        },
        effectiveBranchId || undefined
      );

      setImportSummary({
        successCount: res.successCount,
        failureCount: res.failureCount,
      });
      setStep("complete");
      onImportSuccess();

      if (res.failureCount === 0) {
        toast.success(t("students.import.successMessage", { count: res.successCount }));
      } else {
        toast.warning(
          t("students.import.partialSuccessMessage", {
            successCount: res.successCount,
            failureCount: res.failureCount,
          })
        );
      }
    } catch (e: any) {
      console.error("Bulk import failed:", e);
      toast.error(e?.message || t("common.error"));
      setStep("preview");
    }
  };

  // Filtered rows for the preview table
  const displayedRows: ParsedStudentRow[] = useMemo(() => {
    if (!validationResult) return [];
    if (activeTab === "valid") return validationResult.validRows;
    if (activeTab === "errors") return validationResult.invalidRows;
    return validationResult.allRows;
  }, [validationResult, activeTab]);

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-border/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold font-khmer">
                  {t("students.import.title")}
                </DialogTitle>
                <DialogDescription className="text-xs font-khmer text-muted-foreground">
                  {t("students.import.description")}
                </DialogDescription>
              </div>
            </div>

            {/* Target Branch Badge */}
            {effectiveBranch && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-khmer text-blue-700 dark:text-blue-300">
                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                <span className="font-medium">{effectiveBranch.nameKh}</span>
                {effectiveBranch.code && (
                  <span className="text-[10px] opacity-70 font-mono">({effectiveBranch.code})</span>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {/* STEP 1: Upload & Download Template */}
        {step === "upload" && (
          <div className="space-y-5 py-4 overflow-y-auto">
            {/* Template Download Card */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold font-khmer text-foreground">
                    {t("students.import.downloadTemplate")}
                  </h4>
                  <p className="text-xs text-muted-foreground font-khmer">
                    {t("students.import.downloadTemplateDesc")}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                disabled={isDownloadingTemplate}
                className="text-xs font-khmer h-9 gap-1.5 shrink-0"
              >
                {isDownloadingTemplate ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{t("students.import.downloadTemplate")}</span>
              </Button>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all flex flex-col items-center justify-center space-y-3 ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
                {isParsing ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <Upload className="h-7 w-7" />
                )}
              </div>

              <div>
                <p className="text-sm font-semibold font-khmer text-foreground">
                  {isDragging
                    ? t("students.import.dropzoneActive")
                    : t("students.import.dropzoneTitle")}
                </p>
                <p className="text-xs text-muted-foreground font-khmer mt-1">
                  {t("students.import.dropzoneHint")}
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isParsing}
                className="text-xs font-khmer h-8 mt-2"
              >
                {isParsing ? t("students.import.parsingFile") : t("common.search")}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Preview & Validation Table */}
        {step === "preview" && validationResult && (
          <div className="flex-1 flex flex-col space-y-4 py-2 overflow-hidden">
            {/* Metric Strip */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground font-khmer">
                    {t("students.import.totalRows")}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {validationResult.totalRows}
                  </div>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-khmer">
                    {t("students.import.readyToImport")}
                  </div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {validationResult.validRows.length}
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  validationResult.hasErrors
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400"
                    : "bg-muted/30 border-border/60 text-muted-foreground"
                }`}
              >
                <div>
                  <div className="text-xs font-khmer">
                    {t("students.import.errorsFound")}
                  </div>
                  <div className="text-lg font-bold">
                    {validationResult.invalidRows.length}
                  </div>
                </div>
                <AlertCircle
                  className={`h-5 w-5 ${
                    validationResult.hasErrors
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-muted-foreground"
                  }`}
                />
              </div>
            </div>

            {/* Filter Tabs & Error Export */}
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1 text-xs font-khmer rounded-lg transition-all ${
                    activeTab === "all"
                      ? "bg-background text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("students.import.tabAll", { count: validationResult.totalRows })}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("valid")}
                  className={`px-3 py-1 text-xs font-khmer rounded-lg transition-all ${
                    activeTab === "valid"
                      ? "bg-background text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("students.import.tabValid", { count: validationResult.validRows.length })}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("errors")}
                  className={`px-3 py-1 text-xs font-khmer rounded-lg transition-all ${
                    activeTab === "errors"
                      ? "bg-background text-rose-600 dark:text-rose-400 font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("students.import.tabErrors", { count: validationResult.invalidRows.length })}
                </button>
              </div>

              {validationResult.invalidRows.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadErrorReport}
                  disabled={isDownloadingErrors}
                  className="text-xs font-khmer h-8 gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  {isDownloadingErrors ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>{t("students.import.downloadErrors")}</span>
                </Button>
              )}
            </div>

            {/* Preview Table */}
            <div className="flex-1 border rounded-xl overflow-hidden bg-card flex flex-col min-h-[220px]">
              <ScrollArea className="flex-1 w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/50 border-b sticky top-0 z-10">
                    <tr className="text-muted-foreground font-khmer">
                      <th className="py-2.5 px-3 w-12 text-center">
                        {t("students.import.colRow")}
                      </th>
                      <th className="py-2.5 px-3 w-28">{t("students.import.colCode")}</th>
                      <th className="py-2.5 px-3">{t("students.import.colNameKh")}</th>
                      <th className="py-2.5 px-3">{t("students.import.colNameEn")}</th>
                      <th className="py-2.5 px-3 w-16 text-center">
                        {t("students.import.colGender")}
                      </th>
                      <th className="py-2.5 px-3 w-24">{t("students.import.colDob")}</th>
                      <th className="py-2.5 px-3 w-28">{t("students.import.colPhone")}</th>
                      <th className="py-2.5 px-3 w-24 text-center">
                        {t("common.status")}
                      </th>
                      <th className="py-2.5 px-3 min-w-[200px]">
                        {t("students.import.colErrors")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {displayedRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-8 text-center text-muted-foreground font-khmer"
                        >
                          {t("common.noData")}
                        </td>
                      </tr>
                    ) : (
                      displayedRows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={`transition-colors ${
                            !row.isValid
                              ? "bg-rose-50/50 dark:bg-rose-950/20"
                              : "hover:bg-muted/30"
                          }`}
                        >
                          <td className="py-2 px-3 text-center text-muted-foreground font-mono">
                            {row.rowNumber}
                          </td>
                          <td className="py-2 px-3 font-mono font-medium">
                            {row.data.studentCode || (
                              <span className="text-rose-500 italic">empty</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-khmer font-medium">
                            {row.data.nameKh || (
                              <span className="text-rose-500 italic">empty</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {row.data.nameEn || "-"}
                          </td>
                          <td className="py-2 px-3 text-center font-khmer">
                            {row.data.gender === "female" ? "ស្រី" : "ប្រុស"}
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">
                            {row.data.dateOfBirth || "-"}
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">
                            {row.data.phone || "-"}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.isValid ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-khmer px-1.5"
                              >
                                {t("students.import.valid")}
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="text-[10px] font-khmer px-1.5"
                              >
                                {t("students.import.hasErrors")}
                              </Badge>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {row.errors.length > 0 ? (
                              <div className="space-y-1">
                                {row.errors.map((err, i) => (
                                  <div
                                    key={i}
                                    className="text-[11px] text-rose-600 dark:text-rose-400 font-khmer flex items-center gap-1"
                                  >
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    <span>{err.message}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">
                                -
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* STEP 3: Importing Progress */}
        {step === "importing" && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold font-khmer text-foreground">
                {t("students.import.importProgress")}
              </h3>
              <p className="text-xs text-muted-foreground font-khmer">
                {importProgress.saved} / {importProgress.total} records saved
              </p>
            </div>
            {/* Progress Bar */}
            <div className="w-full max-w-md bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-2.5 transition-all duration-300"
                style={{
                  width: `${
                    importProgress.total > 0
                      ? Math.round((importProgress.saved / importProgress.total) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* STEP 4: Complete Screen */}
        {step === "complete" && (
          <div className="py-10 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
              <FileCheck className="h-8 w-8" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold font-khmer text-foreground">
                {t("students.import.successTitle")}
              </h3>
              <p className="text-xs text-muted-foreground font-khmer max-w-md">
                {t("students.import.successMessage", {
                  count: importSummary.successCount,
                })}
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <DialogFooter className="pt-3 border-t border-border/80 flex items-center justify-between sm:justify-between w-full">
          {step === "upload" && (
            <div className="flex items-center justify-end w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDialogClose(false)}
                className="text-xs font-khmer h-9"
              >
                {t("common.cancel")}
              </Button>
            </div>
          )}

          {step === "preview" && (
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep("upload");
                  setValidationResult(null);
                }}
                className="text-xs font-khmer h-9 gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t("students.import.backButton")}</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDialogClose(false)}
                  className="text-xs font-khmer h-9"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConfirmImport}
                  disabled={!validationResult || validationResult.validRows.length === 0}
                  className="text-xs font-khmer h-9 gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>
                    {t("students.import.confirmButton", {
                      count: validationResult?.validRows.length || 0,
                    })}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="flex items-center justify-end w-full">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleDialogClose(false)}
                className="text-xs font-khmer h-9"
              >
                {t("students.import.doneButton")}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
