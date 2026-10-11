import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { SearchX, RotateCcw } from "lucide-react";

interface ClassProgressEmptyStateProps {
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const ClassProgressEmptyState: React.FC<ClassProgressEmptyStateProps> = ({
  onResetFilters,
  hasActiveFilters,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <div
      className={`flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border/80 text-center space-y-3 shadow-xs ${
        i18n.language === "km" ? "font-khmer" : ""
      }`}
    >
      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        <SearchX className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground">
          {t("classProgressReport.empty.title")}
        </h3>
        <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
          {t("classProgressReport.empty.description")}
        </p>
      </div>
      {hasActiveFilters && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="mt-2 text-xs rounded-xl gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{t("classProgressReport.filters.clearFilters")}</span>
        </Button>
      )}
    </div>
  );
};
