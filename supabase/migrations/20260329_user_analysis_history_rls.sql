-- user_analysis_history RLS 정책
ALTER TABLE IF EXISTS user_analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "service_role_full_access" ON user_analysis_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "users_read_own_history" ON user_analysis_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_insert_own_history" ON user_analysis_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
