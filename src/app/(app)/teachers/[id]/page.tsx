"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Clock,
  CheckCircle,
  BadgeCheck,
  Zap,
  Award,
  Coins,
  MessageSquare,
  Play,
  Quote,
  ChevronRight,
  GraduationCap,
  Trophy,
  Music,
  Users,
  Briefcase,
} from "lucide-react";
import { getTeacherById } from "@/lib/feedback-store";
import { BADGE_LABELS, TeacherBadge } from "@/types";

const badgeIcons: Record<TeacherBadge, typeof Zap> = {
  expert: Award,
  fast: Zap,
  top_rated: Star,
};

const badgeColors: Record<TeacherBadge, string> = {
  expert: "bg-violet-100 text-violet-700",
  fast: "bg-blue-100 text-blue-700",
  top_rated: "bg-amber-100 text-amber-700",
};

// Sample reviews
const sampleReviews = [
  {
    id: "r1",
    studentName: "김OO",
    rating: 5,
    date: "2025-01-15",
    piece: "쇼팽 발라드 1번",
    comment:
      "정말 상세하고 이해하기 쉬운 피드백이었어요. 특히 연습 처방이 체계적이어서 바로 적용할 수 있었습니다.",
  },
  {
    id: "r2",
    studentName: "이OO",
    rating: 5,
    date: "2025-01-10",
    piece: "드뷔시 달빛",
    comment:
      "시연 영상이 너무 도움이 됐어요. 페달링 관련해서 고민이 많았는데 해결됐습니다!",
  },
  {
    id: "r3",
    studentName: "박OO",
    rating: 4,
    date: "2025-01-05",
    piece: "베토벤 소나타",
    comment: "전문적인 조언 감사합니다. 다음에 또 요청드릴게요.",
  },
];

// Sample feedback
const sampleFeedback = {
  piece: "쇼팽 발라드 1번 32-48마디",
  commentPreview:
    "왼손 아르페지오의 손목 움직임이 너무 큽니다. 손목을 고정하고 손가락 관절의 독립적인 움직임으로...",
  practiceCard: {
    section: "마디 32-40",
    steps: ["왼손 단독 연습 (느린 템포)", "양손 합체 (메트로놈 60)"],
  },
};

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  const teacher = getTeacherById(teacherId);

  if (!teacher) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>뒤로</span>
        </button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">선생님을 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-32 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>뒤로</span>
      </button>

      {/* Profile Header */}
      <div className="bg-card rounded-xl p-5 border border-border mb-4">
        <div className="flex gap-4 mb-4">
          {/* Profile Image */}
          <div className="relative w-20 h-20 shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-violet-200 flex items-center justify-center text-2xl font-bold text-primary">
              {teacher.name.charAt(0)}
            </div>
            {teacher.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                <BadgeCheck className="w-5 h-5 text-primary" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground mb-1">
              {teacher.name}
            </h1>
            <p className="text-sm text-muted-foreground mb-2">{teacher.title}</p>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              {teacher.badges.map((badge) => {
                const Icon = badgeIcons[badge];
                return (
                  <span
                    key={badge}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${badgeColors[badge]}`}
                  >
                    <Icon className="w-3 h-3" />
                    {BADGE_LABELS[badge]}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-0.5">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="font-bold text-foreground">{teacher.rating}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">평점</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded-lg">
            <div className="font-bold text-foreground mb-0.5">
              {teacher.completedCount}
            </div>
            <div className="text-[10px] text-muted-foreground">완료</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded-lg">
            <div className="font-bold text-foreground mb-0.5">
              {teacher.responseRate}%
            </div>
            <div className="text-[10px] text-muted-foreground">응답률</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded-lg">
            <div className="font-bold text-foreground mb-0.5">
              {teacher.avgResponseTime}h
            </div>
            <div className="text-[10px] text-muted-foreground">평균응답</div>
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="bg-card rounded-xl p-4 border border-border mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">전문 분야</h2>
        <div className="flex flex-wrap gap-2">
          {teacher.specialty.map((s) => (
            <span
              key={s}
              className="px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 text-xs font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div className="bg-card rounded-xl p-4 border border-border mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">소개</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {teacher.bio}
        </p>
      </div>

      {/* Career / History */}
      {teacher.career && (
        <div className="bg-card rounded-xl p-4 border border-border mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            이력
          </h2>

          {/* Teaching Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-primary/5 to-violet-500/5 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Users className="w-4 h-4" />
                <span className="text-lg font-bold">{teacher.career.studentsToUniversity}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">대학 합격생</p>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-violet-500/5 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-lg font-bold">{teacher.career.teachingExperience}년</span>
              </div>
              <p className="text-[10px] text-muted-foreground">레슨 경력</p>
            </div>
          </div>

          {/* Education */}
          {teacher.career.education.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                학력
              </h3>
              <div className="space-y-2">
                {teacher.career.education.map((edu, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">{edu.school}</span>
                      <span className="text-muted-foreground"> {edu.degree}</span>
                      {edu.year && (
                        <span className="text-muted-foreground text-xs ml-1">({edu.year})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Awards */}
          {teacher.career.awards.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                콩쿠르 입상
              </h3>
              <div className="space-y-2">
                {teacher.career.awards.map((award, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">{award.competition}</span>
                      <span className="text-amber-600 font-medium ml-1">{award.prize}</span>
                      <span className="text-muted-foreground text-xs ml-1">({award.year})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performances */}
          {teacher.career.performances.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                연주 / 협연
              </h3>
              <div className="space-y-2">
                {teacher.career.performances.map((perf, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">{perf.title}</span>
                      {perf.venue && (
                        <span className="text-muted-foreground"> @ {perf.venue}</span>
                      )}
                      <span className="text-muted-foreground text-xs ml-1">({perf.year})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sample Feedback */}
      <div className="bg-gradient-to-br from-primary/5 to-violet-500/5 rounded-xl p-4 border border-primary/10 mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" />
          피드백 샘플
        </h2>
        <div className="bg-white/60 rounded-lg p-3 mb-2">
          <p className="text-xs text-primary font-medium mb-1">
            {sampleFeedback.piece}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {sampleFeedback.commentPreview}
          </p>
        </div>
        <div className="bg-white/60 rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground mb-1">연습 처방</p>
          <ul className="text-xs text-foreground space-y-1">
            {sampleFeedback.practiceCard.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-card rounded-xl p-4 border border-border mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            후기 ({teacher.reviewCount})
          </h2>
        </div>

        <div className="space-y-3">
          {sampleReviews.map((review) => (
            <div
              key={review.id}
              className="p-3 bg-secondary/30 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">
                    {review.studentName}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.rating
                            ? "text-amber-400 fill-current"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {review.date}
                </span>
              </div>
              <p className="text-xs text-primary mb-1">{review.piece}</p>
              <p className="text-xs text-muted-foreground">{review.comment}</p>
            </div>
          ))}
        </div>

        {teacher.reviewCount > 3 && (
          <button className="w-full mt-3 py-2 text-xs text-primary font-medium flex items-center justify-center gap-1">
            후기 더보기
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">피드백 요청 비용</span>
            <div className="flex items-center gap-1 text-primary">
              <Coins className="w-5 h-5" />
              <span className="text-lg font-bold">{teacher.priceCredits}</span>
              <span className="text-sm">크레딧</span>
            </div>
          </div>
          <Link
            href={`/feedback/new?teacherId=${teacher.id}`}
            className="block w-full py-4 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-semibold text-center shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
          >
            이 선생님에게 요청하기
          </Link>
        </div>
      </div>
    </div>
  );
}
