-- ════════════════════════════════════════════════════════
-- V3 곡 분석 시스템 컬럼 추가
-- 날짜: 2026-03-31
-- 목적: V3 파이프라인 지원 + 캐시 정규화 + 품질 관리
-- ════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────
-- 1. song_analyses 테이블 컬럼 추가
-- ────────────────────────────────────────────────────────

-- 스키마 버전 (1=V1, 2=V2, 3=V3)
ALTER TABLE public.song_analyses
  ADD COLUMN IF NOT EXISTS schema_version smallint DEFAULT 1;

-- 콘텐츠 형식 ('legacy' | 'v3_coaching')
ALTER TABLE public.song_analyses
  ADD COLUMN IF NOT EXISTS content_format text DEFAULT 'legacy';

-- 정규화된 작곡가명 (검색/캐시 키용, 예: 'beethoven')
ALTER TABLE public.song_analyses
  ADD COLUMN IF NOT EXISTS composer_normalized text;

-- 정식 곡 제목 (GPT 정제 후)
ALTER TABLE public.song_analyses
  ADD COLUMN IF NOT EXISTS canonical_title text;

-- 작품번호/카탈로그 번호 (예: 'Op. 57', 'BWV 846')
ALTER TABLE public.song_analyses
  ADD COLUMN IF NOT EXISTS opus_catalogue text;

-- 모음곡/세트 내 번호
ALTER TABLE public.song_analyses
  ADD COLUMN IF NOT EXISTS work_number smallint;

-- 외부 소스 ID (IMSLP work ID 등)
ALTER TABLE public.song_analyses
  ADD COLUMN IF NOT EXISTS source_work_id text;

-- 작품 유형 ('single_movement_piece', 'multi_movement_sonata', 'suite_or_collection', 'variation_set', 'unknown')
ALTER TABLE public.song_analyses
  ADD COLUMN IF NOT EXISTS work_type text;

-- 분석 대상 악기
ALTER TABLE public.song_analyses
  ADD COLUMN IF NOT EXISTS instrument text DEFAULT 'piano';

-- 캐시 키 (정규화된 composer__title 형식)
ALTER TABLE public.song_analyses
  ADD COLUMN IF NOT EXISTS cache_key text;

-- 분석 품질 상태 ('passed', 'failed', 'pending', 'skipped')
ALTER TABLE public.song_analyses
  ADD COLUMN IF NOT EXISTS analysis_quality_status text DEFAULT 'pending';

-- 마지막 품질 검증 시각
ALTER TABLE public.song_analyses
  ADD COLUMN IF NOT EXISTS last_validated_at timestamptz;

-- 활성 여부 (품질 미달 결과 비활성화용)
ALTER TABLE public.song_analyses
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 인덱스: 캐시 키 + 활성 상태로 빠른 조회
CREATE INDEX IF NOT EXISTS idx_song_analyses_cache_key
  ON public.song_analyses (cache_key)
  WHERE is_active = true;

-- 인덱스: schema_version으로 V3 필터링
CREATE INDEX IF NOT EXISTS idx_song_analyses_schema_version
  ON public.song_analyses (schema_version);

-- 인덱스: composer_normalized + canonical_title 정규화 검색
CREATE INDEX IF NOT EXISTS idx_song_analyses_normalized
  ON public.song_analyses (composer_normalized, canonical_title);

-- ────────────────────────────────────────────────────────
-- 2. analysis_jobs 테이블 컬럼 추가
-- ────────────────────────────────────────────────────────

-- 분석 버전 (2 또는 3)
ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS analysis_version smallint DEFAULT 2;

-- 요청된 출력 형식 ('legacy' | 'v3')
ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS requested_format text DEFAULT 'legacy';

-- 정규화된 작곡가명
ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS composer_normalized text;

-- 정식 곡 제목
ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS canonical_title text;

-- 캐시 키
ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS cache_key text;

-- 추가 요청 파라미터 (JSON)
ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS payload jsonb;

-- 분석 시작 시각
ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS started_at timestamptz;

-- 분석 완료 시각
ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS finished_at timestamptz;

-- 결과 스키마 버전
ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS result_schema_version smallint;

-- 알림 상태 ('pending', 'sent', 'failed', 'not_required')
ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS notification_status text DEFAULT 'not_required';

-- 인덱스: 진행 중인 job 빠른 조회
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_active
  ON public.analysis_jobs (composer, title, status)
  WHERE status = 'processing';

-- 인덱스: analysis_version으로 V3 job 필터링
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_version
  ON public.analysis_jobs (analysis_version);
