import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
};

export default function PrivacyPage() {
  const thClass =
    "border border-gray-200 px-3 py-2 text-left font-semibold bg-gray-50";
  const tdClass = "border border-gray-200 px-3 py-2";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Sempre(셈프레) 개인정보 처리방침
        </h1>
        <p className="text-sm font-semibold text-gray-700 mb-4">
          시행일 : 2026. 03. 05.
        </p>
        <p className="text-[15px] leading-relaxed text-gray-700 mb-10">
          <strong>Sempre</strong>(이하 &quot;회사&quot;)는 정보주체의 자유와
          권리를 보호하기 위하여 &lsquo;개인정보 보호법&rsquo; 등 관계 법령을
          준수하며, 개인정보를 안전하게 관리하기 위해 다음과 같이 처리방침을
          수립·공개합니다.
        </p>

        <div className="space-y-10 text-gray-700 text-[15px] leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. 개인정보의 처리 목적·수집 항목·보유 및 이용 기간
            </h2>
            <p className="mb-3">
              회사는 AI 기반 음악 연습 분석 및 전문가 매칭 플랫폼을 제공하기 위해
              필요한 최소한의 정보를 수집합니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-200">
                <thead>
                  <tr>
                    <th className={thClass}>구분</th>
                    <th className={thClass}>수집 목적</th>
                    <th className={thClass}>수집 항목</th>
                    <th className={thClass}>보유·이용 기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>
                      회원가입 (학습자)
                    </td>
                    <td className={tdClass}>이용자 식별 및 서비스 제공</td>
                    <td className={tdClass}>
                      이메일, 이름, 프로필 사진, 소셜 로그인 식별값
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      탈퇴 시 지체 없이 파기
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>
                      회원가입 (전문가)
                    </td>
                    <td className={tdClass}>전문가 자격 검증 및 매칭</td>
                    <td className={tdClass}>
                      이름, 이메일, 전화번호, 전공/경력 사항, 소속
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      탈퇴 시 또는 계약 종료 시
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>
                      원포인트 클리닉
                    </td>
                    <td className={tdClass}>AI 연주 분석 및 피드백 생성</td>
                    <td className={tdClass}>
                      <strong>연주 녹음 파일(오디오)</strong>, 악보 데이터, 연습
                      로그
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      탈퇴 후 5년 (분쟁 대비)
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>
                      레슨 매칭/피드백
                    </td>
                    <td className={tdClass}>전문가 연결 및 상담 관리</td>
                    <td className={tdClass}>
                      상담 내역, 피드백 리포트, 아이템 요약
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      5년 (상법 등 관련법령)
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>결제 및 정산</td>
                    <td className={tdClass}>유료 서비스 결제 및 환불</td>
                    <td className={tdClass}>
                      결제 수단 식별정보(빌링키), 구매 내역
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      5년 (전자상거래법)
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>
                      로그/품질 분석
                    </td>
                    <td className={tdClass}>서비스 개선 및 오류 진단</td>
                    <td className={tdClass}>
                      IP주소, 쿠키, 앱 방문 기록, 기기 정보
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      3개월 (통신비밀보호법)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. 만 14세 미만 아동의 개인정보 처리
            </h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                회사는 <strong>만 14세 미만 아동</strong>의 회원가입 및 개인정보
                수집 시 반드시{" "}
                <strong>법정대리인(부모 등)의 동의</strong>를 얻습니다.
              </li>
              <li>
                만 14세 미만 아동이 서비스에 가입하고자 할 경우, 회사는
                법정대리인의 동의를 확인하기 위해{" "}
                <strong>휴대폰 본인인증 또는 보호자 동의 절차</strong>를 요구할 수
                있습니다.
              </li>
              <li>
                법정대리인은 아동의 개인정보에 대한 열람, 정정, 삭제, 처리정지를
                요청할 수 있으며, 회사는 이에 지체 없이 조치합니다.
              </li>
              <li>
                회사는 만 14세 미만 아동의 정보를 수집할 때, 서비스 제공에 필요한
                최소한의 정보 외에 마케팅 활용 등 부가적인 목적으로 정보를
                강요하지 않습니다.
              </li>
            </ol>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. 개인정보의 제3자 제공
            </h2>
            <p className="mb-3">
              회사는 정보주체의 동의 없이 개인정보를 외부에 제공하지 않습니다.
              다만, 다음의 경우 서비스 이용을 위해 필요한 범위 내에서 정보를
              제공합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>제공받는 자</strong>: 전문가 회원 (멘토/강사)
              </li>
              <li>
                <strong>제공 목적</strong>: 원포인트 클리닉 피드백 제공 및 상담
              </li>
              <li>
                <strong>제공 항목</strong>: 연주 음원, 분석 리포트 요약, 학습자
                닉네임
              </li>
              <li>
                <strong>보유 기간</strong>: 피드백 및 정산 완료 후 5년
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. 개인정보 처리업무의 위탁
            </h2>
            <p className="mb-3">
              회사는 효율적인 서비스 운영을 위해 다음과 같이 개인정보 처리 업무를
              위탁하고 있습니다.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Supabase, Inc.</strong> — 데이터베이스 운영, 사용자
                인증(Auth), 파일 저장(Storage) |{" "}
                <strong>회원 탈퇴 시 또는 위탁 계약 종료 시까지</strong>
              </li>
              <li>
                <strong>토스페이먼츠 / 포트원 (선택시)</strong> — 유료 결제 승인
                및 정산 처리 | 결제 완료 후 5년 (전자상거래법)
              </li>
              <li>
                <strong>알림톡/이메일 발송 업체</strong> (예: 비즈톡, 스티비 등) —
                서비스 이용 안내 및 광고성 정보 전송 | 목적 달성 시 또는 탈퇴 시
                파기
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. 개인정보의 국외 이전
            </h2>
            <hr className="border-gray-200 mb-4" />
            <p className="mb-4">
              회사는 AI 분석 기능을 위해 다음과 같이 국외 법인에 데이터를 이전할
              수 있습니다.
              <br />
              국외 이전 거부 시 AI 채점·분석 등 일부 기능이 제한될 수 있습니다.
              거부를 원하면 고객센터로 연락해 주세요.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-200">
                <thead>
                  <tr>
                    <th className={thClass}>이전 국가</th>
                    <th className={thClass}>이전받는 자</th>
                    <th className={thClass}>이전 항목</th>
                    <th className={thClass}>이전 시점·방법</th>
                    <th className={thClass}>이용 목적</th>
                    <th className={thClass}>보유·이용 기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>미국</td>
                    <td className={`${tdClass} font-semibold`}>
                      Supabase, Inc.
                    </td>
                    <td className={tdClass}>
                      계정 정보, 연주 데이터(음원/MIDI), DB 기록 일체
                    </td>
                    <td className={tdClass}>
                      서비스 이용 시 클라우드 서버 실시간 전송
                    </td>
                    <td className={tdClass}>
                      서비스 데이터 저장 및 사용자 인증 인프라 운영
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      회원 탈퇴 시 또는 서비스 종료 시까지
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>미국</td>
                    <td className={`${tdClass} font-semibold`}>
                      Google (Gemini)
                    </td>
                    <td className={tdClass}>
                      분석용 텍스트, 사용자 질의 내용, 시스템 로그 일부
                    </td>
                    <td className={tdClass}>API 호출 시 암호화 전송</td>
                    <td className={tdClass}>
                      <strong>원포인트 클리닉</strong> 생성 및 음악적 질의응답
                      처리
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      목적 달성 시 또는 2년 이내
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>미국</td>
                    <td className={`${tdClass} font-semibold`}>
                      Perplexity, Inc.
                    </td>
                    <td className={tdClass}>
                      검색 및 요약용 키워드, 관련 텍스트 데이터
                    </td>
                    <td className={tdClass}>API 호출 시 암호화 전송</td>
                    <td className={tdClass}>
                      음악 정보 검색 및 관련 지식 요약 제공
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      목적 달성 시 또는 2년 이내
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>미국</td>
                    <td className={`${tdClass} font-semibold`}>
                      OpenAI / Anthropic
                    </td>
                    <td className={tdClass}>
                      피드백 생성용 프롬프트 (개인식별정보 제외)
                    </td>
                    <td className={tdClass}>API 호출 시 암호화 전송</td>
                    <td className={tdClass}>
                      AI 분석 리포트 문장 생성 및 고도화
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      목적 달성 시 또는 2년 이내
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>미국 / 유럽</td>
                    <td className={`${tdClass} font-semibold`}>
                      PostHog, Inc.
                    </td>
                    <td className={tdClass}>
                      앱 내 행동 로그, 접속 환경, 이벤트 기록
                    </td>
                    <td className={tdClass}>SDK 통신 시 실시간 전송</td>
                    <td className={tdClass}>
                      서비스 이용 패턴 분석 및 기능 개선
                    </td>
                    <td className={`${tdClass} font-semibold`}>3개월 후 파기</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. 개인정보의 파기 절차 및 방법
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>절차</strong>: 목적 달성 후 별도의 DB로 옮겨져 법정 기간
                동안 보관 후 파기합니다.
              </li>
              <li>
                <strong>방법</strong>: 전자적 파일은 복구 불가능한 기술적 방법으로
                삭제하며, 출력물은 분쇄합니다.
              </li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. 정보주체와 법정대리인의 권리·행사 방법
            </h2>
            <p>
              이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리정지를 요청할 수
              있습니다. 권리 행사는 마이페이지의 설정 또는 고객센터 이메일을 통해
              가능합니다.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              8. 개인정보의 안전성 확보조치
            </h2>
            <p className="mb-3">
              회사는 개인정보를 안전하게 보호하기 위해 다음의 조치를 취합니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-200">
                <thead>
                  <tr>
                    <th className={thClass}>구분</th>
                    <th className={thClass}>주요 보안 조치</th>
                    <th className={thClass} style={{ minWidth: "300px" }}>
                      세부 내용
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${tdClass} font-semibold align-top`} rowSpan={3}>
                      기술적 조치
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      데이터 암호화
                    </td>
                    <td className={tdClass}>
                      - 비밀번호: 일방향 암호화(Hashing) 처리로 복호화 불가능
                      <br />- 통신: 전 구간 <strong>TLS(SSL)</strong> 암호화 적용
                      <br />- 저장: 중요 식별 정보 및 음원 데이터 암호화 보관
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>
                      접근 통제 (RLS)
                    </td>
                    <td className={tdClass}>
                      - <strong>Supabase Row Level Security(RLS)</strong> 적용:
                      DB 수준에서 본인 외 데이터 접근 원천 차단
                      <br />- API 키 관리 및 주기적 갱신
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>네트워크 보안</td>
                    <td className={tdClass}>
                      - 외부 공격 차단을 위한 방화벽(WAF) 및 침입탐지 시스템 운영
                      <br />- 정기적인 시스템 취약점 점검 및 보안 패치
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold align-top`} rowSpan={3}>
                      관리적 조치
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      최소 권한 원칙
                    </td>
                    <td className={tdClass}>
                      - IAM(Identity and Access Management)을 통한 담당자별 권한
                      최소화
                      <br />- 관리자 계정 접속 시{" "}
                      <strong>2단계 인증(MFA)</strong> 의무화
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>운영 및 교육</td>
                    <td className={tdClass}>
                      - 개인정보 보호책임자 지정 및 내부 관리계획 수립
                      <br />- 전 임직원 대상 정기적인 개인정보 보호 및 보안 교육
                      실시
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>
                      접속 기록 관리
                    </td>
                    <td className={tdClass}>
                      - 개인정보 취급자의 접속 로그를 최소 1년 이상 보관 및
                      위·변조 방지
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>물리적 조치</td>
                    <td className={`${tdClass} font-semibold`}>클라우드 보안</td>
                    <td className={tdClass}>
                      - <strong>AWS 및 Supabase</strong>의 검증된 데이터
                      센터(IDC) 인프라 활용
                      <br />- 출입 통제, 24시간 감시 장비 등 물리적 접근 차단
                      시스템 공유
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>
                      데이터 거버넌스
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      가명·익명 처리
                    </td>
                    <td className={tdClass}>
                      - AI 분석 및 학습 데이터 활용 시 개인식별정보 즉시 가명처리
                      <br />- 데이터 전송 시 필요 최소 정보만 전달하는 미니멀리즘
                      원칙 준수
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              9. 쿠키·행태정보 수집 및 거부
            </h2>
            <p className="mb-2">
              1. 회사는 PostHog 등으로 서비스 이용 행태를 분석하고, 온보딩
              개선·에러 진단·맞춤 기능 추천에 활용합니다.
            </p>
            <p>
              2. 이용자는 브라우저 설정(크롬: 설정 → 개인정보 및 보안 → 쿠키)
              또는{" "}
              <a
                href="https://optout.aboutads.info/"
                className="text-violet-600 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                여기
              </a>
              에서 쿠키 저장을 거부할 수 있습니다. 단, 일부 기능이 제한될 수
              있습니다.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              10. 추가적 이용·제공 판단 기준
            </h2>
            <p>
              목적 관련성·예측 가능성·정보주체 이익 침해 여부·가명처리 등
              &lsquo;개인정보 보호법&rsquo; 제15조 3항 요건을 충족하는 경우에 한해{" "}
              <strong>동의 없이 추가 이용·제공</strong>할 수 있습니다.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              11. 가명정보의 처리
            </h2>
            <p className="mb-3">
              회사는{" "}
              <strong>AI 모델(음악 분석 알고리즘) 학습 및 고도화</strong>를 위해
              수집된 음원 및 데이터를 가명처리하여 활용할 수 있습니다. 가명정보는
              재식별되지 않도록 별도 보관 및 엄격한 보안을 유지합니다.
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse border border-gray-200">
                <thead>
                  <tr>
                    <th className={thClass}>처리 목적</th>
                    <th className={thClass}>대상 항목</th>
                    <th className={thClass}>가명처리 방법</th>
                    <th className={thClass}>보유 및 이용 기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>
                      AI 모델 학습 및 고도화
                    </td>
                    <td className={tdClass}>
                      연주 음원(Audio), 변환된 MIDI 데이터, 연습 로그
                    </td>
                    <td className={tdClass}>
                      식별자(이름, ID) 제거, 데이터 마스킹, 무작위 고유번호 부여
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      회원 탈퇴 시 또는 목적 달성 시까지
                    </td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-semibold`}>
                      통계 작성 및 서비스 분석
                    </td>
                    <td className={tdClass}>
                      서비스 이용 기록, 연습 시간, 성취도 점수
                    </td>
                    <td className={tdClass}>
                      개인 식별 정보 삭제 및 통계적 집계 처리
                    </td>
                    <td className={tdClass}>서비스 종료 시까지</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mb-2">
              회사는 가명정보가 재식별되지 않도록 다음과 같은 기술적·관리적 조치를
              취합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>
                <strong>분리 보관</strong>: 가명정보와 이를 재식별할 수 있는 추가
                정보(추가 식별자 등)를 별도의 데이터베이스에 분리하여 보관합니다.
              </li>
              <li>
                <strong>접근 권한 분리</strong>: 가명정보에 접근할 수 있는 인원을
                최소한으로 제한하고, 일반 개인정보 취급 권한과 엄격히 분리합니다.
              </li>
              <li>
                <strong>재식별 금지</strong>: 가명정보 처리 시 특정 개인을 알아보기
                위한 어떠한 시도도 하지 않으며, 이를 위한 모니터링을 상시
                수행합니다.
              </li>
              <li>
                <strong>기록 보관</strong>: 가명정보의 생성, 이용, 제공에 관한 로그
                기록을 안전하게 보관하여 관리 프로세스를 투명하게 운영합니다.
              </li>
            </ul>

            <h3 className="text-base font-semibold text-gray-900 mb-2">
              [학습 데이터 제외(Opt-out) 권리]
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Sempre</strong>는 회원의 창작적 가치를 존중하며, 모델
                고도화를 위한 학습 데이터 활용 시 개별 연주자나 팀을 식별할 수
                없도록 철저히 전처리합니다.
              </li>
              <li>
                회원은 언제든지 고객센터 또는 서비스 내 설정 메뉴를 통해 본인의
                연주 데이터가 AI 학습 데이터셋에 포함되는 것을
                거부(옵트아웃)할 수 있습니다.
              </li>
              <li>
                거부 요청 시, 회사는 즉시 해당 데이터를 향후 학습 데이터셋에서
                제외하며, 가명처리가 이미 완료되어 개별 추출이 불가능한 경우에
                한해 기술적으로 가능한 최선의 조치를 취합니다.
              </li>
            </ol>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              12. 개인정보 보호책임자
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>개인정보 보호책임자</strong>: 임지수
              </li>
              <li>
                <strong>부서</strong>: Sempre 총괄팀
              </li>
              <li>
                <strong>연락처</strong>:{" "}
                <a
                  href="mailto:sempre.official@gmail.com"
                  className="text-violet-600 underline"
                >
                  sempre.official@gmail.com
                </a>
              </li>
            </ul>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              13. 권익침해 구제방법
            </h2>
            <p className="mb-2">
              이용자는 개인정보 침해에 대한 상담 및 신고를 위해 아래 기관에 문의할
              수 있습니다.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>개인정보분쟁조정위원회 (1833-6972)</li>
              <li>개인정보침해신고센터 (국번없이 118)</li>
            </ul>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              14. 링크
            </h2>
            <p>
              서비스 내 포함된 타 사이트의 링크를 클릭하여 이동할 경우, 해당
              사이트의 개인정보 처리방침은 회사와 무관하므로 별도로 확인하시기
              바랍니다.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              15. 부칙
            </h2>
            <p>
              본 방침은 2026년 3월 5일부터 시행됩니다. 기존 셈프레 서비스 관련
              지침은 본 방침으로 대체됩니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
