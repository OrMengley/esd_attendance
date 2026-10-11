import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { dashboardService } from "@/services/dashboard.service";
import { DashboardData } from "@/models/dashboard.model";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const data = await dashboardService.getDashboardData(user);
      setDashboardData(data);
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
      if (!silent) {
        toast.error(t("common.error", { defaultValue: "Failed to load dashboard data" }));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, t]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Update time-sensitive session state every minute without reloading the entire app
  useEffect(() => {
    const ticker = setInterval(() => {
      loadData(true);
    }, 60000);
    return () => clearInterval(ticker);
  }, [loadData]);

  if (!user) return null;

  const isAdmin = user.role === "super_admin" || user.role === "admin";
  const isTeacher = user.role === "teacher";

  return (
    <div className="space-y-6">
      {/* Shared Dashboard Header */}
      <DashboardHeader
        user={user}
        isRefreshing={isRefreshing}
        onRefresh={() => loadData(true)}
      />

      {/* Main Content / Loading Skeletons */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          {/* Top summary cards skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>

          {/* Main cards skeleton */}
          <Skeleton className="h-44 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-72 rounded-2xl lg:col-span-1" />
          </div>
        </div>
      ) : dashboardData ? (
        <>
          {isAdmin && <AdminDashboard data={dashboardData} />}
          {isTeacher && <TeacherDashboard data={dashboardData} />}
        </>
      ) : null}
    </div>
  );
};
