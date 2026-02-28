-- 작곡가별 학술자료 테이블
CREATE TABLE IF NOT EXISTS composer_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 작곡가 식별
  composer TEXT NOT NULL,
  composer_normalized TEXT NOT NULL,

  -- 자료 메타데이터
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'paper',
  author TEXT,
  year TEXT,
  source TEXT,
  language TEXT DEFAULT 'ko',

  -- 곡 매칭 (선택)
  piece_title TEXT,
  opus_pattern TEXT,

  -- 콘텐츠
  extracted_text TEXT NOT NULL,
  summary_korean TEXT,

  -- 파일 정보
  pdf_storage_path TEXT,
  file_size_bytes INTEGER,
  page_count INTEGER,

  -- 관리
  uploaded_by TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_composer_resources_normalized ON composer_resources(composer_normalized);
CREATE INDEX IF NOT EXISTS idx_composer_resources_opus ON composer_resources(opus_pattern);
CREATE INDEX IF NOT EXISTS idx_composer_resources_active ON composer_resources(is_active);
