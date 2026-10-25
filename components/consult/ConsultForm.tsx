"use client";

import { ChevronLeft, LoaderCircle, RotateCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { Emoji3D, categoryEmoji, type EmojiName } from "@/components/ui/Emoji3D";
import { readAttribution } from "@/lib/consult/attribution";
import { checkDuplicate, duplicateMessage, recordSubmission } from "@/lib/consult/duplicate";
import { CONSULT_DONE_PATH, saveLeadSession } from "@/lib/consult/lead";
import {
  CONTACT_TIME_OPTIONS,
  MEMO_MAX,
  NAME_MAX,
  REGION_OPTIONS,
  TIMING_OPTIONS,
  optionLabel,
  regionFromAddress,
} from "@/lib/consult/options";
import { CONSULT_TITLE, type ConsultMode } from "@/lib/consult/mode";
import { caretAfterDigits, formatPhone } from "@/lib/consult/phone";
import { sourcePage } from "@/lib/consult/source";
import { buildLeadPayload, submitLead } from "@/lib/consult/submit";
import {
  PROCEDURE_UNDECIDED,
  STEP1_FIELDS,
  emptyValues,
  firstErrorField,
  hasErrors,
  validateAll,
  validateName,
  validatePhone,
  validateStep1,
  validateStep2,
  type ConsultValues,
  type FieldErrors,
  type FieldName,
} from "@/lib/consult/validation";
import { readConsent } from "@/lib/consent";
import { readPublicVar } from "@/lib/env.public";
import { CONSULT_CTA } from "@/lib/site";
import { track } from "@/lib/track";
import { btn, chip, cx, input } from "@/lib/ui";
import { ChoiceGroup } from "./ChoiceGroup";
import { ConsentFields } from "./ConsentFields";
import { DemoNotice } from "./DemoNotice";
import { FieldError, describedBy } from "./FieldError";
import { ProcedureField } from "./ProcedureField";
import { StepIndicator } from "./StepIndicator";
import type { ClinicOption, ProcedureOption } from "./types";

type Props = {
  procedures: ProcedureOption[];
  clinics: ClinicOption[];
  privacyHref?: string;
  /** 빌드 시 정해진 동작 모드(lib/consult/mode.ts). demo 면 제출 영역 위에 시연 안내를 띄운다. 기본 live */
  mode?: ConsultMode;
};

type SubmitError = { kind: "duplicate" | "invalid" | "server" | "network"; message: string };

const TIMING_EMOJI: Record<(typeof TIMING_OPTIONS)[number]["value"], EmojiName> = {
  within_1m: "stopwatch",
  within_3m: "calendar",
  undecided: "chat",
};

/**
 * P-06 상담 신청 2단계 폼 (screen-spec 4절 P-06).
 * 1단계 관심 시술(시술·지역·시기, 쿼리 선입력) → 2단계 연락처(이름·휴대폰·연락 시간·메모) + 동의 → submit-lead → P-07.
 * 동의: 개인정보 수집·이용[필수] · 민감정보(관심 시술)[필수] · 병원 제3자 제공[선택] · 마케팅[선택].
 * 이벤트: form_start(1단계 첫 입력, 1회) · form_step2(2단계 진입, 1회). generate_lead 는 여기서 보내지 않는다(P-07 전용).
 */
export function ConsultForm({ procedures, clinics, privacyHref, mode = "live" }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<ConsultValues>(() => emptyValues());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);

  const startedRef = useRef(false);
  const step2Ref = useRef(false);
  const submittingRef = useRef(false);
  const sourceRef = useRef<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const procedureRef = useRef<HTMLButtonElement>(null);
  const regionRef = useRef<HTMLFieldSetElement>(null);
  const timingRef = useRef<HTMLFieldSetElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLFieldSetElement>(null);
  const memoRef = useRef<HTMLTextAreaElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const stepChanged = useRef(false);

  const procedureIds = procedures.map((p) => p.id);
  const clinic = values.clinic_id ? (clinics.find((c) => c.id === values.clinic_id) ?? null) : null;
  const procedure = procedures.find((p) => p.id === values.procedure_id) ?? null;

  // 쿼리 선입력(정적 페이지라 클라이언트에서 읽는다). 목록에 없는 id 는 버린다.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const pid = q.get("procedure_id");
    const cid = q.get("clinic_id");
    const knownClinic = cid ? clinics.find((c) => c.id === cid) : undefined;
    setValues((v) => ({
      ...v,
      procedure_id: pid && procedureIds.includes(pid) ? pid : v.procedure_id,
      clinic_id: knownClinic ? knownClinic.id : null,
      region: v.region || (knownClinic ? (regionFromAddress(knownClinic.region) ?? "") : ""),
    }));
    setReady(true);
    // 첫 마운트 1회만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 단계가 바뀌면 화면 맨 위로, 새 단계 제목에 포커스(스크린 리더가 단계를 읽는다)
  useEffect(() => {
    if (!stepChanged.current) return;
    stepChanged.current = false;
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  // 휴대폰 자동 하이픈 후 커서 위치 복원
  useLayoutEffect(() => {
    if (pendingCaret.current == null || !phoneRef.current) return;
    const pos = pendingCaret.current;
    pendingCaret.current = null;
    if (document.activeElement === phoneRef.current) phoneRef.current.setSelectionRange(pos, pos);
  }, [values.phone]);

  const source = () => {
    sourceRef.current ??= sourcePage({
      referrer: document.referrer,
      href: window.location.href,
      basePath: readPublicVar("NEXT_PUBLIC_BASE_PATH"),
    });
    return sourceRef.current;
  };

  const funnelParams = (v: ConsultValues) => ({
    procedure_id: v.procedure_id && v.procedure_id !== PROCEDURE_UNDECIDED ? v.procedure_id : undefined,
    clinic_id: v.clinic_id ?? undefined,
    source_page: source(),
  });

  /** 사용자 입력으로 값이 바뀔 때. 오류가 떠 있던 필드는 바로 다시 검사해 고쳐지면 지운다. */
  const update = (patch: Partial<ConsultValues>) => {
    const next = { ...values, ...patch };
    setValues(next);
    if (!startedRef.current) {
      startedRef.current = true;
      track("form_start", funnelParams(next));
    }
    const changed = Object.keys(patch) as FieldName[];
    if (changed.some((f) => errors[f])) {
      const fresh = (STEP1_FIELDS as readonly string[]).includes(changed[0] as string) ? validateStep1(next, procedureIds) : validateStep2(next);
      setErrors((prev) => {
        const out = { ...prev };
        for (const f of changed) {
          if (fresh[f]) out[f] = fresh[f];
          else delete out[f];
        }
        return out;
      });
    }
    if (submitError && submitError.kind !== "duplicate") setSubmitError(null);
    if (submitError?.kind === "duplicate" && "phone" in patch) setSubmitError(null);
  };

  /** 입력을 마치고 나갈 때(blur) 값이 있으면 형식 검사 */
  const checkOnBlur = (field: "name" | "phone") => {
    const value = values[field];
    if (!value.trim()) return;
    const message = field === "name" ? validateName(value) : validatePhone(value);
    setErrors((prev) => {
      const out = { ...prev };
      if (message) out[field] = message;
      else delete out[field];
      return out;
    });
  };

  const focusField = (field: FieldName) => {
    const groupFirst = (ref: RefObject<HTMLFieldSetElement | null>) =>
      ref.current?.querySelector<HTMLInputElement>("input:checked") ?? ref.current?.querySelector<HTMLInputElement>("input");
    const target: HTMLElement | null | undefined = {
      procedure_id: procedureRef.current,
      region: groupFirst(regionRef),
      timing: groupFirst(timingRef),
      name: nameRef.current,
      phone: phoneRef.current,
      contact_time: groupFirst(contactRef),
      memo: memoRef.current,
      consent_privacy: consentRef.current,
      consent_sensitive: document.querySelector<HTMLInputElement>('[data-testid="consent_sensitive"]'),
      consent_3rd: null,
      consent_marketing: null,
      clinic_id: null,
    }[field];
    if (!target) return;
    target.focus({ preventScroll: true });
    // 하단 고정 버튼·헤더에 가리지 않게 가운데로
    (target.closest("fieldset, [data-field]") ?? target).scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const goStep2 = () => {
    const e = validateStep1(values, procedureIds);
    setErrors(e);
    if (hasErrors(e)) {
      const first = firstErrorField(e);
      if (first) focusField(first);
      return;
    }
    stepChanged.current = true;
    setStep(2);
    if (!step2Ref.current) {
      step2Ref.current = true;
      if (!startedRef.current) {
        startedRef.current = true;
        track("form_start", funnelParams(values));
      }
      track("form_step2", funnelParams(values));
    }
  };

  const goStep1 = () => {
    stepChanged.current = true;
    setStep(1);
    setSubmitError(null);
  };

  /** 제출 안내로 포커스·스크롤(가운데) — 하단 고정 버튼에 가리지 않게 */
  const showAlert = () => {
    const el = alertRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const submit = async () => {
    if (submittingRef.current) return;
    const e = validateAll(values, procedureIds);
    setErrors(e);
    if (hasErrors(e)) {
      const first = firstErrorField(e);
      if (first && (STEP1_FIELDS as readonly string[]).includes(first)) {
        goStep1();
        return;
      }
      if (first) focusField(first);
      return;
    }
    const dup = checkDuplicate(values.phone);
    if (dup.blocked) {
      setSubmitError({ kind: "duplicate", message: duplicateMessage(dup) });
      requestAnimationFrame(showAlert);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    const payload = buildLeadPayload(values, readAttribution(), {
      consent_ads: readConsent()?.ads ?? false,
      page_url: window.location.href,
    });
    const result = await submitLead(payload);
    if (result.ok) {
      recordSubmission(values.phone);
      saveLeadSession({
        lead_id: result.lead_id,
        procedure_id: payload.procedure_id,
        clinic_id: payload.clinic_id,
        procedure_name: procedure?.name ?? null,
        created_at: new Date().toISOString(),
      });
      // 이동이 끝날 때까지 버튼은 접수 중 상태로 둔다(중복 클릭 차단)
      router.push(CONSULT_DONE_PATH);
      return;
    }
    submittingRef.current = false;
    setSubmitting(false);
    setSubmitError({ kind: result.reason, message: result.message });
    if (result.fields) setErrors((prev) => ({ ...prev, ...(result.fields as FieldErrors) }));
    requestAnimationFrame(showAlert);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 1) goStep2();
    else void submit();
  };

  const memoLength = [...values.memo].length;
  const phoneHintId = "phone-hint";

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-label={CONSULT_TITLE}
      data-testid="consult-form"
      data-step={step}
      // 모바일 하단 고정 버튼(약 84px) 뒤로 포커스된 입력·안내가 숨지 않게 스크롤 여백을 둔다
      className="[&_input]:scroll-mb-28 [&_textarea]:scroll-mb-28 [&_[role=alert]]:scroll-mb-28"
    >
      <StepIndicator step={step} headingRef={headingRef} />

      {step === 1 ? (
        <div key="step1" data-testid="consult-step1" className="mt-8 grid gap-10 transition duration-300 starting:translate-y-2 starting:opacity-0">
          {clinic && (
            <div data-testid="consult-clinic">
              <p className="text-lg font-bold tracking-tight text-ink">상담 병원</p>
              <p className="mt-1 text-sm text-ink-subtle">병원 상세에서 고른 병원입니다. 빼면 희망 지역 기준으로 안내해 드려요.</p>
              <div className="mt-4 flex items-center gap-3 rounded-md bg-canvas py-2 pr-2 pl-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-surface">
                  <Emoji3D name="hospital" size={32} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-ink">{clinic.name}</span>
                  <span className="block text-sm text-ink-muted">{clinic.region}</span>
                </span>
                <button
                  type="button"
                  onClick={() => update({ clinic_id: null })}
                  aria-label={`${clinic.name} 선택 해제`}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-muted hover:bg-line hover:text-ink"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              </div>
            </div>
          )}

          <ProcedureField
            procedures={procedures}
            value={values.procedure_id}
            onChange={(id) => update({ procedure_id: id })}
            error={errors.procedure_id}
            triggerRef={procedureRef}
            ready={ready}
          />

          <ChoiceGroup
            name="region"
            legend="희망 지역"
            description="방문하기 편한 지역을 골라 주세요."
            options={REGION_OPTIONS}
            value={values.region}
            onChange={(v) => update({ region: v as ConsultValues["region"] })}
            error={errors.region}
            gridClass="grid grid-cols-2 sm:grid-cols-3"
            groupRef={regionRef}
            testId="consult-region"
          />

          <ChoiceGroup
            name="timing"
            legend="희망 시기"
            options={TIMING_OPTIONS.map((o) => ({ ...o, icon: <Emoji3D name={TIMING_EMOJI[o.value]} size={32} /> }))}
            value={values.timing}
            onChange={(v) => update({ timing: v as ConsultValues["timing"] })}
            error={errors.timing}
            variant="card"
            groupRef={timingRef}
            testId="consult-timing"
          />
        </div>
      ) : (
        <div key="step2" data-testid="consult-step2" className="mt-8 grid gap-10 transition duration-300 starting:translate-y-2 starting:opacity-0">
          <section aria-label="신청 내용" className="flex items-center gap-3 rounded-lg bg-canvas p-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-surface">
              <Emoji3D name={procedure ? categoryEmoji(procedure.category_id) : "bulb"} size={32} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-ink">{procedure?.name ?? "관심 시술 상담"}</p>
              <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="선택한 조건">
                {[optionLabel(REGION_OPTIONS, values.region), optionLabel(TIMING_OPTIONS, values.timing), clinic?.name]
                  .filter(Boolean)
                  .map((t) => (
                    <li key={t} className={cx(chip.base, "h-7 bg-surface px-2.5 text-xs text-ink-muted")}>
                      {t}
                    </li>
                  ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={goStep1}
              className="inline-flex h-11 shrink-0 items-center rounded-sm px-3 text-sm font-semibold text-brand-strong hover:bg-surface"
            >
              수정<span className="sr-only">: 관심 시술 단계로 돌아가기</span>
            </button>
          </section>

          <div className="grid gap-6">
            <div data-field="name">
              <label htmlFor="consult-name" className="block font-bold text-ink">
                이름
              </label>
              <input
                ref={nameRef}
                id="consult-name"
                name="name"
                type="text"
                autoComplete="name"
                enterKeyHint="next"
                maxLength={NAME_MAX + 10}
                placeholder="연락받으실 분의 이름"
                value={values.name}
                onChange={(e) => update({ name: e.target.value })}
                onBlur={() => checkOnBlur("name")}
                aria-required="true"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={describedBy(errors.name && "name-error")}
                className={cx(input, "mt-2")}
              />
              <FieldError id="name-error" message={errors.name} />
            </div>

            <div data-field="phone">
              <label htmlFor="consult-phone" className="block font-bold text-ink">
                휴대폰 번호
              </label>
              <input
                ref={phoneRef}
                id="consult-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                enterKeyHint="next"
                maxLength={13}
                placeholder="010-0000-0000"
                value={values.phone}
                onChange={(e) => {
                  const raw = e.target.value;
                  const caret = e.target.selectionStart ?? raw.length;
                  const digitsBefore = raw.slice(0, caret).replace(/\D/g, "").length;
                  const formatted = formatPhone(raw);
                  pendingCaret.current = caretAfterDigits(formatted, digitsBefore);
                  update({ phone: formatted });
                }}
                onBlur={() => checkOnBlur("phone")}
                aria-required="true"
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={describedBy(errors.phone ? "phone-error" : phoneHintId)}
                className={cx(input, "mt-2 tabular-nums")}
              />
              {errors.phone ? (
                <FieldError id="phone-error" message={errors.phone} />
              ) : (
                <p id={phoneHintId} className="mt-2 text-sm text-ink-subtle">
                  상담 연락과 안내 문자는 이 번호로만 드립니다.
                </p>
              )}
            </div>

            <ChoiceGroup
              name="contact_time"
              legend="연락 가능 시간"
              options={CONTACT_TIME_OPTIONS}
              value={values.contact_time}
              onChange={(v) => update({ contact_time: v as ConsultValues["contact_time"] })}
              error={errors.contact_time}
              gridClass="grid grid-cols-4"
              groupRef={contactRef}
              testId="consult-contact-time"
              size="base"
            />

            <div data-field="memo">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="consult-memo" className="block font-bold text-ink">
                  메모 <span className="font-medium text-ink-subtle">(선택)</span>
                </label>
                <span
                  aria-hidden="true"
                  className={cx("text-sm tabular-nums", memoLength > MEMO_MAX ? "font-semibold text-danger" : "text-ink-subtle")}
                >
                  {memoLength}/{MEMO_MAX}
                </span>
              </div>
              <textarea
                ref={memoRef}
                id="consult-memo"
                name="memo"
                rows={4}
                placeholder="궁금한 점이나 상담 때 꼭 듣고 싶은 내용을 적어 주세요."
                value={values.memo}
                onChange={(e) => update({ memo: e.target.value })}
                aria-invalid={errors.memo ? true : undefined}
                aria-describedby={describedBy(errors.memo ? "memo-error" : "memo-hint")}
                className={cx(input, "mt-2 h-auto min-h-32 resize-y py-3 leading-relaxed")}
              />
              {errors.memo ? (
                <FieldError id="memo-error" message={errors.memo} />
              ) : (
                <p id="memo-hint" className="mt-2 text-sm text-ink-subtle">
                  최대 {MEMO_MAX}자까지 쓸 수 있어요. 주민등록번호 같은 민감한 정보는 적지 마세요.
                </p>
              )}
            </div>
          </div>

          <ConsentFields
            values={{
              consent_privacy: values.consent_privacy,
              consent_sensitive: values.consent_sensitive,
              consent_3rd: values.consent_3rd,
              consent_marketing: values.consent_marketing,
            }}
            onChange={(patch) => update(patch)}
            errors={{ consent_privacy: errors.consent_privacy, consent_sensitive: errors.consent_sensitive }}
            firstRef={consentRef}
            privacyHref={privacyHref}
          />
        </div>
      )}

      {submitError && step === 2 && (
        <div
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          data-testid="consult-submit-error"
          className="mt-8 flex gap-3 rounded-md bg-danger-weak p-4 focus:outline-none"
        >
          <Emoji3D name="warning" size={24} className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-danger">{submitError.kind === "duplicate" ? "이미 접수된 신청이 있어요" : "신청을 보내지 못했어요"}</p>
            <p className="mt-0.5 text-sm text-ink-muted">{submitError.message}</p>
            {(submitError.kind === "server" || submitError.kind === "network") && (
              <button
                type="button"
                onClick={() => void submit()}
                className={cx(btn.outline, "mt-3 h-11 rounded-sm px-4 text-sm")}
              >
                <RotateCw aria-hidden="true" className="size-4" />
                다시 시도
              </button>
            )}
          </div>
        </div>
      )}

      {/* 시연 모드: 제출 영역 바로 위에서 "서버로 전송되지 않음"을 알린다(접수·연락을 약속하지 않는다) */}
      {mode === "demo" && <DemoNotice className="mt-8" />}

      {/* 모바일: 화면 하단에 붙어 따라오다 폼 끝에서 멈춘다(sticky) → 신뢰 안내·푸터를 가리지 않는다. 안전 영역 패딩 포함.
          데스크톱: 폼 끝의 일반 버튼(같은 요소라 중복 없음). */}
      <div
        data-testid="consult-actions"
        className={cx(
          "sticky bottom-0 z-(--z-bottom-bar) -mx-5 bg-surface px-5 pt-3 pb-safe-4 before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-linear-to-t before:from-surface before:to-transparent md:static md:mx-0 md:px-0 md:pt-0 md:pb-0 md:before:hidden",
          // 시연 안내가 있으면 안내와 버튼을 붙여 둔다(모바일은 위쪽 그라디언트 높이만큼 띄워 안내를 덮지 않게)
          mode === "demo" ? "mt-6 md:mt-4" : "mt-10",
        )}
      >
        <div className="flex gap-2">
          {step === 2 && (
            <button
              type="button"
              onClick={goStep1}
              disabled={submitting}
              data-testid="consult-back"
              className={cx(btn.neutral, "h-14 w-24 px-0 text-lg md:w-28")}
            >
              <ChevronLeft aria-hidden="true" className="-ml-1 size-5" />
              이전
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting || undefined}
            data-testid="consult-submit"
            className={cx(btn.primary, btn.lg, "grow disabled:opacity-100", submitting && "bg-brand-ink")}
          >
            {submitting ? (
              <>
                <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                접수하고 있어요
              </>
            ) : step === 1 ? (
              "다음"
            ) : (
              CONSULT_CTA.long
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
