import { Icon3D, type IconName } from "@/components/ui/Icon3D";
import { consultCopy, type ConsultMode } from "@/lib/consult/mode";
import { cx } from "@/lib/ui";

/** 상담 폼 신뢰 안내 — 비용·연락 시간·개인정보 보관. 시연 모드에서는 연락·저장을 약속하지 않는 문구로 바꾼다. */
export function TrustNotes({ className, mode = "live" }: { className?: string; mode?: ConsultMode }) {
  const copy = consultCopy(mode);
  const notes: { icon: IconName; title: string; body: string }[] = [
    {
      icon: "ic-free",
      title: "신청 비용은 들지 않아요",
      body: "신청자에게도 병원에도 연결 수수료를 받지 않습니다.",
    },
    { icon: "ic-callback", ...copy.contactNote },
    { icon: "ic-privacy", ...copy.storageNote },
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
              <Icon3D name={n.icon} size={24} />
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
