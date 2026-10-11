import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { UsersTable } from "@/components/users/users-table";
import { UserDialog } from "./user-dialog";
import { UserDeleteDialog } from "./user-delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userService } from "@/services/user.service";
import { classroomService } from "@/services/classroom.service";
import { User, UserRole, UserStatus } from "@/models/user.model";
import { Classroom } from "@/models/classroom.model";
import { toast } from "sonner";
import { UserPlus, Search } from "lucide-react";

export const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect teacher role immediately
  useEffect(() => {
    if (currentUser && currentUser.role === "teacher") {
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser, navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allUsers, clsList] = await Promise.all([
        userService.getUsers(),
        classroomService.getClassrooms(),
      ]);

      // If current user is admin, only show teachers
      const visibleUsers =
        currentUser?.role === "admin"
          ? allUsers.filter((u) => u.role === "teacher")
          : allUsers;

      setUsers(visibleUsers);
      setClassrooms(clsList);
    } catch (e) {
      console.error(e);
      toast.error(t("users.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [currentUser, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveUser = async (
    userData: Omit<User, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (userToEdit) {
        const res = await userService.updateUser(userToEdit.id, userData, currentUser);
        if (!res.success) {
          if (res.error === "usernameExists") {
            toast.error(t("users.usernameExists"));
          } else {
            toast.error(t("users.saveError"));
          }
          return;
        }
        toast.success(t("users.updated"));
      } else {
        const res = await userService.createUser(userData, currentUser);
        if (!res.success) {
          if (res.error === "usernameExists") {
            toast.error(t("users.usernameExists"));
          } else {
            toast.error(t("users.saveError"));
          }
          return;
        }
        toast.success(t("users.created"));
      }
      setIsDialogOpen(false);
      setUserToEdit(null);
      await loadData();
    } catch (e) {
      toast.error(t("users.saveError"));
    }
  };

  const handleToggleStatus = async (userItem: User) => {
    try {
      const updated = await userService.toggleStatus(userItem.id, currentUser);
      if (updated) {
        toast.success(t("users.updated"));
        await loadData();
      }
    } catch (e) {
      toast.error(t("users.saveError"));
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await userService.deleteUser(userToDelete.id, currentUser);
      if (!res.success) {
        if (res.error === "cannotDeleteSelf") {
          toast.error(t("users.cannotDeleteSelf"));
        } else if (res.error === "cannotDeleteSuperAdmin") {
          toast.error(t("users.cannotDeleteSuperAdmin"));
        } else {
          toast.error(t("users.deleteError"));
        }
        return;
      }

      if (res.deactivated) {
        toast.info(t("users.teacherDeactivatedNotice"));
      } else {
        toast.success(t("users.deleted"));
      }
      setUserToDelete(null);
      await loadData();
    } catch (e) {
      toast.error(t("users.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery));

    const matchesRole = selectedRole === "all" || u.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || u.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const isSuperAdmin = currentUser?.role === "super_admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("users.title")}
        description={t("users.description")}
      >
        <Button
          onClick={() => {
            setUserToEdit(null);
            setIsDialogOpen(true);
          }}
          variant="gradient"
          className="gap-2 shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          <span>{t("users.addUser")}</span>
        </Button>
      </PageHeader>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-4 rounded-xl border border-border/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("users.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {isSuperAdmin && (
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full sm:w-[160px] text-xs">
              <SelectValue placeholder={t("users.allRoles")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("users.allRoles")}</SelectItem>
              <SelectItem value="super_admin">{t("roles.super_admin")}</SelectItem>
              <SelectItem value="admin">{t("roles.admin")}</SelectItem>
              <SelectItem value="teacher">{t("roles.teacher")}</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[150px] text-xs">
            <SelectValue placeholder={t("common.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="active">{t("users.statusActive")}</SelectItem>
            <SelectItem value="inactive">{t("users.statusInactive")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* USERS TABLE */}
      <UsersTable
        users={filteredUsers}
        classrooms={classrooms}
        currentUser={currentUser}
        loading={loading}
        onEdit={(user) => {
          setUserToEdit(user);
          setIsDialogOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
        onDelete={(user) => setUserToDelete(user)}
        onAddUser={() => {
          setUserToEdit(null);
          setIsDialogOpen(true);
        }}
      />

      {/* CREATE / EDIT DIALOG */}
      <UserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userToEdit={userToEdit}
        currentUser={currentUser}
        classrooms={classrooms}
        onSubmit={handleSaveUser}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <UserDeleteDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        userToDelete={userToDelete}
        currentUser={currentUser}
        classrooms={classrooms}
        onConfirm={handleDeleteUser}
        isLoading={isDeleting}
      />
    </div>
  );
};
