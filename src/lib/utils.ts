import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKhmerDate(dateString: string | Date | undefined): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateString);
  }
}

export function formatKhmerTime(dateString: string | Date | undefined): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleTimeString("km-KH", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(dateString);
  }
}

export function formatAuditDateTime(dateInput: string | Date | undefined, lang: string = "km"): string {
  if (!dateInput) return "-";
  try {
    const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    if (lang === "km") {
      const khmerMonths = [
        "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
        "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
      ];
      const khmerDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
      const toKhmerNum = (num: number | string) => String(num).replace(/[0-9]/g, (w) => khmerDigits[parseInt(w, 10)]);

      const day = toKhmerNum(d.getDate());
      const month = khmerMonths[d.getMonth()];
      const year = toKhmerNum(d.getFullYear());

      let hours = d.getHours();
      const minutes = toKhmerNum(String(d.getMinutes()).padStart(2, "0"));
      const isPm = hours >= 12;
      const period = isPm ? "រសៀល" : "ព្រឹក";
      hours = hours % 12;
      if (hours === 0) hours = 12;
      const khmerHours = toKhmerNum(hours);

      return `${day} ${month} ${year}, ${khmerHours}:${minutes} ${period}`;
    } else {
      const dateStr = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      return `${dateStr}, ${timeStr}`;
    }
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats an ISO date string as a compact datetime (YYYY-MM-DD HH:mm).
 * Used for audit log timestamps.
 */
export function formatKhmerDateTime(dateInput: string | Date | undefined): string {
  if (!dateInput) return "—";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch {
    return String(dateInput);
  }
}
