// 브랜드색 기하 SVG 플레이스홀더 (docs/design/IMAGES.md "키 없으면 … 브랜드색 기하 도형 + 시술명", QUALITY 3-1 "빈 공간 금지")
// - 시술 10개: 1200×800(3:2) — 같은 파일을 히어로·썸네일 두 자리에 쓴다(벡터라 크기 무관).
// - 화면 이미지 자리(slot): 메인 히어로, 광고 랜딩 히어로, 병원 커버 패턴, 지도 썸네일, 칼럼 커버, 상담 완료, 빈 상태.
// - 사람·얼굴·신체 노출·수술 도구 없음. 생성 이미지가 아니므로 시술명 글자는 넣는다(윤곽선 path → 폰트 무관).
// 사용: gen-image.mjs 가 매번 다시 쓴다(결정적 출력 → git diff 가 비어 있으면 변경 없음).
import path from "node:path";
import { ROOT, readTokenColors, textToPath, writeText } from "./brand-kit.mjs";

export const PLACEHOLDER_DIR = path.join(ROOT, "public", "images", "placeholder");
export const PLACEHOLDER_URL = "/images/placeholder";

const ROUND = 'stroke-linecap="round" stroke-linejoin="round" fill="none"';

function doc(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

/** 4갈래 반짝임(장식) */
function sparkle(cx, cy, r, fill) {
  const k = r * 0.28;
  return `<path d="M${cx} ${cy - r}Q${cx + k} ${cy - k} ${cx + r} ${cy}Q${cx + k} ${cy + k} ${cx} ${cy + r}Q${cx - k} ${cy + k} ${cx - r} ${cy}Q${cx - k} ${cy - k} ${cx} ${cy - r}Z" fill="${fill}"/>`;
}

const eyeBase = (c) =>
  `<path d="M430 370Q600 250 770 370Q600 470 430 370Z" stroke="${c.brand}" stroke-width="12" ${ROUND}/>` +
  `<circle cx="600" cy="366" r="46" fill="${c.brand}"/><circle cx="616" cy="350" r="10" fill="${c.surface}"/>`;

/** 시술별 추상 모티프 (카드 영역 300..900 × 150..570, 중심 600,360) */
export const PROCEDURE_MOTIFS = {
  "double-eyelid": (c) =>
    eyeBase(c) + `<path d="M446 332Q600 226 754 332" stroke="${c.accent}" stroke-width="8" ${ROUND}/>` + sparkle(792, 246, 26, c.accent),
  epicanthoplasty: (c) =>
    eyeBase(c) +
    `<path d="M468 338Q440 370 468 402" stroke="${c.accent}" stroke-width="8" ${ROUND}/>` +
    `<path d="M410 370H372" stroke="${c.accent}" stroke-width="6" stroke-dasharray="2 14" ${ROUND}/>` +
    sparkle(792, 270, 20, c.accent),
  "ptosis-correction": (c) =>
    eyeBase(c) +
    `<path d="M600 262V196M576 218L600 194L624 218" stroke="${c.accent}" stroke-width="8" ${ROUND}/>` +
    `<path d="M462 322Q520 290 560 282M640 282Q680 290 738 322" stroke="${c.line}" stroke-width="6" ${ROUND}/>`,
  "lower-fat-repositioning": (c) =>
    eyeBase(c) +
    `<path d="M468 424Q600 500 732 424" stroke="${c.accent}" stroke-width="8" ${ROUND}/>` +
    `<circle cx="540" cy="482" r="7" fill="${c.accent}"/><circle cx="600" cy="494" r="7" fill="${c.accent}"/><circle cx="660" cy="482" r="7" fill="${c.accent}"/>`,
  rhinoplasty: (c) =>
    `<path d="M548 186L684 452" stroke="${c.accent}" stroke-width="6" stroke-dasharray="2 16" ${ROUND}/>` +
    `<path d="M560 186C572 268 600 350 660 430Q684 462 652 478Q624 488 594 474" stroke="${c.brand}" stroke-width="12" ${ROUND}/>` +
    sparkle(724, 250, 24, c.accent),
  "square-jaw-reduction": (c) =>
    `<path d="M470 190L474 350Q486 470 600 512Q714 470 726 350L730 190" stroke="${c.brand}" stroke-width="12" ${ROUND}/>` +
    `<path d="M488 372Q512 454 600 488Q688 454 712 372" stroke="${c.accent}" stroke-width="6" stroke-dasharray="2 14" ${ROUND}/>` +
    `<circle cx="482" cy="420" r="16" fill="${c.accent}" fill-opacity="0.45"/><circle cx="718" cy="420" r="16" fill="${c.accent}" fill-opacity="0.45"/>`,
  "zygoma-reduction": (c) =>
    `<ellipse cx="600" cy="352" rx="136" ry="176" stroke="${c.brand}" stroke-width="12" fill="none"/>` +
    `<path d="M450 318Q436 352 452 388M750 318Q764 352 748 388" stroke="${c.accent}" stroke-width="8" ${ROUND}/>` +
    `<path d="M404 352H428M420 340L432 352L420 364M796 352H772M780 340L768 352L780 364" stroke="${c.accent}" stroke-width="6" ${ROUND}/>`,
  "thread-lift": (c) =>
    `<path d="M470 504Q500 384 560 262M600 514V242M730 504Q700 384 640 262" stroke="${c.brand}" stroke-width="10" ${ROUND}/>` +
    `<path d="M540 274L560 254L572 282M582 258L600 236L618 258M628 282L640 254L660 274" stroke="${c.accent}" stroke-width="8" ${ROUND}/>`,
  "laser-toning": (c) =>
    `<circle cx="600" cy="360" r="152" stroke="${c.line}" stroke-width="6" fill="none"/>` +
    `<circle cx="600" cy="360" r="106" stroke="${c.brand}" stroke-width="8" fill="none"/>` +
    `<circle cx="600" cy="360" r="58" fill="${c.accent}" fill-opacity="0.55"/>` +
    sparkle(600, 360, 22, c.surface) +
    sparkle(770, 220, 18, c.accent),
  "breast-augmentation": (c) =>
    `<path d="M600 196V524" stroke="${c.line}" stroke-width="6" stroke-dasharray="2 14" ${ROUND}/>` +
    `<path d="M584 236C500 236 470 316 520 358C560 392 540 456 470 470M616 236C700 236 730 316 680 358C640 392 660 456 730 470" stroke="${c.brand}" stroke-width="12" ${ROUND}/>` +
    sparkle(600, 212, 20, c.accent),
};

/** 목적격 조사: 마지막 글자 받침 있으면 "을", 없으면 "를" (한글이 아니면 "을(를)") */
export function withObjectParticle(word) {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return `${word}을(를)`;
  return `${word}${code % 28 === 0 ? "를" : "을"}`;
}

/** 카테고리 → 플레이스홀더 alt(한글). 시술명은 호출부가 붙인다. */
export const MOTIF_ALT = {
  eye: "눈 윤곽선을 단순화한 기하 도형",
  nose: "옆모습 곡선을 단순화한 기하 도형",
  contour: "턱·광대 곡선을 단순화한 기하 도형",
  lifting: "위로 향하는 곡선을 단순화한 기하 도형",
  skin: "동심원 빛을 단순화한 기하 도형",
  breast: "좌우 대칭 곡선을 단순화한 기하 도형",
};

/**
 * 시술 플레이스홀더 SVG (1200×800)
 * @param {{ id: string, name: string }} p
 * @param {Record<string,string>} c tokens.css 색
 */
export function procedurePlaceholderSvg(p, c = readTokenColors()) {
  const motif = PROCEDURE_MOTIFS[p.id];
  if (!motif) throw new Error(`[placeholders] ${p.id} 모티프가 없습니다. PROCEDURE_MOTIFS 에 추가하세요.`);
  const label = textToPath(p.name, { size: 44, x: 600, y: 682, anchor: "middle", weight: "bold", letterSpacing: -0.01 });
  return doc(
    1200,
    800,
    `<rect width="1200" height="800" fill="${c.canvas}"/>` +
      `<circle cx="968" cy="164" r="232" fill="${c.accent}" fill-opacity="0.14"/>` +
      `<circle cx="176" cy="700" r="176" fill="${c.brand}" fill-opacity="0.08"/>` +
      `<rect x="300" y="150" width="600" height="420" rx="48" fill="${c.surface}"/>` +
      motif(c) +
      `<path d="${label.d}" fill="${c.ink}"/>` +
      `<rect x="576" y="712" width="48" height="6" rx="3" fill="${c.accent}"/>`,
  );
}

/** 가로 범위 막대 1줄(메인 히어로 장식) */
function rangeRow(x, y, w, from, to, c, color) {
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="16" rx="8" fill="${c.line}"/>` +
    `<rect x="${x + w * from}" y="${y}" width="${w * (to - from)}" height="16" rx="8" fill="${color}"/>`
  );
}

/** 화면 이미지 자리별 플레이스홀더. file 은 PLACEHOLDER_DIR 기준 ASCII 이름. */
export const SLOT_PLACEHOLDERS = [
  {
    slot: "home-hero",
    width: 1200,
    height: 800,
    alt: "시술 가격 범위와 회복 일정을 비교하는 카드 일러스트",
    svg: (c) =>
      doc(
        1200,
        800,
        `<rect width="1200" height="800" fill="${c.canvas}"/>` +
          `<circle cx="930" cy="210" r="260" fill="${c.accent}" fill-opacity="0.14"/>` +
          `<circle cx="210" cy="640" r="200" fill="${c.brand}" fill-opacity="0.08"/>` +
          `<rect x="270" y="170" width="560" height="420" rx="48" fill="${c.surface}"/>` +
          `<circle cx="350" cy="252" r="34" fill="${c.brand}"/><path d="M334 252L346 264L368 240" stroke="${c.surface}" stroke-width="8" ${ROUND}/>` +
          `<rect x="404" y="232" width="200" height="16" rx="8" fill="${c.ink}" fill-opacity="0.85"/><rect x="404" y="260" width="128" height="12" rx="6" fill="${c.line}"/>` +
          rangeRow(330, 330, 440, 0.12, 0.62, c, c.brand) +
          rangeRow(330, 390, 440, 0.3, 0.86, c, c.accent) +
          rangeRow(330, 450, 440, 0.06, 0.44, c, c.brand) +
          rangeRow(330, 510, 440, 0.4, 0.74, c, c.accent) +
          `<rect x="700" y="470" width="300" height="190" rx="32" fill="${c.surface}" stroke="${c.line}" stroke-width="4"/>` +
          `<path d="M748 566H952" stroke="${c.line}" stroke-width="6" ${ROUND}/>` +
          `<circle cx="760" cy="566" r="16" fill="${c.brand}"/><circle cx="850" cy="566" r="16" fill="${c.accent}"/><circle cx="940" cy="566" r="16" fill="${c.surface}" stroke="${c.brand}" stroke-width="6"/>` +
          sparkle(1010, 300, 30, c.accent) +
          sparkle(240, 220, 18, c.brand),
      ),
  },
  {
    slot: "lp-hero",
    width: 1200,
    height: 800,
    alt: "상담 신청 단계를 나타내는 카드 일러스트",
    svg: (c) =>
      doc(
        1200,
        800,
        `<rect width="1200" height="800" fill="${c.canvas}"/>` +
          `<circle cx="260" cy="220" r="220" fill="${c.brand}" fill-opacity="0.08"/>` +
          `<circle cx="980" cy="620" r="240" fill="${c.accent}" fill-opacity="0.14"/>` +
          `<rect x="330" y="180" width="540" height="440" rx="48" fill="${c.surface}"/>` +
          `<path d="M420 300V520" stroke="${c.line}" stroke-width="6" ${ROUND}/>` +
          [300, 410, 520]
            .map(
              (y, i) =>
                `<circle cx="420" cy="${y}" r="24" fill="${i < 2 ? c.brand : c.surface}" stroke="${c.brand}" stroke-width="6"/>` +
                `<rect x="476" y="${y - 14}" width="${[260, 220, 300][i]}" height="14" rx="7" fill="${c.ink}" fill-opacity="${i < 2 ? 0.85 : 0.35}"/>` +
                `<rect x="476" y="${y + 10}" width="${[180, 150, 200][i]}" height="10" rx="5" fill="${c.line}"/>`,
            )
            .join("") +
          `<path d="M408 300L416 308L432 292M408 410L416 418L432 402" stroke="${c.surface}" stroke-width="6" ${ROUND}/>` +
          sparkle(900, 210, 30, c.accent),
      ),
  },
  {
    slot: "clinic-cover",
    width: 1200,
    height: 400,
    alt: "",
    svg: (c) => {
      let tiles = "";
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 12; col++) {
          const x = col * 100;
          const y = row * 100;
          const k = (row + col) % 4;
          if (k === 0) tiles += `<path d="M${x} ${y + 100}A100 100 0 0 1 ${x + 100} ${y}" stroke="${c.brand}" stroke-opacity="0.22" stroke-width="6" fill="none"/>`;
          else if (k === 1) tiles += `<circle cx="${x + 50}" cy="${y + 50}" r="22" fill="${c.accent}" fill-opacity="0.22"/>`;
          else if (k === 2) tiles += `<path d="M${x} ${y}A100 100 0 0 0 ${x + 100} ${y + 100}" stroke="${c.accent}" stroke-opacity="0.3" stroke-width="6" fill="none"/>`;
          else tiles += `<rect x="${x + 34}" y="${y + 34}" width="32" height="32" rx="8" fill="${c.brand}" fill-opacity="0.12"/>`;
        }
      }
      return doc(1200, 400, `<rect width="1200" height="400" fill="${c.canvas}"/>${tiles}`);
    },
  },
  {
    slot: "map",
    width: 600,
    height: 400,
    alt: "병원 위치를 표시한 약도 일러스트",
    svg: (c) =>
      doc(
        600,
        400,
        `<rect width="600" height="400" fill="${c.canvas}"/>` +
          `<path d="M-20 300C120 250 220 330 360 280S560 220 640 250" stroke="${c.brand}" stroke-opacity="0.18" stroke-width="40" fill="none"/>` +
          [
            [40, 40, 150, 90],
            [220, 30, 120, 110],
            [400, 50, 160, 80],
            [30, 170, 130, 70],
            [400, 160, 170, 60],
          ]
            .map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${c.surface}" stroke="${c.line}" stroke-width="3"/>`)
            .join("") +
          `<path d="M0 150H600M190 0V400M370 0V400" stroke="${c.surface}" stroke-width="18"/>` +
          `<path d="M0 150H600M190 0V400M370 0V400" stroke="${c.line}" stroke-width="2" stroke-dasharray="10 10"/>` +
          `<path d="M300 112C276 112 258 130 258 154C258 186 300 222 300 222S342 186 342 154C342 130 324 112 300 112Z" fill="${c.accentStrong}"/>` +
          `<circle cx="300" cy="154" r="14" fill="${c.surface}"/>` +
          `<ellipse cx="300" cy="232" rx="26" ry="7" fill="${c.ink}" fill-opacity="0.12"/>`,
      ),
  },
  {
    slot: "post-cover",
    width: 1200,
    height: 800,
    alt: "칼럼을 나타내는 추상 패턴 일러스트",
    svg: (c) =>
      doc(
        1200,
        800,
        `<rect width="1200" height="800" fill="${c.canvas}"/>` +
          `<circle cx="300" cy="300" r="220" fill="${c.brand}" fill-opacity="0.1"/>` +
          `<circle cx="860" cy="520" r="260" fill="${c.accent}" fill-opacity="0.14"/>` +
          [0, 1, 2, 3, 4]
            .map((i) => `<path d="M${180 + i * 40} 640Q600 ${200 + i * 40} ${1020 - i * 40} 640" stroke="${i % 2 ? c.accent : c.brand}" stroke-opacity="0.5" stroke-width="8" ${ROUND}/>`)
            .join("") +
          `<rect x="440" y="250" width="320" height="220" rx="32" fill="${c.surface}"/>` +
          `<rect x="484" y="300" width="200" height="16" rx="8" fill="${c.ink}" fill-opacity="0.85"/>` +
          `<rect x="484" y="340" width="232" height="12" rx="6" fill="${c.line}"/><rect x="484" y="368" width="180" height="12" rx="6" fill="${c.line}"/><rect x="484" y="396" width="208" height="12" rx="6" fill="${c.line}"/>` +
          sparkle(780, 230, 26, c.accent),
      ),
  },
  {
    slot: "consult-done",
    width: 600,
    height: 400,
    alt: "상담 신청이 완료되었음을 나타내는 체크 표시 일러스트",
    svg: (c) =>
      doc(
        600,
        400,
        `<rect width="600" height="400" fill="${c.canvas}"/>` +
          `<circle cx="300" cy="196" r="128" fill="${c.brand}" fill-opacity="0.1"/>` +
          `<circle cx="300" cy="196" r="88" fill="${c.brand}"/>` +
          `<path d="M258 198L288 228L346 168" stroke="${c.surface}" stroke-width="16" ${ROUND}/>` +
          sparkle(440, 96, 18, c.accent) +
          sparkle(150, 290, 14, c.accent) +
          `<circle cx="132" cy="120" r="8" fill="${c.accent}"/><circle cx="470" cy="300" r="10" fill="${c.brand}" fill-opacity="0.4"/><rect x="444" y="190" width="14" height="14" rx="3" fill="${c.accent}" fill-opacity="0.6" transform="rotate(20 451 197)"/>`,
      ),
  },
  {
    slot: "empty",
    width: 600,
    height: 400,
    alt: "찾는 결과가 없음을 나타내는 빈 카드와 돋보기 일러스트",
    svg: (c) =>
      doc(
        600,
        400,
        `<rect width="600" height="400" fill="${c.canvas}"/>` +
          `<rect x="170" y="110" width="240" height="190" rx="24" fill="${c.surface}" stroke="${c.line}" stroke-width="4" stroke-dasharray="12 10"/>` +
          `<rect x="200" y="150" width="120" height="14" rx="7" fill="${c.line}"/><rect x="200" y="182" width="170" height="10" rx="5" fill="${c.line}"/><rect x="200" y="206" width="140" height="10" rx="5" fill="${c.line}"/>` +
          `<circle cx="390" cy="244" r="50" fill="${c.surface}" stroke="${c.brand}" stroke-width="12"/>` +
          `<path d="M426 280L466 320" stroke="${c.brand}" stroke-width="14" ${ROUND}/>` +
          sparkle(160, 90, 16, c.accent),
      ),
  },
];

/**
 * 플레이스홀더 전부 쓰기. 반환값은 매니페스트에 넣을 항목.
 * @param {{ id: string, name: string, category_id: string }[]} procedures
 * @param {{ outDir?: string, colors?: Record<string,string> }} [o]
 */
export function writePlaceholders(procedures, { outDir = PLACEHOLDER_DIR, colors = readTokenColors() } = {}) {
  const procedureEntries = procedures.map((p) => {
    writeText(path.join(outDir, `${p.id}.svg`), procedurePlaceholderSvg(p, colors));
    const motif = MOTIF_ALT[p.category_id] ?? "기하 도형";
    return { slug: p.id, file: `${PLACEHOLDER_URL}/${p.id}.svg`, width: 1200, height: 800, alt: `${withObjectParticle(p.name)} 나타내는 ${motif}` };
  });
  const slotEntries = SLOT_PLACEHOLDERS.map((s) => {
    writeText(path.join(outDir, `${s.slot}.svg`), s.svg(colors));
    return { slot: s.slot, file: `${PLACEHOLDER_URL}/${s.slot}.svg`, width: s.width, height: s.height, alt: s.alt };
  });
  return { procedures: procedureEntries, slots: slotEntries };
}

