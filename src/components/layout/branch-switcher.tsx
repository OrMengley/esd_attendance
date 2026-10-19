import React from "react";
import { useTranslation } from "react-i18next";
import { Building2, Globe, Lock } from "lucide-react";
import { useBranch, ALL_BRANCHES_ID } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BranchSwitcherProps {
  collapsed?: boolean;
}

export const BranchSwitcher: React.FC<BranchSwitcherProps> = ({ collapsed = false }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    currentBranchId,
    currentBranch,
    branches,
    isAllBranches,
    canSelectAll,
    isLockedToBranch,
    setBranchId,
  } = useBranch();

  const isTeacher = user?.role === "teacher";

  // Label to display for the active selection
  const activeLabel = isAllBranches
    ? t("branches.allBranches", { defaultValue: "គ្រប់សាខាទាំងអស់" })
    : currentBranch
    ? currentBranch.nameKh || currentBranch.nameEn
    : t("branches.selectBranch", { defaultValue: "ជ្រើសរើសសាខា" });

  if (collapsed) {
    return (
      <div className="flex justify-center py-2 px-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border",
                isAllBranches
                  ? "bg-amber-500/20 border-amber-400/40 text-amber-300"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/15"
              )}
            >
              {isAllBranches ? (
                <Globe className="h-5 w-5" />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-khmer text-xs z-50">
            <div className="font-semibold">{activeLabel}</div>
            {isLockedToBranch && (
              <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Lock className="h-3 w-3" />
                {t("branches.assignedBranchOnly", { defaultValue: "សាខាដែលបានចាត់តាំង" })}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // If user is locked to branch (Admin or Teacher), show a clear, locked branch badge/card
  if (isLockedToBranch) {
    const roleLabel =
      user?.role === "admin"
        ? t("roles.admin", { defaultValue: "រដ្ឋបាល" })
        : t("roles.teacher", { defaultValue: "គ្រូបង្រៀន" });

    return (
      <div className="mx-3 my-2 p-2.5 rounded-xl bg-[#16213D]/70 border border-[#263E89]/80 shadow-inner">
        <div className="flex items-center justify-between text-[11px] text-white/60 mb-1 font-khmer">
          <span className="flex items-center gap-1.5 font-medium">
            <Building2 className="h-3.5 w-3.5 text-blue-300" />
            {t("branches.branch", { defaultValue: "សាខា" })}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-300/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            <Lock className="h-2.5 w-2.5" />
            {roleLabel}
          </span>
        </div>
        <div className="text-xs font-semibold text-white font-khmer truncate pl-5">
          {currentBranch ? currentBranch.nameKh || currentBranch.nameEn : t("common.loading", { defaultValue: "កំពុងដំណើរការ..." })}
        </div>
        {currentBranch?.code && (
          <div className="text-[10px] text-white/50 pl-5 font-mono">
            {currentBranch.code}
          </div>
        )}
      </div>
    );
  }

  // For Super Admins & Admins: interactive dropdown
  return (
    <div className="mx-3 my-2 p-2.5 rounded-xl bg-[#16213D]/70 border border-[#263E89]/80 shadow-inner">
      <div className="flex items-center justify-between text-[11px] text-white/70 mb-1.5 font-khmer">
        <span className="flex items-center gap-1.5 font-medium">
          <Building2 className="h-3.5 w-3.5 text-blue-300" />
          {t("branches.currentBranch", { defaultValue: "សាខាបច្ចុប្បន្ន" })}
        </span>
        {isAllBranches && (
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/30 font-medium">
            Super Admin
          </span>
        )}
      </div>

      <Select value={currentBranchId || ALL_BRANCHES_ID} onValueChange={setBranchId}>
        <SelectTrigger className="w-full h-8 text-xs bg-[#1E347B]/90 hover:bg-[#1E347B] border-[#263E89] text-white font-khmer focus:ring-1 focus:ring-blue-400">
          <SelectValue placeholder={t("branches.selectBranch", { defaultValue: "ជ្រើសរើសសាខា" })}>
            <div className="flex items-center gap-1.5 truncate">
              {isAllBranches ? (
                <>
                  <Globe className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{t("branches.allBranches", { defaultValue: "គ្រប់សាខាទាំងអស់" })}</span>
                </>
              ) : (
                <>
                  <Building2 className="h-3.5 w-3.5 text-blue-300 shrink-0" />
                  <span className="truncate">{activeLabel}</span>
                </>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#16213D] border-[#263E89] text-white font-khmer shadow-2xl z-50">
          {canSelectAll && (
            <SelectItem
              value={ALL_BRANCHES_ID}
              className="text-xs focus:bg-[#1E347B] focus:text-white cursor-pointer hover:bg-white/5 py-2 border-b border-[#263E89]/50"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-semibold text-amber-300">
                  {t("branches.allBranches", { defaultValue: "គ្រប់សាខាទាំងអស់" })}
                </span>
              </div>
            </SelectItem>
          )}

          {branches.map((b) => (
            <SelectItem
              key={b.id}
              value={b.id}
              className="text-xs focus:bg-[#1E347B] focus:text-white cursor-pointer hover:bg-white/5 py-1.5"
            >
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-white">{b.nameKh}</span>
                  {b.isMain && (
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 rounded border border-blue-400/30">
                      {t("branches.mainCampus", { defaultValue: "សាខាកណ្តាល" })}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-white/50 font-mono">
                  {b.code} • {b.nameEn}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
