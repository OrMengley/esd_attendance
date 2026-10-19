import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Upload,
  Save,
  GraduationCap,
  Sparkles,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { settingService, defaultSettings } from "@/services/setting.service";
import { uploadImage } from "@/services/upload.service";

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [centerName, setCenterName] = useState(defaultSettings.centerName);
  const [phone, setPhone] = useState(defaultSettings.phone);
  const [email, setEmail] = useState(defaultSettings.email);
  const [address, setAddress] = useState(defaultSettings.address);
  const [logoUrl, setLogoUrl] = useState(defaultSettings.logoUrl || "");

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await settingService.getSettings();
      setCenterName(data.centerName || defaultSettings.centerName);
      setPhone(data.phone || defaultSettings.phone);
      setEmail(data.email || defaultSettings.email);
      setAddress(data.address || defaultSettings.address);
      setLogoUrl(data.logoUrl || "");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("settings.logoTypeError"));
      return;
    }

    // Check file size (2MB limit)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error(t("settings.logoSizeError"));
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadImage(file);
      setLogoUrl(uploadedUrl);
      toast.success(t("settings.logoUpdateSuccess"));
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error(t("common.error"));
    } finally {
      setIsUploading(false);
      // Reset input value so user can pick same file again if desired
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success(t("settings.logoRemoveSuccess"));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await settingService.saveSettings({
        centerName: centerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        logoUrl,
      });
      toast.success(t("settings.saveSuccess"));
    } catch (e) {
      console.error(e);
      toast.error(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-full">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="gap-4 flex">
          <Card className="border-border/80 shadow-sm w-1/2">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {t("settings.generalCardTitle")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("settings.generalCardDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="set-name" className="text-xs">
                  {t("settings.centerName")}
                </Label>
                <Input
                  id="set-name"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="set-phone" className="text-xs">
                    {t("settings.phoneNumber")}
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="set-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="set-email" className="text-xs">
                    {t("settings.email")}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="set-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="set-address" className="text-xs">
                  {t("settings.address")}
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="set-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LOGO UPLOAD & PREVIEW */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                {t("settings.logoCardTitle")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("settings.logoCardDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
                id="logo-file-input"
              />

              <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl border border-dashed border-border bg-muted/20 hover:bg-muted/30 transition-colors">
                {/* Logo Preview Box */}
                <div className="relative group">
                  <div className="h-28 w-28 rounded-2xl bg-gradient-to-tr from-brand-navy to-brand-primary text-white flex items-center justify-center shadow-lg shadow-blue-950/25 shrink-0 overflow-hidden ring-4 ring-primary/10 p-1.5">
                    <img
                      src={logoUrl || "/images/Logo-Wat-Soriyaram-Training-Computer-School.png"}
                      alt="School Logo"
                      className="h-full w-full object-contain rounded-xl bg-background/90 p-1"
                    />
                  </div>

                  {isUploading && (
                    <div className="absolute inset-0 rounded-2xl bg-black/50 backdrop-blur-xs flex items-center justify-center text-white">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFileClick}
                      disabled={isUploading || isSaving}
                      className="text-xs gap-1.5 h-9 rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{t("settings.uploadingLogo")}</span>
                        </>
                      ) : logoUrl ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>{t("settings.changeLogo")}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          <span>{t("settings.chooseLogo")}</span>
                        </>
                      )}
                    </Button>

                    {logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLogo}
                        disabled={isUploading || isSaving}
                        className="text-xs gap-1.5 h-9 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{t("settings.removeLogo")}</span>
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-khmer leading-relaxed">
                    {t("settings.logoHint")}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isSaving || isUploading}
                  className="gap-2 shadow-sm rounded-xl px-6 h-10"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t("common.loading")}</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{t("settings.saveSettings")}</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>


        </form>
      )}
    </div>
  );
};
