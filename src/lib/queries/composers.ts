import { supabase } from "@/lib/supabase";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface Composer {
  id: string;
  shortName: string;
  fullName: string;
  works: string[];
}

/** 전체 작곡가 목록 (캐시용) */
let cachedComposers: Composer[] | null = null;

export async function getComposers(): Promise<Composer[]> {
  if (cachedComposers) return cachedComposers;

  const { data, error } = await db
    .from("composers")
    .select("*")
    .order("short_name");

  if (error) {
    console.error("[getComposers]", error.message);
    return [];
  }

  const result: Composer[] = (data ?? []).map((row: any) => ({
    id: row.id,
    shortName: row.short_name,
    fullName: row.full_name,
    works: row.works ?? [],
  }));
  cachedComposers = result;

  return result;
}

/** 자동완성용 { key, label } 리스트 */
export async function getComposerList(): Promise<{ key: string; label: string }[]> {
  const composers = await getComposers();
  return composers.map((c) => ({
    key: c.shortName.toLowerCase(),
    label: c.shortName,
  }));
}

/** 작곡가 이름으로 검색 */
export async function findComposerByName(name: string): Promise<Composer | undefined> {
  const composers = await getComposers();
  const lower = name.toLowerCase();
  return composers.find(
    (c) =>
      c.shortName.toLowerCase() === lower ||
      c.fullName.toLowerCase() === lower
  );
}

/** 캐시 초기화 (새 작곡가 추가 후) */
export function invalidateComposerCache(): void {
  cachedComposers = null;
}
