-- 보안 취약점 수정 마이그레이션
-- 분석 일시: 2026-06-26
-- 수정 항목: RLS 정책 과도 허용 5건 + 함수 search_path 2건 + EXECUTE 권한 1건

-- ──────────────────────────────────────────────────────────────
-- 1. composer_resources: RLS 정책 없음 → service_role 정책 추가
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "Service role full access on composer_resources"
  ON public.composer_resources
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- 2. invitations: USING(true) 전체 허용 → service_role 한정
--    (모든 접근이 서버 API route /service_role/ 경유)
-- ──────────────────────────────────────────────────────────────
DROP POLICY "Service role full access on invitations" ON public.invitations;

CREATE POLICY "Service role full access on invitations"
  ON public.invitations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- 3. teacher_students: USING(true) 전체 허용 → service_role 한정
--    (모든 접근이 서버 API route /service_role/ 경유)
-- ──────────────────────────────────────────────────────────────
DROP POLICY "Service role full access on teacher_students" ON public.teacher_students;

CREATE POLICY "Service role full access on teacher_students"
  ON public.teacher_students
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- 4. user_events: INSERT WITH CHECK(true) → user_id 검증 추가
--    (익명 이벤트는 user_id=NULL 허용, 인증 유저는 본인 user_id만)
-- ──────────────────────────────────────────────────────────────
DROP POLICY "users_insert_own_events" ON public.user_events;

CREATE POLICY "users_insert_own_events"
  ON public.user_events
  FOR INSERT
  WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id
  );

-- ──────────────────────────────────────────────────────────────
-- 5. rls_auto_enable(): anon/authenticated EXECUTE 권한 제거
--    (DDL 이벤트 트리거 함수, 외부에서 호출 불필요)
-- ──────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;

-- ──────────────────────────────────────────────────────────────
-- 6. update_help_requests_updated_at: mutable search_path 수정
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_help_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 7. update_help_proposals_updated_at: mutable search_path 수정
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_help_proposals_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
