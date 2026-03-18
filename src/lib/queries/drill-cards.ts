import { supabase } from "@/lib/supabase";
import { dbMutate } from "@/lib/db-mutate";
import type { Tables } from "@/types/database";
import type { DrillCard, DrillType } from "@/types";

type DrillCardRow = Tables<"drill_cards">;

export async function getDrillCards(userId: string): Promise<DrillCard[]> {
  const { data, error } = await supabase
    .from("drill_cards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getDrillCards]", error.message);
    return [];
  }
  return (data ?? []).map(rowToDrillCard);
}

export async function createDrillCard(
  userId: string,
  card: Omit<DrillCard, "id">
): Promise<DrillCard | null> {
  const result = await dbMutate<DrillCardRow>({
    table: "drill_cards",
    operation: "insert",
    data: {
      user_id: userId,
      type: card.type,
      icon: card.icon,
      song: card.song,
      title: card.title,
      measures: card.measures,
      action: card.action,
      tempo: card.tempo,
      duration: card.duration,
      recurrence: card.recurrence,
      confidence: card.confidence,
    },
    returnData: true,
  });

  if (!result.success || !result.data) return null;
  return rowToDrillCard(result.data);
}

export async function updateDrillCard(
  cardId: string,
  updates: Partial<DrillCard>
): Promise<boolean> {
  const result = await dbMutate({
    table: "drill_cards",
    operation: "update",
    data: {
      confidence: updates.confidence,
      duration: updates.duration,
      tempo: updates.tempo,
      action: updates.action,
    },
    filters: { id: cardId },
  });

  return result.success;
}

export async function deleteDrillCard(cardId: string): Promise<boolean> {
  const result = await dbMutate({
    table: "drill_cards",
    operation: "delete",
    filters: { id: cardId },
  });

  return result.success;
}

function rowToDrillCard(row: DrillCardRow): DrillCard {
  return {
    id: row.id,
    type: (row.type as DrillType) ?? "technique",
    icon: row.icon ?? "🎯",
    song: row.song,
    title: row.title,
    measures: row.measures ?? "",
    action: row.action ?? "",
    tempo: row.tempo ?? 0,
    duration: row.duration ?? 10,
    recurrence: row.recurrence ?? 1,
    confidence: row.confidence ?? 0,
  };
}
