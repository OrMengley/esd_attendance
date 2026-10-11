import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";

interface ModuleDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleName: string;
  onConfirm: () => Promise<void>;
}

export const ModuleDeleteDialog: React.FC<ModuleDeleteDialogProps> = ({
  open,
  onOpenChange,
  moduleName,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // handled by parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-bold font-khmer">
                {t("packages.deleteModuleTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs font-khmer mt-1 text-muted-foreground">
                {t("packages.deleteModuleConfirm", { name: moduleName })}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:space-x-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? t("common.loading") : t("common.delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
