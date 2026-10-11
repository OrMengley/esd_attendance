import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AttentionItem } from "@/models/dashboard.model";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminAttentionPanelProps {
  items: AttentionItem[];
}

export const AdminAttentionPanel: React.FC<AdminAttentionPanelProps> = ({ items }) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground font-khmer">
              {t("dashboard.attentionPanelTitle", {
                defaultValue: "Requires Attention",
              })}
            </h3>
            <p className="text-[11px] text-muted-foreground font-khmer">
              {t("dashboard.attentionPanelSubtitle", {
                defaultValue: "Items requiring administrative follow-up or completion",
              })}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono text-[11px] font-bold px-1.5">
            {items.length}
          </span>
        )}
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
          <p className="font-semibold text-emerald-700 dark:text-emerald-300 font-khmer">
            {t("dashboard.noAttentionNeeded", {
              defaultValue: "All sessions and records are up to date!",
            })}
          </p>
          <p className="text-[11px] text-muted-foreground font-khmer mt-0.5">
            {t("dashboard.noAttentionNeededDesc", {
              defaultValue: "No missing attendance or overdue classes detected.",
            })}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const isDanger = item.severity === "danger";

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start justify-between gap-3 p-3 rounded-xl border text-xs transition-colors",
                  isDanger
                    ? "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40"
                    : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isDanger ? (
                      <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground font-khmer truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-khmer line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 text-[11px] px-2.5 shrink-0 rounded-lg font-khmer self-center",
                    isDanger
                      ? "border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10"
                      : "border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                  )}
                >
                  <Link to={item.link}>
                    <span>{item.linkText || t("common.view", { defaultValue: "View" })}</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
