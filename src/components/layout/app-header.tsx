import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import {
  Menu,
  Calendar,
  Clock,
  LogOut,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useNavigate } from "react-router-dom";

interface AppHeaderProps {
  onToggleSidebar: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onToggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isKm = i18n.language === "km";

  const khmerDays = ["អាទិត្យ", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
  const khmerMonths = [
    "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
    "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
  ];

  const formattedDate = isKm
    ? `ថ្ងៃ${khmerDays[time.getDay()]} ទី${time.getDate()} ខែ${khmerMonths[time.getMonth()]} ឆ្នាំ${time.getFullYear()}`
    : time.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  const formattedTime = time.toLocaleTimeString(isKm ? "km-KH" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b bg-card/80 px-4 sm:px-6 backdrop-blur-md shadow-xs">
      {/* Left controls */}
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="rounded-xl text-muted-foreground hover:text-foreground"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden sm:flex items-center text-xs text-muted-foreground gap-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium font-khmer">{formattedDate}</span>
          <span className="text-border">|</span>
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono font-semibold text-foreground">{formattedTime}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2.5">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-1 transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {user?.name ? user.name.charAt(0) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block pr-1">
                <p className="text-xs font-semibold leading-none text-foreground">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                  @{user?.username}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-foreground">{user?.name || t("header.guest")}</p>
                <p className="text-xs text-muted-foreground">@{user?.username} {user?.email && `• ${user.email}`}</p>
                <div className="pt-1">
                  <StatusBadge role={user?.role} />
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer text-xs">
              <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{t("header.systemSettings")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-rose-600 focus:text-rose-600 cursor-pointer text-xs">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("header.logoutAccount")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
