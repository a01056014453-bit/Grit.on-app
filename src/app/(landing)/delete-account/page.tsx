import Link from "next/link";

export const metadata = { title: "계정 및 데이터 삭제 | Sempre" };

export default function DeleteAccountPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-foreground">
      <h1 className="text-2xl font-bold">Sempre 계정 및 데이터 삭제</h1>
      <p className="mt-4">셈프레(Sempre) 계정을 삭제하려면 로그인 후 프로필 페이지 하단의 회원탈퇴 버튼을 선택하세요.</p>
      <Link href="/profile" className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-white">프로필에서 회원탈퇴</Link>
      <h2 className="mt-8 text-lg font-semibold">로그인할 수 없는 경우</h2>
      <p className="mt-3">계정 삭제 요청을 support@withsempre.com으로 보내주세요. 계정을 식별할 수 있도록 가입에 사용한 이메일과 로그인 방식(Google 또는 Apple)을 적어주세요. 비밀번호나 인증 코드는 보내지 마세요. 요청자의 계정 소유 여부를 확인한 뒤 삭제 요청을 처리합니다.</p>
      <a href="mailto:support@withsempre.com?subject=Sempre%20account%20deletion" className="mt-4 inline-block text-primary underline">이메일로 계정 삭제 요청</a>
      <h2 className="mt-8 text-lg font-semibold">삭제 대상 및 보관 정보</h2>
      <p className="mt-3">계정 정보, 연습 기록 및 계정과 연결된 업로드 데이터의 삭제를 요청할 수 있습니다. 법령상 보관이 필요한 정보와 보관 기간은 개인정보처리방침을 확인해주세요.</p>
      <Link href="/privacy" className="mt-4 inline-block text-primary underline">개인정보처리방침</Link>
    </main>
  );
}