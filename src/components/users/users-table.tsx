import React from "react";
import { useTranslation } from "react-i18next";
import { User } from "@/models/user.model";
import { Classroom } from "@/models/classroom.model";
import { Branch } from "@/models/branch.model";
import { UserRoleBadge } from "./user-role-badge";
import { UserStatusBadge } from "./user-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  Mail,
  Phone,
  School,
  Power,
  Building2,
} from "lucide-react";
import { formatKhmerDate, formatKhmerTime } from "@/lib/utils";

interface UsersTableProps {
  users: User[];
  classrooms: Classroom[];
  branches?: Branch[];
  currentUser: User | null;
  loading: boolean;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
  onAddUser: () => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  classrooms,
  branches = [],
  currentUser,
  loading,
  onEdit,
  onToggleStatus,
  onDelete,
  onAddUser,
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <div className="h-6 w-1/4 bg-muted/60 animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-muted/40 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        title={t("users.noUsersTitle")}
        description={t("users.noUsersDesc")}
        actionLabel={t("users.addUser")}
        onAction={onAddUser}
      />
    );
  }

  const isSuperAdmin = currentUser?.role === "super_admin";

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-12 text-center text-xs">{t("students.photo")}</TableHead>
            <TableHead className="text-xs">{t("users.fullName")}</TableHead>
            <TableHead className="text-xs">{t("users.username")}</TableHead>
            <TableHead className="text-xs">{t("users.email")}</TableHead>
            <TableHead className="text-xs">{t("users.phone")}</TableHead>
            <TableHead className="w-32 text-xs">{t("users.role")}</TableHead>
            <TableHead className="text-xs">{t("users.assignedClasses")}</TableHead>
            <TableHead className="w-24 text-xs">{t("common.status")}</TableHead>
            <TableHead className="text-xs">{t("users.lastLogin")}</TableHead>
            <TableHead className="w-16 text-right text-xs">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((userItem) => {
            const assignedClassNames = classrooms
              .filter(
                (c) =>
                  c.assignedTeacherId === userItem.id ||
                  userItem.assignedClassroomIds?.includes(c.id)
              )
              .map((c) => c.name);

            const isSelf = currentUser?.id === userItem.id;
            const isTargetSuperAdmin = userItem.role === "super_admin";

            // Permission check:
            // super_admin can edit everyone, delete everyone except super_admin and self.
            // admin can only edit/delete teachers.
            const canEdit = isSuperAdmin || (currentUser?.role === "admin" && userItem.role === "teacher");
            const canDelete = !isSelf && !isTargetSuperAdmin && (isSuperAdmin || (currentUser?.role === "admin" && userItem.role === "teacher"));
            const canToggleStatus = !isSelf && !isTargetSuperAdmin && canEdit;

            return (
              <TableRow key={userItem.id} className="hover:bg-muted/30">
                <TableCell className="text-center py-2.5">
                  <Avatar className="h-8 w-8 mx-auto ring-1 ring-border">
                    <AvatarImage src={userItem.avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-bold">
                      {userItem.name ? userItem.name.charAt(0) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-foreground">
                      {userItem.name}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary dark:bg-primary/30 dark:text-blue-200 font-medium">
                        You
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="font-mono text-xs font-semibold text-primary dark:text-blue-400">
                  @{userItem.username}
                </TableCell>

                <TableCell className="text-xs text-muted-foreground">
                  {userItem.email ? (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-slate-400" />
                      {userItem.email}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>

                <TableCell className="text-xs text-muted-foreground font-mono">
                  {userItem.phone ? (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-emerald-500" />
                      {userItem.phone}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>

                <TableCell>
                  <UserRoleBadge role={userItem.role} />
                  {/* {userItem.branchId && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 font-khmer">
                      <Building2 className="h-3 w-3 text-blue-500 shrink-0" />
                      <span className="truncate">
                        {branches.find((b) => b.id === userItem.branchId)?.nameKh || userItem.branchId}
                      </span>
                    </div>
                  )} */}
                </TableCell>

                <TableCell className="text-xs max-w-[200px]">
                  {userItem.role === "teacher" ? (
                    assignedClassNames.length > 0 ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-blue-300 transition-colors cursor-pointer border border-primary/20"
                            title={t("classes.assignedClasses", { defaultValue: "ថ្នាក់រៀនដែលទទួលបន្ទុក" })}
                          >
                            <School className="h-3 w-3" />
                            <span>{assignedClassNames.length} {t("classes.classesUnit", { defaultValue: "ថ្នាក់" })}</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-64 p-3 font-khmer shadow-lg">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 pb-1.5 border-b border-border/60">
                              <School className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs font-bold text-foreground">
                                {t("classes.assignedClasses", { defaultValue: "ថ្នាក់រៀនដែលទទួលបន្ទុក" })} ({assignedClassNames.length})
                              </span>
                            </div>
                            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                              {assignedClassNames.map((cName, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 p-1.5 rounded-md bg-muted/60 text-xs text-foreground font-medium"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                  <span className="truncate">{cName}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="text-muted-foreground italic text-[11px]">
                        {t("users.noClasses")}
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                <TableCell>
                  <UserStatusBadge status={userItem.status} />
                </TableCell>

                <TableCell className="text-[11px] text-muted-foreground font-mono">
                  {userItem.lastLogin ? (
                    <span>
                      {formatKhmerDate(userItem.lastLogin)} {formatKhmerTime(userItem.lastLogin)}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>

                <TableCell className="text-right py-2.5">
                  {(canEdit || canDelete) ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-muted"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() => onEdit(userItem)}
                            className="gap-2 cursor-pointer text-xs"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-amber-500" />
                            <span>{t("common.edit")}</span>
                          </DropdownMenuItem>
                        )}
                        {canToggleStatus && (
                          <DropdownMenuItem
                            onClick={() => onToggleStatus(userItem)}
                            className="gap-2 cursor-pointer text-xs"
                          >
                            <Power className="h-3.5 w-3.5 text-blue-500" />
                            <span>
                              {userItem.status === "active"
                                ? t("users.statusInactive")
                                : t("users.statusActive")}
                            </span>
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(userItem)}
                              className="gap-2 cursor-pointer text-xs text-rose-600 focus:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>{t("common.delete")}</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-muted-foreground text-xs pr-2">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
