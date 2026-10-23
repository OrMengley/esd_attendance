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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Student } from "@/models/student.model";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { Enrollment } from "@/models/enrollment.model";
import { enrollmentService } from "@/services/enrollment.service";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  UserPlus,
  School,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  AlertCircle,
} from "lucide-react";

interface EnrollStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  classrooms: Classroom[];
  packages: StudyPackage[];
  existingEnrollments: Enrollment[];
  onSuccess: () => void;
}

export const EnrollStudentDialog: React.FC<EnrollStudentDialogProps> = ({
  open,
  onOpenChange,
  students,
  classrooms,
  packages,
  existingEnrollments,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map of active enrollments by studentId
  const activeStudentEnrollmentMap = useMemo(() => {
    const map = new Map<string, Enrollment>();
    existingEnrollments
      .filter((e) => e.status === "active")
      .forEach((e) => map.set(e.studentId, e));
    return map;
  }, [existingEnrollments]);

  // Count active enrollments per classroom
  const activeCountPerClassMap = useMemo(() => {
    const map = new Map<string, number>();
    existingEnrollments
      .filter((e) => e.status === "active")
      .forEach((e) => {
        map.set(e.classroomId, (map.get(e.classroomId) || 0) + 1);
      });
    return map;
  }, [existingEnrollments]);

  // Filter active registered students
  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    return students
      .filter((s) => s.status !== "archived")
      .filter((s) => {
        if (!query) return true;
        const nameKh = (s.nameKh || "").toLowerCase();
        const nameEn = (s.nameEn || "").toLowerCase();
        const code = (s.studentCode || "").toLowerCase();
        const phone = (s.phone || "").toLowerCase();
        return (
          nameKh.includes(query) ||
          nameEn.includes(query) ||
          code.includes(query) ||
          phone.includes(query)
        );
      });
  }, [students, studentSearch]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  const studentHasActiveEnrollment = Boolean(
    selectedStudentId && activeStudentEnrollmentMap.has(selectedStudentId)
  );

  const selectedClass = useMemo(() => {
    return classrooms.find((c) => c.id === selectedClassId) || null;
  }, [classrooms, selectedClassId]);

  const activeClasses = useMemo(() => {
    return classrooms.filter((c) => c.status === "active");
  }, [classrooms]);

  const selectedPackage = useMemo(() => {
    const pkgId = selectedClass?.packageId;
    return packages.find((p) => p.id === pkgId) || null;
  }, [selectedClass, packages]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setStudentSearch("");
      setSelectedStudentId("");
      setSelectedClassId("");
      setStartDate(new Date().toISOString().split("T")[0]);
      setExpectedEndDate("");
      setNote("");
    }
  }, [open]);

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    const cls = classrooms.find((c) => c.id === classId);
    if (cls) {
      if (cls.startDate) setStartDate(cls.startDate);
      if (cls.expectedEndDate) setExpectedEndDate(cls.expectedEndDate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedClassId || !startDate || !expectedEndDate) {
      toast.error(t("common.requiredFields", { defaultValue: "Please complete all required fields" }));
      return;
    }

    if (studentHasActiveEnrollment) {
      toast.error(
        t("enrollment.activeExists", {
          defaultValue: "Student already has an active enrollment. Please transfer or complete previous studies first.",
        })
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await enrollmentService.createEnrollment(
        {
          studentId: selectedStudentId,
          classroomId: selectedClassId,
          packageId: selectedClass?.packageId || "",
          startDate,
          expectedEndDate,
          status: "active",
          note: note.trim(),
        },
        user
      );

      toast.success(t("enrollments.enrollSuccess"));
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to enroll student:", err);
      if (err.message === "UNAUTHORIZED_BRANCH") {
        toast.error(t("common.unauthorizedBranch", { defaultValue: "មិនមានសិទ្ធិចាត់ចែងសាខានេះទេ (Unauthorized branch)" }));
      } else if (err.message === "CLASS_CAPACITY_FULL") {
        toast.error(t("enrollments.capacityFullError"));
      } else if (err.message === "ACTIVE_ENROLLMENT_EXISTS") {
        toast.error(t("enrollment.activeExists"));
      } else {
        toast.error(t("common.errorOccurred", { defaultValue: "Failed to create enrollment" }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {t("enrollments.newEnrollment")}
              </DialogTitle>
              <DialogDescription>
                {t("enrollments.subtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Step 1: Student Selection */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                {t("enrollments.student")} <span className="text-destructive">*</span>
              </span>
              {selectedStudent && (
                <button
                  type="button"
                  onClick={() => setSelectedStudentId("")}
                  className="text-xs text-primary hover:underline"
                >
                  Change student
                </button>
              )}
            </Label>

            {!selectedStudentId ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("enrollments.searchPlaceholder")}
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border divide-y bg-background">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      {t("students.noStudentsFound", { defaultValue: "No students found" })}
                    </div>
                  ) : (
                    filteredStudents.slice(0, 20).map((stu) => {
                      const hasActive = activeStudentEnrollmentMap.has(stu.id);
                      return (
                        <div
                          key={stu.id}
                          onClick={() => {
                            setSelectedStudentId(stu.id);
                          }}
                          className={`flex items-center justify-between p-2.5 hover:bg-muted/50 cursor-pointer transition-colors ${
                            hasActive ? "opacity-75" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={stu.avatarUrl} alt={stu.nameKh} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {stu.nameKh.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium flex items-center gap-2">
                                <span>{stu.nameKh}</span>
                                {stu.nameEn && (
                                  <span className="text-xs text-muted-foreground">
                                    ({stu.nameEn})
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-mono text-muted-foreground">
                                {stu.studentCode}
                              </span>
                            </div>
                          </div>
                          <div>
                            {hasActive ? (
                              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                                Enrolled
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Eligible
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              selectedStudent && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border">
                  <Avatar className="h-10 w-10 border shadow-xs">
                    <AvatarImage src={selectedStudent.avatarUrl} alt={selectedStudent.nameKh} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {selectedStudent.nameKh.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{selectedStudent.nameKh}</span>
                      {selectedStudent.nameEn && (
                        <span className="text-xs text-muted-foreground truncate">
                          ({selectedStudent.nameEn})
                        </span>
                      )}
                      <Badge variant="outline" className="font-mono text-xs">
                        {selectedStudent.studentCode}
                      </Badge>
                    </div>
                    {studentHasActiveEnrollment && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Already has an active class enrollment</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Step 2: Classroom Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 font-medium">
              <School className="h-4 w-4 text-muted-foreground" />
              {t("enrollments.class")} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedClassId}
              onValueChange={handleClassSelect}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("enrollments.filterByClass")} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {activeClasses.map((cls) => {
                  const enrolledCount = activeCountPerClassMap.get(cls.id) || 0;
                  const isFull = cls.capacity ? enrolledCount >= cls.capacity : false;
                  return (
                    <SelectItem
                      key={cls.id}
                      value={cls.id}
                      disabled={isFull}
                    >
                      <div className="flex items-center justify-between gap-4 py-0.5 w-full">
                        <span className="font-medium">{cls.name}</span>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-muted-foreground">
                            {cls.startTime} - {cls.endTime}
                          </span>
                          <Badge
                            variant={isFull ? "destructive" : "outline"}
                            className="text-[10px] py-0 px-1.5"
                          >
                            {enrolledCount}/{cls.capacity || "∞"}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {selectedClass && (
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/30 border text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {selectedClass.startTime} - {selectedClass.endTime} ({selectedClass.scheduleDays?.join(", ")})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span className="truncate">
                    {selectedPackage?.nameKh || selectedPackage?.nameEn || "Standard Course"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="enrStartDate" className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {t("enrollments.startDate")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="enrStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="enrEndDate" className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {t("enrollments.expectedEndDate")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="enrEndDate"
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Step 4: Notes */}
          <div className="space-y-2">
            <Label htmlFor="enrNote" className="font-medium">
              {t("enrollments.note")}
            </Label>
            <Textarea
              id="enrNote"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Registered with discount voucher; transfer requested..."
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedStudentId ||
                !selectedClassId ||
                !startDate ||
                !expectedEndDate ||
                studentHasActiveEnrollment
              }
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? t("common.saving") : t("enrollments.newEnrollment")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
