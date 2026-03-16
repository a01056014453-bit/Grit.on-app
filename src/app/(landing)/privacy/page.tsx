import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          개인정보 처리방침
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          시행일: 2026년 3월 16일 | 최종 수정일: 2026년 3월 16일
        </p>

        <div className="space-y-8 text-gray-700 text-[15px] leading-relaxed">
          {/* 1. 개요 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              1. 개요
            </h2>
            <p>
              Sempre(이하 &quot;회사&quot;)는 AI 기반 클래식 음악 연습 코치
              서비스(이하 &quot;서비스&quot;)를 제공하며, 이용자의 개인정보를
              소중히 보호합니다. 본 개인정보 처리방침은 서비스 이용 과정에서
              수집·이용·보관·파기되는 개인정보에 관한 사항을 안내합니다.
            </p>
            <p className="mt-2">
              서비스 웹사이트:{" "}
              <a
                href="https://withsempre.com"
                className="text-violet-600 underline"
              >
                https://withsempre.com
              </a>
            </p>
          </section>

          {/* 2. 수집하는 개인정보 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              2. 수집하는 개인정보
            </h2>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">
              가. 회원가입 및 인증 시
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>소셜 로그인(Google, Apple):</strong> 이메일 주소, 이름,
                프로필 정보
              </li>
              <li>
                <strong>서비스 프로필 설정:</strong> 닉네임, 연령대(학생/성인
                구분), 주 악기, 프로필 이모지
              </li>
            </ul>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">
              나. 서비스 이용 시 자동 수집
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>연습 세션 기록: 시작/종료 시간, 연습 시간, 연습 유형</li>
              <li>연주 녹음 파일 (사용자가 녹음 기능 사용 시)</li>
              <li>
                AI 분석 결과: 템포, 다이나믹, 리듬 정확도, 집중 영역 등 연주
                분석 데이터
              </li>
              <li>일일/주간 연습 목표 및 달성 현황</li>
              <li>연습곡 정보: 곡명, 작곡가, 연습 구간</li>
            </ul>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">
              다. 선생님/피드백 기능 이용 시
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                선생님 프로필: 경력 정보(학력, 수상 이력, 교육 경험), 평점, 응답
                시간
              </li>
              <li>
                피드백 요청: 연습 영상, 문제 설명, 악보 구간 정보, 크레딧 결제
                정보
              </li>
              <li>학생-선생님 연결 관계 정보</li>
            </ul>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">
              라. 기기 및 브라우저 정보
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                쿠키: 인증 세션 관리를 위한 JWT 토큰 (Supabase 인증 쿠키)
              </li>
              <li>
                로컬 저장소(localStorage): 로그인 상태, 프로필 캐시, 연습 루틴
                설정, 일일 목표
              </li>
              <li>
                IndexedDB: 오프라인 연습 기록 임시 저장 (온라인 복귀 시 서버
                동기화)
              </li>
            </ul>
          </section>

          {/* 3. 개인정보의 이용 목적 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              3. 개인정보의 이용 목적
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>서비스 제공:</strong> 연습 기록 관리, AI 연주 분석 및
                피드백 제공, 연습 계획 수립 지원
              </li>
              <li>
                <strong>회원 관리:</strong> 회원 식별, 인증, 프로필 관리
              </li>
              <li>
                <strong>AI 분석:</strong> 연주 녹음에 대한 음악적 분석(템포,
                리듬, 다이나믹 등) 및 개선 제안 생성
              </li>
              <li>
                <strong>랭킹 및 동기부여:</strong> 연습 통계 기반 그릿 점수 산출
                및 랭킹 제공
              </li>
              <li>
                <strong>선생님 매칭:</strong> 피드백 요청 처리 및 선생님-학생
                연결
              </li>
              <li>
                <strong>서비스 개선:</strong> 서비스 품질 향상 및 신규 기능 개발
              </li>
            </ul>
          </section>

          {/* 4. 개인정보의 제3자 제공 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              4. 개인정보의 제3자 제공 및 위탁
            </h2>
            <p className="mb-3">
              회사는 다음과 같은 외부 서비스를 이용하여 서비스를 제공하며, 이에
              필요한 최소한의 정보를 전달합니다.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-medium">
                      서비스 제공자
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-medium">
                      목적
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-medium">
                      전달 정보
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">
                      Supabase (미국)
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      데이터베이스 및 인증, 파일 저장
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      회원 정보, 연습 기록, 녹음 파일 전체
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">
                      OpenAI (미국)
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      AI 연주 분석 및 연습 제안 생성
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      악곡 정보, 악보 구조 데이터
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">
                      Google (미국)
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      소셜 로그인 인증
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      이메일, 이름 (Google 계정 정보)
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">
                      Apple (미국)
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      소셜 로그인 인증
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      이메일, 인증 토큰 (Apple ID 정보)
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">
                      Perplexity (미국)
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      악곡 참고 정보 조회
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      곡명, 작곡가 정보 (개인정보 미포함)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-sm text-gray-600">
              * 상기 서비스 제공자의 서버가 해외(미국)에 소재하므로, 이용자의
              정보가 국외로 전송될 수 있습니다.
            </p>
          </section>

          {/* 5. 쿠키 및 로컬 저장소 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              5. 쿠키 및 로컬 저장소
            </h2>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">가. 쿠키</h3>
            <p>
              서비스는 인증 세션 관리를 위해 Supabase에서 발급하는 JWT 토큰
              쿠키를 사용합니다. 해당 쿠키는 로그인 상태 유지에만 사용되며,
              광고·추적 목적의 쿠키는 사용하지 않습니다. 로그아웃 시 해당 쿠키는
              자동으로 삭제됩니다.
            </p>

            <h3 className="font-medium text-gray-800 mt-4 mb-2">
              나. 브라우저 로컬 저장소
            </h3>
            <p>
              서비스는 원활한 이용 경험을 위해 브라우저의 localStorage와
              IndexedDB에 다음 정보를 저장합니다:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>로그인 상태 및 인증 방식</li>
              <li>프로필 캐시 (닉네임, 악기, 프로필 이모지)</li>
              <li>연습 루틴 및 일일 목표 설정</li>
              <li>
                오프라인 연습 기록 (인터넷 미연결 시 기기에 임시 저장 후 연결 시
                서버 동기화)
              </li>
            </ul>
            <p className="mt-2">
              브라우저 캐시를 삭제하거나, 앱 버전 업데이트 시 오래된 로컬 데이터는
              자동으로 정리됩니다.
            </p>
          </section>

          {/* 6. AI 처리 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              6. AI 기반 데이터 처리
            </h2>
            <p>서비스는 다음과 같은 AI 기술을 활용합니다:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>브라우저 내 음향 분석 (TensorFlow.js):</strong> 이용자의
                기기에서 직접 실행되며, 연주 구간과 무음 구간을 구분하여 실질적인
                연습 시간을 측정합니다. 이 데이터는 외부 서버로 전송되지 않습니다.
              </li>
              <li>
                <strong>서버 측 AI 분석 (OpenAI):</strong> 악곡 구조 분석, 난이도
                평가, 연습 제안 생성 등을 위해 OpenAI API를 사용합니다. 악곡
                메타데이터(곡명, 작곡가, 구간 정보)가 전달되며, OpenAI의
                개인정보처리방침에 따라 처리됩니다.
              </li>
            </ul>
          </section>

          {/* 7. 보유 및 파기 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              7. 개인정보의 보유 및 파기
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                회원 탈퇴 시 개인정보는 지체 없이 파기합니다. 다만, 관계 법령에
                의한 보존 의무가 있는 경우 해당 기간 동안 보관합니다.
              </li>
              <li>
                녹음 파일: 이용자가 삭제 요청 시 Supabase Storage에서 완전
                삭제합니다.
              </li>
              <li>
                브라우저 로컬 데이터: 이용자가 브라우저 캐시를 삭제하거나 앱 버전
                업데이트 시 자동 정리됩니다.
              </li>
            </ul>

            <div className="mt-3 bg-gray-50 rounded-lg p-4 text-sm">
              <p className="font-medium text-gray-800 mb-1">
                관계 법령에 따른 보존 기간:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>
                  계약 또는 청약 철회에 관한 기록: 5년 (전자상거래 등에서의
                  소비자보호에 관한 법률)
                </li>
                <li>
                  대금 결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래
                  등에서의 소비자보호에 관한 법률)
                </li>
                <li>
                  소비자의 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래
                  등에서의 소비자보호에 관한 법률)
                </li>
                <li>
                  접속에 관한 기록: 3개월 (통신비밀보호법)
                </li>
              </ul>
            </div>
          </section>

          {/* 8. 이용자의 권리 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              8. 이용자의 권리
            </h2>
            <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>개인정보 열람 요청</li>
              <li>개인정보 정정·삭제 요청</li>
              <li>개인정보 처리 정지 요청</li>
              <li>회원 탈퇴 및 계정 삭제 요청</li>
              <li>녹음 파일 및 연습 기록 삭제 요청</li>
            </ul>
            <p className="mt-2">
              상기 권리 행사는 아래 연락처를 통해 요청할 수 있으며, 회사는 지체
              없이 조치하겠습니다.
            </p>
          </section>

          {/* 9. 안전성 확보 조치 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              9. 개인정보의 안전성 확보 조치
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>암호화:</strong> 모든 통신은 HTTPS(TLS)로 암호화되며,
                비밀번호 및 인증 토큰은 업계 표준 방식으로 암호화하여 저장합니다.
              </li>
              <li>
                <strong>인증 보안:</strong> OAuth 2.0 / PKCE 기반의 안전한 인증
                흐름을 사용하며, 직접 비밀번호를 저장하지 않습니다.
              </li>
              <li>
                <strong>접근 제한:</strong> 데이터베이스에 행 수준
                보안(Row-Level Security)을 적용하여 이용자 본인의 데이터만 접근
                가능하도록 제한합니다.
              </li>
              <li>
                <strong>API 키 보호:</strong> 외부 서비스(OpenAI, Perplexity
                등)의 API 키는 서버 측에서만 사용되며, 클라이언트에 노출되지
                않습니다.
              </li>
            </ul>
          </section>

          {/* 10. 만 14세 미만 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              10. 만 14세 미만 아동의 개인정보
            </h2>
            <p>
              서비스는 원칙적으로 만 14세 이상의 이용자를 대상으로 합니다. 만
              14세 미만 아동의 개인정보를 수집하는 경우 법정대리인의 동의를
              받습니다. 법정대리인은 아동의 개인정보 열람, 정정, 삭제, 처리 정지를
              요청할 수 있습니다.
            </p>
          </section>

          {/* 11. 연락처 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              11. 개인정보 보호 책임자 및 연락처
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-1 text-sm">
                <li>
                  <strong>서비스명:</strong> Sempre (셈프레)
                </li>
                <li>
                  <strong>운영:</strong> Sempre Team
                </li>
                <li>
                  <strong>이메일:</strong>{" "}
                  <a
                    href="mailto:support@withsempre.com"
                    className="text-violet-600 underline"
                  >
                    support@withsempre.com
                  </a>
                </li>
              </ul>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              개인정보 침해에 대한 신고나 상담이 필요한 경우 아래 기관에 문의하실
              수 있습니다:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2 text-sm text-gray-600">
              <li>
                개인정보침해신고센터 (privacy.kisa.or.kr / 국번없이 118)
              </li>
              <li>
                개인정보분쟁조정위원회 (www.kopico.go.kr / 1833-6972)
              </li>
              <li>대검찰청 사이버수사과 (www.spo.go.kr / 국번없이 1301)</li>
              <li>
                경찰청 사이버수사국 (ecrm.police.go.kr / 국번없이 182)
              </li>
            </ul>
          </section>

          {/* 12. 변경 사항 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              12. 개인정보 처리방침의 변경
            </h2>
            <p>
              본 개인정보 처리방침은 법령 또는 서비스 변경 사항을 반영하기 위해
              수정될 수 있습니다. 변경 시 서비스 내 공지를 통해 안내하며, 변경된
              방침은 공지한 날로부터 7일 후 효력이 발생합니다.
            </p>
          </section>

          <hr className="border-gray-200" />

          <p className="text-sm text-gray-500 text-center">
            본 개인정보 처리방침은 2026년 3월 16일부터 시행됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
