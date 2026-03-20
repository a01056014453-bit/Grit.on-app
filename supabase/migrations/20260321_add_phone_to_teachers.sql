-- 선생님 연락처 필드 추가
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS phone TEXT;
