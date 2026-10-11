import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CourseModule, CourseModuleStatus } from "@/models/course-module.model";
import { toast } from "sonner";
import { Layers, Clock, Globe } from "lucide-react";

interface ModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  moduleToEdit?: CourseModule | null;
  onSubmit: (data: Omit<CourseModule, "id" | "createdAt" | "updatedAt">) => Promise<void>;
}

export const ModuleDialog: React.FC<ModuleDialogProps> = ({
  open,
  onOpenChange,
  packageId,
  moduleToEdit,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [nameKh, setNameKh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [plannedHours, setPlannedHours] = useState<number | string>("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CourseModuleStatus>("active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (moduleToEdit) {
      setCode(moduleToEdit.code || "");
      setNameKh(moduleToEdit.nameKh || "");
      setNameEn(moduleToEdit.nameEn || "");
      setPlannedHours(moduleToEdit.plannedHours ?? "");
      setDescription(moduleToEdit.description || "");
      setStatus(moduleToEdit.status || "active");
    } else {
      setCode("");
      setNameKh("");
      setNameEn("");
      setPlannedHours("");
      setDescription("");
      setStatus("active");
    }
  }, [moduleToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.trim().toUpperCase();
    const cleanNameKh = nameKh.trim();

    if (!cleanCode) {
      toast.error(t("packages.moduleCodeRequired"));
      return;
    }

    if (!cleanNameKh) {
      toast.error(t("packages.moduleNameKhRequired"));
      return;
    }

    const hoursVal = plannedHours === "" ? undefined : Number(plannedHours);

    setIsSubmitting(true);
    try {
      await onSubmit({
        packageId,
        code: cleanCode,
        nameKh: cleanNameKh,
        nameEn: nameEn.trim(),
        order: moduleToEdit ? moduleToEdit.order : 0,
        plannedHours: hoursVal,
        description: description.trim(),
        status,
      });
      onOpenChange(false);
    } catch (error: any) {
      if (error?.message === "MODULE_CODE_EXISTS") {
        toast.error(t("packages.moduleCodeExists"));
      } else {
        toast.error(t("common.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold font-khmer">
            {moduleToEdit ? t("packages.editModule") : t("packages.addModule")}
          </DialogTitle>
          <DialogDescription className="text-xs font-khmer">
            {t("packages.modulesDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Module Code & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mod-code" className="text-xs font-khmer">
                {t("packages.moduleCode")} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Layers className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mod-code"
                  placeholder="MS-WORD"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="pl-9 text-xs font-mono uppercase"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mod-status" className="text-xs font-khmer">
                {t("packages.status")}
              </Label>
              <Select
                value={status}
                onValueChange={(val: CourseModuleStatus) => setStatus(val)}
              >
                <SelectTrigger id="mod-status" className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("packages.activeStatus")}</SelectItem>
                  <SelectItem value="inactive">{t("packages.inactiveStatus")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Khmer Name */}
          <div className="space-y-1.5">
            <Label htmlFor="mod-name-kh" className="text-xs font-khmer">
              {t("packages.moduleNameKh")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mod-name-kh"
              placeholder="Microsoft Word"
              value={nameKh}
              onChange={(e) => setNameKh(e.target.value)}
              className="text-xs font-khmer"
              required
            />
          </div>

          {/* English Name & Planned Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mod-name-en" className="text-xs font-khmer">
                {t("packages.moduleNameEn")}
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mod-name-en"
                  placeholder="Microsoft Word"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mod-hours" className="text-xs font-khmer">
                {t("packages.plannedHours")}
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mod-hours"
                  type="number"
                  min={0}
                  placeholder="10"
                  value={plannedHours}
                  onChange={(e) => setPlannedHours(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="mod-desc" className="text-xs font-khmer">
              {t("packages.descriptionLabel")}
            </Label>
            <Textarea
              id="mod-desc"
              placeholder="ការរៀបចំឯកសារ លិខិតរដ្ឋបាល និងតារាង..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs font-khmer min-h-[60px]"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
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
              variant="gradient"
              disabled={isSubmitting}
              className="shadow-sm"
            >
              {isSubmitting ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
