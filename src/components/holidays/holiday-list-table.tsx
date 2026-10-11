import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { HolidayStatusBadge } from "./holiday-status-badge";
import { HolidayPeriodBadge } from "./holiday-period-badge";
import { calculateHolidayDays } from "@/lib/holiday-calendar";
import { getHolidayPeriod } from "@/lib/holiday-period";
import { formatKhmerDate } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MoreHorizontal,
  Edit2,
  CheckCircle2,
  XCircle,
  Calendar,
  CalendarOff,
  Palmtree,
} from "lucide-react";

interface HolidayListTableProps {
  holidays: SchoolHoliday[];
  onToggleStatus: (holiday: SchoolHoliday) => void;
  isLoading?: boolean;
}

export const HolidayListTable: React.FC<HolidayListTableProps> = ({
  holidays,
  onToggleStatus,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  if (holidays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card rounded-2xl border border-dashed">
        <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3.5">
          <Palmtree className="w-7 h-7 text-amber-500" />
        </div>
        <h4 className="text-sm sm:text-base font-semibold text-foreground font-khmer">
          {t("holidays.noHolidays", { defaultValue: "មិនមានទិន្នន័យថ្ងៃឈប់សម្រាកទេ" })}
        </h4>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 font-khmer">
          {t("holidays.noHolidaysDesc", {
            defaultValue: "ចុច \"បន្ថែមថ្ងៃឈប់សម្រាក\" ដើម្បីបង្កើតកំណត់ត្រាឈប់សម្រាកថ្មី។",
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-b border-border/60">
              <TableHead className="w-12 text-center text-xs font-semibold font-khmer">
                {t("common.no", { defaultValue: "ល.រ" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer min-w-[190px]">
                {t("holidays.nameKm", { defaultValue: "ឈ្មោះថ្ងៃឈប់សម្រាក" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer whitespace-nowrap">
                {t("holidays.startDate", { defaultValue: "ថ្ងៃចាប់ផ្តើម" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer whitespace-nowrap">
                {t("holidays.endDate", { defaultValue: "ថ្ងៃបញ្ចប់" })}
              </TableHead>
              <TableHead className="text-center text-xs font-semibold font-khmer whitespace-nowrap">
                {t("holidays.totalDays", { defaultValue: "ចំនួនថ្ងៃ" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer whitespace-nowrap">
                {t("holidays.period", { defaultValue: "កាលកំណត់" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer">
                {t("common.status", { defaultValue: "ស្ថានភាព" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer max-w-[160px]">
                {t("students.note", { defaultValue: "ចំណាំ" })}
              </TableHead>
              <TableHead className="text-right text-xs font-semibold font-khmer w-[80px]">
                {t("common.actions", { defaultValue: "សកម្មភាព" })}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holidays.map((item, index) => {
              const daysCount = calculateHolidayDays(item.startDate, item.endDate);
              const period = getHolidayPeriod(item.startDate, item.endDate);

              return (
                <TableRow key={item.id} className="hover:bg-muted/30 border-b border-border/40">
                  {/* Index */}
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">
                    {index + 1}
                  </TableCell>

                  {/* Holiday Name */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-foreground font-khmer">
                        {item.nameKm}
                      </div>
                      {item.nameEn && (
                        <div className="text-xs text-muted-foreground font-medium">
                          {item.nameEn}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Start Date */}
                  <TableCell className="text-xs text-foreground font-medium whitespace-nowrap">
                    {formatKhmerDate(item.startDate)}
                  </TableCell>

                  {/* End Date */}
                  <TableCell className="text-xs text-foreground font-medium whitespace-nowrap">
                    {formatKhmerDate(item.endDate)}
                  </TableCell>

                  {/* Total Days */}
                  <TableCell className="text-center">
                    <span className="font-mono font-bold text-xs bg-muted/80 text-foreground px-2 py-0.5 rounded-md border border-border/60">
                      {daysCount} {t("classes.daysUnit", { defaultValue: "ថ្ងៃ" })}
                    </span>
                  </TableCell>

                  {/* Period */}
                  <TableCell>
                    <HolidayPeriodBadge period={period} />
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <HolidayStatusBadge status={item.status} />
                  </TableCell>

                  {/* Note */}
                  <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate" title={item.note}>
                    {item.note || "-"}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 font-khmer">
                        <DropdownMenuItem asChild className="cursor-pointer gap-2">
                          <Link to={`/holidays/${item.id}/edit`}>
                            <Edit2 className="h-4 w-4 text-amber-500" />
                            <span>{t("common.edit", { defaultValue: "កែប្រែ" })}</span>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {item.status === "active" ? (
                          <DropdownMenuItem
                            onClick={() => onToggleStatus(item)}
                            className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>{t("holidays.deactivate", { defaultValue: "កំណត់ជា អសកម្ម" })}</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => onToggleStatus(item)}
                            className="cursor-pointer gap-2 text-emerald-600 focus:text-emerald-600"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{t("holidays.activate", { defaultValue: "កំណត់ជា សកម្ម" })}</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {holidays.map((item, index) => {
          const daysCount = calculateHolidayDays(item.startDate, item.endDate);
          const period = getHolidayPeriod(item.startDate, item.endDate);

          return (
            <Card
              key={item.id}
              className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-foreground font-khmer">
                        {index + 1}. {item.nameKm}
                      </span>
                    </div>
                    {item.nameEn && (
                      <p className="text-xs text-muted-foreground truncate font-medium">
                        {item.nameEn}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <HolidayPeriodBadge period={period} />
                    <HolidayStatusBadge status={item.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/40 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-khmer">
                      {t("holidays.startDate")}:
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatKhmerDate(item.startDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-khmer">
                      {t("holidays.endDate")}:
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatKhmerDate(item.endDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-foreground font-semibold">
                    {daysCount} {t("classes.daysUnit", { defaultValue: "ថ្ងៃ" })}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-xs font-khmer h-8 gap-1"
                    >
                      <Link to={`/holidays/${item.id}/edit`}>
                        <Edit2 className="h-3.5 w-3.5 text-amber-500" />
                        <span>{t("common.edit")}</span>
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleStatus(item)}
                      className={`text-xs font-khmer h-8 gap-1 ${
                        item.status === "active" ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {item.status === "active" ? (
                        <>
                          <XCircle className="h-3.5 w-3.5" />
                          <span>{t("holidays.deactivate")}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{t("holidays.activate")}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

