"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { User, Music } from "lucide-react";
import { getComposers, type Composer } from "@/lib/queries/composers";

/** 위키피디아에서 작곡가 썸네일 가져오기 (캐시) */
const imageCache = new Map<string, string>();

async function getComposerImage(fullName: string): Promise<string> {
  if (imageCache.has(fullName)) return imageCache.get(fullName)!;

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(fullName)}`,
    );
    if (!res.ok) return "";
    const data = await res.json();
    const url = data.thumbnail?.source ?? "";
    imageCache.set(fullName, url);
    return url;
  } catch {
    imageCache.set(fullName, "");
    return "";
  }
}

interface ComposerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
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

/** 작곡가 자동완성 입력 */
export function ComposerAutocomplete({
  value,
  onChange,
  placeholder = "예: Chopin, Bach, Mozart",
  label,
  className = "",
  autoFocus,
}: ComposerAutocompleteProps) {
  const [composers, setComposers] = useState<Composer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [composerImages, setComposerImages] = useState<Record<string, string>>({});
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getComposers().then(setComposers);
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

  const filtered = value.length >= 2
    ? composers.filter(
        (c) =>
          c.shortName.toLowerCase().includes(value.toLowerCase()) ||
          c.fullName.toLowerCase().includes(value.toLowerCase())
      )
    : [];

  // 필터된 작곡가의 이미지 로드
  useEffect(() => {
    filtered.forEach((c) => {
      if (!composerImages[c.fullName] && composerImages[c.fullName] !== "") {
        getComposerImage(c.fullName).then((url) => {
          if (url) setComposerImages((prev) => ({ ...prev, [c.fullName]: url }));
        });
      }
    });
  }, [filtered.map((c) => c.id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (v: string) => {
    onChange(v);
    setShowSuggestions(v.length >= 2);
  };

  const handleSelect = (c: Composer) => {
    onChange(c.shortName);
    setShowSuggestions(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          {label}
        </label>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (value.length >= 2) setShowSuggestions(true); }}
        className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        autoFocus={autoFocus}
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelect(c)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                {composerImages[c.fullName] ? (
                  <img
                    src={composerImages[c.fullName]}
                    alt={c.shortName}
                    className="w-10 h-10 object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{c.shortName}</p>
                <p className="text-xs text-muted-foreground truncate">{c.fullName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** 곡 제목 자동완성 입력 (작곡가 선택 후) */
export function TitleAutocomplete({
  value,
  onChange,
  composer,
  placeholder = "예: Ballade Op.23 No.1",
  label,
  className = "",
}: TitleAutocompleteProps) {
  const [composers, setComposers] = useState<Composer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getComposers().then(setComposers);
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

  const getFilteredWorks = useCallback(() => {
    if (value.length < 2) return [];
    const lowerQuery = value.toLowerCase();

    if (composer) {
      const selected = composers.find(
        (c) => c.shortName === composer || c.fullName === composer
      );
      if (selected) {
        return selected.works
          .filter((w) => w.toLowerCase().includes(lowerQuery))
          .slice(0, 8);
      }
    }

    // 작곡가 미선택 시 전체 검색
    const results: string[] = [];
    for (const c of composers) {
      for (const w of c.works) {
        if (w.toLowerCase().includes(lowerQuery)) {
          results.push(`${w} (${c.shortName})`);
        }
      }
    }
    return [...new Set(results)].slice(0, 8);
  }, [value, composer, composers]);

  const filtered = getFilteredWorks();

  const handleChange = (v: string) => {
    onChange(v);
    setShowSuggestions(v.length >= 2);
  };

  const handleSelect = (work: string) => {
    // "(작곡가)" 부분 분리
    const match = work.match(/^(.+) \((.+)\)$/);
    onChange(match ? match[1] : work);
    setShowSuggestions(false);
  };

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
        onFocus={() => { if (value.length >= 2) setShowSuggestions(true); }}
        className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
          {filtered.map((work, i) => (
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
