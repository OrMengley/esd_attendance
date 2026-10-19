import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Classroom } from "@/models/classroom.model";
import { Student } from "@/models/student.model";
import { Enrollment } from "@/models/enrollment.model";
import { studentService } from "@/services/student.service";
import { enrollmentService } from "@/services/enrollment.service";
import { classroomService } from "@/services/classroom.service";
import {
  getStudentClassEligibility,
  canEnrollInClassroom,
  canEnrollCountInClassroom,
  filterStudentsForEnrollment,
} from "@/lib/class-student-enrollment";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  Search,
  UserPlus,
  Users,
  AlertCircle,
  Calendar,
  Clock,
  Loader2,
  Check,
  UserCheck,
  X,
  Trash2,
} from "lucide-react";

interface AddStudentToClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroom: Classroom;
  onSuccess: () => void;
}

export const AddStudentToClassDialog: React.FC<AddStudentToClassDialogProps> = ({
  open,
  onOpenChange,
  classroom,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [activeEnrollments, setActiveEnrollments] = useState<Enrollment[]>([]);
  const [classroomsMap, setClassroomsMap] = useState<Record<string, Classroom>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "available" | "enrolled">("available");
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [startDate, setStartDate] = useState(
    classroom.startDate || new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allStudents, allEnrollments, allClasses] = await Promise.all([
        studentService.getStudents(),
        enrollmentService.getEnrollments(),
        classroomService.getClassrooms(),
      ]);

      setStudents(allStudents.filter((s) => s.status !== "archived"));
      setActiveEnrollments(allEnrollments.filter((e) => e.status === "active"));

      const map: Record<string, Classroom> = {};
      allClasses.forEach((c) => {
        map[c.id] = c;
      });
      setClassroomsMap(map);
    } catch (e) {
      console.error("Failed to load students for class enrollment:", e);
      toast.error(t("classes.fetchError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
      setSelectedStudents([]);
      setSearchQuery("");
      setFilterTab("available");
      setStartDate(classroom.startDate || new Date().toISOString().slice(0, 10));
      setNote("");
    }
  }, [open, classroom.id, classroom.startDate]);

  // Current active enrollments in this classroom
  const currentClassEnrollmentCount = useMemo(() => {
    return activeEnrollments.filter((e) => e.classroomId === classroom.id).length;
  }, [activeEnrollments, classroom.id]);

  const capacityStatus = useMemo(() => {
    return canEnrollInClassroom(classroom, currentClassEnrollmentCount);
  }, [classroom, currentClassEnrollmentCount]);

  const remainingSpots = useMemo(() => {
    if (!classroom.capacity || classroom.capacity <= 0) return null;
    return Math.max(0, classroom.capacity - currentClassEnrollmentCount);
  }, [classroom.capacity, currentClassEnrollmentCount]);

  const exceedsCapacity = Boolean(
    remainingSpots !== null && selectedStudents.length > remainingSpots
  );

  const filteredItems = useMemo(() => {
    return filterStudentsForEnrollment(
      students,
      searchQuery,
      classroom.id,
      activeEnrollments,
      classroomsMap,
      filterTab
    );
  }, [students, searchQuery, classroom.id, activeEnrollments, classroomsMap, filterTab]);

  const availableCount = useMemo(() => {
    return students.filter((s) => {
      const el = getStudentClassEligibility(
        s.id,
        classroom.id,
        activeEnrollments,
        classroomsMap
      );
      return el.isSelectable;
    }).length;
  }, [students, classroom.id, activeEnrollments, classroomsMap]);

  const enrolledElsewhereCount = useMemo(() => {
    return students.filter((s) => {
      const el = getStudentClassEligibility(
        s.id,
        classroom.id,
        activeEnrollments,
        classroomsMap
      );
      return !el.isSelectable;
    }).length;
  }, [students, classroom.id, activeEnrollments, classroomsMap]);

  // Selectable students in current filtered view
  const selectableInView = useMemo(() => {
    if (!capacityStatus.canEnroll) return [];
    return filteredItems
      .filter((i) => i.eligibility.isSelectable)
      .map((i) => i.student);
  }, [filteredItems, capacityStatus.canEnroll]);

  const allSelectableInViewSelected = useMemo(() => {
    if (selectableInView.length === 0) return false;
    return selectableInView.every((s) =>
      selectedStudents.some((sel) => sel.id === s.id)
    );
  }, [selectableInView, selectedStudents]);

  const toggleSelectStudent = (student: Student) => {
    setSelectedStudents((prev) => {
      const exists = prev.some((s) => s.id === student.id);
      if (exists) {
        return prev.filter((s) => s.id !== student.id);
      } else {
        return [...prev, student];
      }
    });
  };

  const removeSelectedStudent = (studentId: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const handleToggleSelectAllInView = () => {
    if (allSelectableInViewSelected) {
      // Unselect all that are currently in view
      setSelectedStudents((prev) =>
        prev.filter((p) => !selectableInView.some((s) => s.id === p.id))
      );
    } else {
      // Add all selectable in view that aren't already selected
      setSelectedStudents((prev) => {
        const toAdd = selectableInView.filter(
          (s) => !prev.some((p) => p.id === s.id)
        );
        return [...prev, ...toAdd];
      });
    }
  };

  const handleEnroll = async () => {
    if (selectedStudents.length === 0) return;

    if (!capacityStatus.canEnroll) {
      if (capacityStatus.reason === "CLASS_FULL") {
        toast.error(t("enrollment.classFull"));
      } else {
        toast.error(t("enrollment.classNotActive"));
      }
      return;
    }

    if (exceedsCapacity) {
      toast.error(
        t("classes.students.exceedsCapacityWarning", {
          selected: selectedStudents.length,
          remaining: remainingSpots,
          capacity: classroom.capacity,
        })
      );
      return;
    }

    if (!startDate) {
      toast.error(t("enrollment.startDateRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const enrollmentItems = selectedStudents.map((s) => ({
        studentId: s.id,
        classroomId: classroom.id,
        packageId: classroom.packageId,
        startDate,
        expectedEndDate: classroom.expectedEndDate,
        status: "active" as const,
        note: note.trim(),
      }));

      await enrollmentService.createEnrollments(enrollmentItems, user?.id);

      const successMsg =
        selectedStudents.length > 1
          ? t("classes.students.enrollBulkSuccess", {
              count: selectedStudents.length,
            })
          : t("enrollment.created");
      toast.success(successMsg);

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to enroll students:", err);
      if (err.message === "ACTIVE_ENROLLMENT_EXISTS") {
        toast.error(t("enrollment.activeExists"));
      } else if (err.message === "CLASS_CAPACITY_FULL") {
        toast.error(t("enrollment.classFull"));
      } else {
        toast.error(err.message || t("common.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold font-khmer">
                {t("classes.students.dialogTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs font-khmer text-muted-foreground">
                {t("classes.students.dialogDesc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Classroom Info Banner */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground font-khmer text-sm">
                {classroom.name}
              </span>
              <Badge variant="outline" className="font-mono text-[11px] bg-background">
                {classroom.code}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground text-[11px] font-mono mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {classroom.startTime} - {classroom.endTime}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {classroom.startDate} → {classroom.expectedEndDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-khmer text-xs">
              {t("classes.students.enrolledCount", {
                enrolled: currentClassEnrollmentCount,
                capacity: classroom.capacity || "—",
              })}
            </span>
            {classroom.capacity && classroom.capacity > 0 && (
              <Badge
                variant={capacityStatus.canEnroll ? "outline" : "destructive"}
                className={`text-[11px] font-khmer ${
                  capacityStatus.canEnroll
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : ""
                }`}
              >
                {capacityStatus.canEnroll
                  ? t("classes.students.spotsLeft", {
                      count: classroom.capacity - currentClassEnrollmentCount,
                    })
                  : t("classes.students.full")}
              </Badge>
            )}
          </div>
        </div>

        {/* Capacity Warning (if class full or inactive) */}
        {!capacityStatus.canEnroll && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-khmer flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {capacityStatus.reason === "CLASS_FULL"
                ? t("classes.students.classFullWarning", {
                    capacity: classroom.capacity,
                  })
                : t("classes.students.classNotActiveWarning")}
            </span>
          </div>
        )}

        {/* Content Body: Two Columns (Student Selector on Left / Form on Right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[300px] overflow-hidden py-1">
          {/* Left Column: Student Search, Filters & List (7 cols) */}
          <div className="md:col-span-7 flex flex-col space-y-2.5 overflow-hidden">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("classes.students.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-background"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg text-xs font-khmer shrink-0">
              <button
                type="button"
                onClick={() => setFilterTab("available")}
                className={`flex-1 py-1 text-center rounded-md transition-all ${
                  filterTab === "available"
                    ? "bg-background text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("classes.students.tabAvailable", { count: availableCount })}
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                className={`flex-1 py-1 text-center rounded-md transition-all ${
                  filterTab === "all"
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("classes.students.tabAll", { count: students.length })}
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("enrolled")}
                className={`flex-1 py-1 text-center rounded-md transition-all ${
                  filterTab === "enrolled"
                    ? "bg-background text-amber-700 dark:text-amber-400 font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("classes.students.tabEnrolled", { count: enrolledElsewhereCount })}
              </button>
            </div>

            {/* Bulk Selection Bar */}
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-muted/30 border border-border/60 rounded-lg text-xs font-khmer shrink-0">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all-view"
                  checked={allSelectableInViewSelected}
                  disabled={selectableInView.length === 0 || !capacityStatus.canEnroll}
                  onCheckedChange={handleToggleSelectAllInView}
                />
                <label
                  htmlFor="select-all-view"
                  className={`text-xs cursor-pointer select-none font-medium ${
                    selectableInView.length === 0 || !capacityStatus.canEnroll
                      ? "text-muted-foreground/60 cursor-not-allowed"
                      : "text-foreground"
                  }`}
                >
                  {allSelectableInViewSelected
                    ? t("classes.students.deselectAll")
                    : t("classes.students.selectAll")}
                </label>
                <span className="text-[11px] text-muted-foreground">
                  ({selectableInView.length})
                </span>
              </div>

              {selectedStudents.length > 0 && (
                <Badge variant="secondary" className="text-[11px] font-mono h-5 px-1.5">
                  {selectedStudents.length} {t("common.selected")}
                </Badge>
              )}
            </div>

            {/* Student List */}
            <div className="flex-1 border rounded-xl overflow-hidden bg-card flex flex-col">
              <ScrollArea className="flex-1 p-2">
                {isLoading ? (
                  <div className="space-y-2 p-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-14 bg-muted/40 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground font-khmer">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>{t("students.noStudentsFiltered")}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredItems.map(({ student, eligibility }) => {
                      const isSelected = selectedStudents.some(
                        (s) => s.id === student.id
                      );
                      const isSelectable =
                        eligibility.isSelectable && capacityStatus.canEnroll;

                      return (
                        <div
                          key={student.id}
                          onClick={() => {
                            if (isSelectable) {
                              toggleSelectStudent(student);
                            }
                          }}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                              : isSelectable
                              ? "border-border/70 hover:border-primary/50 hover:bg-muted/30 cursor-pointer"
                              : "border-border/40 bg-muted/20 opacity-70 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Checkbox */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 flex items-center"
                            >
                              <Checkbox
                                checked={isSelected}
                                disabled={!isSelectable}
                                onCheckedChange={() => {
                                  if (isSelectable) {
                                    toggleSelectStudent(student);
                                  }
                                }}
                              />
                            </div>

                            <Avatar className="h-9 w-9 rounded-lg shrink-0">
                              <AvatarImage src={student.avatarUrl} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs rounded-lg">
                                {student.nameKh?.charAt(0) || "S"}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs font-khmer text-foreground truncate">
                                  {student.nameKh}
                                </span>
                                {student.nameEn && (
                                  <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                                    ({student.nameEn})
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                                <span>{student.studentCode}</span>
                                <span>•</span>
                                <span className="font-khmer">
                                  {student.gender === "female" ? "ស្រី" : "ប្រុស"}
                                </span>
                                {student.phone && (
                                  <>
                                    <span>•</span>
                                    <span>{student.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Eligibility Badge */}
                          <div className="shrink-0">
                            {eligibility.status === "available" && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-khmer ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30"
                                }`}
                              >
                                {isSelected ? (
                                  <span className="flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    {t("common.selected")}
                                  </span>
                                ) : (
                                  t("classes.students.statusAvailable")
                                )}
                              </Badge>
                            )}

                            {eligibility.status === "in_this_class" && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-khmer text-slate-600 bg-slate-100 dark:bg-slate-800"
                              >
                                {t("classes.students.statusInThisClass")}
                              </Badge>
                            )}

                            {eligibility.status === "in_other_class" && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-khmer text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/30 max-w-[130px] truncate"
                                title={eligibility.otherClassroomName}
                              >
                                {t("classes.students.statusInOtherClass", {
                                  className:
                                    eligibility.otherClassroomCode ||
                                    eligibility.otherClassroomName,
                                })}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* Right Column: Enrollment Form & Selected Summary (5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between border rounded-xl p-4 bg-muted/20 overflow-y-auto space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold font-khmer text-foreground flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-primary" />
                  {t("classes.students.selectedStudentsCount", {
                    count: selectedStudents.length,
                  })}
                </h4>

                {selectedStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedStudents([])}
                    className="text-[11px] text-muted-foreground hover:text-rose-600 font-khmer flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t("classes.students.clearSelection")}
                  </button>
                )}
              </div>

              {/* Excess capacity warning */}
              {exceedsCapacity && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-khmer flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    {t("classes.students.exceedsCapacityWarning", {
                      selected: selectedStudents.length,
                      remaining: remainingSpots,
                      capacity: classroom.capacity,
                    })}
                  </span>
                </div>
              )}

              {/* Selected Students Scroll Area / Empty State */}
              {selectedStudents.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed text-center text-xs text-muted-foreground font-khmer">
                  <UserPlus className="h-8 w-8 mx-auto mb-1 text-muted-foreground/40" />
                  <p>{t("classes.students.noStudentsSelected")}</p>
                </div>
              ) : (
                <div className="border rounded-xl bg-card p-2 max-h-[160px] overflow-y-auto space-y-1.5">
                  {selectedStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/50 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-6 w-6 rounded-md shrink-0">
                          <AvatarImage src={student.avatarUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
                            {student.nameKh?.charAt(0) || "S"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold font-khmer text-xs text-foreground truncate">
                          {student.nameKh}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                          {student.studentCode}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSelectedStudent(student.id)}
                        className="text-muted-foreground hover:text-rose-600 p-0.5 rounded transition-colors"
                        title={t("classes.students.removeStudent")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Start Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer flex items-center gap-1">
                  <span>{t("classes.students.startDate")}</span>
                  <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs h-9 bg-background font-mono"
                  required
                />
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer">
                  {t("classes.students.note")}
                </Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("classes.students.notePlaceholder")}
                  rows={2}
                  className="text-xs bg-background font-khmer resize-none"
                />
              </div>
            </div>

            {/* Quick helper note */}
            <div className="text-[11px] text-muted-foreground font-khmer bg-muted/40 p-2.5 rounded-lg border border-border/50">
              <span className="font-semibold text-foreground block mb-0.5">
                {t("classes.studyPeriod")}:
              </span>
              {classroom.startDate} → {classroom.expectedEndDate}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="pt-3 border-t border-border/70 flex items-center justify-between sm:justify-between w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-khmer h-9"
          >
            {t("common.cancel")}
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleEnroll}
            disabled={
              selectedStudents.length === 0 ||
              !capacityStatus.canEnroll ||
              exceedsCapacity ||
              isSubmitting
            }
            className="text-xs font-khmer h-9 gap-1.5 shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            <span>
              {selectedStudents.length > 1
                ? t("classes.students.enrollBulkButton", {
                    count: selectedStudents.length,
                  })
                : t("classes.students.enrollButton")}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
