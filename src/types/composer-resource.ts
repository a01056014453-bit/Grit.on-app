export type ResourceType = "paper" | "thesis" | "dissertation" | "article";

export interface ComposerResource {
  id: string;
  composer: string;
  composer_normalized: string;
  title: string;
  resource_type: ResourceType;
  author: string | null;
  year: string | null;
  source: string | null;
  language: string;
  piece_title: string | null;
  opus_pattern: string | null;
  extracted_text: string;
  summary_korean: string | null;
  pdf_storage_path: string | null;
  file_size_bytes: number | null;
  page_count: number | null;
  uploaded_by: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComposerResourceInsert {
  composer: string;
  title: string;
  resource_type: ResourceType;
  author?: string;
  year?: string;
  source?: string;
  language?: string;
  piece_title?: string;
  extracted_text: string;
  pdf_storage_path?: string;
  file_size_bytes?: number;
  page_count?: number;
  uploaded_by?: string;
  tags?: string[];
}

export interface ResourceSearchResult {
  resources: ComposerResource[];
  totalRelevantText: string;
}
