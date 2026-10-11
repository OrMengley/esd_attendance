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
import { StudyPackage, PackageStatus } from "@/models/study-package.model";
import { toast } from "sonner";
import { Package, Clock, FileText, Globe } from "lucide-react";

interface PackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageToEdit?: StudyPackage | null;
  onSubmit: (data: Omit<StudyPackage, "id" | "createdAt" | "updatedAt">) => Promise<void>;
}

export const PackageDialog: React.FC<PackageDialogProps> = ({
  open,
  onOpenChange,
  packageToEdit,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [nameKh, setNameKh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [totalPlannedHours, setTotalPlannedHours] = useState<number | string>(40);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<PackageStatus>("active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (packageToEdit) {
      setCode(packageToEdit.code || "");
      setNameKh(packageToEdit.nameKh || "");
      setNameEn(packageToEdit.nameEn || "");
      setTotalPlannedHours(packageToEdit.totalPlannedHours ?? 40);
      setDescription(packageToEdit.description || "");
      setStatus(packageToEdit.status || "active");
    } else {
      setCode("");
      setNameKh("");
      setNameEn("");
      setTotalPlannedHours(40);
      setDescription("");
      setStatus("active");
    }
  }, [packageToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.trim().toUpperCase();
    const cleanNameKh = nameKh.trim();
    const hoursNum = Number(totalPlannedHours);

    if (!cleanCode) {
      toast.error(t("packages.codeRequired"));
      return;
    }

    if (!cleanNameKh) {
      toast.error(t("packages.nameKhRequired"));
      return;
    }

    if (isNaN(hoursNum) || hoursNum <= 0) {
      toast.error(t("packages.hoursRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        code: cleanCode,
        nameKh: cleanNameKh,
        nameEn: nameEn.trim(),
        totalPlannedHours: hoursNum,
        description: description.trim(),
        status,
      });
      onOpenChange(false);
    } catch (error: any) {
      if (error?.message === "PACKAGE_CODE_EXISTS") {
        toast.error(t("packages.codeExists"));
      } else {
        toast.error(t("common.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-khmer">
            {packageToEdit ? t("packages.editPackage") : t("packages.addPackage")}
          </DialogTitle>
          <DialogDescription className="text-xs font-khmer">
            {t("packages.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Package Code & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pkg-code" className="text-xs font-khmer">
                {t("packages.packageCode")} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pkg-code"
                  placeholder="ESD-COMPUTER-001"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="pl-9 text-xs font-mono uppercase"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pkg-status" className="text-xs font-khmer">
                {t("packages.status")}
              </Label>
              <Select
                value={status}
                onValueChange={(val: PackageStatus) => setStatus(val)}
              >
                <SelectTrigger id="pkg-status" className="text-xs">
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
            <Label htmlFor="pkg-name-kh" className="text-xs font-khmer">
              {t("packages.packageNameKh")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pkg-name-kh"
              placeholder="កញ្ចប់សិក្សាកុំព្យូទ័រ"
              value={nameKh}
              onChange={(e) => setNameKh(e.target.value)}
              className="text-xs font-khmer"
              required
            />
          </div>

          {/* English Name & Total Planned Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pkg-name-en" className="text-xs font-khmer">
                {t("packages.packageNameEn")}
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pkg-name-en"
                  placeholder="Computer Study Package"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pkg-hours" className="text-xs font-khmer">
                {t("packages.totalPlannedHours")} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pkg-hours"
                  type="number"
                  min={1}
                  placeholder="40"
                  value={totalPlannedHours}
                  onChange={(e) => setTotalPlannedHours(e.target.value)}
                  className="pl-9 text-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="pkg-desc" className="text-xs font-khmer">
              {t("packages.descriptionLabel")}
            </Label>
            <Textarea
              id="pkg-desc"
              placeholder="កញ្ចប់សិក្សាមូលដ្ឋានកុំព្យូទ័រ រួមមានការវាយអក្សរ និង Microsoft Office..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs font-khmer min-h-[70px]"
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
