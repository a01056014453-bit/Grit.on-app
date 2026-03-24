-- teacher_reviews 테이블 생성
-- 원포인트 레슨 피드백 완료 후 학생이 선생님을 평가

CREATE TABLE IF NOT EXISTS teacher_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES feedback_requests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- 하나의 피드백 요청에 하나의 리뷰만 가능
  CONSTRAINT unique_review_per_request UNIQUE (request_id)
);

-- 인덱스
CREATE INDEX idx_teacher_reviews_teacher_id ON teacher_reviews(teacher_id);
CREATE INDEX idx_teacher_reviews_student_id ON teacher_reviews(student_id);

-- RLS 활성화
ALTER TABLE teacher_reviews ENABLE ROW LEVEL SECURITY;

-- 학생: 본인 리뷰만 INSERT
CREATE POLICY "학생은 본인 리뷰만 생성"
  ON teacher_reviews FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- 본인 리뷰 조회 (학생)
CREATE POLICY "학생은 본인 리뷰 조회"
  ON teacher_reviews FOR SELECT
  USING (student_id = auth.uid());

-- 선생님: 본인에게 달린 리뷰 조회
CREATE POLICY "선생님은 본인 리뷰 조회"
  ON teacher_reviews FOR SELECT
  USING (teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  ));

-- Service role은 모든 접근 가능 (API Route에서 사용)
CREATE POLICY "service_role_all"
  ON teacher_reviews FOR ALL
  USING (auth.role() = 'service_role');
