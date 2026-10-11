import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { User } from "@/models/user.model";
import { userService } from "@/services/user.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRoleBadge } from "@/components/users/user-role-badge";
import { Bot } from "lucide-react";

export interface AuditUserDisplayProps {
  userId?: string;
  user?: User | null;
  label: string;
  isLoading?: boolean;
  className?: string;
}

export const AuditUserDisplay: React.FC<AuditUserDisplayProps> = ({
  userId,
  user: initialUser,
  label,
  isLoading: initialLoading,
  className = "",
}) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [loading, setLoading] = useState<boolean>(
    initialLoading ?? (initialUser === undefined && !!userId && userId !== "system")
  );

  useEffect(() => {
    if (initialUser !== undefined) {
      setUser(initialUser);
      if (initialLoading !== undefined) {
        setLoading(initialLoading);
      }
      return;
    }

    if (!userId || userId === "system") {
      setUser(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    userService
      .getUserById(userId)
      .then((fetchedUser) => {
        if (isMounted) {
          setUser(fetchedUser);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load audit user:", err);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId, initialUser, initialLoading]);

  // If loading, show compact skeleton
  if (loading || (initialLoading && !user)) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <span className="block text-[11px] font-khmer text-muted-foreground">
          {label}:
        </span>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full shrink-0" />
          <div className="space-y-1 min-w-0 flex-1">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-2.5 w-16 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // If no userId provided, display dash
  if (!userId) {
    return (
      <div className={`space-y-1 ${className}`}>
        <span className="block text-[11px] font-khmer text-muted-foreground">
          {label}:
        </span>
        <span className="font-medium text-foreground text-xs">-</span>
      </div>
    );
  }

  // If system user
  if (userId === "system") {
    return (
      <div className={`space-y-1 ${className}`}>
        <span className="block text-[11px] font-khmer text-muted-foreground">
          {label}:
        </span>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-foreground truncate">
              {t("common.systemUser", { defaultValue: "ប្រព័ន្ធ" })}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              @system
            </span>
          </div>
        </div>
      </div>
    );
  }

  // If user object not found in Firestore
  if (!user) {
    return (
      <div className={`space-y-1 ${className}`}>
        <span className="block text-[11px] font-khmer text-muted-foreground">
          {label}:
        </span>
        <span className="text-xs text-muted-foreground italic font-khmer">
          {t("common.userNotFound", {
            defaultValue: "អ្នកប្រើប្រាស់មិនមានក្នុងប្រព័ន្ធ",
          })}
        </span>
      </div>
    );
  }

  // Normal user resolved from Firestore
  const initials = user.name ? user.name.slice(0, 2).toUpperCase() : "U";

  return (
    <div className={`space-y-1 ${className}`}>
      <span className="block text-[11px] font-khmer text-muted-foreground">
        {label}:
      </span>
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7 rounded-full border border-border/80 shrink-0">
          {user.avatarUrl ? (
            <AvatarImage
              src={user.avatarUrl}
              alt={user.name}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="text-[10px] bg-gradient-to-tr from-brand-navy to-brand-primary text-white font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0 leading-tight">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-foreground truncate">
              {user.name}
            </span>
            {user.role && (
              <UserRoleBadge
                role={user.role}
                className="text-[9px] px-1.5 py-0 h-4"
              />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono truncate">
            @{user.username}
          </span>
        </div>
      </div>
    </div>
  );
};
