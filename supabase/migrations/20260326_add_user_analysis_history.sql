-- 1. user_analysis_history 테이블 생성
CREATE TABLE public.user_analysis_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  song_analysis_id uuid NOT NULL,
  requested_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_analysis_history_pkey PRIMARY KEY (id),
  CONSTRAINT user_analysis_history_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_analysis_history_song_analysis_id_fkey
    FOREIGN KEY (song_analysis_id) REFERENCES public.song_analyses(id) ON DELETE CASCADE,
  CONSTRAINT user_analysis_history_unique
    UNIQUE (user_id, song_analysis_id)
);

-- 2. RLS 활성화
ALTER TABLE public.user_analysis_history ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 — 본인 것만 접근
CREATE POLICY "본인 분석함만 접근" ON public.user_analysis_history
  FOR ALL USING (auth.uid() = user_id);

-- 4. 기존 song_analyses.user_id 데이터 마이그레이션
INSERT INTO public.user_analysis_history (user_id, song_analysis_id, requested_at)
SELECT user_id, id, created_at
FROM public.song_analyses
WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. song_analyses에서 user_id 컬럼 제거 (공유 캐시로 순수화)
ALTER TABLE public.song_analyses DROP COLUMN IF EXISTS user_id;

-- 6. song_analyses RLS — 전체 읽기 허용, 쓰기는 서버만
ALTER TABLE public.song_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "전체 읽기 허용" ON public.song_analyses
  FOR SELECT USING (true);

-- 7. 하루 1회 제한 체크용 인덱스
CREATE INDEX idx_user_analysis_history_user_date
  ON public.user_analysis_history (user_id, requested_at);
