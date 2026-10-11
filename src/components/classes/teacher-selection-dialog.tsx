import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/models/user.model";
import {
  Search,
  GraduationCap,
  Phone,
  Mail,
  UserPlus,
  Check,
} from "lucide-react";

interface TeacherSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: User[];
  selectedTeacherId?: string;
  onSelect: (teacher: User) => void;
}

export const TeacherSelectionDialog: React.FC<TeacherSelectionDialogProps> = ({
  open,
  onOpenChange,
  teachers,
  selectedTeacherId,
  onSelect,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  // Only active teachers
  const activeTeachers = useMemo(() => {
    return teachers.filter(
      (u) => u.role === "teacher" && (u.status === "active" || !u.status)
    );
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return activeTeachers;
    const q = searchQuery.toLowerCase().trim();
    return activeTeachers.filter((teacher) => {
      const matchName = (teacher.name || "").toLowerCase().includes(q);
      const matchUsername = (teacher.username || "").toLowerCase().includes(q);
      const matchPhone = (teacher.phone || "").toLowerCase().includes(q);
      const matchEmail = (teacher.email || "").toLowerCase().includes(q);
      return matchName || matchUsername || matchPhone || matchEmail;
    });
  }, [activeTeachers, searchQuery]);

  const handleSelect = (teacher: User) => {
    onSelect(teacher);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-6 z-50">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold font-khmer">
                {t("classes.selectTeacherModalTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs font-khmer text-muted-foreground">
                {t("classes.selectTeacherModalDesc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search Input */}
        <div className="pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("classes.searchTeacherPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs sm:text-sm h-9 bg-background"
              autoFocus
            />
          </div>
        </div>

        {/* Teachers List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 min-h-[220px]">
          {filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground font-khmer">
                {t("classes.noTeachersFound")}
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 font-khmer">
                {t("classes.noTeachersFoundDesc")}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4 gap-1.5 text-xs font-khmer">
                <Link to="/users" onClick={() => onOpenChange(false)}>
                  <UserPlus className="h-3.5 w-3.5" />
                  {t("classes.manageUsers")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredTeachers.map((teacher) => {
                const isSelected = selectedTeacherId === teacher.id;
                return (
                  <div
                    key={teacher.id}
                    onClick={() => handleSelect(teacher)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary/40 shadow-xs"
                        : "bg-card hover:bg-muted/40 border-border/70"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <Avatar className="h-10 w-10 ring-1 ring-border shrink-0">
                        <AvatarImage src={teacher.avatarUrl} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                          {teacher.name ? teacher.name.charAt(0) : "T"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                            {teacher.name}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                              <Check className="h-3 w-3" />
                              {t("classes.selectedTeacher")}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="font-mono font-medium">@{teacher.username}</span>
                          {teacher.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="h-3 w-3" />
                              {teacher.phone}
                            </span>
                          )}
                          {teacher.email && (
                            <span className="hidden sm:flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {teacher.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      className="text-xs shrink-0 font-khmer h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(teacher);
                      }}
                    >
                      {t("classes.selectAction")}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
