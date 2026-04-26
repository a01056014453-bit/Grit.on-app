"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Music } from "lucide-react";
import { getComposers, type Composer } from "@/lib/queries/composers";

/** 이미지 맵에서 작곡가 이름으로 퍼지 매칭 */
function findComposerImage(images: Record<string, string>, fullName: string): string | undefined {
  // 1. 정확 일치
  if (images[fullName]) return images[fullName];
  // 2. 대소문자 무시 + 성(last name) 매칭
  const lastName = fullName.split(" ").pop()?.toLowerCase() ?? "";
  for (const [key, url] of Object.entries(images)) {
    if (key.toLowerCase() === fullName.toLowerCase()) return url;
    if (lastName && key.toLowerCase().includes(lastName)) return url;
  }
  return undefined;
}

interface ComposerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectComposer?: (composer: Composer) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  autoFocus?: boolean;
}

interface TitleAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  composer: string;
  placeholder?: string;
  label?: string;
  className?: string;
}

/** 작곡가 이미지 캐시 (모듈 레벨 — Promise 기반 중복 방지) */
let _imagePromise: Promise<Record<string, string>> | null = null;

export function loadComposerImages(): Promise<Record<string, string>> {
  if (_imagePromise) return _imagePromise;
  _imagePromise = (async () => {
    try {
      const res = await fetch("/api/composers/images");
      if (res.ok) {
        const data = await res.json();
        return (data.images ?? {}) as Record<string, string>;
      }
    } catch (err) {
      console.error("[loadComposerImages] 이미지 로드 실패:", err);
    }
    return {};
  })();
  return _imagePromise;
}

/** 작곡가 자동완성 입력 (선택 후 입력창 왼쪽에 얼굴 표시) */
export function ComposerAutocomplete({
  value,
  onChange,
  onSelectComposer,
  placeholder = "예: Chopin, Bach, Mozart",
  label,
  className = "",
  autoFocus,
}: ComposerAutocompleteProps) {
  const [composers, setComposers] = useState<Composer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getComposers().then(setComposers);
    loadComposerImages().then(setImages);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value) setSelectedImageUrl(null);
  }, [value]);

  const filtered = useMemo(() => {
    if (value.length < 2) return [];
    const lower = value.toLowerCase();
    return composers.filter(
      (c) =>
        c.shortName.toLowerCase().includes(lower) ||
        c.fullName.toLowerCase().includes(lower),
    );
  }, [value, composers]);

  const handleChange = (v: string) => {
    onChange(v);
    setSelectedImageUrl(null);
    setShowSuggestions(v.length >= 2);
  };

  const handleSelect = (c: Composer) => {
    onChange(c.shortName);
    setSelectedImageUrl(findComposerImage(images, c.fullName) ?? null);
    setShowSuggestions(false);
    onSelectComposer?.(c);
  };

  const hasImage = !!selectedImageUrl;

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {hasImage && (
          <div className="absolute left-3 w-7 h-7 rounded-full overflow-hidden shrink-0 z-10">
            <img src={selectedImageUrl!} alt="" className="w-7 h-7 object-cover" />
          </div>
        )}
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (value.length >= 2) setShowSuggestions(true); }}
          className={`w-full ${hasImage ? "pl-12" : "px-4"} pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20`}
          autoFocus={autoFocus}
        />
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
          {filtered.map((c) => {
            const imgUrl = findComposerImage(images, c.fullName);
            return (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {imgUrl ? (
                    <img src={imgUrl} alt="" className="w-10 h-10 object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-primary">
                      {c.shortName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{c.shortName}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.fullName}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** 곡 제목 자동완성 입력 */
export function TitleAutocomplete({
  value,
  onChange,
  composer,
  placeholder = "예: Ballade Op.23 No.1",
  label,
  className = "",
}: TitleAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // IMSLP API에서 곡 검색
  const searchWorks = useCallback(async (q: string, comp: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ composer: comp, q });
      const res = await fetch(`/api/composers/works?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.works ?? []);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    setShowSuggestions(v.length >= 2);

    // 디바운스 300ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.length >= 2 && composer) {
      debounceRef.current = setTimeout(() => searchWorks(v, composer), 300);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (work: string) => {
    onChange(work);
    setShowSuggestions(false);
  };

  // 작곡가 변경 시 suggestions 초기화
  useEffect(() => {
    setSuggestions([]);
  }, [composer]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          {label}
        </label>
      )}
      <input
        type="text"
        placeholder={composer ? `${composer}의 곡 검색...` : placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (value.length >= 2 && suggestions.length > 0) setShowSuggestions(true); }}
        className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {loading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-xs text-muted-foreground">검색 중...</div>
          )}
          {suggestions.map((work, i) => (
            <button
              key={`${work}-${i}`}
              onClick={() => handleSelect(work)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-violet-600" />
              </div>
              <p className="font-medium text-foreground text-sm truncate">{work}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
