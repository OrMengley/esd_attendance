import React from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PackageStatusBadge } from "./package-status-badge";
import { StudyPackage } from "@/models/study-package.model";
import { formatKhmerDate } from "@/lib/utils";
import {
  MoreHorizontal,
  Edit,
  Layers,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
} from "lucide-react";

interface PackageTableProps {
  packages: StudyPackage[];
  modulesCountMap: Record<string, number>;
  onEdit: (pkg: StudyPackage) => void;
  onViewModules: (pkg: StudyPackage) => void;
  onToggleStatus: (pkg: StudyPackage) => void;
}

export const PackageTable: React.FC<PackageTableProps> = ({
  packages,
  modulesCountMap,
  onEdit,
  onViewModules,
  onToggleStatus,
}) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="w-[160px] font-semibold font-khmer">{t("packages.packageCode")}</TableHead>
            <TableHead className="font-semibold font-khmer">{t("packages.packageNameKh")}</TableHead>
            <TableHead className="w-[140px] font-semibold font-khmer">{t("packages.totalPlannedHours")}</TableHead>
            <TableHead className="w-[140px] font-semibold font-khmer">{t("packages.modulesCount")}</TableHead>
            <TableHead className="w-[120px] font-semibold font-khmer">{t("packages.status")}</TableHead>
            <TableHead className="w-[140px] font-semibold font-khmer">{t("packages.createdAt")}</TableHead>
            <TableHead className="w-[80px] text-right font-semibold font-khmer">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.map((pkg) => {
            const modCount = modulesCountMap[pkg.id] ?? 0;
            return (
              <TableRow key={pkg.id} className="hover:bg-muted/30 transition-colors">
                {/* Code */}
                <TableCell className="font-mono font-semibold text-xs text-primary">
                  <div className="inline-flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-md">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <span>{pkg.code}</span>
                  </div>
                </TableCell>

                {/* Package Name */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-foreground font-khmer">
                      {pkg.nameKh}
                    </span>
                    {pkg.nameEn && (
                      <span className="text-xs text-muted-foreground font-sans">
                        {pkg.nameEn}
                      </span>
                    )}
                    {pkg.description && (
                      <span className="text-[11px] text-muted-foreground/80 line-clamp-1 mt-0.5 font-khmer">
                        {pkg.description}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Planned Hours */}
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>{pkg.totalPlannedHours} {t("packages.hoursUnit")}</span>
                  </div>
                </TableCell>

                {/* Modules Count */}
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onViewModules(pkg)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-blue-400 hover:underline cursor-pointer bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>{modCount} {t("packages.modulesUnit")}</span>
                  </button>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <PackageStatusBadge status={pkg.status} />
                </TableCell>

                {/* Created Date */}
                <TableCell className="text-xs text-muted-foreground font-khmer">
                  {formatKhmerDate(pkg.createdAt)}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        {pkg.code}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => onViewModules(pkg)}
                        className="cursor-pointer text-xs"
                      >
                        <Layers className="mr-2 h-4 w-4 text-cyan-500" />
                        <span>{t("packages.viewModules")}</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => onEdit(pkg)}
                        className="cursor-pointer text-xs"
                      >
                        <Edit className="mr-2 h-4 w-4 text-blue-500" />
                        <span>{t("packages.editPackage")}</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => onToggleStatus(pkg)}
                        className={
                          pkg.status === "active"
                            ? "cursor-pointer text-xs text-amber-600 dark:text-amber-400"
                            : "cursor-pointer text-xs text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {pkg.status === "active" ? (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>{t("packages.deactivate")}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>{t("packages.activate")}</span>
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
