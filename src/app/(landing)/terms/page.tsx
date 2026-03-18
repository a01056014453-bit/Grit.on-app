import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "서비스 이용약관",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Sempre(셈프레) 서비스 이용약관
        </h1>
        <p className="text-sm font-semibold text-gray-700 mb-4">
          시행일 : 2026. 03. 18.
        </p>
        <p className="text-[15px] leading-relaxed text-gray-700 mb-10">
          본 약관은 <strong>Sempre</strong>(이하 &quot;회사&quot;)가 제공하는 AI
          기반 음악 연습 분석 및 전문가 매칭 서비스(이하 &quot;서비스&quot;)의
          이용조건 및 절차에 관한 사항을 규정합니다.
        </p>

        <div className="space-y-10 text-gray-700 text-[15px] leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              제1조 (목적)
            </h2>
            <p>
              본 약관은 회사가 운영하는 웹사이트 및 모바일 애플리케이션을 통해
              제공하는 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및
              책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              제2조 (용어의 정의)
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                &quot;서비스&quot;란 회사가 제공하는 AI 음악 연습 분석, 연습 기록
                관리, 전문가 매칭, 커뮤니티 기능 등 일체의 서비스를 말합니다.
              </li>
              <li>
                &quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를
                이용하는 자를 말합니다.
              </li>
              <li>
                &quot;회원&quot;이란 회사에 개인정보를 제공하여 회원등록을 한
                이용자를 말합니다.
              </li>
              <li>
                &quot;크레딧&quot;이란 서비스 내에서 전문가 매칭 등 유료 기능
                이용을 위해 사용되는 가상 재화를 말합니다.
              </li>
              <li>
                &quot;전문가&quot;란 회사의 인증 절차를 통과하여 다른 이용자에게
                음악 관련 조언을 제공할 수 있는 자격을 부여받은 회원을 말합니다.
              </li>
            </ol>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              제3조 (약관의 효력 및 변경)
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게
                공지함으로써 효력을 발생합니다.
              </li>
              <li>
                회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며,
                변경 시 적용일자 및 변경사유를 명시하여 서비스 내에 적용일자 7일
                전부터 공지합니다.
              </li>
              <li>
                이용자가 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고
                회원 탈퇴를 할 수 있습니다. 변경된 약관의 시행일 이후에도 서비스를
                계속 이용하는 경우, 변경된 약관에 동의한 것으로 간주합니다.
              </li>
            </ol>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              제4조 (이용계약의 체결)
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                이용계약은 이용자가 본 약관에 동의하고 회원가입을 신청하며, 회사가
                이를 승낙함으로써 성립합니다.
              </li>
              <li>
                회원가입은 소셜 로그인(Google, Apple)을 통해 진행되며, 회사는 다음
                각 호에 해당하는 경우 승낙을 거부하거나 사후에 이용계약을 해지할 수
                있습니다.
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>타인의 정보를 도용한 경우</li>
                  <li>허위 정보를 기재한 경우</li>
                  <li>14세 미만의 아동이 법정대리인의 동의 없이 가입한 경우</li>
                  <li>
                    기타 이용 신청 요건을 충족하지 못하거나 위법·부당한 신청인 경우
                  </li>
                </ul>
              </li>
            </ol>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              제5조 (서비스의 내용)
            </h2>
            <p className="mb-3">회사가 제공하는 서비스는 다음과 같습니다.</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>AI 연습 분석</strong>: 녹음된 연습 음원을 AI가 분석하여
                피드백을 제공합니다.
              </li>
              <li>
                <strong>곡 분석</strong>: 작곡가와 곡에 대한 심층 분석 정보를
                제공합니다.
              </li>
              <li>
                <strong>연습 기록 관리</strong>: 연습 시간, 곡목, 진행 상황 등을
                기록·관리합니다.
              </li>
              <li>
                <strong>전문가 매칭</strong>: 음악 전공생·전문가에게 1:1 피드백을
                요청할 수 있습니다.
              </li>
              <li>
                <strong>입시방</strong>: 같은 학교를 준비하는 학생들이 영상을
                공유하고 소통합니다.
              </li>
              <li>
                <strong>랭킹 시스템</strong>: 연습 시간 기반의 랭킹을 통해 동기를
                부여합니다.
              </li>
            </ol>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              제6조 (이용자의 의무)
            </h2>
            <p className="mb-3">이용자는 다음 행위를 하여서는 안 됩니다.</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>타인의 개인정보를 수집, 저장, 공개하는 행위</li>
              <li>서비스 운영을 방해하거나 비정상적인 방법으로 이용하는 행위</li>
              <li>
                타인의 저작권 등 지식재산권을 침해하는 콘텐츠를 업로드하는 행위
              </li>
              <li>욕설, 비방, 음란물 등 불건전한 콘텐츠를 게시하는 행위</li>
              <li>
                서비스를 상업적 목적으로 무단 이용하거나 제3자에게 제공하는 행위
              </li>
              <li>자동화된 수단으로 서비스에 접근하거나 데이터를 수집하는 행위</li>
            </ol>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              제7조 (회사의 의무)
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                회사는 관련 법령과 본 약관이 금지하는 행위를 하지 않으며,
                지속적이고 안정적인 서비스 제공을 위해 노력합니다.
              </li>
              <li>
                회사는 이용자의 개인정보를 안전하게 관리하며, 개인정보 처리방침에
                따라 처리합니다.
              </li>
              <li>
                회사는 서비스 이용과 관련한 이용자의 불만이나 피해구제 요청을
                적절하게 처리하기 위한 체계를 갖춥니다.
              </li>
            </ol>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              제8조 (서비스의 변경 및 중단)
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                회사는 운영상 또는 기술상의 필요에 따라 서비스의 전부 또는 일부를
                변경하거나 중단할 수 있습니다.
              </li>
              <li>
                서비스의 중단이 예정된 경우, 회사는 최소 7일 전에 공지합니다. 다만,
                불가피한 사유(천재지변, 시스템 장애 등)가 있는 경우 사후에 공지할 수
                있습니다.
              </li>
              <li>
                회사는 무료 서비스의 변경·중단에 대해 별도의 보상을 하지 않습니다.
              </li>
            </ol>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              제9조 (지식재산권)
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                서비스에 포함된 소프트웨어, 디자인, AI 모델, 콘텐츠 등에 대한
                지식재산권은 회사에 귀속됩니다.
              </li>
              <li>
                이용자가 서비스에 업로드한 연습 녹음, 영상 등의 콘텐츠에 대한
                저작권은 해당 이용자에게 귀속됩니다. 다만, 이용자는 회사가 서비스
                운영 및 AI 분석 개선 목적으로 해당 콘텐츠를 이용(비식별화 처리
                포함)할 수 있도록 비독점적 라이선스를 부여합니다.
              </li>
              <li>
                이용자는 서비스를 통해 제공받은 AI 분석 결과를 개인적 학습 목적으로
                이용할 수 있으나, 이를 상업적으로 재배포할 수 없습니다.
              </li>
            </ol>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              제10조 (크레딧 및 결제)
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                서비스 내 일부 기능(전문가 매칭 등)은 크레딧을 사용하여 이용할 수
                있습니다.
              </li>
              <li>
                크레딧은 회사가 정한 결제 수단을 통해 구매할 수 있으며, 구매 즉시
                계정에 충전됩니다.
              </li>
              <li>
                이미 사용된 크레딧은 환불이 불가합니다. 미사용 크레딧에 대한
                환불은 관련 법령(전자상거래법)에 따릅니다.
              </li>
              <li>
                회사는 크레딧의 유효기간, 가격 등을 변경할 수 있으며, 변경 시 사전
                공지합니다.
              </li>
            </ol>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              제11조 (면책사항)
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                AI 분석 결과는 참고 목적으로 제공되며, 전문 음악 교육을 대체하지
                않습니다. 회사는 AI 분석의 정확성이나 완전성을 보장하지 않습니다.
              </li>
              <li>
                전문가 매칭을 통해 제공되는 피드백은 해당 전문가 개인의 의견이며,
                회사는 전문가의 조언 내용에 대해 책임을 지지 않습니다.
              </li>
              <li>
                회사는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에
                대해 책임을 지지 않습니다.
              </li>
              <li>
                이용자 간 또는 이용자와 전문가 간의 분쟁에 대해 회사는 개입하지
                않으며, 이로 인한 손해에 대해 책임을 지지 않습니다.
              </li>
            </ol>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              제12조 (회원 탈퇴 및 자격 제한)
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                회원은 언제든지 서비스 내 &quot;회원탈퇴&quot; 기능을 통해 탈퇴를
                신청할 수 있으며, 회사는 즉시 처리합니다.
              </li>
              <li>
                탈퇴 시 회원의 개인정보 및 서비스 이용 기록은 개인정보
                처리방침에 따라 처리됩니다.
              </li>
              <li>
                회사는 이용자가 본 약관을 위반한 경우, 사전 통지 후 서비스 이용을
                제한하거나 이용계약을 해지할 수 있습니다. 다만, 긴급한 경우 사후에
                통지할 수 있습니다.
              </li>
            </ol>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              제13조 (분쟁해결)
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                본 약관에 관한 분쟁은 대한민국 법률에 따르며, 분쟁 발생 시
                관할법원은 민사소송법에 따른 법원으로 합니다.
              </li>
              <li>
                회사와 이용자 간 분쟁이 발생한 경우, 양 당사자는 분쟁 해결을 위해
                성실히 협의합니다.
              </li>
              <li>
                이용자는 한국인터넷진흥원(KISA) 개인정보침해 신고센터(118) 또는
                개인정보분쟁조정위원회에 분쟁 해결을 신청할 수 있습니다.
              </li>
            </ol>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              제14조 (부칙)
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>본 약관은 2026년 3월 18일부터 시행합니다.</li>
              <li>
                본 약관에서 정하지 아니한 사항은 관련 법령 및 상관례에 따릅니다.
              </li>
            </ol>
          </section>

          {/* 문의 */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              문의처
            </h2>
            <ul className="space-y-1">
              <li>
                이메일:{" "}
                <a
                  href="mailto:sempre.official@gmail.com"
                  className="text-violet-600 underline"
                >
                  sempre.official@gmail.com
                </a>
              </li>
            </ul>
            <div className="mt-6 flex gap-4 text-sm">
              <Link href="/privacy" className="text-violet-600 underline">
                개인정보 처리방침
              </Link>
              <Link href="/support" className="text-violet-600 underline">
                고객지원
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
