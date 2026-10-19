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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { Branch } from "@/models/branch.model";
import {
  MoreVertical,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  Power,
  Building2,
  School,
} from "lucide-react";

interface BranchTableProps {
  branches: Branch[];
  classCountMap: Record<string, number>;
  onEdit: (branch: Branch) => void;
  onToggleStatus: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
}

export const BranchTable: React.FC<BranchTableProps> = ({
  branches,
  classCountMap,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="w-12 text-center text-xs font-khmer">#</TableHead>
            <TableHead className="text-xs font-khmer">{t("branches.branchCode")}</TableHead>
            <TableHead className="text-xs font-khmer">{t("branches.title")}</TableHead>
            <TableHead className="text-xs font-khmer hidden md:table-cell">{t("branches.phone")}</TableHead>
            <TableHead className="text-xs font-khmer hidden lg:table-cell">{t("branches.address")}</TableHead>
            <TableHead className="text-xs font-khmer text-center hidden sm:table-cell">{t("sidebar.classes")}</TableHead>
            <TableHead className="text-xs font-khmer text-center">{t("branches.status")}</TableHead>
            <TableHead className="w-16 text-right text-xs font-khmer">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {branches.map((branch, index) => {
            const classCount = classCountMap[branch.id] || 0;

            return (
              <TableRow key={branch.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="text-center font-mono text-xs text-muted-foreground">
                  {index + 1}
                </TableCell>

                {/* Code & Main Badge */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/60">
                      {branch.code}
                    </span>
                    {branch.isMain && (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 gap-1 text-[10px] font-khmer font-semibold py-0"
                      >
                        <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                        <span>{t("branches.mainCampusBadge")}</span>
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Name */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs font-khmer text-foreground">
                      {branch.nameKh}
                    </span>
                    {branch.nameEn && (
                      <span className="text-[11px] text-muted-foreground">
                        {branch.nameEn}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Phone & Email */}
                <TableCell className="hidden md:table-cell">
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    {branch.phone && (
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="h-3 w-3 text-muted-foreground/70" />
                        <span>{branch.phone}</span>
                      </div>
                    )}
                    {branch.email && (
                      <div className="flex items-center gap-1 text-[11px] truncate max-w-[180px]">
                        <Mail className="h-3 w-3 text-muted-foreground/70" />
                        <span>{branch.email}</span>
                      </div>
                    )}
                    {!branch.phone && !branch.email && (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </div>
                </TableCell>

                {/* Address */}
                <TableCell className="hidden lg:table-cell">
                  {branch.address ? (
                    <div className="flex items-start gap-1 text-xs text-muted-foreground max-w-[260px]">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70 mt-0.5" />
                      <span className="font-khmer truncate" title={branch.address}>
                        {branch.address}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/40 text-xs">—</span>
                  )}
                </TableCell>

                {/* Linked Classes Count */}
                <TableCell className="text-center hidden sm:table-cell">
                  <Badge variant="outline" className="font-mono text-xs gap-1 font-normal bg-background">
                    <School className="h-3 w-3 text-primary/70" />
                    <span>{classCount}</span>
                  </Badge>
                </TableCell>

                {/* Status */}
                <TableCell className="text-center">
                  <StatusBadge status={branch.status} />
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs font-khmer w-40">
                      <DropdownMenuItem onClick={() => onEdit(branch)} className="gap-2 cursor-pointer">
                        <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                        <span>{t("common.edit")}</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => onToggleStatus(branch)}
                        className="gap-2 cursor-pointer"
                      >
                        <Power
                          className={`h-3.5 w-3.5 ${
                            branch.status === "active" ? "text-amber-500" : "text-emerald-500"
                          }`}
                        />
                        <span>
                          {branch.status === "active"
                            ? t("common.deactivate", { defaultValue: "បិទដំណើរការ" })
                            : t("common.activate", { defaultValue: "បើកដំណើរការ" })}
                        </span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => onDelete(branch)}
                        className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                        disabled={branch.isMain}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{t("common.delete")}</span>
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
