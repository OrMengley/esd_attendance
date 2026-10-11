import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { useSchoolSettings } from "@/hooks/use-school-settings";
import { toast } from "sonner";
import {
    GraduationCap,
    Eye,
    EyeOff,
    LogIn,
    Lock,
    User as UserIcon,
    Sparkles,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const settings = useSchoolSettings();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        try {
            const saved = localStorage.getItem("esd_remember_credentials");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.username) setUsername(parsed.username);
                if (parsed.password) setPassword(parsed.password);
                setRememberMe(true);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            toast.error(t("auth.inputRequiredError"));
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await login(username.trim(), password.trim());
            if (res.success && res.user) {
                if (rememberMe) {
                    localStorage.setItem(
                        "esd_remember_credentials",
                        JSON.stringify({ username: username.trim(), password: password.trim() })
                    );
                } else {
                    localStorage.removeItem("esd_remember_credentials");
                }
                toast.success(t("auth.welcomeToast", { name: res.user.name }));
                navigate("/dashboard");
            } else {
                let errorMsg = res.error;
                if (res.error === "រកមិនឃើញគណនីអ្នកប្រើប្រាស់") errorMsg = t("auth.userNotFound");
                else if (res.error === "លេខសម្ងាត់មិនត្រឹមត្រូវ") errorMsg = t("auth.wrongPassword");
                else if (res.error === "គណនីនេះត្រូវបានបិទ") errorMsg = t("auth.accountInactive");
                toast.error(errorMsg || t("common.error"));
            }
        } catch (error) {
            toast.error(t("auth.connectionError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const fillTestCredentials = (u: string, p: string) => {
        setUsername(u);
        setPassword(p);
    };

    return (
        <div
            className="min-h-screen w-full relative flex items-center justify-center lg:justify-start bg-slate-950 text-slate-100 overflow-hidden font-sans"
            style={{
                backgroundImage: `url('/images/Background-Computer-Wat-Soriyaram.jpg'), url('/images/login-bg.jpg')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Ambient overlay to balance contrast while preserving the background artwork */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/40 lg:from-slate-950/92 lg:via-slate-950/70 lg:to-slate-950/20 pointer-events-none backdrop-blur-[1px]" />

            {/* Ambient tech glow */}
            <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#314B9C]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#F3B51B]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar with Language Switcher */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-3">
                <LanguageSwitcher className="border-white/15 bg-slate-950/60 backdrop-blur-md text-white hover:bg-slate-900/80 shadow-lg rounded-xl" />
            </div>

            {/* Main Content Layout */}
            <div className="w-full h-full min-h-screen flex items-center justify-between p-4 sm:p-8 lg:p-16 z-10">
                <div className="w-full max-w-md lg:max-w-lg space-y-6 mx-auto lg:mx-0">
                    {/* Brand Header */}
                    <div className="space-y-3 text-center lg:text-left">
                        <div className="inline-flex items-center gap-3">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 p-1.5 text-white shadow-xl shadow-blue-950/40 ring-2 ring-white/20 overflow-hidden shrink-0 backdrop-blur-sm">
                                <img
                                    src={settings.logoUrl || "/images/Logo-Wat-Soriyaram-Training-Computer-School.png"}
                                    alt="Logo"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            <div className="text-left">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-[#F3B51B] bg-[#1E347B]/80 border border-[#F3B51B]/30 px-2.5 py-0.5 rounded-full">
                                    <ShieldCheck className="h-3.5 w-3.5 text-[#F3B51B]" /> ESD Attendance System
                                </span>
                            </div>
                        </div>

                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-khmer leading-snug drop-shadow-md">
                                {settings.centerName || t("auth.brandTitle")}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 font-khmer mt-1">
                                {t("auth.brandSubtitle")}
                            </p>
                        </div>
                    </div>

                    {/* Login Card with Glassmorphism */}
                    <Card className="border-[#314B9C]/30 bg-slate-950/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl rounded-2xl overflow-hidden ring-1 ring-white/10">
                        <CardHeader className="space-y-1 pb-4 border-b border-white/5">
                            <CardTitle className="text-lg font-bold text-white flex items-center justify-between font-khmer">
                                <span>{t("auth.signInTitle")}</span>
                                <span className="text-[11px] font-semibold text-[#F3B51B] bg-[#1E347B]/60 px-2.5 py-1 rounded-lg border border-[#F3B51B]/30 font-sans">
                                    Portal v1.0
                                </span>
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400 font-khmer">
                                {t("auth.signInDesc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="username" className="text-xs text-slate-300 font-khmer">
                                        {t("auth.usernameLabel")}
                                    </Label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-3 h-4 w-4 text-[#F3B51B]" />
                                        <Input
                                            id="username"
                                            placeholder={t("auth.usernamePlaceholder")}
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="pl-9 bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 focus-visible:ring-[#314B9C] focus-visible:border-[#314B9C] rounded-xl h-10 text-xs transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-xs text-slate-300 font-khmer">
                                            {t("auth.passwordLabel")}
                                        </Label>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-[#F3B51B]" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder={t("auth.passwordPlaceholder")}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-9 pr-10 bg-slate-900/80 border-slate-700/80 text-white placeholder:text-slate-500 focus-visible:ring-[#314B9C] focus-visible:border-[#314B9C] rounded-xl h-10 text-xs transition-all"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                                            aria-label="Toggle password visibility"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-0.5">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="remember-password"
                                            checked={rememberMe}
                                            onCheckedChange={(checked) => setRememberMe(checked === true)}
                                            className="border-slate-600 data-[state=checked]:bg-[#314B9C] data-[state=checked]:border-[#314B9C] rounded-md h-4 w-4"
                                        />
                                        <label
                                            htmlFor="remember-password"
                                            className="text-xs font-medium text-slate-300 font-khmer cursor-pointer select-none hover:text-white transition-colors"
                                        >
                                            {t("auth.rememberPassword")}
                                        </label>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-11 text-sm font-semibold shadow-lg shadow-[#314B9C]/30 gap-2 mt-2 rounded-xl bg-[#314B9C] hover:bg-[#263E89] text-white transition-all active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <>
                                             <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            <span>{t("auth.loggingIn")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="h-4 w-4" />
                                            <span>{t("auth.loginButton")}</span>
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <p className="text-center lg:text-left text-xs text-slate-400 font-khmer">
                        {t("app.copyright", { year: new Date().getFullYear() })}
                    </p>
                </div>
            </div>
        </div>
    );
};