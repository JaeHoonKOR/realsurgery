// scripts/contact-sheet.mjs — 후보 이름 규칙과 배경 판정(asset-plan 9절 "배경")
import { describe, expect, it } from "vitest";
import { backgroundVerdict, isCutout, parseCandidateName } from "../../scripts/contact-sheet.mjs";

const white = { r: 255, g: 255, b: 255 };
const surface = { r: 242, g: 244, b: 246 };

describe("contact-sheet", () => {
  it("후보 파일 이름 <id>-v<n>.webp 만 받는다", () => {
    expect(parseCandidateName("ic-eye-v2.webp")).toEqual({ id: "ic-eye", variant: "v2" });
    expect(parseCandidateName("proc-double-eyelid-v1.webp")).toEqual({ id: "proc-double-eyelid", variant: "v1" });
    expect(parseCandidateName("ic-eye-v0.webp")).toBeNull();
    expect(parseCandidateName("ic-eye.webp")).toBeNull();
    expect(parseCandidateName("selection.json")).toBeNull();
  });

  it("흰 배경 생성(아이콘·흰 배경 오브젝트)만 multiply 컷아웃", () => {
    expect(isCutout({ family: "icon" })).toBe(true);
    expect(isCutout({ family: "object", background: "#ffffff" })).toBe(true);
    expect(isCutout({ family: "object", background: "#F2F4F6" })).toBe(false);
    expect(isCutout({ family: "still" })).toBe(false);
  });

  it("배경 판정: 컷아웃은 모서리 ≥253, 스틸은 #F2F4F6 ±4, 사진은 눈으로", () => {
    expect(backgroundVerdict({ family: "icon" }, [white, white, white, { r: 250, g: 250, b: 250 }]).ok).toBe(false);
    expect(backgroundVerdict({ family: "icon" }, [white, white, white, { r: 254, g: 253, b: 255 }]).ok).toBe(true);
    expect(backgroundVerdict({ family: "still" }, [surface, surface, { r: 246, g: 244, b: 246 }, surface]).ok).toBe(true);
    expect(backgroundVerdict({ family: "still" }, [surface, surface, surface, { r: 236, g: 244, b: 246 }]).ok).toBe(false);
    expect(backgroundVerdict({ family: "space" }, [white]).ok).toBeNull();
    expect(backgroundVerdict({ family: "icon" }, []).ok).toBeNull();
  });
});
