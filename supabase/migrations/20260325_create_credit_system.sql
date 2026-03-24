-- ============================================
-- 셈프레 크레딧 & 보상 시스템
-- ============================================

-- 1. profiles 테이블 확장
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credit_balance INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_credit_purchases INTEGER DEFAULT 0;

-- 2. 크레딧 트랜잭션 테이블
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'charge',         -- 직접 충전
    'subscription',   -- Pro 월간 지급
    'hold',           -- 기능 이용 시 홀드
    'release',        -- 완료 확정
    'refund',         -- 거절/만료 환불
    'reward'          -- 활동 보상
  )),
  reference_id UUID,          -- feedback_request_id 등
  description TEXT,
  balance_after INTEGER NOT NULL,
  expires_at TIMESTAMPTZ,     -- 보상 크레딧 유효기간 (null = 무제한)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_credit_tx_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_credit_tx_ref ON credit_transactions(reference_id);

-- 3. 보상 유형 정의
CREATE TABLE IF NOT EXISTS reward_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  credit_amount NUMERIC(4,1) NOT NULL,  -- 0.5 단위 지원
  category TEXT NOT NULL CHECK (category IN (
    'onboarding', 'streak', 'daily_ranking', 'weekly_ranking',
    'monthly_ranking', 'badge', 'event'
  )),
  is_active BOOLEAN DEFAULT true,
  is_repeatable BOOLEAN DEFAULT false,
  cooldown_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 보상 지급 이력
CREATE TABLE IF NOT EXISTS reward_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL REFERENCES reward_definitions(id),
  period_key TEXT NOT NULL,
  credit_amount NUMERIC(4,1) NOT NULL,
  transaction_id UUID REFERENCES credit_transactions(id),
  granted_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX uq_reward_grants_user_period
  ON reward_grants (user_id, reward_id, period_key);
CREATE INDEX idx_reward_grants_user
  ON reward_grants (user_id, granted_at DESC);

-- 5. RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_grants ENABLE ROW LEVEL SECURITY;

-- credit_transactions: 본인만 조회
CREATE POLICY "credit_tx_select_own" ON credit_transactions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "credit_tx_service" ON credit_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- reward_definitions: 모든 인증 유저 조회
CREATE POLICY "reward_def_select" ON reward_definitions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "reward_def_service" ON reward_definitions
  FOR ALL USING (auth.role() = 'service_role');

-- reward_grants: 본인만 조회
CREATE POLICY "reward_grants_select_own" ON reward_grants
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "reward_grants_service" ON reward_grants
  FOR ALL USING (auth.role() = 'service_role');

-- 6. 보상 지급 함수 (트랜잭션 보장)
CREATE OR REPLACE FUNCTION grant_reward(
  p_user_id UUID,
  p_reward_id TEXT,
  p_period_key TEXT,
  p_is_pro BOOLEAN DEFAULT false
) RETURNS JSONB AS $$
DECLARE
  v_base_amount NUMERIC(4,1);
  v_amount NUMERIC(4,1);
  v_new_balance INTEGER;
  v_tx_id UUID;
  v_reward_name TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- 1. 보상 정의 조회
  SELECT credit_amount, name INTO v_base_amount, v_reward_name
  FROM reward_definitions
  WHERE id = p_reward_id AND is_active = true;

  IF v_base_amount IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'reward_not_found');
  END IF;

  -- 2. Pro 1.5배 적용
  v_amount := CASE WHEN p_is_pro THEN v_base_amount * 1.5 ELSE v_base_amount END;

  -- 3. 유효기간: 무료 유저 90일, Pro 무제한
  v_expires_at := CASE WHEN p_is_pro THEN NULL ELSE now() + INTERVAL '90 days' END;

  -- 4. 중복 체크
  IF EXISTS (
    SELECT 1 FROM reward_grants
    WHERE user_id = p_user_id AND reward_id = p_reward_id AND period_key = p_period_key
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_granted');
  END IF;

  -- 5. 잔액 갱신
  UPDATE profiles
  SET credit_balance = COALESCE(credit_balance, 0) + CEIL(v_amount)::INTEGER
  WHERE id = p_user_id
  RETURNING credit_balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  -- 6. 트랜잭션 기록
  INSERT INTO credit_transactions (user_id, amount, type, description, balance_after, expires_at)
  VALUES (p_user_id, CEIL(v_amount)::INTEGER, 'reward', v_reward_name, v_new_balance, v_expires_at)
  RETURNING id INTO v_tx_id;

  -- 7. 지급 이력
  INSERT INTO reward_grants (user_id, reward_id, period_key, credit_amount, transaction_id)
  VALUES (p_user_id, p_reward_id, p_period_key, v_amount, v_tx_id);

  RETURN jsonb_build_object(
    'success', true,
    'amount', v_amount,
    'new_balance', v_new_balance
  );

EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success', false, 'error', 'already_granted');
END;
$$ LANGUAGE plpgsql;

-- 7. 초기 보상 데이터
INSERT INTO reward_definitions (id, name, credit_amount, category, is_repeatable, cooldown_days) VALUES
  -- 온보딩
  ('first_practice',  '첫 연습 기록',     0.5, 'onboarding', false, 0),
  ('first_feedback',  '첫 피드백 요청',   0.5, 'onboarding', false, 0),
  ('profile_complete','프로필 완성',       0.5, 'onboarding', false, 0),
  -- 연속 연습
  ('streak_7',        '7일 연속 연습',    0.5, 'streak',     true,  7),
  ('streak_30',       '30일 연속 연습',   1.0, 'streak',     false, 0),
  ('streak_100',      '100일 연속 연습',  2.0, 'streak',     false, 0),
  -- 일일 랭킹 (배지 교환)
  ('daily_rank_1_badge', '일일 1위 배지', 0,   'daily_ranking', true, 0),
  ('daily_badge_exchange','일일 배지 2개 교환', 1.0, 'daily_ranking', true, 0),
  -- 주간 랭킹
  ('weekly_rank_1',   '주간 랭킹 1위',   1.0, 'weekly_ranking', true, 0),
  ('weekly_rank_2',   '주간 랭킹 2위',   0.5, 'weekly_ranking', true, 0),
  ('weekly_rank_3',   '주간 랭킹 3위',   0.5, 'weekly_ranking', true, 0),
  -- 월간 랭킹
  ('monthly_rank_1',  '월간 랭킹 1위',   2.0, 'monthly_ranking', true, 0),
  -- 배지
  ('all_badges',      '전체 배지 수집',   2.0, 'badge', false, 0)
ON CONFLICT (id) DO NOTHING;
