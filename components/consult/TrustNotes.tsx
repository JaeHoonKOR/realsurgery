import { Emoji3D, type EmojiName } from "@/components/ui/Emoji3D";
import { consultCopy, type ConsultMode } from "@/lib/consult/mode";
import { cx } from "@/lib/ui";

/** 상담 폼 신뢰 안내 — 비용·연락 시간·개인정보 보관. 시연 모드에서는 연락·저장을 약속하지 않는 문구로 바꾼다. */
export function TrustNotes({ className, mode = "live" }: { className?: string; mode?: ConsultMode }) {
  const copy = consultCopy(mode);
  const notes: { emoji: EmojiName; title: string; body: string }[] = [
    {
      emoji: "money",
      title: "신청 비용은 들지 않아요",
      body: "신청자에게도 병원에도 연결 수수료를 받지 않습니다.",
    },
    { emoji: "phone", ...copy.contactNote },
    { emoji: "lock", ...copy.storageNote },
  ];
  return (
    <section aria-labelledby="consult-trust" data-testid="consult-trust" className={cx("rounded-xl bg-canvas-soft p-6", className)}>
      <h2 id="consult-trust" className="text-base font-bold text-ink">
        안심하고 신청하세요
      </h2>
      <ul className="mt-4 grid gap-4">
        {notes.map((n) => (
          <li key={n.title} className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-surface">
              <Emoji3D name={n.emoji} size={24} />
            </span>
            <div>
              <p className="font-semibold text-ink">{n.title}</p>
              <p className="text-sm text-ink-muted">{n.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
