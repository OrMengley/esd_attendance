import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { PackageStatus } from "@/models/study-package.model";

interface PackageStatusBadgeProps {
  status: PackageStatus;
  className?: string;
}

export const PackageStatusBadge: React.FC<PackageStatusBadgeProps> = ({
  status,
  className,
}) => {
  const { t } = useTranslation();

  if (status === "active") {
    return (
      <Badge variant="success" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
        {t("packages.activeStatus")}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={className}>
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mr-1.5" />
      {t("packages.inactiveStatus")}
    </Badge>
  );
};
