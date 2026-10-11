import React from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EnrollmentTransfer } from "@/models/enrollment-transfer.model";
import { Classroom } from "@/models/classroom.model";
import { User } from "@/models/user.model";
import {
  ArrowRightLeft,
  Calendar,
  Clock,
  School,
  FileText,
  User as UserIcon,
} from "lucide-react";
import { formatKhmerDate, formatAuditDateTime } from "@/lib/utils";

interface TransferHistorySectionProps {
  transfers: EnrollmentTransfer[];
  classrooms: Classroom[];
  users: User[];
  isLoading?: boolean;
}

export const TransferHistorySection: React.FC<TransferHistorySectionProps> = ({
  transfers,
  classrooms,
  users,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();

  const getClassroom = (classroomId: string) => {
    return classrooms.find((c) => c.id === classroomId);
  };

  const getUser = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  if (transfers.length === 0 && !isLoading) {
    return null; // Only show section if student has transfer history
  }

  return (
    <Card className="rounded-2xl border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/10 shadow-xs overflow-hidden">
      <CardHeader className="bg-purple-500/10 border-b border-purple-500/20 py-3.5 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-purple-600/15 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-khmer text-foreground flex items-center gap-2">
                <span>{t("transfer.historyTitle", { defaultValue: "ប្រវត្តិការផ្ទេរថ្នាក់" })}</span>
                <Badge className="bg-purple-600/20 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] py-0 px-2 font-mono">
                  {transfers.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs font-khmer text-muted-foreground">
                {t("transfer.historyDesc", {
                  defaultValue: "កំណត់ត្រានៃការផ្លាស់ប្តូរវេន និងថ្នាក់រៀនរបស់សិស្ស",
                })}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border/60">
                <TableHead className="font-khmer text-xs">
                  {t("transfer.fromClass", { defaultValue: "ពីថ្នាក់" })}
                </TableHead>
                <TableHead className="font-khmer text-xs">
                  {t("transfer.toClass", { defaultValue: "ទៅថ្នាក់" })}
                </TableHead>
                <TableHead className="font-khmer text-xs whitespace-nowrap">
                  {t("transfer.effectiveDate", { defaultValue: "ថ្ងៃចាប់ផ្តើមផ្ទេរ" })}
                </TableHead>
                <TableHead className="font-khmer text-xs">
                  {t("transfer.reason", { defaultValue: "មូលហេតុ" })}
                </TableHead>
                <TableHead className="font-khmer text-xs">
                  {t("transfer.transferredBy", { defaultValue: "ផ្ទេរដោយ" })}
                </TableHead>
                <TableHead className="font-khmer text-xs whitespace-nowrap">
                  {t("transfer.transferredAt", { defaultValue: "កាលបរិច្ឆេទផ្ទេរ" })}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((tr) => {
                const sourceClass = getClassroom(tr.sourceClassroomId);
                const targetClass = getClassroom(tr.targetClassroomId);
                const transferredByUser = getUser(tr.transferredBy);

                return (
                  <TableRow key={tr.id} className="hover:bg-muted/30 border-b border-border/40">
                    {/* From Class */}
                    <TableCell className="text-xs">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-[11px] bg-muted px-1.5 py-0.5 rounded text-foreground border">
                          {sourceClass ? sourceClass.code : "-"}
                        </span>
                        <div className="font-medium text-foreground font-khmer">
                          {sourceClass ? sourceClass.name : "-"}
                        </div>
                      </div>
                    </TableCell>

                    {/* To Class */}
                    <TableCell className="text-xs">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-[11px] bg-purple-500/10 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">
                          {targetClass ? targetClass.code : "-"}
                        </span>
                        <div className="font-bold text-foreground font-khmer">
                          {targetClass ? targetClass.name : "-"}
                        </div>
                      </div>
                    </TableCell>

                    {/* Effective Date */}
                    <TableCell className="text-xs text-foreground font-medium whitespace-nowrap">
                      {formatKhmerDate(tr.effectiveDate)}
                    </TableCell>

                    {/* Reason */}
                    <TableCell className="text-xs text-muted-foreground font-khmer max-w-[200px]">
                      <div className="bg-muted/40 p-2 rounded-lg border border-border/50 text-[11px] leading-relaxed">
                        {tr.reason || "-"}
                      </div>
                    </TableCell>

                    {/* Transferred By */}
                    <TableCell className="text-xs">
                      {transferredByUser ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 ring-1 ring-border shrink-0">
                            {transferredByUser.avatarUrl ? (
                              <AvatarImage src={transferredByUser.avatarUrl} />
                            ) : null}
                            <AvatarFallback className="text-[9px] bg-purple-600 text-white font-bold">
                              {transferredByUser.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground truncate">
                              {transferredByUser.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              @{transferredByUser.username}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-mono text-xs">
                          {tr.transferredBy === "system" ? "@system" : "-"}
                        </span>
                      )}
                    </TableCell>

                    {/* Transferred At */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-khmer">
                      {formatAuditDateTime(tr.transferredAt, i18n.language)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
