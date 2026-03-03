-- ─── help_requests: 공개 해결 요청 ─────────────────────────
CREATE TABLE IF NOT EXISTS help_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  composer        text NOT NULL,
  piece           text NOT NULL,
  measure_start   int  NOT NULL,
  measure_end     int  NOT NULL,
  problem_type    problem_type NOT NULL DEFAULT 'other',
  description     text NOT NULL,
  video_url       text,
  video_length    int,            -- 초
  face_blurred    boolean NOT NULL DEFAULT true,
  is_anonymous    boolean NOT NULL DEFAULT true,
  status          text NOT NULL DEFAULT 'open',  -- open, reviewing, closed
  deadline        timestamptz NOT NULL,
  credit          int NOT NULL DEFAULT 3,
  max_proposals   int NOT NULL DEFAULT 5,
  accepted_proposal_id uuid,       -- 채택된 제안 (아래 FK)
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── help_proposals: 전문가 해결 제안 ──────────────────────
CREATE TABLE IF NOT EXISTS help_proposals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id        uuid NOT NULL REFERENCES help_requests(id) ON DELETE CASCADE,
  expert_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comments          jsonb NOT NULL DEFAULT '[]',
  demo_video_url    text,
  demo_video_length int,            -- 초
  practice_card     jsonb NOT NULL DEFAULT '{}',
  submitted_at      timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 채택된 제안 FK (순환 참조 방지를 위해 ALTER)
ALTER TABLE help_requests
  ADD CONSTRAINT help_requests_accepted_proposal_fk
  FOREIGN KEY (accepted_proposal_id) REFERENCES help_proposals(id)
  ON DELETE SET NULL;

-- ─── 인덱스 ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_help_requests_student_id ON help_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status     ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_deadline   ON help_requests(deadline);
CREATE INDEX IF NOT EXISTS idx_help_proposals_request_id ON help_proposals(request_id);
CREATE INDEX IF NOT EXISTS idx_help_proposals_expert_id  ON help_proposals(expert_id);

-- ─── RLS 정책 ──────────────────────────────────────────────
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_proposals ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능 (공개 마켓플레이스)
CREATE POLICY "help_requests_select" ON help_requests FOR SELECT USING (true);
CREATE POLICY "help_proposals_select" ON help_proposals FOR SELECT USING (true);

-- 본인만 생성
CREATE POLICY "help_requests_insert" ON help_requests FOR INSERT
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "help_proposals_insert" ON help_proposals FOR INSERT
  WITH CHECK (auth.uid() = expert_id);

-- 본인 요청만 수정 (채택 등)
CREATE POLICY "help_requests_update" ON help_requests FOR UPDATE
  USING (auth.uid() = student_id);

-- updated_at 자동 갱신 트리거 (help_requests)
CREATE OR REPLACE FUNCTION update_help_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_help_requests_updated_at
  BEFORE UPDATE ON help_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_help_requests_updated_at();

-- updated_at 자동 갱신 트리거 (help_proposals)
CREATE OR REPLACE FUNCTION update_help_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_help_proposals_updated_at
  BEFORE UPDATE ON help_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_help_proposals_updated_at();
