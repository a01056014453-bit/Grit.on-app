-- 학생 초대 테이블
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_name TEXT,
  email TEXT,
  phone TEXT,
  category TEXT,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_teacher_id ON invitations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS: service role은 모든 작업 가능 (API route에서 사용)
CREATE POLICY "Service role full access on invitations"
  ON invitations FOR ALL
  USING (true)
  WITH CHECK (true);

-- teacher_students 테이블에 category 컬럼이 없으면 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teacher_students' AND column_name = 'category'
  ) THEN
    ALTER TABLE teacher_students ADD COLUMN category TEXT;
  END IF;
END $$;

-- teacher_students에 updated_at 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teacher_students' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE teacher_students ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;
