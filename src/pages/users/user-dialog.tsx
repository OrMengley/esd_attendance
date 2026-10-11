import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { User, UserRole, UserStatus } from "@/models/user.model";
import { Classroom } from "@/models/classroom.model";
import { Eye, EyeOff, Lock, User as UserIcon, Mail, Phone } from "lucide-react";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit?: User | null;
  currentUser: User | null;
  classrooms: Classroom[];
  onSubmit: (userData: Omit<User, "id" | "createdAt" | "updatedAt">) => Promise<void>;
}

export const UserDialog: React.FC<UserDialogProps> = ({
  open,
  onOpenChange,
  userToEdit,
  currentUser,
  classrooms,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("teacher");
  const [assignedClassroomIds, setAssignedClassroomIds] = useState<string[]>([]);
  const [status, setStatus] = useState<UserStatus>("active");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name || "");
      setUsername(userToEdit.username || "");
      setPassword(""); // Clear password field on edit
      setEmail(userToEdit.email || "");
      setPhone(userToEdit.phone || "");
      setRole(userToEdit.role || "teacher");
      setAssignedClassroomIds(userToEdit.assignedClassroomIds || []);
      setStatus(userToEdit.status || "active");
    } else {
      setName("");
      setUsername("");
      setPassword("");
      setEmail("");
      setPhone("");
      setRole("teacher");
      setAssignedClassroomIds([]);
      setStatus("active");
    }
    setShowPassword(false);
    setValidationError(null);
  }, [userToEdit, open]);

  const handleToggleClass = (classId: string) => {
    setAssignedClassroomIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const validateForm = (): boolean => {
    setValidationError(null);

    // Name validation
    if (!name.trim()) {
      setValidationError(t("users.nameRequired"));
      return false;
    }

    // Username validation: min 3 chars, no spaces
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      setValidationError(t("users.usernameMinLength"));
      return false;
    }
    if (/\s/.test(cleanUsername)) {
      setValidationError(t("users.usernameNoSpaces"));
      return false;
    }

    // Password validation on create
    if (!userToEdit && (!password || password.length < 3)) {
      setValidationError(t("users.passwordMinLength"));
      return false;
    }

    // Email validation if provided
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidationError(t("users.invalidEmail"));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim() || userToEdit?.password || "123456",
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        role,
        assignedClassroomIds: role === "teacher" ? assignedClassroomIds : [],
        status,
        avatarUrl: userToEdit?.avatarUrl || "",
        lastLogin: userToEdit?.lastLogin || "",
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuperAdmin = currentUser?.role === "super_admin";
  const isSelf = userToEdit && currentUser?.id === userToEdit.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {userToEdit ? t("users.editUser") : t("users.addUser")}
          </DialogTitle>
          <DialogDescription>
            {t("users.dialogDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
              {validationError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="usr-name" className="text-xs">
                {t("users.fullName")} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="usr-name"
                  placeholder="e.g. Sok Dara"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="usr-username" className="text-xs">
                {t("users.username")} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="usr-username"
                  placeholder="e.g. sok_dara"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="usr-pass" className="text-xs">
                {t("users.password")} {!userToEdit && <span className="text-destructive">*</span>}
              </Label>
              <div className="relative">
                <Input
                  id="usr-pass"
                  type={showPassword ? "text" : "password"}
                  placeholder={userToEdit ? t("users.passwordPlaceholderEdit") : t("users.passwordPlaceholderNew")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required={!userToEdit}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="usr-role" className="text-xs">
                {t("users.role")} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={role}
                onValueChange={(v: UserRole) => setRole(v)}
                disabled={Boolean(isSelf && userToEdit?.role === "super_admin")} // Cannot change own super_admin role
              >
                <SelectTrigger id="usr-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">{t("roles.teacher")}</SelectItem>
                  {isSuperAdmin && (
                    <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="usr-email" className="text-xs">
                {t("users.email")}
              </Label>
              <Input
                id="usr-email"
                type="email"
                placeholder="example@school.edu.kh"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="usr-phone" className="text-xs">
                {t("users.phone")}
              </Label>
              <Input
                id="usr-phone"
                placeholder="012xxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="usr-status" className="text-xs">
              {t("users.accountStatus")}
            </Label>
            <Select
              value={status}
              onValueChange={(v: UserStatus) => setStatus(v)}
              disabled={Boolean(isSelf)} // Cannot deactivate self
            >
              <SelectTrigger id="usr-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("users.statusActive")}</SelectItem>
                <SelectItem value="inactive">{t("users.statusInactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned Classrooms (Teacher only) */}
          {role === "teacher" && (
            <div className="p-3.5 rounded-xl border bg-muted/40 space-y-2">
              <Label className="text-xs font-semibold text-foreground">
                {t("users.assignedClassesHelp")}
              </Label>
              {classrooms.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-1">
                  {t("classes.noClassesDesc")}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-40 overflow-y-auto">
                  {classrooms.map((c) => {
                    const checked = assignedClassroomIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleToggleClass(c.id)}
                        className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          checked
                            ? "bg-primary/10 border-primary/40 font-medium text-primary dark:text-blue-200"
                            : "bg-card hover:bg-muted/70"
                        }`}
                      >
                        <Checkbox
                          id={`cls-chk-${c.id}`}
                          checked={checked}
                          onCheckedChange={() => handleToggleClass(c.id)}
                        />
                        <span className="truncate">{c.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="gradient" disabled={isSubmitting}>
              {isSubmitting
                ? t("common.loading")
                : userToEdit
                ? t("common.edit")
                : t("users.addUser")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
