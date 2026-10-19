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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Branch, BranchStatus } from "@/models/branch.model";
import { toast } from "sonner";
import { Building2, Sparkles, Loader2, Star } from "lucide-react";

interface BranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchToEdit?: Branch | null;
  onSubmit: (data: Omit<Branch, "id" | "createdAt" | "updatedAt">) => Promise<void>;
}

export const BranchDialog: React.FC<BranchDialogProps> = ({
  open,
  onOpenChange,
  branchToEdit,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const [code, setCode] = useState("");
  const [nameKh, setNameKh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [isMain, setIsMain] = useState(false);
  const [status, setStatus] = useState<BranchStatus>("active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (branchToEdit) {
      setCode(branchToEdit.code || "");
      setNameKh(branchToEdit.nameKh || "");
      setNameEn(branchToEdit.nameEn || "");
      setPhone(branchToEdit.phone || "");
      setEmail(branchToEdit.email || "");
      setAddress(branchToEdit.address || "");
      setIsMain(Boolean(branchToEdit.isMain));
      setStatus(branchToEdit.status || "active");
    } else {
      setCode("");
      setNameKh("");
      setNameEn("");
      setPhone("");
      setEmail("");
      setAddress("");
      setIsMain(false);
      setStatus("active");
    }
  }, [branchToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.trim().toUpperCase();
    const cleanNameKh = nameKh.trim();

    if (!cleanCode) {
      toast.error(t("branches.codeRequired"));
      return;
    }

    if (!cleanNameKh) {
      toast.error(t("branches.nameKhRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        code: cleanCode,
        nameKh: cleanNameKh,
        nameEn: nameEn.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        isMain,
        status,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting branch:", error);
      if (error?.message === "CODE_EXISTS") {
        toast.error(t("branches.codeExists"));
      } else if (error?.message === "CODE_REQUIRED") {
        toast.error(t("branches.codeRequired"));
      } else if (error?.message === "NAME_KH_REQUIRED") {
        toast.error(t("branches.nameKhRequired"));
      } else {
        toast.error(error?.message || t("common.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold font-khmer">
                  {branchToEdit ? t("branches.editBranch") : t("branches.addBranch")}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-khmer">
                  {t("branches.description")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {/* Branch Code */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold font-khmer flex items-center gap-1">
                <span>{t("branches.branchCode")}</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder={t("branches.branchCodePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono text-xs uppercase"
                required
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold font-khmer">
                {t("branches.status")}
              </Label>
              <Select
                value={status}
                onValueChange={(val: BranchStatus) => setStatus(val)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-xs font-khmer">
                    {t("common.active", { defaultValue: "សកម្ម" })}
                  </SelectItem>
                  <SelectItem value="inactive" className="text-xs font-khmer">
                    {t("common.inactive", { defaultValue: "អសកម្ម" })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Khmer Name */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold font-khmer flex items-center gap-1">
                <span>{t("branches.nameKh")}</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder={t("branches.nameKhPlaceholder")}
                value={nameKh}
                onChange={(e) => setNameKh(e.target.value)}
                className="text-xs font-khmer"
                required
              />
            </div>

            {/* English Name */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold font-khmer">
                {t("branches.nameEn")}
              </Label>
              <Input
                placeholder={t("branches.nameEnPlaceholder")}
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold font-khmer">
                {t("branches.phone")}
              </Label>
              <Input
                placeholder={t("branches.phonePlaceholder")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold font-khmer">
                {t("branches.email")}
              </Label>
              <Input
                type="email"
                placeholder={t("branches.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold font-khmer">
                {t("branches.address")}
              </Label>
              <Textarea
                placeholder={t("branches.addressPlaceholder")}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="text-xs font-khmer resize-none"
              />
            </div>

            {/* Main Campus Checkbox */}
            <div className="md:col-span-2 p-3 rounded-xl border border-border/80 bg-muted/30 flex items-start gap-3">
              <div className="pt-0.5">
                <Checkbox
                  id="branch-is-main"
                  checked={isMain}
                  onCheckedChange={(checked) => setIsMain(Boolean(checked))}
                />
              </div>
              <div className="space-y-0.5">
                <label
                  htmlFor="branch-is-main"
                  className="text-xs font-bold font-khmer text-foreground cursor-pointer flex items-center gap-1.5"
                >
                  <Star className={`h-3.5 w-3.5 ${isMain ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                  <span>{t("branches.isMain")}</span>
                </label>
                <p className="text-[11px] text-muted-foreground font-khmer">
                  {t("branches.isMainDesc")}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-khmer"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-khmer gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              )}
              <span>{t("common.save")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
