import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  School,
  ClipboardCheck,
  History,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  GraduationCap,
  Layers,
  Palmtree,
  FileSpreadsheet,
  UserCheck,
  CalendarCheck,
  UserX,
  TrendingUp,
  Edit3,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useSchoolSettings } from "@/hooks/use-school-settings";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const settings = useSchoolSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isTeacher = user?.role === "teacher";

  const navItems = [
    {
      title: t("sidebar.dashboard"),
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["super_admin", "admin", "teacher"],
    },
    {
      title: t("sidebar.students"),
      path: "/students",
      icon: Users,
      roles: ["super_admin", "admin"],
    },
    {
      title: t("sidebar.packages"),
      path: "/packages",
      icon: Layers,
      roles: ["super_admin", "admin"],
    },
    {
      title: t("sidebar.subjects"),
      path: "/subjects",
      icon: BookOpen,
      roles: ["super_admin", "admin"],
    },
    {
      title: t("sidebar.classes"),
      path: "/classes",
      icon: School,
      roles: ["super_admin", "admin"],
    },
    {
      title: t("sidebar.holidays", { defaultValue: "ថ្ងៃឈប់សម្រាក" }),
      path: "/holidays",
      icon: Palmtree,
      roles: ["super_admin", "admin"],
    },
    {
      title: t("sidebar.attendance"),
      path: "/attendance",
      icon: ClipboardCheck,
      roles: ["super_admin", "admin", "teacher"],
    },
    {
      title: t("sidebar.dailySummary", { defaultValue: "សង្ខេបប្រចាំថ្ងៃ" }),
      path: "/daily-attendance-summary",
      icon: CalendarCheck,
      roles: ["super_admin", "admin"],
    },
    {
      title: t("sidebar.attendanceCorrections", { defaultValue: "កែប្រែវត្តមាន" }),
      path: "/attendance-corrections",
      icon: Edit3,
      roles: ["super_admin", "admin"],
    },
    {
      title: t("sidebar.attendanceAuditLogs", { defaultValue: "កំណត់ហេតុកែប្រែវត្តមាន" }),
      path: "/attendance-audit-logs",
      icon: ShieldCheck,
      roles: ["super_admin", "admin"],
    },
    {
      title: t("sidebar.attendanceHistory"),
      path: "/attendance-history",
      icon: History,
      roles: ["super_admin", "admin", "teacher"],
    },
    {
      title: t("sidebar.attendanceReports", { defaultValue: "របាយការណ៍វត្តមាន" }),
      path: "/attendance-reports",
      icon: FileSpreadsheet,
      roles: ["super_admin", "admin", "teacher"],
    },
    {
      title: t("sidebar.studentAttendance", { defaultValue: "វត្តមានតាមសិស្ស" }),
      path: "/student-attendance",
      icon: UserCheck,
      roles: ["super_admin", "admin", "teacher"],
    },
    {
      title: t("sidebar.absenceLateReport", { defaultValue: "អវត្តមាន & មកយឺត" }),
      path: "/absence-late-report",
      icon: UserX,
      roles: ["super_admin", "admin"],
    },
    {
      title: t("sidebar.classProgressReport", { defaultValue: "វឌ្ឍនភាពថ្នាក់រៀន" }),
      path: "/class-progress-report",
      icon: TrendingUp,
      roles: ["super_admin", "admin"],
    },
    {
      title: t("sidebar.users"),
      path: "/users",
      icon: UserCog,
      roles: ["super_admin", "admin"],
    },
    {
      title: t("sidebar.settings"),
      path: "/settings",
      icon: Settings,
      roles: ["super_admin", "admin"],
    },
  ];

  const allowedNavItems = navItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-[#1E347B] text-white transition-all duration-300 border-r border-[#263E89]/70 z-30 shrink-0",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-[#263E89]/70 bg-[#16213D]/40 transition-all",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {collapsed ? (
          <button
            onClick={onToggleCollapse}
            title={t("sidebar.expand")}
            className="h-10 w-10 rounded-xl bg-white hover:bg-slate-100 flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 group relative overflow-hidden p-1"
          >
            <img
              src={settings.logoUrl || "/images/Logo-Wat-Soriyaram-Training-Computer-School.png"}
              alt="Logo"
              className="h-full w-full object-contain"
            />
            <div className="absolute left-full ml-3 hidden rounded-lg bg-[#16213D] px-2.5 py-1 text-xs text-white shadow-xl group-hover:block z-50 whitespace-nowrap border border-[#263E89] font-khmer">
              {t("sidebar.expand")}
            </div>
          </button>
        ) : (
          <>
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="h-10 w-10 min-w-[2.5rem] rounded-xl bg-white p-1 flex items-center justify-center shadow-md overflow-hidden shrink-0">
                <img
                  src={settings.logoUrl || "/images/Logo-Wat-Soriyaram-Training-Computer-School.png"}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-wide text-white truncate font-khmer">
                  {settings.centerName || t("app.title")}
                </span>
                <span className="text-[11px] text-white/70 font-medium truncate">
                  {t("app.subtitle")}
                </span>
              </div>
            </div>

            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title={t("sidebar.collapse")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Navigation List */}
      <div className={cn("flex-1 overflow-y-auto py-4 space-y-1.5", collapsed ? "px-2" : "px-3")}>
        {!collapsed && (
          <div className="px-3 py-1 text-[11px] font-semibold text-white/60 uppercase tracking-wider">
            {isTeacher ? t("sidebar.teacherMenu") : t("sidebar.mainMenu")}
          </div>
        )}

        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-xl text-sm font-medium transition-all group relative",
                  collapsed
                    ? "justify-center w-11 h-11 mx-auto"
                    : "px-3 py-2.5 w-full",
                  isActive
                    ? "bg-[#F3B51B] text-[#16213D] font-bold shadow-md shadow-amber-950/20"
                    : "text-white/80 hover:bg-[#3D58AE] hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                      isActive ? "text-[#16213D]" : "text-white/70 group-hover:text-white"
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate text-xs font-semibold ml-3">
                      {item.title}
                    </span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-3 hidden rounded-lg bg-[#16213D] px-3 py-1.5 text-xs text-white shadow-xl group-hover:flex items-center z-50 whitespace-nowrap border border-[#263E89] pointer-events-none">
                      {item.title}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className={cn("border-t border-[#263E89]/70 bg-[#16213D]/40", collapsed ? "p-2 space-y-2" : "p-3 space-y-2")}>
        {collapsed ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="group relative">
              <Avatar className="h-10 w-10 ring-2 ring-[#3D58AE] cursor-pointer">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-[#314B9C] text-white font-bold text-xs">
                  {user?.name ? user.name.charAt(0) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute left-full bottom-0 ml-3 hidden rounded-lg bg-[#16213D] p-2 text-xs text-white shadow-xl group-hover:block z-50 whitespace-nowrap border border-[#263E89] pointer-events-none">
                <p className="font-semibold text-white">{user?.name}</p>
                <p className="text-[10px] text-white/70 capitalize">@{user?.username}</p>
                <div className="pt-1">
                  <StatusBadge role={user?.role} className="text-[10px] py-0 px-1" />
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title={t("sidebar.logout")}
              className="h-10 w-10 text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded-xl"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#16213D]/70 border border-[#263E89]/80">
              <Avatar className="h-9 w-9 ring-1 ring-[#3D58AE] shrink-0">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-[#314B9C] text-white font-bold text-xs">
                  {user?.name ? user.name.charAt(0) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || t("header.guest")}
                </p>
                <div className="mt-0.5">
                  <StatusBadge role={user?.role} className="text-[10px] py-0 px-1.5" />
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 justify-start text-xs font-medium h-9 rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2 shrink-0" />
              <span>{t("sidebar.logout")}</span>
            </Button>
          </>
        )}
      </div>
    </aside>
  );
};
