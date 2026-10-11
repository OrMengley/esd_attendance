import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudyPackage } from "@/models/study-package.model";
import { CourseModule } from "@/models/course-module.model";
import { courseModuleService } from "@/services/course-module.service";
import { ModuleDialog } from "./module-dialog";
import { ModuleDeleteDialog } from "./module-delete-dialog";
import { PackageStatusBadge } from "./package-status-badge";
import { toast } from "sonner";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Layers,
  Clock,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface ModuleListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg: StudyPackage | null;
  onModulesUpdated?: () => void;
}

export const ModuleListDialog: React.FC<ModuleListDialogProps> = ({
  open,
  onOpenChange,
  pkg,
  onModulesUpdated,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [modules, setModules] = useState<CourseModule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [moduleToEdit, setModuleToEdit] = useState<CourseModule | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<CourseModule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadModules = useCallback(async () => {
    if (!pkg) return;
    setIsLoading(true);
    try {
      const data = await courseModuleService.getCourseModulesByPackageId(pkg.id);
      setModules(data);
    } catch (error) {
      console.error("Failed to fetch modules:", error);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }, [pkg, t]);

  useEffect(() => {
    if (open && pkg) {
      loadModules();
    } else {
      setModules([]);
    }
  }, [open, pkg, loadModules]);

  const handleSaveModule = async (
    data: Omit<CourseModule, "id" | "createdAt" | "updatedAt">
  ) => {
    if (!pkg) return;
    if (moduleToEdit) {
      await courseModuleService.updateCourseModule(moduleToEdit.id, data, user?.id);
    } else {
      await courseModuleService.createCourseModule(data, user?.id);
    }
    toast.success(t("packages.moduleSaveSuccess"));
    await loadModules();
    onModulesUpdated?.();
  };

  const handleDeleteModule = async () => {
    if (!moduleToDelete || !pkg) return;
    try {
      await courseModuleService.deleteCourseModule(moduleToDelete.id, pkg.id, user?.id);
      toast.success(t("packages.moduleDeleteSuccess"));
      setModuleToDelete(null);
      await loadModules();
      onModulesUpdated?.();
    } catch (error) {
      console.error(error);
      toast.error(t("common.error"));
    }
  };

  const handleMove = async (moduleId: string, direction: "up" | "down") => {
    if (!pkg) return;
    try {
      const updated = await courseModuleService.moveModule(
        pkg.id,
        moduleId,
        direction,
        user?.id
      );
      setModules(updated);
      toast.success(t("packages.moduleOrderSuccess"));
      onModulesUpdated?.();
    } catch (error) {
      console.error(error);
      toast.error(t("common.error"));
    }
  };

  const totalModuleHours = modules.reduce(
    (sum, m) => sum + (Number(m.plannedHours) || 0),
    0
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="pb-3 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-xl font-bold font-khmer flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {pkg?.nameKh}
                  </DialogTitle>
                  {pkg?.nameEn && (
                    <span className="text-sm font-medium text-muted-foreground">
                      ({pkg.nameEn})
                    </span>
                  )}
                  <Badge variant="outline" className="font-mono text-xs uppercase bg-muted/60">
                    {pkg?.code}
                  </Badge>
                </div>
                <DialogDescription className="text-xs font-khmer text-muted-foreground">
                  {t("packages.modulesDesc")}
                </DialogDescription>
              </div>

              <Button
                onClick={() => {
                  setModuleToEdit(null);
                  setIsModuleDialogOpen(true);
                }}
                variant="gradient"
                size="sm"
                className="gap-1.5 shadow-sm text-xs self-start sm:self-auto shrink-0"
              >
                <Plus className="h-4 w-4" />
                {t("packages.addModule")}
              </Button>
            </div>

            {/* Quick stats pills */}
            {pkg && (
              <div className="flex items-center gap-3 pt-3 flex-wrap text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/40">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {t("packages.modulesCount")}:{" "}
                    <strong className="text-foreground">{modules.length}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/40">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>
                    {t("packages.totalPlannedHours")}:{" "}
                    <strong className="text-foreground">{pkg.totalPlannedHours} {t("packages.hoursUnit")}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/40">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  <span>
                    {t("packages.totalModulesHours")}:{" "}
                    <strong className="text-foreground">{totalModuleHours} {t("packages.hoursUnit")}</strong>
                  </span>
                </div>

                {pkg.totalPlannedHours !== totalModuleHours && totalModuleHours > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-khmer">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>
                      ({pkg.totalPlannedHours} vs {totalModuleHours} {t("packages.hoursUnit")})
                    </span>
                  </div>
                )}
              </div>
            )}
          </DialogHeader>

          {/* Module List Body */}
          <div className="flex-1 overflow-y-auto py-2">
            {isLoading ? (
              <div className="space-y-3 py-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 w-full bg-muted/40 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : modules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                  <Layers className="h-7 w-7 text-primary/70" />
                </div>
                <h4 className="text-sm font-bold font-khmer text-foreground">
                  {t("packages.emptyModulesTitle")}
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 font-khmer">
                  {t("packages.emptyModulesDesc")}
                </p>
                <Button
                  onClick={() => {
                    setModuleToEdit(null);
                    setIsModuleDialogOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-1.5 text-xs font-khmer"
                >
                  <Plus className="h-4 w-4" />
                  {t("packages.addModule")}
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-border/70 overflow-hidden shadow-xs">
                <Table>
                  <TableHeader className="bg-muted/40 font-khmer">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[60px] text-center font-bold text-xs">
                        {t("packages.order")}
                      </TableHead>
                      <TableHead className="w-[140px] font-bold text-xs">
                        {t("packages.moduleCode")}
                      </TableHead>
                      <TableHead className="font-bold text-xs">
                        {t("packages.moduleNameKh")}
                      </TableHead>
                      <TableHead className="hidden md:table-cell font-bold text-xs">
                        {t("packages.moduleNameEn")}
                      </TableHead>
                      <TableHead className="w-[120px] text-center font-bold text-xs">
                        {t("packages.plannedHours")}
                      </TableHead>
                      <TableHead className="w-[100px] text-center font-bold text-xs">
                        {t("packages.status")}
                      </TableHead>
                      <TableHead className="w-[170px] text-right font-bold text-xs pr-4">
                        {t("common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((mod, index) => (
                      <TableRow
                        key={mod.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="text-center font-medium">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {mod.order || index + 1}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted/60 text-foreground border border-border/40">
                            {mod.code}
                          </span>
                        </TableCell>

                        <TableCell className="font-khmer">
                          <div className="font-semibold text-xs text-foreground">
                            {mod.nameKh}
                          </div>
                          {mod.description && (
                            <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {mod.description}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {mod.nameEn || "-"}
                        </TableCell>

                        <TableCell className="text-center">
                          {mod.plannedHours !== undefined && mod.plannedHours > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground bg-muted/40 px-2 py-0.5 rounded">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {mod.plannedHours} {t("packages.hoursUnit")}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <PackageStatusBadge status={mod.status} />
                        </TableCell>

                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                              disabled={index === 0}
                              onClick={() => handleMove(mod.id, "up")}
                              title={t("packages.moveUp")}
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                              disabled={index === modules.length - 1}
                              onClick={() => handleMove(mod.id, "down")}
                              title={t("packages.moveDown")}
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              onClick={() => {
                                setModuleToEdit(mod);
                                setIsModuleDialogOpen(true);
                              }}
                              title={t("common.edit")}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setModuleToDelete(mod)}
                              title={t("common.delete")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Module Dialog */}
      {pkg && (
        <ModuleDialog
          open={isModuleDialogOpen}
          onOpenChange={setIsModuleDialogOpen}
          packageId={pkg.id}
          moduleToEdit={moduleToEdit}
          onSubmit={handleSaveModule}
        />
      )}

      {/* Delete Module Dialog */}
      <ModuleDeleteDialog
        open={!!moduleToDelete}
        onOpenChange={(isOpen) => !isOpen && setModuleToDelete(null)}
        moduleName={moduleToDelete?.nameKh || moduleToDelete?.code || ""}
        onConfirm={handleDeleteModule}
      />
    </>
  );
};
