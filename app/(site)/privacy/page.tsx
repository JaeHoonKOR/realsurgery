import type { Metadata } from "next";
import { Clauses, PolicyDoc, PolicyTable, type PolicySection } from "@/components/consult/PolicyDoc";
import {
  POLICY_EFFECTIVE_LABEL,
  RETENTION_LABEL,
  SENSITIVE_ITEMS,
  SENSITIVE_PURPOSE,
  THIRD_PARTY,
  consentDetail,
} from "@/lib/consult/policy";
import { SITE } from "@/lib/site";

// C-01 개인정보처리방침 (screen-spec 4절 C-01, 1절 법적 고려). [human-gate] 게시 전 사람(필요 시 변호사) 검토.
// 동의 문구(lib/consult/policy.ts)와 같은 값을 쓴다: 민감정보 별도 필수 동의, 병원 제3자 제공은 선택.

const TITLE = "개인정보처리방침";
const DESCRIPTION =
  "리얼성형이 상담 신청 시 수집하는 개인정보 항목과 이용 목적, 민감정보(관심 시술) 처리, 병원 제3자 제공, 보유 기간과 파기, 처리 위탁, 쿠키·분석 도구, 이용자 권리와 행사 방법을 안내합니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "./" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "./" },
};

const strong = "font-semibold text-ink";

