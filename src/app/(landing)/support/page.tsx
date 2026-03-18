import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "고객지원",
};

export default function SupportPage() {
  const faqs: { q: string; a: string }[] = [
    {
      q: "Sempre는 어떤 서비스인가요?",
      a: "Sempre는 AI 기반 클래식 음악 연습 코치 앱입니다. 연습 녹음을 AI가 분석해 피드백을 제공하고, 연습 기록 관리, 곡 분석, 전문가 1:1 피드백 매칭 등의 기능을 제공합니다.",
    },
    {
      q: "AI 분석은 어떻게 작동하나요?",
      a: "연습 녹음을 업로드하면 AI가 음정, 리듬, 표현력 등을 종합적으로 분석합니다. 곡 분석 기능에서는 작곡가 배경, 곡 구조, 연습 방법 등의 심층 정보를 제공합니다. AI 분석은 참고 목적이며 전문 교육을 대체하지 않습니다.",
    },
    {
      q: "내 데이터는 안전한가요?",
      a: "네, 모든 데이터는 암호화되어 전송·저장됩니다. Supabase의 RLS(Row Level Security)를 적용하여 본인만 자신의 데이터에 접근할 수 있습니다. 자세한 내용은 개인정보 처리방침을 참고하세요.",
    },
    {
      q: "회원 탈퇴는 어떻게 하나요?",
      a: "프로필 페이지 하단의 '회원탈퇴' 버튼을 통해 즉시 탈퇴할 수 있습니다. 탈퇴 시 모든 개인정보와 연습 데이터가 영구 삭제되며 복구할 수 없습니다.",
    },
    {
      q: "전문가 등록은 어떻게 하나요?",
      a: "프로필 페이지에서 '선생님 인증 신청'을 통해 관련 서류(재학증명서, 수상내역 등)를 제출하면 AI 1차 심사 후 관리자 최종 검토를 거쳐 승인됩니다.",
    },
    {
      q: "크레딧은 무엇인가요?",
      a: "크레딧은 전문가 1:1 피드백 등 유료 기능 이용 시 사용되는 서비스 내 재화입니다. 추후 결제 기능이 추가될 예정입니다.",
    },
    {
      q: "연습 기록이 동기화되지 않아요.",
      a: "인터넷 연결 상태를 확인해주세요. 오프라인에서 기록된 연습 데이터는 인터넷 연결 시 자동으로 동기화됩니다. 문제가 지속되면 아래 이메일로 문의해주세요.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">고객지원</h1>
        <p className="text-[15px] leading-relaxed text-gray-700 mb-10">
          Sempre 이용 중 궁금한 점이 있으시면 아래 FAQ를 확인해주세요. 해결되지
          않는 문제는 이메일로 문의해주시면 빠르게 답변드리겠습니다.
        </p>

        <div className="space-y-10 text-gray-700 text-[15px] leading-relaxed">
          {/* FAQ */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              자주 묻는 질문
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group border border-gray-200 rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors font-medium text-gray-900">
                    <span>{faq.q}</span>
                    <span className="ml-2 text-gray-400 group-open:rotate-180 transition-transform">
                      ▾
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* 문의하기 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              문의하기
            </h2>
            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <div>
                <span className="font-medium text-gray-900">이메일</span>
                <br />
                <a
                  href="mailto:sempre.official@gmail.com"
                  className="text-violet-600 underline"
                >
                  sempre.official@gmail.com
                </a>
              </div>
              <p className="text-sm text-gray-500">
                영업일 기준 1~2일 내 답변드립니다.
              </p>
            </div>
          </section>

          {/* 신고 및 분쟁 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              신고 및 분쟁 해결
            </h2>
            <ul className="space-y-2">
              <li>
                개인정보침해 신고센터 (KISA):{" "}
                <strong>118</strong> /{" "}
                <span className="text-violet-600">privacy.kisa.or.kr</span>
              </li>
              <li>
                개인정보분쟁조정위원회:{" "}
                <strong>1833-6972</strong> /{" "}
                <span className="text-violet-600">kopico.go.kr</span>
              </li>
              <li>
                대검찰청 사이버수사과:{" "}
                <strong>1301</strong> /{" "}
                <span className="text-violet-600">spo.go.kr</span>
              </li>
              <li>
                경찰청 사이버안전국:{" "}
                <strong>182</strong> /{" "}
                <span className="text-violet-600">cyberbureau.police.go.kr</span>
              </li>
            </ul>
          </section>

          {/* 관련 링크 */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              관련 링크
            </h2>
            <div className="flex gap-4 text-sm">
              <Link href="/terms" className="text-violet-600 underline">
                서비스 이용약관
              </Link>
              <Link href="/privacy" className="text-violet-600 underline">
                개인정보 처리방침
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
