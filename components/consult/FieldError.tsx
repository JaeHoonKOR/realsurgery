import { CircleAlert } from "lucide-react";

/** 필드 아래 인라인 오류. id 를 입력의 aria-describedby 에 연결한다. 메시지가 없으면 자리만 비운다. */
export function FieldError({ id, message }: { id: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

/** aria-describedby 값 — 비어 있는 id 는 뺀다 */
export function describedBy(...ids: (string | false | null | undefined)[]): string | undefined {
  const v = ids.filter(Boolean).join(" ");
  return v || undefined;
}
