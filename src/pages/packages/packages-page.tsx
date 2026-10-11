import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { PackageTable } from "@/components/packages/package-table";
import { PackageDialog } from "@/components/packages/package-dialog";
import { ModuleListDialog } from "@/components/packages/module-list-dialog";
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
import { studyPackageService } from "@/services/study-package.service";
import { courseModuleService } from "@/services/course-module.service";
import { StudyPackage, PackageStatus } from "@/models/study-package.model";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Plus, Search, Layers, RefreshCw, BookOpen } from "lucide-react";

export const PackagesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [packages, setPackages] = useState<StudyPackage[]>([]);
  const [modulesCountMap, setModulesCountMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PackageStatus>("all");

  // Dialogs
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  const [packageToEdit, setPackageToEdit] = useState<StudyPackage | null>(null);

  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false);
  const [packageForModules, setPackageForModules] = useState<StudyPackage | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pkgs, allModules] = await Promise.all([
        studyPackageService.getStudyPackages(),
        courseModuleService.getAllCourseModules(),
      ]);

      // Calculate module counts per package
      const countMap: Record<string, number> = {};
      allModules.forEach((mod) => {
        if (mod.packageId) {
          countMap[mod.packageId] = (countMap[mod.packageId] || 0) + 1;
        }
      });

      setPackages(pkgs);
      setModulesCountMap(countMap);
    } catch (error) {
      console.error("Failed to load study packages:", error);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // Status filter
      if (statusFilter !== "all" && pkg.status !== statusFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchCode = pkg.code.toLowerCase().includes(query);
        const matchNameKh = pkg.nameKh.toLowerCase().includes(query);
        const matchNameEn = (pkg.nameEn || "").toLowerCase().includes(query);
        if (!matchCode && !matchNameKh && !matchNameEn) {
          return false;
        }
      }

      return true;
    });
  }, [packages, statusFilter, searchQuery]);

  // Handlers
  const handleOpenAdd = () => {
    setPackageToEdit(null);
    setIsPackageDialogOpen(true);
  };

  const handleOpenEdit = (pkg: StudyPackage) => {
    setPackageToEdit(pkg);
    setIsPackageDialogOpen(true);
  };

  const handleSavePackage = async (
    data: Omit<StudyPackage, "id" | "createdAt" | "updatedAt">
  ) => {
    if (packageToEdit) {
      await studyPackageService.updateStudyPackage(packageToEdit.id, data, user?.id);
    } else {
      await studyPackageService.createStudyPackage(data, user?.id);
    }
    toast.success(t("packages.saveSuccess"));
    await loadData();
  };

  const handleOpenModules = (pkg: StudyPackage) => {
    setPackageForModules(pkg);
    setIsModulesDialogOpen(true);
  };

  const handleToggleStatus = async (pkg: StudyPackage) => {
    const nextStatus: PackageStatus = pkg.status === "active" ? "inactive" : "active";
    try {
      await studyPackageService.setStudyPackageStatus(pkg.id, nextStatus, user?.id);
      toast.success(t("packages.statusUpdateSuccess"));
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error(t("common.error"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("packages.title")}
        description={t("packages.description")}
      >
        <Button
          onClick={handleOpenAdd}
          variant="gradient"
          className="gap-2 shadow-sm font-khmer text-xs sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          {t("packages.addPackage")}
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-card p-4 rounded-xl border border-border/80 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("packages.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs sm:text-sm bg-background/70"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Select
            value={statusFilter}
            onValueChange={(val: "all" | PackageStatus) => setStatusFilter(val)}
          >
            <SelectTrigger className="w-[160px] text-xs">
              <SelectValue placeholder={t("packages.allStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("packages.allStatus")}</SelectItem>
              <SelectItem value="active">{t("packages.activeStatus")}</SelectItem>
              <SelectItem value="inactive">{t("packages.inactiveStatus")}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={loadData}
            title={t("common.refresh")}
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-full bg-muted/40 animate-pulse rounded-xl border border-border/50"
            />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={t("packages.emptyTitle")}
          description={t("packages.emptyDesc")}
          actionLabel={t("packages.addPackage")}
          onAction={handleOpenAdd}
        />
      ) : filteredPackages.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card/50 rounded-2xl border border-dashed border-border/80">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground font-khmer">
            {t("common.noData")}
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 font-khmer">
            {t("common.noDataDesc")}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="mt-3 text-xs text-primary"
          >
            {t("common.refresh")}
          </Button>
        </div>
      ) : (
        <PackageTable
          packages={filteredPackages}
          modulesCountMap={modulesCountMap}
          onEdit={handleOpenEdit}
          onViewModules={handleOpenModules}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Add / Edit Package Dialog */}
      <PackageDialog
        open={isPackageDialogOpen}
        onOpenChange={setIsPackageDialogOpen}
        packageToEdit={packageToEdit}
        onSubmit={handleSavePackage}
      />

      {/* Modules List & Management Dialog */}
      <ModuleListDialog
        open={isModulesDialogOpen}
        onOpenChange={setIsModulesDialogOpen}
        pkg={packageForModules}
        onModulesUpdated={loadData}
      />
    </div>
  );
};

export default PackagesPage;
