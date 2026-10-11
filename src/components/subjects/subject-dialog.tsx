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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Subject } from "@/models/subject.model";

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectToEdit?: Subject | null;
  onSubmit: (subjectData: Omit<Subject, "id">) => Promise<void>;
}

export const SubjectDialog: React.FC<SubjectDialogProps> = ({
  open,
  onOpenChange,
  subjectToEdit,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subjectToEdit) {
      setCode(subjectToEdit.code || "");
      setName(subjectToEdit.name || "");
      setDescription(subjectToEdit.description || "");
      setDuration(subjectToEdit.duration || "");
      setStatus(subjectToEdit.status || "active");
    } else {
      setCode("");
      setName("");
      setDescription("");
      setDuration("");
      setStatus("active");
    }
  }, [subjectToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        code: code.trim(),
        name: name.trim(),
        description: description.trim(),
        duration: duration.trim(),
        status,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {subjectToEdit ? t("subjects.editSubject") : t("subjects.addSubject")}
          </DialogTitle>
          <DialogDescription>
            {t("subjects.dialogDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="sub-code" className="text-xs">
              {t("subjects.code")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sub-code"
              placeholder="e.g. SUB-WORD"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-name" className="text-xs">
              {t("subjects.name")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sub-name"
              placeholder="e.g. Microsoft Word"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-desc" className="text-xs">
              {t("subjects.descriptionLabel")}
            </Label>
            <Input
              id="sub-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub-dur" className="text-xs">
                {t("subjects.duration")}
              </Label>
              <Input
                id="sub-dur"
                placeholder="45h"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-status" className="text-xs">
                {t("common.status")}
              </Label>
              <Select value={status} onValueChange={(v: "active" | "inactive") => setStatus(v)}>
                <SelectTrigger id="sub-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("status.active")}</SelectItem>
                  <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="gradient" disabled={isSubmitting}>
              {isSubmitting
                ? t("common.loading")
                : subjectToEdit
                ? t("common.edit")
                : t("common.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
