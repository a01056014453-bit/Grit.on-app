"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Camera,
  User,
  Plus,
  Trash2,
  CheckCircle,
  Eye,
  EyeOff,
  Save,
  GraduationCap,
  Award,
  Music,
  Star,
  Clock,
  MapPin,
  CreditCard,
} from "lucide-react";
import { TeacherProfileData } from "@/types";
import {
  getTeacherProfileData,
  saveTeacherProfileData,
  getVerification,
} from "@/lib/teacher-store";

const PROFILE_STORAGE_KEY = "grit-on-profile";

function loadUserProfile() {
  if (typeof window === "undefined") return { nickname: "사용자", instrument: "피아노", profileImage: "" };
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) {
      const p = JSON.parse(saved);
      return { nickname: p.nickname || "사용자", instrument: p.instrument || "피아노", profileImage: p.profileImage || "" };
    }
  } catch {}
  return { nickname: "사용자", instrument: "피아노", profileImage: "" };
}

const SPECIALTY_OPTIONS = ["쇼팽", "드뷔시", "베토벤", "모차르트", "바흐", "리스트", "라흐마니노프", "테크닉", "화성학", "시창청음", "반주"];
const LESSON_TARGET_OPTIONS = ["입시", "취미", "전공", "콩쿠르", "그레이드"];
const DAY_OPTIONS = ["월", "화", "수", "목", "금", "토", "일"];
const DEGREE_OPTIONS = ["학사", "석사", "박사", "재학중", "수료"];

