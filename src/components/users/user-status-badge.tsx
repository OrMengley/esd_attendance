import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { UserStatus } from "@/models/user.model";

interface UserStatusBadgeProps {
  status: UserStatus;
  className?: string;
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status, className }) => {
  const { t } = useTranslation();

  return status === "active" ? (
    <Badge variant="success" className={className}>
      {t("status.active")}
    </Badge>
  ) : (
    <Badge variant="secondary" className={`text-slate-500 ${className || ""}`}>
      {t("status.inactive")}
    </Badge>
  );
};