export default function PrivacyPage() {
  const sections: PolicySection[] = [
    {
      id: "items",
      title: "수집하는 개인정보 항목",
      body: (
        <>
          <p>리얼성형은 회원가입 없이 운영되며, 시술 상담을 신청할 때에만 아래 정보를 받습니다.</p>
          <PolicyTable
            caption="수집 항목"
            columns={["구분", "항목", "수집 방법"]}
            rows={[
              ["필수", "이름, 휴대폰 번호, 희망 지역, 희망 시기, 연락 가능 시간", "상담 신청서"],
              ["필수(민감정보)", "관심 시술 — 아래 「민감정보의 처리」 조항에 따라 따로 동의받습니다", "상담 신청서"],
              ["선택", "메모, 상담 병원(병원 상세에서 신청한 경우)", "상담 신청서"],
              [
                "자동 수집",
                "유입 정보(광고 매체·캠페인 등 UTM 값, 광고 클릭 ID, 첫 방문 페이지, 이전 사이트 주소), 방문 기록, 기기·브라우저 정보",
                "쿠키·분석 도구",
              ],
            ]}
          />
          <p>
            상담 신청서의 동의는 <span className={strong}>[필수] 개인정보 수집·이용</span>,{" "}
            <span className={strong}>[필수] 민감정보(관심 시술) 처리</span>, <span className={strong}>[선택] 병원 연결을 위한 제3자 제공</span>,{" "}
            <span className={strong}>[선택] 마케팅 정보 수신</span>으로 나눠 받습니다. 선택 항목에 동의하지 않아도 상담 신청은 할 수
            있습니다.
          </p>
        </>
      ),
    },
    {
      id: "purpose",
      title: "개인정보의 이용 목적",
      body: (
        <Clauses
          items={[
            <>
              <span className={strong}>상담 안내</span>: 신청하신 시술의 가격 범위·회복 일정 안내, 상담 일정 조율, 문의 응대
            </>,
            <>
              <span className={strong}>신청 관리</span>: 본인 확인, 중복 신청 방지, 상담 진행 상태 기록
            </>,
            <>
              <span className={strong}>서비스 개선</span>: 유입 경로별 신청 통계(개인을 알아볼 수 없는 형태로 집계)
            </>,
            <>
              <span className={strong}>마케팅</span>: 마케팅 수신에 동의한 경우에만 관심 시술 관련 새 가이드·이벤트 안내
            </>,
          ]}
        />
      ),
    },
    {
      id: "sensitive",
      title: "민감정보의 처리",
      body: (
        <>
          <p>
            관심 시술은 신체 부위나 건강 상태를 짐작할 수 있는 정보이므로 「개인정보 보호법」 제23조에 따라 민감정보로 다룹니다.
            상담 신청서에서 다른 개인정보와 구분한 <span className={strong}>[필수] 민감정보(관심 시술) 처리 동의</span>를 따로
            받으며, 동의한 목적 외에는 쓰지 않습니다.
          </p>
          <PolicyTable
            caption="민감정보 처리"
            columns={["처리 항목", "처리 목적", "보유 기간", "거부 시 불이익"]}
            rows={[
              [
                SENSITIVE_ITEMS,
                SENSITIVE_PURPOSE,
                `${RETENTION_LABEL} 파기 (상담이 이뤄지지 않으면 신청일로부터 1년)`,
                consentDetail("consent_sensitive").refusal,
              ],
            ]}
          />
          <p>
            관심 시술은 마케팅 정보 수신에 따로 동의한 경우에만 맞춤 안내에 쓰고, 병원에는 제3자 제공에 동의한 경우에만 제공합니다.
          </p>
        </>
      ),
    },
    {
      id: "third-party",
      title: "개인정보의 제3자 제공",
      body: (
        <>
          <p>
            리얼성형은 이용자가 <span className={strong}>[선택] 병원 연결을 위한 제3자 제공</span>에 동의하고 병원 연결을 원할
            때에만, 상담을 연결할 병원에 필요한 최소한의 정보를 제공합니다. 그 밖에는 법령에 근거가 있는 경우를 제외하고 개인정보를
            외부에 제공하지 않습니다.
          </p>
          <PolicyTable
            caption="제3자 제공"
            columns={["제공받는 자", "제공 항목", "제공 목적", "보유 기간"]}
            rows={[[THIRD_PARTY.recipient, THIRD_PARTY.items, THIRD_PARTY.purpose, THIRD_PARTY.retention]]}
          />
          <p>
            <span className={strong}>현재 제휴 병원은 없습니다.</span> 지금은 어떤 병원에도 정보를 제공하지 않으며, 리얼성형
            운영팀이 직접 상담 가이드를 안내합니다. 병원을 연결하게 되면 제공받는 병원 이름을 이 항목에 게시하고, 정보를 넘기기
            전에 이용자에게 병원 이름을 먼저 알려 다시 확인을 받습니다.
          </p>
          <p>
            제3자 제공에 동의하지 않아도 상담 신청과 운영팀의 상담 가이드 안내는 똑같이 받을 수 있습니다. 다만 병원 상담 연결은
            해 드릴 수 없습니다.
          </p>
          <p>리얼성형은 병원으로부터 상담 연결의 대가(건당 수수료)를 받지 않습니다.</p>
        </>
      ),
    },
    {
      id: "retention",
      title: "보유 기간과 파기",
      body: (
        <Clauses
          items={[
            <>
              상담 신청 정보는 <span className={strong}>{RETENTION_LABEL}</span> 파기합니다. 상담이 이뤄지지 않으면 신청일로부터 1년이
              지난 뒤 파기합니다.
            </>,
            <>마케팅 수신 동의 정보는 동의를 철회하거나 보유 기간이 끝나면 즉시 파기합니다.</>,
            <>
              보유 기간이 끝난 정보는 매일 자동으로 확인해 데이터베이스에서 복구할 수 없는 방법으로 삭제하며, 종이 문서는 만들지
              않습니다.
            </>,
            <>
              다른 법령에서 보존을 요구하는 경우(예: 「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 소비자 불만·분쟁 처리 기록
              3년)에는 해당 기간 동안 분리해 보관합니다.
            </>,
          ]}
        />
      ),
    },
    {
      id: "outsourcing",
      title: "개인정보 처리 위탁",
      body: (
        <>
          <p>서비스 운영을 위해 아래 업체에 처리를 맡기고 있으며, 위탁 계약에 따라 안전하게 관리되도록 감독합니다.</p>
          <PolicyTable
            caption="처리 위탁"
            columns={["수탁 업체", "위탁 업무", "보관 위치"]}
            rows={[
              ["Supabase Inc.", "상담 신청 정보 저장(데이터베이스)", "클라우드(서울 리전)"],
              ["Resend Inc.", "상담 신청 알림 메일 발송(운영팀 수신)", "미국"],
              ["GitHub Inc.", "웹사이트 호스팅(개인정보는 저장하지 않음)", "미국"],
            ]}
          />
          <p>
            해외 업체로 이전되는 정보는 알림 메일에 포함된 신청 요약(이름 일부 가림, 관심 시술, 희망 시기)뿐이며, 휴대폰 번호는
            포함하지 않습니다.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "쿠키와 분석 도구",
      body: (
        <>
          <p>방문 통계와 광고 성과 측정을 위해 쿠키를 사용하며, 첫 방문 때 표시되는 쿠키 설정에서 동의한 경우에만 작동합니다.</p>
          <PolicyTable
            caption="분석 도구"
            columns={["도구", "용도", "동의 항목"]}
            rows={[
              ["Google Analytics 4", "방문 통계, 상담 신청 전환 측정", "방문 통계"],
              ["Meta 픽셀·전환 API", "광고 성과 측정, 광고 대상 제외(이미 신청한 분)", "광고 성과 측정"],
              ["첫 유입 쿠키(_utm)", "어떤 광고·검색으로 처음 방문했는지 기록(90일)", "상담 신청 시 함께 저장"],
            ]}
          />
          <p>
            광고 성과 측정에 동의한 경우에만 휴대폰 번호를 복원할 수 없게 변환(SHA-256 해시)한 값을 Meta에 보내 광고 성과를 집계합니다.
            쿠키 설정은 브라우저 설정에서 쿠키를 삭제하면 다시 고를 수 있습니다.
          </p>
        </>
      ),
    },
    {
      id: "security",
      title: "개인정보의 안전성 확보 조치",
      body: (
        <Clauses
          items={[
            <>휴대폰 번호는 저장할 때 암호화(AES-256-GCM)하고, 관리자 화면에서도 기본으로 가려서 보여 줍니다.</>,
            <>상담 신청 정보는 브라우저에서 직접 읽거나 쓸 수 없고, 접근 권한을 확인하는 서버 함수를 거쳐서만 처리됩니다.</>,
            <>관리자 계정은 최소 인원에게만 부여하고, 상담 상태를 바꿀 때마다 변경 기록을 남깁니다.</>,
            <>모든 통신은 HTTPS로 암호화합니다.</>,
          ]}
        />
      ),
    },
    {
      id: "rights",
      title: "이용자의 권리와 행사 방법",
      body: (
        <>
          <Clauses
            items={[
              <>이용자는 언제든지 자신의 개인정보 열람, 정정, 삭제, 처리 정지, 동의 철회를 요구할 수 있습니다.</>,
              <>
                상담 연락을 받을 때 말씀하시거나 아래 개인정보 보호책임자에게 요청하시면 본인 확인 후 10일 안에 처리하고 결과를
                알려 드립니다.
              </>,
              <>마케팅 수신은 안내 문자에 적힌 수신 거부 방법으로도 바로 철회할 수 있습니다.</>,
              <>만 14세 미만 아동의 상담 신청은 받지 않습니다.</>,
            ]}
          />
        </>
      ),
    },
    {
      id: "officer",
      title: "개인정보 보호책임자",
      body: (
        <>
          <dl className="grid gap-2 rounded-md bg-canvas-soft p-4 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-ink-muted">책임 부서</dt>
              <dd className="col-span-2 font-semibold text-ink">리얼성형 운영팀(시연 사이트)</dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-ink-muted">연락처</dt>
              <dd className="col-span-2 text-ink-muted" data-testid="privacy-officer-contact">
                실제 영업을 하지 않는 포트폴리오용 시연 사이트라 연락처를 두지 않았습니다. 사이트 운영을 시작하면 이곳에 게시합니다.
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <dt className="text-ink-muted">응대 시간</dt>
              <dd className="col-span-2 text-ink-muted">운영 시 {SITE.hours}</dd>
            </div>
          </dl>
          <p>개인정보 침해에 대한 신고나 상담이 필요하면 아래 기관에 문의할 수 있습니다.</p>
          <ul className="grid gap-1 text-sm">
            <li>개인정보침해신고센터 (privacy.kisa.or.kr, 국번 없이 118)</li>
            <li>개인정보분쟁조정위원회 (www.kopico.go.kr, 1833-6972)</li>
            <li>대검찰청 사이버수사과 (www.spo.go.kr, 국번 없이 1301)</li>
            <li>경찰청 사이버수사국 (ecrm.police.go.kr, 국번 없이 182)</li>
          </ul>
        </>
      ),
    },
    {
      id: "changes",
      title: "방침의 변경",
      body: (
        <p>
          이 방침의 내용이 바뀌면 시행 7일 전부터 이 페이지에 알립니다. 수집 항목이나 제3자 제공처가 바뀌는 등 이용자 권리에 중요한
          변경이 있으면 30일 전에 알리고, 필요하면 다시 동의를 받습니다.
        </p>
      ),
    },
  ];

  return (
    <PolicyDoc
      kind="privacy"
      title={TITLE}
      effectiveLabel={POLICY_EFFECTIVE_LABEL}
      intro={
        <>
          <p>
            {SITE.name}(이하 &lsquo;리얼성형&rsquo;)은 「개인정보 보호법」에 따라 이용자의 개인정보를 보호하고 관련 고충을 신속하게
            처리하기 위해 다음과 같이 개인정보처리방침을 둡니다. 리얼성형은 의료기관이 아니며, 상담 신청에 필요한 최소한의 정보만
            받습니다.
          </p>
          <p data-testid="privacy-demo-note" className="rounded-md bg-canvas px-4 py-3 text-sm">
            {SITE.businessPending} 아래 내용은 서비스를 운영할 때 적용할 기준입니다.
          </p>
        </>
      }
      sections={sections}
      footer={
        <>
          <p className="font-semibold text-ink">부칙</p>
          <p className="mt-1">이 방침은 {POLICY_EFFECTIVE_LABEL}부터 시행합니다.</p>
        </>
      }
    />
  );
}
