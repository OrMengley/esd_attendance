import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { studentService } from "@/services/student.service";
import { uploadImage } from "@/services/upload.service";
import { Student, StudentStatus } from "@/models/student.model";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Upload,
  Trash2,
  User,
  MapPin,
  Users,
  FileText,
  Camera,
  Loader2,
  CheckCircle2,
  Building2,
} from "lucide-react";

interface StudentFormPageProps {
  mode: "create" | "edit";
}

export const StudentFormPage: React.FC<StudentFormPageProps> = ({ mode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentBranchId, isAllBranches, branches } = useBranch();
  const { id } = useParams<{ id: string }>();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [studentCode, setStudentCode] = useState("");
  const [branchId, setBranchId] = useState<string>(() => {
    if (!isAllBranches && currentBranchId) return currentBranchId;
    return branches[0]?.id || "";
  });
  const [nameKh, setNameKh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [birthCertificateStatus, setBirthCertificateStatus] = useState<
    "has_certificate" | "no_certificate"
  >("has_certificate");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Address
  const [village, setVillage] = useState("");
  const [commune, setCommune] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("បាត់ដំបង");

  // Father Info
  const [fatherName, setFatherName] = useState("");
  const [fatherOccupation, setFatherOccupation] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");

  // Mother Info
  const [motherName, setMotherName] = useState("");
  const [motherOccupation, setMotherOccupation] = useState("");
  const [motherPhone, setMotherPhone] = useState("");

  // Additional Info
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<StudentStatus>("active");

  // Loading & uploading states
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Load existing student data for edit mode
  useEffect(() => {
    if (mode === "edit" && id) {
      loadStudentData(id);
    } else if (mode === "create") {
      // Auto-suggest next student code e.g. STU-100 or auto-generated
      suggestStudentCode();
      if (!isAllBranches && currentBranchId) {
        setBranchId(currentBranchId);
      } else if (branches.length > 0) {
        setBranchId(branches[0].id);
      }
    }
  }, [mode, id, isAllBranches, currentBranchId, branches]);

  const suggestStudentCode = async () => {
    try {
      const all = await studentService.getStudents();
      const codeNumber = all.length + 1;
      const padded = String(codeNumber).padStart(3, "0");
      setStudentCode(`STU-${padded}`);
    } catch (e) {
      setStudentCode(`STU-${Date.now().toString().slice(-4)}`);
    }
  };

  const loadStudentData = async (studentId: string) => {
    setIsLoading(true);
    try {
      const student = await studentService.getStudentById(studentId);
      if (!student) {
        toast.error(t("students.noStudentsTitle"));
        navigate("/students");
        return;
      }

      setStudentCode(student.studentCode || "");
      setBranchId(student.branchId || "");
      setNameKh(student.nameKh || "");
      setNameEn(student.nameEn || "");
      setGender(student.gender || "male");
      setDateOfBirth(student.dateOfBirth || "");
      setBirthCertificateStatus(
        student.birthCertificateStatus || "has_certificate"
      );
      setPhone(student.phone || "");
      setAvatarUrl(student.avatarUrl || "");

      // Address
      setVillage(student.address?.village || "");
      setCommune(student.address?.commune || "");
      setDistrict(student.address?.district || "");
      setProvince(student.address?.province || "បាត់ដំបង");

      // Father
      setFatherName(student.fatherName || "");
      setFatherOccupation(student.fatherOccupation || "");
      setFatherPhone(student.fatherPhone || "");

      // Mother
      setMotherName(student.motherName || "");
      setMotherOccupation(student.motherOccupation || "");
      setMotherPhone(student.motherPhone || "");

      // Additional
      setNote(student.note || "");
      setStatus(student.status || "active");
    } catch (e) {
      console.error("Failed to load student for edit:", e);
      toast.error(t("students.fetchError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("students.photoSizeError", { defaultValue: "ទំហំរូបថតត្រូវតែតូចជាង 2MB" }));
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const uploadedUrl = await uploadImage(file);
      setAvatarUrl(uploadedUrl);
      toast.success(t("students.photoUploadSuccess", { defaultValue: "បានបញ្ចូលរូបថតសិស្សដោយជោគជ័យ" }));
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(t("students.saveError"));
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const cleanCode = studentCode.trim();
    const cleanNameKh = nameKh.trim();

    if (!cleanCode) {
      toast.error(t("students.studentCodeRequired"));
      return;
    }

    if (!cleanNameKh) {
      toast.error(t("students.nameKhRequired"));
      return;
    }

    setIsSaving(true);
    try {
      const studentPayload: Omit<Student, "id" | "createdAt" | "updatedAt"> = {
        studentCode: cleanCode,
        branchId: branchId || undefined,
        nameKh: cleanNameKh,
        nameEn: nameEn.trim(),
        gender,
        dateOfBirth,
        birthCertificateStatus,
        phone: phone.trim(),
        avatarUrl,
        address: {
          village: village.trim(),
          commune: commune.trim(),
          district: district.trim(),
          province: province.trim(),
        },
        fatherName: fatherName.trim(),
        fatherOccupation: fatherOccupation.trim(),
        fatherPhone: fatherPhone.trim(),
        motherName: motherName.trim(),
        motherOccupation: motherOccupation.trim(),
        motherPhone: motherPhone.trim(),
        note: note.trim(),
        status,
      };

      if (mode === "create") {
        const created = await studentService.createStudent(
          studentPayload,
          user?.id
        );
        toast.success(t("students.created"));
        // Redirect to detail page
        navigate(`/students/${created.id}`);
      } else if (mode === "edit" && id) {
        const updated = await studentService.updateStudent(
          id,
          studentPayload,
          user?.id
        );
        toast.success(t("students.updated"));
        navigate(`/students/${updated.id}`);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      if (err.message === "STUDENT_CODE_EXISTS") {
        toast.error(t("students.studentCodeExists"));
      } else {
        toast.error(err.message || t("students.saveError"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <div className="h-10 w-48 bg-muted/50 rounded-xl animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-card rounded-2xl border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Action Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl shrink-0"
          >
            <Link
              to={mode === "edit" && id ? `/students/${id}` : "/students"}
              title={t("students.backToStudents")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-khmer text-foreground">
              {mode === "create"
                ? t("students.createStudentTitle")
                : t("students.editStudentTitle")}
            </h1>
            <p className="text-xs text-muted-foreground font-khmer">
              {t("students.profileSummary")}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate(mode === "edit" && id ? `/students/${id}` : "/students")
            }
            disabled={isSaving}
            className="text-xs font-khmer h-9"
          >
            {t("common.cancel")}
          </Button>

          <Button
            type="submit"
            form="student-form"
            disabled={isSaving || isUploadingPhoto}
            className="text-xs font-khmer h-9 gap-1.5 shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("common.saving")}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{t("common.save")}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <form id="student-form" onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Student Information */}
        <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <User className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-khmer">
                  {t("students.studentInfo")}
                </CardTitle>
                <CardDescription className="text-xs font-khmer">
                  {t("students.studentInfoDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* Photo upload + Code & Names */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-2">
              {/* Photo Upload Box */}
              <div className="flex flex-col items-center space-y-2 shrink-0">
                <div className="relative group">
                  <Avatar className="h-28 w-28 rounded-2xl ring-2 ring-border shadow-xs overflow-hidden">
                    <AvatarImage src={avatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary dark:text-blue-400 font-bold text-2xl rounded-2xl">
                      {nameKh ? nameKh.charAt(0) : "S"}
                    </AvatarFallback>
                  </Avatar>

                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="text-xs font-khmer h-7 px-2.5 gap-1"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>
                      {avatarUrl
                        ? t("students.changePhoto")
                        : t("students.uploadPhoto")}
                    </span>
                  </Button>

                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePhoto}
                      disabled={isUploadingPhoto}
                      className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-7 px-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground font-khmer text-center max-w-[140px]">
                  {t("students.photoHint")}
                </span>
              </div>

              {/* Basic Fields */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* Student Code */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold font-khmer flex items-center gap-1">
                    <span>{t("students.studentCode")}</span>
                    <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder={t("students.studentCodePlaceholder")}
                    className="font-mono text-xs sm:text-sm h-9 bg-background"
                    required
                  />
                </div>

                {/* Branch Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold font-khmer flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-blue-500" />
                    <span>{t("branches.branch", { defaultValue: "សាខា" })}</span>
                    <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={branchId} onValueChange={setBranchId} disabled={!isAllBranches}>
                    <SelectTrigger className="text-xs sm:text-sm h-9 bg-background font-khmer">
                      <SelectValue placeholder={t("branches.selectBranchPlaceholder", { defaultValue: "ជ្រើសរើសសាខាសាលា..." })} />
                    </SelectTrigger>
                    <SelectContent className="font-khmer">
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.nameKh} ({b.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Khmer Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold font-khmer flex items-center gap-1">
                    <span>{t("students.nameKh")}</span>
                    <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={nameKh}
                    onChange={(e) => setNameKh(e.target.value)}
                    placeholder={t("students.nameKhPlaceholder")}
                    className="text-xs sm:text-sm h-9 bg-background font-khmer"
                    required
                  />
                </div>

                {/* English Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold font-khmer">
                    {t("students.nameEn")} ({t("common.optional")})
                  </Label>
                  <Input
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder={t("students.nameEnPlaceholder")}
                    className="text-xs sm:text-sm h-9 bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Gender, DOB, Birth Certificate, Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-border/60">
              {/* Gender */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer flex items-center gap-1">
                  <span>{t("students.gender")}</span>
                  <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={gender}
                  onValueChange={(val: "male" | "female") => setGender(val)}
                >
                  <SelectTrigger className="text-xs sm:text-sm h-9 bg-background font-khmer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-khmer">
                    <SelectItem value="male">{t("gender.male")}</SelectItem>
                    <SelectItem value="female">{t("gender.female")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer">
                  {t("students.dob")} ({t("common.optional")})
                </Label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="text-xs sm:text-sm h-9 bg-background"
                />
              </div>

              {/* Birth Certificate */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer">
                  {t("students.birthCertificate")} ({t("common.optional")})
                </Label>
                <Select
                  value={birthCertificateStatus}
                  onValueChange={(val: "has_certificate" | "no_certificate") =>
                    setBirthCertificateStatus(val)
                  }
                >
                  <SelectTrigger className="text-xs sm:text-sm h-9 bg-background font-khmer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-khmer">
                    <SelectItem value="has_certificate">
                      {t("students.hasCertificate")}
                    </SelectItem>
                    <SelectItem value="no_certificate">
                      {t("students.noCertificate")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Student Phone */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer">
                  {t("students.phone")} ({t("common.optional")})
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("students.phonePlaceholder")}
                  className="font-mono text-xs sm:text-sm h-9 bg-background"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Address Information */}
        <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-khmer">
                  {t("students.addressInfo")}
                </CardTitle>
                <CardDescription className="text-xs font-khmer">
                  {t("students.addressInfoDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Village */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold font-khmer">
                {t("students.village")} ({t("common.optional")})
              </Label>
              <Input
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder={t("students.villagePlaceholder")}
                className="text-xs sm:text-sm h-9 bg-background font-khmer"
              />
            </div>

            {/* Commune */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold font-khmer">
                {t("students.commune")} ({t("common.optional")})
              </Label>
              <Input
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                placeholder={t("students.communePlaceholder")}
                className="text-xs sm:text-sm h-9 bg-background font-khmer"
              />
            </div>

            {/* District */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold font-khmer">
                {t("students.district")} ({t("common.optional")})
              </Label>
              <Input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={t("students.districtPlaceholder")}
                className="text-xs sm:text-sm h-9 bg-background font-khmer"
              />
            </div>

            {/* Province */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold font-khmer">
                {t("students.province")} ({t("common.optional")})
              </Label>
              <Input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder={t("students.provincePlaceholder")}
                className="text-xs sm:text-sm h-9 bg-background font-khmer"
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3 & 4: Parents Information (Father & Mother) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Father Card */}
          <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-khmer">
                    {t("students.fatherInfo")}
                  </CardTitle>
                  <CardDescription className="text-xs font-khmer">
                    {t("students.fatherInfoDesc")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Father Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer">
                  {t("students.fatherName")} ({t("common.optional")})
                </Label>
                <Input
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder={t("students.fatherNamePlaceholder")}
                  className="text-xs sm:text-sm h-9 bg-background font-khmer"
                />
              </div>

              {/* Father Occupation */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer">
                  {t("students.fatherJob")} ({t("common.optional")})
                </Label>
                <Input
                  value={fatherOccupation}
                  onChange={(e) => setFatherOccupation(e.target.value)}
                  placeholder={t("students.fatherJobPlaceholder")}
                  className="text-xs sm:text-sm h-9 bg-background font-khmer"
                />
              </div>

              {/* Father Phone */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer">
                  {t("students.fatherPhone")} ({t("common.optional")})
                </Label>
                <Input
                  type="tel"
                  value={fatherPhone}
                  onChange={(e) => setFatherPhone(e.target.value)}
                  placeholder={t("students.fatherPhonePlaceholder")}
                  className="font-mono text-xs sm:text-sm h-9 bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Mother Card */}
          <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-khmer">
                    {t("students.motherInfo")}
                  </CardTitle>
                  <CardDescription className="text-xs font-khmer">
                    {t("students.motherInfoDesc")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Mother Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer">
                  {t("students.motherName")} ({t("common.optional")})
                </Label>
                <Input
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder={t("students.motherNamePlaceholder")}
                  className="text-xs sm:text-sm h-9 bg-background font-khmer"
                />
              </div>

              {/* Mother Occupation */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer">
                  {t("students.motherJob")} ({t("common.optional")})
                </Label>
                <Input
                  value={motherOccupation}
                  onChange={(e) => setMotherOccupation(e.target.value)}
                  placeholder={t("students.motherJobPlaceholder")}
                  className="text-xs sm:text-sm h-9 bg-background font-khmer"
                />
              </div>

              {/* Mother Phone */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer">
                  {t("students.motherPhone")} ({t("common.optional")})
                </Label>
                <Input
                  type="tel"
                  value={motherPhone}
                  onChange={(e) => setMotherPhone(e.target.value)}
                  placeholder={t("students.motherPhonePlaceholder")}
                  className="font-mono text-xs sm:text-sm h-9 bg-background"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 5: Additional Information & Status */}
        <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-600 dark:text-slate-400">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-khmer">
                  {t("students.additionalInfo")}
                </CardTitle>
                <CardDescription className="text-xs font-khmer">
                  {t("students.additionalInfoDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Note (2 cols) */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold font-khmer">
                  {t("students.note")} ({t("common.optional")})
                </Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("students.notePlaceholder")}
                  rows={3}
                  className="text-xs sm:text-sm bg-background font-khmer resize-none"
                />
              </div>

              {/* Student Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer">
                  {t("students.studentStatus")}
                </Label>
                <Select
                  value={status}
                  onValueChange={(val: StudentStatus) => setStatus(val)}
                >
                  <SelectTrigger className="text-xs sm:text-sm h-9 bg-background font-khmer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-khmer">
                    <SelectItem value="active">{t("students.statusActive")}</SelectItem>
                    <SelectItem value="inactive">
                      {t("students.statusInactive")}
                    </SelectItem>
                    <SelectItem value="archived">
                      {t("students.statusArchived")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};