export default function TeacherProfileEditPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // User profile (read-only)
  const [userName, setUserName] = useState("사용자");
  const [userInstrument, setUserInstrument] = useState("피아노");

  // AI verification
  const [verifiedInstitutions, setVerifiedInstitutions] = useState<Set<string>>(new Set());

  // Editable profile data
  const [profileImage, setProfileImage] = useState<string>("");
  const [title, setTitle] = useState("");
  const [specialty, setSpecialty] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [lessonTarget, setLessonTarget] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [priceCredits, setPriceCredits] = useState(30);
  const [education, setEducation] = useState<{ school: string; degree: string; major: string; year?: number }[]>([]);
  const [awards, setAwards] = useState<{ competition: string; prize: string; year: number }[]>([]);
  const [performances, setPerformances] = useState<{ title: string; venue?: string; year: number }[]>([]);
  const [teachingExperience, setTeachingExperience] = useState(0);

  // Load data on mount
  useEffect(() => {
    const user = loadUserProfile();
    setUserName(user.nickname);
    setUserInstrument(user.instrument);

    const data = getTeacherProfileData();
    setProfileImage(data.profileImage || user.profileImage || "");
    setTitle(data.title);
    setSpecialty(data.specialty);
    setBio(data.bio);
    setLessonTarget(data.lessonTarget);
    setAvailableDays(data.availableDays);
    setPriceCredits(data.priceCredits);
    setEducation(data.career.education);
    setAwards(data.career.awards);
    setPerformances(data.career.performances);
    setTeachingExperience(data.career.teachingExperience);

    // Check AI-verified institutions
    const verification = getVerification();
    if (verification.aiReview && verification.status === "approved") {
      const institutions = new Set<string>();
      verification.aiReview.documents.forEach((doc) => {
        if (doc.isValid && doc.institution) {
          institutions.add(doc.institution);
        }
      });
      setVerifiedInstitutions(institutions);
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    const data: TeacherProfileData = {
      profileImage,
      title,
      specialty,
      bio,
      lessonTarget,
      availableDays,
      priceCredits,
      career: {
        education,
        awards,
        performances,
        teachingExperience,
      },
    };
    saveTeacherProfileData(data);
    setTimeout(() => {
      setIsSaving(false);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    }, 300);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("사진 크기는 5MB 이하여야 합니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        setProfileImage(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const toggleChip = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const isEducationVerified = (school: string) => {
    return verifiedInstitutions.has(school);
  };

  // ─── Preview Mode ───
  if (isPreview) {
    return (
      <div className="min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
            <button onClick={() => setIsPreview(false)} className="flex items-center gap-2 text-sm text-gray-600">
              <EyeOff className="w-4 h-4" />
              편집으로 돌아가기
            </button>
            <span className="text-xs font-medium text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
              학생 시점 미리보기
            </span>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 pb-24">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header gradient */}
            <div className="h-20 bg-gradient-to-r from-violet-500 to-purple-600" />

            <div className="px-5 pb-5">
              {/* Avatar */}
              <div className="-mt-12 mb-3">
                <div className="w-24 h-24 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-gray-100">
                  {profileImage ? (
                    <Image src={profileImage} alt="프로필" fill className="object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                </div>
              </div>

              {/* Name & Title */}
              <h2 className="text-xl font-bold text-gray-900">{userName} 선생님</h2>
              {title && <p className="text-sm text-gray-500 mt-0.5">{title}</p>}

              {/* Specialty Tags */}
              {specialty.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {specialty.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mt-4 py-3 border-y border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{priceCredits}</p>
                  <p className="text-xs text-gray-500">크레딧/회</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{teachingExperience}</p>
                  <p className="text-xs text-gray-500">경력(년)</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{education.length}</p>
                  <p className="text-xs text-gray-500">학력</p>
                </div>
              </div>

              {/* Lesson Info */}
              {(lessonTarget.length > 0 || availableDays.length > 0) && (
                <div className="mt-4 space-y-2">
                  {lessonTarget.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">대상: {lessonTarget.join(", ")}</span>
                    </div>
                  )}
                  {availableDays.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">가능 요일: {availableDays.join(", ")}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Bio */}
              {bio && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{bio}</p>
                </div>
              )}

              {/* Career */}
              {education.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-violet-600" />
                    학력
                  </h3>
                  <div className="space-y-2">
                    {education.map((edu, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">{edu.school}</span>
                          <span className="text-gray-500"> {edu.major} ({edu.degree})</span>
                          {edu.year && <span className="text-gray-400 text-xs ml-1">{edu.year}</span>}
                        </div>
                        {isEducationVerified(edu.school) && (
                          <span className="flex items-center gap-0.5 text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full shrink-0">
                            <CheckCircle className="w-3.5 h-3.5" />
                            AI 인증
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {awards.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    수상 경력
                  </h3>
                  <div className="space-y-2">
                    {awards.map((a, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium text-gray-800">{a.competition}</span>
                        <span className="text-gray-500"> - {a.prize}</span>
                        <span className="text-gray-400 text-xs ml-1">({a.year})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {performances.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-blue-500" />
                    연주 활동
                  </h3>
                  <div className="space-y-2">
                    {performances.map((p, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium text-gray-800">{p.title}</span>
                        {p.venue && <span className="text-gray-500"> @ {p.venue}</span>}
                        <span className="text-gray-400 text-xs ml-1">({p.year})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Edit Mode ───
  return (
    <div className="min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-600">
            <ArrowLeft className="w-4 h-4" />
            뒤로
          </button>
          <h1 className="text-sm font-semibold text-gray-900">프로필 관리</h1>
          <button
            onClick={() => setIsPreview(true)}
            className="flex items-center gap-1 text-sm text-violet-600 font-medium"
          >
            <Eye className="w-4 h-4" />
            미리보기
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-6">
        {/* Profile Photo + Name */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative shrink-0"
            >
              <div className="w-24 h-24 rounded-full ring-4 ring-violet-400/30 shadow-[0_0_30px_rgba(139,92,246,0.3)] overflow-hidden bg-gray-100">
                {profileImage ? (
                  <Image src={profileImage} alt="프로필" fill className="object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center border-2 border-white shadow">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />

            <div className="flex-1 space-y-2">
              <p className="text-lg font-bold text-gray-900">{userName} 선생님</p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="한 줄 소개 (예: 서울대 피아노 전공)"
                maxLength={40}
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Specialty */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">전문 분야</h3>
          <div className="flex flex-wrap gap-2">
            {SPECIALTY_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => toggleChip(specialty, s, setSpecialty)}
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                  specialty.includes(s) ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-violet-600" />
              학력
            </h3>
            <button
              onClick={() => setEducation([...education, { school: "", degree: "학사", major: "" }])}
              className="flex items-center gap-1 text-xs text-violet-600 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              추가
            </button>
          </div>
          {education.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3">학력을 추가해주세요</p>
          )}
          <div className="space-y-3">
            {education.map((edu, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-500">학력 {i + 1}</span>
                    {isEducationVerified(edu.school) && (
                      <span className="flex items-center gap-0.5 text-xs text-violet-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        AI 인증
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setEducation(education.filter((_, idx) => idx !== i))}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={edu.school}
                  onChange={(e) => {
                    const updated = [...education];
                    updated[i] = { ...updated[i], school: e.target.value };
                    setEducation(updated);
                  }}
                  placeholder="학교명"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <select
                    value={edu.degree}
                    onChange={(e) => {
                      const updated = [...education];
                      updated[i] = { ...updated[i], degree: e.target.value };
                      setEducation(updated);
                    }}
                    className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                  >
                    {DEGREE_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={edu.major}
                    onChange={(e) => {
                      const updated = [...education];
                      updated[i] = { ...updated[i], major: e.target.value };
                      setEducation(updated);
                    }}
                    placeholder="전공"
                    className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>
                <input
                  type="number"
                  value={edu.year || ""}
                  onChange={(e) => {
                    const updated = [...education];
                    updated[i] = { ...updated[i], year: e.target.value ? parseInt(e.target.value) : undefined };
                    setEducation(updated);
                  }}
                  placeholder="졸업년도 (선택)"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Awards */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              수상 경력
            </h3>
            <button
              onClick={() => setAwards([...awards, { competition: "", prize: "", year: new Date().getFullYear() }])}
              className="flex items-center gap-1 text-xs text-violet-600 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              추가
            </button>
          </div>
          {awards.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3">수상 경력을 추가해주세요</p>
          )}
          <div className="space-y-3">
            {awards.map((award, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">수상 {i + 1}</span>
                  <button
                    onClick={() => setAwards(awards.filter((_, idx) => idx !== i))}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={award.competition}
                  onChange={(e) => {
                    const updated = [...awards];
                    updated[i] = { ...updated[i], competition: e.target.value };
                    setAwards(updated);
                  }}
                  placeholder="대회명"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={award.prize}
                    onChange={(e) => {
                      const updated = [...awards];
                      updated[i] = { ...updated[i], prize: e.target.value };
                      setAwards(updated);
                    }}
                    placeholder="수상 내역"
                    className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={award.year}
                    onChange={(e) => {
                      const updated = [...awards];
                      updated[i] = { ...updated[i], year: parseInt(e.target.value) || new Date().getFullYear() };
                      setAwards(updated);
                    }}
                    placeholder="년도"
                    className="w-24 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performances */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-blue-500" />
              연주 활동
            </h3>
            <button
              onClick={() => setPerformances([...performances, { title: "", year: new Date().getFullYear() }])}
              className="flex items-center gap-1 text-xs text-violet-600 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              추가
            </button>
          </div>
          {performances.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3">연주 활동을 추가해주세요</p>
          )}
          <div className="space-y-3">
            {performances.map((perf, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">연주 {i + 1}</span>
                  <button
                    onClick={() => setPerformances(performances.filter((_, idx) => idx !== i))}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={perf.title}
                  onChange={(e) => {
                    const updated = [...performances];
                    updated[i] = { ...updated[i], title: e.target.value };
                    setPerformances(updated);
                  }}
                  placeholder="연주 제목/프로그램"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={perf.venue || ""}
                    onChange={(e) => {
                      const updated = [...performances];
                      updated[i] = { ...updated[i], venue: e.target.value };
                      setPerformances(updated);
                    }}
                    placeholder="장소 (선택)"
                    className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={perf.year}
                    onChange={(e) => {
                      const updated = [...performances];
                      updated[i] = { ...updated[i], year: parseInt(e.target.value) || new Date().getFullYear() };
                      setPerformances(updated);
                    }}
                    placeholder="년도"
                    className="w-24 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teaching Experience */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">레슨 경력 (년)</h3>
          <input
            type="number"
            min={0}
            max={50}
            value={teachingExperience}
            onChange={(e) => setTeachingExperience(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
          />
        </div>

        {/* Lesson Target */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">레슨 대상</h3>
          <div className="flex flex-wrap gap-2">
            {LESSON_TARGET_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => toggleChip(lessonTarget, t, setLessonTarget)}
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                  lessonTarget.includes(t) ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Available Days */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">레슨 가능 요일</h3>
          <div className="flex gap-2">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => toggleChip(availableDays, d, setAvailableDays)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  availableDays.includes(d) ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-violet-600" />
            레슨 비용
          </h3>
          <div className="space-y-3">
            <input
              type="range"
              min={10}
              max={200}
              step={5}
              value={priceCredits}
              onChange={(e) => setPriceCredits(parseInt(e.target.value))}
              className="w-full accent-violet-600"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">10 크레딧</span>
              <span className="text-lg font-bold text-violet-600">{priceCredits} 크레딧</span>
              <span className="text-xs text-gray-400">200 크레딧</span>
            </div>
          </div>
        </div>

        {/* Bio / Lesson Philosophy */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">레슨 철학</h3>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="자기소개와 레슨 철학을 작성해주세요.&#10;예: 학생 개개인의 수준과 목표에 맞춘 맞춤형 레슨을 지향합니다..."
            rows={5}
            maxLength={500}
            className="w-full text-sm px-4 py-3 bg-white/60 backdrop-blur-sm border border-violet-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/500</p>
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4 max-w-lg mx-auto z-10">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3.5 bg-violet-600 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 hover:bg-violet-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "저장 중..." : "저장하기"}
        </button>
      </div>

      {/* Saved Toast */}
      {showSavedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-fade-in">
          저장되었습니다
        </div>
      )}
    </div>
  );
}
