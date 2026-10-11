import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/models/user.model";
import { ShieldAlert, ShieldCheck, GraduationCap } from "lucide-react";

interface UserRoleBadgeProps {
  role: UserRole;
  className?: string;
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ role, className }) => {
  const { t } = useTranslation();

  switch (role) {
    case "super_admin":
      return (
        <Badge variant="gold" className={`gap-1 font-medium ${className || ""}`}>
          <ShieldAlert className="h-3 w-3" />
          {t("roles.super_admin")}
        </Badge>
      );
    case "admin":
      return (
        <Badge variant="info" className={`gap-1 font-medium ${className || ""}`}>
          <ShieldCheck className="h-3 w-3" />
          {t("roles.admin")}
        </Badge>
      );
    case "teacher":
      return (
        <Badge variant="success" className={`gap-1 font-medium ${className || ""}`}>
          <GraduationCap className="h-3 w-3" />
          {t("roles.teacher")}
        </Badge>
      );
    default:
      return null;
  }
};
