import React from "react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "km";

  const changeLang = (lang: "km" | "en") => {
    i18n.changeLanguage(lang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 px-2.5 sm:px-3 text-xs gap-1.5 rounded-xl border-border/80 bg-background/80 hover:bg-muted font-medium transition-all ${
            className || ""
          }`}
        >
          <Globe className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold">{currentLang === "km" ? "ខ្មែរ" : "English"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 font-sans">
        <DropdownMenuItem
          onClick={() => changeLang("km")}
          className="flex items-center justify-between cursor-pointer text-xs py-2 font-khmer"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🇰🇭</span>
            <span className="font-medium">ខ្មែរ (Khmer)</span>
          </div>
          {currentLang === "km" && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLang("en")}
          className="flex items-center justify-between cursor-pointer text-xs py-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🇬🇧</span>
            <span className="font-medium">English</span>
          </div>
          {currentLang === "en" && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
