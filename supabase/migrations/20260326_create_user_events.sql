-- 사용자 이벤트 추적 테이블
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  user_id UUID,
  properties JSONB,
  user_agent TEXT,
  platform TEXT,
  is_standalone BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_events_event ON user_events(event);
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at);

-- RLS 정책: 서비스 역할만 전체 접근, 일반 유저는 insert만 가능
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON user_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "users_insert_own_events" ON user_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_read_own_events" ON user_events
  FOR SELECT USING (auth.uid() = user_id);
