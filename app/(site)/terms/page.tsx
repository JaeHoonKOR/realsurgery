import type { Metadata } from "next";
import { Clauses, PolicyDoc, type PolicySection } from "@/components/consult/PolicyDoc";
import { POLICY_EFFECTIVE_LABEL } from "@/lib/consult/policy";
import { SITE } from "@/lib/site";

// C-01 이용약관 (screen-spec 4절 C-01: 플랫폼은 의료 행위·진단 없음, 가격은 참고용, 병원 분쟁 책임 범위). [human-gate]

const TITLE = "이용약관";
const DESCRIPTION =
  "리얼성형 서비스 이용약관입니다. 리얼성형은 의료기관이 아니며 진단·치료를 하지 않습니다. 가격 정보는 병원 공개가를 옮긴 참고용이고, 상담 신청·연결에는 비용과 수수료가 없습니다. 책임 범위와 분쟁 해결 방법을 안내합니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "./" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "./" },
};

const strong = "font-semibold text-ink";

export default function TermsPage() {
  const sections: PolicySection[] = [
    {
      id: "purpose",
      title: "목적",
      body: (
        <p>
          이 약관은 {SITE.name}(이하 &lsquo;리얼성형&rsquo;)이 제공하는 성형 시술 정보·병원 공개 정보 비교·상담 연결 서비스(이하
          &lsquo;서비스&rsquo;)의 이용 조건과 절차, 리얼성형과 이용자의 권리·의무 및 책임 사항을 정합니다.
        </p>
      ),
    },
    {
      id: "nature",
      title: "서비스의 성격",
      body: (
        <Clauses
          items={[
            <>
              리얼성형은 <span className={strong}>의료기관이 아니며</span>, 진단·처방·치료 등 의료 행위를 하지 않습니다.
            </>,
            <>
              서비스의 시술 정보는 학회·대학병원·공공기관 자료를 바탕으로 정리한 일반 정보이며 의료 조언이 아닙니다. 시술 여부와
              방법은 반드시 의료진과 상담해 결정해야 합니다.
            </>,
            <>서비스는 특정 병원이나 시술을 추천하거나 효과를 보장하지 않습니다.</>,
          ]}
        />
      ),
    },
    {
      id: "price",
      title: "가격 정보",
      body: (
        <Clauses
          items={[
            <>
              서비스에 표시되는 가격은 각 병원이 홈페이지 등에 <span className={strong}>공개한 가격을 옮긴 참고용 정보</span>이며,
              표시된 갱신일 기준입니다.
            </>,
            <>실제 비용은 진찰 결과, 시술 방법, 마취·검사·사후 관리 포함 여부에 따라 달라질 수 있으며 최종 금액은 병원이 정합니다.</>,
            <>가격 정보가 실제와 다르면 알려 주세요. 확인 후 바로 고칩니다.</>,
          ]}
        />
      ),
    },
    {
      id: "consult",
      title: "상담 신청과 연결",
      body: (
        <Clauses
          items={[
            <>
              상담 신청과 연결에는 <span className={strong}>비용이 들지 않습니다</span>. 리얼성형은 이용자에게 비용을 받지 않으며, 「의료법」
              제27조 제3항에 따라 병원으로부터 환자 소개·알선의 대가(건당 수수료)도 받지 않습니다.
            </>,
            <>
              현재 제휴 병원이 없어, 신청하신 내용은 리얼성형 운영팀이 받아 시술 상담 가이드를 직접 안내합니다. 병원을 연결하게 되면
              이용자가 [선택] 제3자 제공에 동의하고 연결을 원한 경우에만, 그 동의 범위 안에서 정보를 전달합니다.
            </>,
            <>이용자는 연락 가능한 본인의 정보로 신청해야 하며, 다른 사람의 정보로 신청해서는 안 됩니다.</>,
            <>같은 번호로 짧은 시간에 반복해 신청하면 중복 신청으로 보고 접수하지 않을 수 있습니다.</>,
          ]}
        />
      ),
    },
    {
      id: "ads",
      title: "광고의 표시",
      body: (
        <p>
          병원의 유료 노출(프리미엄 노출)은 정보와 구분해 광고임을 표시하며, 의료광고 사전심의를 받은 문구와 심의번호만 게시합니다.
          제휴 상품 링크에는 제휴 사실을 함께 표시합니다.
        </p>
      ),
    },
    {
      id: "duties",
      title: "이용자의 의무",
      body: (
        <Clauses
          items={[
            <>서비스의 정보를 무단으로 복제·배포하거나 상업적으로 이용해서는 안 됩니다.</>,
            <>자동화된 수단으로 상담 신청을 반복하거나 서비스 운영을 방해해서는 안 됩니다.</>,
          ]}
        />
      ),
    },
    {
      id: "liability",
      title: "책임의 범위",
      body: (
        <Clauses
          items={[
            <>
              시술의 결과, 부작용, 진료 과정에서 생긴 문제와 병원과 이용자 사이의 분쟁은 진료 계약의 당사자인 병원과 이용자에게
              책임이 있으며, 리얼성형은 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.
            </>,
            <>리얼성형은 분쟁 해결에 필요한 범위에서 상담 신청 기록 등 보유한 자료를 이용자에게 제공하도록 협조합니다.</>,
            <>천재지변, 서비스 설비 장애 등 불가항력으로 서비스를 제공하지 못한 경우에는 책임이 면제됩니다.</>,
          ]}
        />
      ),
    },
    {
      id: "changes",
      title: "약관의 변경",
      body: (
        <p>
          약관을 바꾸면 시행일과 변경 이유를 밝혀 시행 7일 전부터 서비스에 알립니다. 이용자에게 불리한 변경은 30일 전부터 알립니다.
        </p>
      ),
    },
    {
      id: "dispute",
      title: "분쟁 해결과 관할",
      body: (
        <Clauses
          items={[
            <>서비스 이용과 관련한 분쟁은 리얼성형과 이용자가 성실히 협의해 해결합니다.</>,
            <>
              협의가 되지 않으면 한국소비자원 등 분쟁조정기관에 조정을 신청할 수 있으며, 소송은 「민사소송법」에 따른 관할 법원에
              제기합니다.
            </>,
            <>이 약관은 대한민국 법률에 따라 해석합니다.</>,
          ]}
        />
      ),
    },
  ];

  return (
    <PolicyDoc
      kind="terms"
      title={TITLE}
      effectiveLabel={POLICY_EFFECTIVE_LABEL}
      intro={
        <>
          <p>리얼성형 서비스를 이용하기 전에 아래 내용을 꼭 확인해 주세요. 서비스를 이용하면 이 약관에 동의한 것으로 봅니다.</p>
          <p className="rounded-md bg-canvas px-4 py-3 text-sm">
            {SITE.businessPending} 아래 내용은 서비스를 운영할 때 적용할 기준입니다.
          </p>
        </>
      }
      sections={sections}
      footer={
        <>
          <p className="font-semibold text-ink">부칙</p>
          <p className="mt-1">이 약관은 {POLICY_EFFECTIVE_LABEL}부터 시행합니다.</p>
        </>
      }
    />
  );
}
