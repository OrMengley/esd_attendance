import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { StudentTable } from "@/components/students/student-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { studentService } from "@/services/student.service";
import { classroomService } from "@/services/classroom.service";
import { enrollmentService } from "@/services/enrollment.service";
import { Student, StudentStatus } from "@/models/student.model";
import { Classroom } from "@/models/classroom.model";
import { Enrollment } from "@/models/enrollment.model";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  School,
  Users,
  Sparkles,
  Filter,
  CheckCircle2,
  PauseCircle,
  Archive,
} from "lucide-react";

export const StudentsListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInsertingTest, setIsInsertingTest] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stdList, clsList, enrList] = await Promise.all([
        studentService.getStudents(),
        classroomService.getClassrooms(),
        enrollmentService.getEnrollments(),
      ]);
      setStudents(stdList);
      setClassrooms(clsList);
      setEnrollments(enrList);
    } catch (e) {
      console.error(e);
      toast.error(t("students.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map of studentId -> active Enrollment
  const activeEnrollmentsMap = useMemo(() => {
    const map: Record<string, Enrollment> = {};
    enrollments.forEach((e) => {
      if (e.status === "active") {
        map[e.studentId] = e;
      }
    });
    return map;
  }, [enrollments]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = (student.studentCode || "").toLowerCase().includes(q);
        const matchKh = (student.nameKh || "").toLowerCase().includes(q);
        const matchEn = (student.nameEn || "").toLowerCase().includes(q);
        const matchPhone = (student.phone || "").toLowerCase().includes(q);
        const matchFatherPhone = (student.fatherPhone || "")
          .toLowerCase()
          .includes(q);
        const matchMotherPhone = (student.motherPhone || "")
          .toLowerCase()
          .includes(q);

        if (
          !matchCode &&
          !matchKh &&
          !matchEn &&
          !matchPhone &&
          !matchFatherPhone &&
          !matchMotherPhone
        ) {
          return false;
        }
      }

      // 2. Class filter
      if (selectedClass !== "all") {
        const activeEnr = activeEnrollmentsMap[student.id];
        if (!activeEnr || activeEnr.classroomId !== selectedClass) {
          return false;
        }
      }

      // 3. Status filter
      if (selectedStatus !== "all") {
        if (student.status !== selectedStatus) {
          return false;
        }
      } else {
        // By default, if "all" is selected, we still show all except maybe you want all 3
        // Show everything including archived when requested
      }

      return true;
    });
  }, [students, searchQuery, selectedClass, selectedStatus, activeEnrollmentsMap]);

  // Insert Test Student
  const handleInsertTestStudent = async () => {
    setIsInsertingTest(true);
    try {
      const result = await studentService.insertTestStudent(user?.id);
      if (result.success && result.student) {
        toast.success(t("students.created"));
        await loadData();
      } else {
        toast.error(result.error || t("common.error"));
      }
    } catch (e: any) {
      toast.error(e?.message || t("common.error"));
    } finally {
      setIsInsertingTest(false);
    }
  };

  // Stats
  const activeCount = students.filter((s) => s.status === "active").length;
  const inactiveCount = students.filter((s) => s.status === "inactive").length;
  const archivedCount = students.filter((s) => s.status === "archived").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title={t("students.title")}
        description={t("students.description")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleInsertTestStudent}
            disabled={isInsertingTest}
            className="text-xs font-khmer h-9 gap-1.5 border-dashed"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>
              {isInsertingTest
                ? t("students.testStudentLoading")
                : t("students.testStudent")}
            </span>
          </Button>

          <Button
            asChild
            variant="default"
            className="text-xs font-khmer h-9 gap-1.5 shadow-sm"
          >
            <Link to="/students/new">
              <UserPlus className="h-4 w-4" />
              <span>{t("students.addStudent")}</span>
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-foreground">
              {students.length}
            </div>
            <div className="text-xs text-muted-foreground font-khmer">
              {t("students.totalStudents")}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </div>
            <div className="text-xs text-muted-foreground font-khmer">
              {t("students.activeStudents")}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <PauseCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {inactiveCount}
            </div>
            <div className="text-xs text-muted-foreground font-khmer">
              {t("students.inactiveStudents")}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-600 dark:text-slate-400">
              {archivedCount}
            </div>
            <div className="text-xs text-muted-foreground font-khmer">
              {t("students.archivedStudents")}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("students.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs sm:text-sm h-10 bg-background"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Active Class Filter */}
          <div className="w-full sm:w-56">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="text-xs sm:text-sm h-10 bg-background font-khmer">
                <SelectValue placeholder={t("students.allClassrooms")} />
              </SelectTrigger>
              <SelectContent className="font-khmer max-h-64">
                <SelectItem value="all">{t("students.allClassrooms")}</SelectItem>
                {classrooms.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student Status Filter */}
          <div className="w-full sm:w-44">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="text-xs sm:text-sm h-10 bg-background font-khmer">
                <SelectValue placeholder={t("students.allStatus")} />
              </SelectTrigger>
              <SelectContent className="font-khmer">
                <SelectItem value="all">{t("students.allStatus")}</SelectItem>
                <SelectItem value="active">{t("students.statusActive")}</SelectItem>
                <SelectItem value="inactive">
                  {t("students.statusInactive")}
                </SelectItem>
                <SelectItem value="archived">
                  {t("students.statusArchived")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-card rounded-2xl border animate-pulse" />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title={
            students.length === 0
              ? t("students.noStudentsTitle")
              : t("students.noStudentsFiltered")
          }
          description={
            students.length === 0
              ? t("students.noStudentsEmpty")
              : t("students.noStudentsFiltered")
          }
          icon={Users}
          actionLabel={students.length === 0 ? t("students.addStudent") : undefined}
          onAction={
            students.length === 0
              ? () => navigate("/students/new")
              : undefined
          }
        />
      ) : (
        <StudentTable
          students={filteredStudents}
          activeEnrollments={activeEnrollmentsMap}
          classrooms={classrooms}
          onRefresh={loadData}
        />
      )}
    </div>
  );
};
