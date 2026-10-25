import { Emoji3D, type EmojiName } from "@/components/ui/Emoji3D";
import { RETENTION_LABEL } from "@/lib/consult/policy";
import { SITE } from "@/lib/site";
import { cx } from "@/lib/ui";

const NOTES: { emoji: EmojiName; title: string; body: string }[] = [
  {
    emoji: "money",
    title: "상담 신청은 무료예요",
    body: "신청자에게도 병원에도 연결 수수료를 받지 않습니다.",
  },
  {
    emoji: "phone",
    title: "영업일 기준 1일 안에 연락드려요",
    body: `${SITE.hours}에 남겨 주신 번호로 전화드립니다.`,
  },
  {
    emoji: "lock",
    title: "개인정보는 필요한 만큼만 보관해요",
    body: `휴대폰 번호는 암호화해 저장하고, ${RETENTION_LABEL} 파기합니다.`,
  },
];

/** 상담 폼 신뢰 안내 — 무료·연락 시간·개인정보 보관 */
export function TrustNotes({ className }: { className?: string }) {
  return (
    <section aria-labelledby="consult-trust" data-testid="consult-trust" className={cx("rounded-xl bg-canvas-soft p-6", className)}>
      <h2 id="consult-trust" className="text-base font-bold text-ink">
        안심하고 신청하세요
      </h2>
      <ul className="mt-4 grid gap-4">
        {NOTES.map((n) => (
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
