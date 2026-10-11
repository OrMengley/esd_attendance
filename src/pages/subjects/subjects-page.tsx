import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SubjectDialog } from "@/components/subjects/subject-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { subjectService } from "@/services/subject.service";
import { Subject } from "@/models/subject.model";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Clock,
  Laptop,
} from "lucide-react";

export const SubjectsPage: React.FC = () => {
  const { t } = useTranslation();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const list = await subjectService.getSubjects();
      setSubjects(list);
    } catch (e) {
      console.error(e);
      toast.error(t("subjects.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: Omit<Subject, "id">) => {
    try {
      if (subjectToEdit) {
        await subjectService.updateSubject(subjectToEdit.id, data);
        toast.success(t("subjects.updateSuccess"));
      } else {
        await subjectService.createSubject(data);
        toast.success(t("subjects.saveSuccess"));
      }
      setIsDialogOpen(false);
      setSubjectToEdit(null);
      await loadSubjects();
    } catch (e) {
      toast.error(t("subjects.saveError"));
    }
  };

  const handleDelete = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    try {
      await subjectService.deleteSubject(subjectToDelete.id);
      toast.success(t("subjects.deleteSuccess"));
      setSubjectToDelete(null);
      await loadSubjects();
    } catch (e) {
      toast.error(t("subjects.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("subjects.title")}
        description={t("subjects.description")}
      >
        <Button
          onClick={() => {
            setSubjectToEdit(null);
            setIsDialogOpen(true);
          }}
          variant="gradient"
          className="gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>{t("subjects.addSubject")}</span>
        </Button>
      </PageHeader>

      {/* SEARCH BAR */}
      <div className="flex bg-card p-4 rounded-xl border border-border/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("subjects.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* SUBJECTS TABLE */}
      {filteredSubjects.length === 0 ? (
        <EmptyState
          title={t("subjects.noSubjectsTitle")}
          description={t("subjects.noSubjectsDesc")}
          actionLabel={t("subjects.addSubject")}
          onAction={() => {
            setSubjectToEdit(null);
            setIsDialogOpen(true);
          }}
        />
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-32 text-xs">{t("subjects.code")}</TableHead>
                <TableHead className="text-xs">{t("subjects.name")}</TableHead>
                <TableHead className="text-xs">{t("subjects.descriptionLabel")}</TableHead>
                <TableHead className="w-28 text-xs">{t("subjects.duration")}</TableHead>
                <TableHead className="w-24 text-xs">{t("common.status")}</TableHead>
                <TableHead className="w-16 text-right text-xs">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.map((sub) => (
                <TableRow key={sub.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs font-bold text-primary dark:text-blue-400">
                    {sub.code}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                      <Laptop className="h-4 w-4 text-primary shrink-0" />
                      <span>{sub.name}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                    {sub.description || "-"}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {sub.duration ? (
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <Clock className="h-3 w-3 text-amber-500" />
                        {sub.duration}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={sub.status} />
                  </TableCell>

                  <TableCell className="text-right py-2.5">
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
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onClick={() => {
                            setSubjectToEdit(sub);
                            setIsDialogOpen(true);
                          }}
                          className="gap-2 cursor-pointer text-xs"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-amber-500" />
                          <span>{t("common.edit")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setSubjectToDelete(sub)}
                          className="gap-2 cursor-pointer text-xs text-rose-600 focus:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{t("common.delete")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog */}
      <SubjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        subjectToEdit={subjectToEdit}
        onSubmit={handleSave}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!subjectToDelete}
        onOpenChange={(open) => !open && setSubjectToDelete(null)}
        title={t("subjects.deleteTitle")}
        description={t("subjects.deleteConfirm", { name: subjectToDelete?.name || "" })}
        confirmLabel={t("common.confirmDelete")}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};
