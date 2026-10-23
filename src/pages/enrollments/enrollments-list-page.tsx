import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnrollmentsTable } from "@/components/enrollments/enrollments-table";
import { EnrollStudentDialog } from "@/components/enrollments/enroll-student-dialog";
import { enrollmentService } from "@/services/enrollment.service";
import { studentService } from "@/services/student.service";
import { classroomService } from "@/services/classroom.service";
import { studyPackageService } from "@/services/study-package.service";
import { branchService } from "@/services/branch.service";
import { userService } from "@/services/user.service";
import { Enrollment } from "@/models/enrollment.model";
import { Student } from "@/models/student.model";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { Branch } from "@/models/branch.model";
import { User } from "@/models/user.model";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { filterStudentsByBranch } from "@/lib/branch-scoping";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Award,
  ArrowRightLeft,
  PauseCircle,
  Layers,
  RotateCw,
} from "lucide-react";

export const EnrollmentsListPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentBranchId, isAllBranches } = useBranch();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [packages, setPackages] = useState<StudyPackage[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const effectiveBranch = user?.role === "super_admin" ? (isAllBranches ? null : currentBranchId) : user?.branchId;
      const [enrList, stdList, clsList, pkgList, brList, usrList] =
        await Promise.all([
          enrollmentService.getEnrollments(user, currentBranchId),
          studentService.getStudents(effectiveBranch),
          classroomService.getClassrooms(effectiveBranch),
          studyPackageService.getStudyPackages(),
          branchService.getBranches(),
          userService.getUsers(),
        ]);

      setEnrollments(enrList);
      setStudents(stdList);
      setClassrooms(clsList);
      setPackages(pkgList);
      setBranches(brList);
      setTeachers(usrList.filter((u: User) => u.role === "teacher" || u.role === "admin"));
    } catch (err) {
      console.error("Failed to load enrollments data:", err);
      toast.error(t("enrollments.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fast maps
  const studentsMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const classroomsMap = useMemo(() => {
    const map = new Map<string, Classroom>();
    classrooms.forEach((c) => map.set(c.id, c));
    return map;
  }, [classrooms]);

  // Scope classrooms to current branch
  const scopedClassrooms = useMemo(() => {
    if (isAllBranches || !currentBranchId) return classrooms;
    return classrooms.filter((c) => c.branchId === currentBranchId);
  }, [classrooms, isAllBranches, currentBranchId]);

  // Scope students to current branch
  const scopedStudents = useMemo(() => {
    if (isAllBranches || !currentBranchId) return students;
    return filterStudentsByBranch(students, enrollments, classrooms, currentBranchId);
  }, [students, enrollments, classrooms, isAllBranches, currentBranchId]);

  // Scope enrollments to current branch
  const scopedEnrollments = useMemo(() => {
    if (isAllBranches || !currentBranchId) return enrollments;
    return enrollments.filter((e) => {
      const cls = classroomsMap.get(e.classroomId);
      if (cls && cls.branchId) {
        return cls.branchId === currentBranchId;
      }
      const stu = studentsMap.get(e.studentId);
      return stu?.branchId === currentBranchId;
    });
  }, [enrollments, classroomsMap, studentsMap, isAllBranches, currentBranchId]);

  // If selected class is outside scopedClassrooms, reset to "all"
  useEffect(() => {
    if (selectedClass !== "all" && !scopedClassrooms.some((c) => c.id === selectedClass)) {
      setSelectedClass("all");
    }
  }, [scopedClassrooms, selectedClass]);

  // Filtered enrollments for table
  const filteredEnrollments = useMemo(() => {
    return scopedEnrollments.filter((enr) => {
      // 1. Status Filter
      if (selectedStatus !== "all" && enr.status !== selectedStatus) {
        return false;
      }

      // 2. Class Filter
      if (selectedClass !== "all" && enr.classroomId !== selectedClass) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const student = studentsMap.get(enr.studentId);
        const classroom = classroomsMap.get(enr.classroomId);

        const matchStudentCode = (student?.studentCode || "").toLowerCase().includes(q);
        const matchKh = (student?.nameKh || "").toLowerCase().includes(q);
        const matchEn = (student?.nameEn || "").toLowerCase().includes(q);
        const matchPhone = (student?.phone || "").toLowerCase().includes(q);
        const matchClassName = (classroom?.name || "").toLowerCase().includes(q);
        const matchClassCode = (classroom?.code || "").toLowerCase().includes(q);
        const matchNote = (enr.note || "").toLowerCase().includes(q);

        if (
          !matchStudentCode &&
          !matchKh &&
          !matchEn &&
          !matchPhone &&
          !matchClassName &&
          !matchClassCode &&
          !matchNote
        ) {
          return false;
        }
      }

      return true;
    });
  }, [scopedEnrollments, selectedStatus, selectedClass, searchQuery, studentsMap, classroomsMap]);

  // Metrics summary based on scopedEnrollments
  const totalCount = scopedEnrollments.length;
  const activeCount = scopedEnrollments.filter((e) => e.status === "active").length;
  const completedCount = scopedEnrollments.filter((e) => e.status === "completed").length;
  const transferredCount = scopedEnrollments.filter((e) => e.status === "transferred").length;
  const pausedCancelledCount = scopedEnrollments.filter(
    (e) => e.status === "paused" || e.status === "cancelled"
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <PageHeader
        title={t("enrollments.title")}
        description={t("enrollments.subtitle")}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="h-9 gap-1.5 shadow-2xs"
          >
            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{t("common.refresh")}</span>
          </Button>

          <Button
            onClick={() => setIsEnrollDialogOpen(true)}
            className="h-9 gap-1.5 shadow-sm font-medium"
          >
            <UserPlus className="h-4 w-4" />
            <span>{t("enrollments.newEnrollment")}</span>
          </Button>
        </div>
      </PageHeader>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total */}
        <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-foreground">
              {totalCount}
            </div>
            <div className="text-xs text-muted-foreground font-khmer">
              {t("enrollments.totalEnrollments")}
            </div>
          </div>
        </div>

        {/* Active */}
        <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </div>
            <div className="text-xs text-muted-foreground font-khmer">
              {t("enrollments.activeEnrollments")}
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-sky-600 dark:text-sky-400">
              {completedCount}
            </div>
            <div className="text-xs text-muted-foreground font-khmer">
              {t("enrollments.completedEnrollments")}
            </div>
          </div>
        </div>

        {/* Transferred */}
        <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {transferredCount}
            </div>
            <div className="text-xs text-muted-foreground font-khmer">
              {t("enrollments.transferredEnrollments")}
            </div>
          </div>
        </div>

        {/* Paused / Cancelled */}
        <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <PauseCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {pausedCancelledCount}
            </div>
            <div className="text-xs text-muted-foreground font-khmer">
              {t("enrollments.pausedCancelled")}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("enrollments.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card h-10"
          />
        </div>

        {/* Filter by Classroom */}
        <div className="w-full sm:w-60">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="bg-card h-10">
              <SelectValue placeholder={t("enrollments.filterByClass")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("enrollments.allClasses")}</SelectItem>
              {scopedClassrooms.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} ({cls.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter by Status */}
        <div className="w-full sm:w-48">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="bg-card h-10">
              <SelectValue placeholder={t("enrollments.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("enrollments.allStatuses")}</SelectItem>
              <SelectItem value="active">{t("enrollments.activeEnrollments")}</SelectItem>
              <SelectItem value="completed">{t("enrollments.completedEnrollments")}</SelectItem>
              <SelectItem value="transferred">{t("enrollments.transferredEnrollments")}</SelectItem>
              <SelectItem value="paused">{t("enrollment.statusPaused", { defaultValue: "Paused" })}</SelectItem>
              <SelectItem value="cancelled">{t("enrollment.statusCancelled", { defaultValue: "Cancelled" })}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enrollments Table */}
      {loading ? (
        <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground animate-pulse">
          {t("common.loading")}
        </div>
      ) : (
        <EnrollmentsTable
          enrollments={filteredEnrollments}
          students={scopedStudents}
          classrooms={scopedClassrooms}
          packages={packages}
          branches={branches}
          teachers={teachers}
          onRefresh={loadData}
        />
      )}

      {/* New Enrollment Dialog */}
      <EnrollStudentDialog
        open={isEnrollDialogOpen}
        onOpenChange={setIsEnrollDialogOpen}
        students={scopedStudents}
        classrooms={scopedClassrooms}
        packages={packages}
        existingEnrollments={enrollments}
        onSuccess={loadData}
      />
    </div>
  );
};
