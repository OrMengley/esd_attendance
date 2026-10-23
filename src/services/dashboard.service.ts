import { classroomService } from "./classroom.service";
import { studyPackageService } from "./study-package.service";
import { userService } from "./user.service";
import { enrollmentService } from "./enrollment.service";
import { studentService } from "./student.service";
import { attendanceService } from "./attendance.service";
import { schoolHolidayService } from "./school-holiday.service";
import { getCambodiaDateTime } from "@/lib/attendance-time-lock";
import { calculateDashboardData } from "@/lib/dashboard-calculator";
import { getEffectiveBranchId } from "@/lib/branch-scoping";
import { DashboardData } from "@/models/dashboard.model";
import { User } from "@/models/user.model";

export const dashboardService = {
  /**
   * Fetches required collections in parallel (no N+1 reads) and returns role-scoped dashboard data.
   */
  async getDashboardData(currentUser: User, branchId?: string | null): Promise<DashboardData> {
    const effectiveBranchId = getEffectiveBranchId(currentUser, branchId);
    const [
      classrooms,
      packages,
      users,
      enrollments,
      students,
      attendance,
      holidays,
    ] = await Promise.all([
      classroomService.getClassrooms(),
      studyPackageService.getStudyPackages(),
      userService.getUsers(),
      enrollmentService.getEnrollments(currentUser, effectiveBranchId),
      studentService.getStudents(),
      attendanceService.getAttendance(),
      schoolHolidayService.getActiveSchoolHolidays(),
    ]);

    const currentDateTime = getCambodiaDateTime();

    return calculateDashboardData({
      user: currentUser,
      classrooms,
      packages,
      users,
      enrollments,
      students,
      attendance,
      holidays,
      branchId: effectiveBranchId,
      currentDateTime,
    });
  },
};
