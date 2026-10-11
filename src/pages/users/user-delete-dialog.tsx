import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert, Power } from "lucide-react";
import { User } from "@/models/user.model";
import { Classroom } from "@/models/classroom.model";

interface UserDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToDelete: User | null;
  currentUser: User | null;
  classrooms: Classroom[];
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export const UserDeleteDialog: React.FC<UserDeleteDialogProps> = ({
  open,
  onOpenChange,
  userToDelete,
  currentUser,
  classrooms,
  onConfirm,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  if (!userToDelete) return null;

  const isSelf = currentUser?.id === userToDelete.id;
  const isSuperAdmin = userToDelete.role === "super_admin";

  // Check if teacher has assigned classrooms
  const hasAssignedClasses =
    userToDelete.role === "teacher" &&
    ((userToDelete.assignedClassroomIds && userToDelete.assignedClassroomIds.length > 0) ||
      classrooms.some((c) => c.assignedTeacherId === userToDelete.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-2">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full sm:mx-0 ${
              isSelf || isSuperAdmin
                ? "bg-amber-100 text-amber-600 dark:bg-amber-950/50"
                : hasAssignedClasses
                ? "bg-blue-100 text-blue-600 dark:bg-blue-950/50"
                : "bg-red-100 text-destructive dark:bg-red-950/50"
            }`}
          >
            {isSelf || isSuperAdmin ? (
              <ShieldAlert className="h-6 w-6" />
            ) : hasAssignedClasses ? (
              <Power className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>

          <div>
            <DialogTitle className="text-lg font-bold">
              {isSelf || isSuperAdmin
                ? t("users.actionBlocked") || "Action Blocked"
                : hasAssignedClasses
                ? t("users.deactivateTitle") || "Deactivate Teacher Account"
                : t("users.deleteTitle")}
            </DialogTitle>

            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              {isSelf ? (
                t("users.cannotDeleteSelf")
              ) : isSuperAdmin ? (
                t("users.cannotDeleteSuperAdmin") || "Super Admin accounts cannot be deleted."
              ) : hasAssignedClasses ? (
                <span>
                  {t("users.teacherHasClassesNotice", {
                    name: userToDelete.name,
                  }) ||
                    `This teacher "${userToDelete.name}" is assigned to active classes. The account will be deactivated instead of permanently removed to preserve classroom records.`}
                </span>
              ) : (
                t("users.deleteConfirm", {
                  name: userToDelete.name,
                  username: userToDelete.username,
                })
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>

          {!isSelf && !isSuperAdmin && (
            <Button
              variant={hasAssignedClasses ? "default" : "destructive"}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading
                ? t("common.loading")
                : hasAssignedClasses
                ? t("users.confirmDeactivate") || "Deactivate Account"
                : t("common.confirmDelete")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
