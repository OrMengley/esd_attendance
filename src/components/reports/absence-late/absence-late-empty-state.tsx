import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { UserCheck2, RotateCcw } from "lucide-react";

interface AbsenceLateEmptyStateProps {
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const AbsenceLateEmptyState: React.FC<AbsenceLateEmptyStateProps> = ({
  onResetFilters,
  hasActiveFilters,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border/80 text-center font-khmer space-y-3 shadow-xs">
      <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
        <UserCheck2 className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground">
          {t("absenceLateReport.noStudentsTitle", { defaultValue: "មិនមានសិស្សជាប់លក្ខខណ្ឌទេ" })}
        </h3>
        <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
          {t("absenceLateReport.noStudentsDesc", {
            defaultValue: "មិនមានសិស្សណាដែលអវត្តមាន ឬមកយឺតលើសពីកម្រិតកំណត់ ឬត្រូវនឹងលក្ខខណ្ឌតម្រងដែលបានជ្រើសរើសឡើយ។",
          })}
        </p>
      </div>
      {hasActiveFilters && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="mt-2 text-xs font-khmer rounded-xl gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{t("absenceLateReport.clearFilters")}</span>
        </Button>
      )}
    </div>
  );
};
