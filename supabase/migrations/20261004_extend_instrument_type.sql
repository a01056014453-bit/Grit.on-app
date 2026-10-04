-- instrument_type enum 확장 (docs/launch-checklist.md B6)
--
-- ⚠️ 2026-10-04 기준 프로덕션 미적용. 적용 순서:
--   1. 이 SQL을 Supabase에서 실행
--   2. `supabase gen types`로 src/types/database.ts 재생성
--   3. 한글 악기명 → enum 매핑 3곳 수정
--      (onboarding/profile-setup/page.tsx, profile/page.tsx, lib/sync-practice.ts)
--
-- 현재 enum은 piano·violin·cello·flute·clarinet·guitar·vocal 7개뿐이라
-- 비올라는 "violin"으로, 트럼펫 등 목록 밖 악기는 "piano"로 저장되어 악기별 랭킹이 오염된다.
-- 값 목록은 src/types/ranking.ts 의 InstrumentType 과 동일하게 맞춘다.

ALTER TYPE instrument_type ADD VALUE IF NOT EXISTS 'viola';
ALTER TYPE instrument_type ADD VALUE IF NOT EXISTS 'double_bass';
ALTER TYPE instrument_type ADD VALUE IF NOT EXISTS 'oboe';
ALTER TYPE instrument_type ADD VALUE IF NOT EXISTS 'bassoon';
ALTER TYPE instrument_type ADD VALUE IF NOT EXISTS 'trumpet';
ALTER TYPE instrument_type ADD VALUE IF NOT EXISTS 'horn';
ALTER TYPE instrument_type ADD VALUE IF NOT EXISTS 'trombone';
ALTER TYPE instrument_type ADD VALUE IF NOT EXISTS 'tuba';
ALTER TYPE instrument_type ADD VALUE IF NOT EXISTS 'percussion';
ALTER TYPE instrument_type ADD VALUE IF NOT EXISTS 'harp';
ALTER TYPE instrument_type ADD VALUE IF NOT EXISTS 'composition';
