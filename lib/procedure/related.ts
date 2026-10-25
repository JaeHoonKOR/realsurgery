/**
 * P-03 "비슷한 시술" 카드 목록 — extras.similar 를 먼저, 모자라면 같은 부위, 그다음 조회수 순으로 채운다.
 */
import type { Procedure } from "@/lib/content";

export function similarProcedures(current: Procedure, all: readonly Procedure[], limit = 3): Procedure[] {
  const byId = new Map(all.map((p) => [p.id, p]));
  const picked: Procedure[] = [];
  const add = (p: Procedure | undefined) => {
    if (p && p.id !== current.id && !picked.some((x) => x.id === p.id) && picked.length < limit) picked.push(p);
  };
  for (const id of current.extras?.similar ?? []) add(byId.get(id));
  const byViews = [...all].sort((a, b) => b.view_count - a.view_count);
  for (const p of byViews) if (p.category_id === current.category_id) add(p);
  for (const p of byViews) add(p);
  return picked;
}
