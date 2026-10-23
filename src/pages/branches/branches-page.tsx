import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/page-header";
import { BranchTable } from "@/components/branches/branch-table";
import { BranchDialog } from "@/components/branches/branch-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { branchService } from "@/services/branch.service";
import { classroomService } from "@/services/classroom.service";
import { Branch, BranchStatus } from "@/models/branch.model";
import { Classroom } from "@/models/classroom.model";
import { filterBranches } from "@/lib/branch-validation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Star,
  CheckCircle2,
  School,
  AlertCircle,
} from "lucide-react";

export const BranchesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BranchStatus>("all");

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null);

  // Delete Dialog States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect non-super-admins immediately
  useEffect(() => {
    if (user && user.role !== "super_admin") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [branchList, classList] = await Promise.all([
        branchService.getBranches(),
        classroomService.getClassrooms(),
      ]);
      setBranches(branchList);
      setClassrooms(classList);
    } catch (err) {
      console.error("Failed to load branches:", err);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map of branchId -> active class count
  const classCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    classrooms.forEach((c) => {
      if (c.branchId) {
        map[c.branchId] = (map[c.branchId] || 0) + 1;
      }
    });
    return map;
  }, [classrooms]);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return filterBranches(branches, searchQuery, statusFilter);
  }, [branches, searchQuery, statusFilter]);

  // Statistics
  const activeCount = useMemo(() => {
    return branches.filter((b) => b.status === "active").length;
  }, [branches]);

  const mainBranch = useMemo(() => {
    return branches.find((b) => b.isMain);
  }, [branches]);

  // Handlers
  const handleOpenCreate = () => {
    setBranchToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setBranchToEdit(branch);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (
    data: Omit<Branch, "id" | "createdAt" | "updatedAt">
  ) => {
    if (branchToEdit) {
      await branchService.updateBranch(branchToEdit.id, data, user?.id);
      toast.success(t("branches.updateSuccess"));
    } else {
      await branchService.createBranch(data, user?.id);
      toast.success(t("branches.createSuccess"));
    }
    await loadData();
  };

  const handleToggleStatus = async (branch: Branch) => {
    const newStatus: BranchStatus = branch.status === "active" ? "inactive" : "active";
    try {
      await branchService.setBranchStatus(branch.id, newStatus, user?.id);
      toast.success(t("branches.updateSuccess"));
      await loadData();
    } catch (err: any) {
      console.error("Failed to toggle status:", err);
      toast.error(err?.message || t("common.error"));
    }
  };

  const handleOpenDelete = (branch: Branch) => {
    if (branch.isMain) {
      toast.error(t("branches.cannotDeleteMain"));
      return;
    }

    const linkedClasses = classrooms.filter(
      (c) => c.branchId === branch.id && c.status === "active"
    );
    if (linkedClasses.length > 0) {
      toast.error(
        t("branches.cannotDeleteInUse", { count: linkedClasses.length })
      );
      return;
    }

    setBranchToDelete(branch);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!branchToDelete) return;

    setIsDeleting(true);
    try {
      const res = await branchService.deleteBranch(branchToDelete.id, user?.id);
      if (!res.success) {
        if (res.error === "CANNOT_DELETE_MAIN") {
          toast.error(t("branches.cannotDeleteMain"));
        } else if (res.error === "BRANCH_IN_USE") {
          toast.error(
            t("branches.cannotDeleteInUse", { count: res.activeClassCount || 0 })
          );
        } else {
          toast.error(t("common.error"));
        }
        return;
      }

      toast.success(t("branches.deleteSuccess"));
      setIsDeleteDialogOpen(false);
      setBranchToDelete(null);
      await loadData();
    } catch (err) {
      console.error("Failed to delete branch:", err);
      toast.error(t("common.error"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("branches.pageTitle")}
        description={t("branches.description")}
      >
        <Button onClick={handleOpenCreate} className="gap-2 font-khmer shadow-sm">
          <Plus className="h-4 w-4" />
          <span>{t("branches.addBranch")}</span>
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Branches */}
        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-khmer">
                {t("branches.totalBranches")}
              </p>
              <p className="text-2xl font-bold font-mono text-foreground">
                {branches.length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Active Campuses */}
        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-khmer">
                {t("branches.activeBranches")}
              </p>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Main Campus */}
        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1 min-w-0 pr-2">
              <p className="text-xs text-muted-foreground font-khmer flex items-center gap-1">
                <span>{t("branches.mainCampus")}</span>
              </p>
              <p className="text-sm font-bold font-khmer text-foreground truncate">
                {mainBranch ? mainBranch.nameKh : "—"}
              </p>
              {mainBranch?.code && (
                <span className="font-mono text-[11px] text-muted-foreground block">
                  {mainBranch.code}
                </span>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <Star className="h-5 w-5 fill-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(val: any) => setStatusFilter(val)}
          >
            <SelectTrigger className="h-9 w-36 text-xs font-khmer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-xs font-khmer">
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="active">{t("common.active", { defaultValue: "សកម្ម" })}</SelectItem>
              <SelectItem value="inactive">{t("common.inactive", { defaultValue: "អសកម្ម" })}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={loadData}
            title={t("common.refresh")}
            className="h-9 w-9 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredBranches.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t("branches.noBranches")}
          description={t("branches.noBranchesDesc")}
          actionLabel={
            searchQuery || statusFilter !== "all"
              ? t("common.refresh")
              : t("branches.addBranch")
          }
          onAction={
            searchQuery || statusFilter !== "all"
              ? () => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }
              : handleOpenCreate
          }
        />
      ) : (
        <BranchTable
          branches={filteredBranches}
          classCountMap={classCountMap}
          onEdit={handleOpenEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleOpenDelete}
        />
      )}

      {/* Create / Edit Dialog */}
      <BranchDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        branchToEdit={branchToEdit}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("branches.deleteConfirmTitle")}
        description={
          branchToDelete
            ? t("branches.deleteConfirmDesc", { name: branchToDelete.nameKh })
            : ""
        }
        confirmLabel={t("common.delete")}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};
