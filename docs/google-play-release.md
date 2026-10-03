# Google Play 무료 출시 준비

2026-10-04 기준. 출시 정책: 무료 다운로드 및 무료 기능으로 시작하고, 추후 부분 유료화를 별도 업데이트한다. 기존 main 병합 보류는 유지하며 배포는 출시 후보 검증 후 결정한다.

## 진행 순서

1. 첫 출시 기능 범위와 Play 개발자 계정 확인.
2. 계정 삭제 API 누락과 사용자 플로우 결함 수정 및 검증.
3. TWA/Bubblewrap으로 기존 PWA를 Android 앱으로 패키징. 기존 Play 앱이 있으면 그 패키지 이름과 서명 정보를 사용한다. 패키지 이름과 서명 키는 확인 없이 확정하지 않는다.
4. Play App Signing 인증서 SHA-256을 기반으로 /.well-known/assetlinks.json 구성. Android 실기기에서 로그인, 마이크 권한, 연습 측정, 백그라운드 복귀, 기록 저장 및 탈퇴 확인.
5. 스토어 설명, 실제 화면 스크린샷, 1024×500 그래픽, 개인정보처리방침, 데이터 보안 신고, 콘텐츠 등급 및 앱 접근 안내 준비.
6. 내부 테스트와 필요한 비공개 테스트 진행 후 프로덕션 심사 신청.

## 확인된 상태

- 무료 출시 화면 및 블러 준비 중 표시: fix/launch-batch2 커밋 8e18d3e.
- Android 프로젝트, Bubblewrap 설정 및 Digital Asset Links: 없음.
- 공개 계정 삭제 안내: /delete-account 페이지 추가. 실제 지원 메일 수신 및 수동 처리 담당자 확인 필요.
- 계정 삭제 API: recordings 외 영상/아바타 파일 정리 누락. 성공 응답 전에 삭제 오류 처리를 검증해야 한다.
- CLAUDE.md에 기존 미커밋 변경 있음. 보존.

## 사용자 정보가 필요한 항목

- Play 개발자 계정의 개인/조직 구분, 생성 시기, 기존 앱 등록 여부.
- 첫 출시 기능 범위. 영상 공유를 포함하면 신고·차단·콘텐츠 관리 흐름 확인 필요.
- 공개 개발자명, 지원 메일 담당자, 개인정보 책임자 및 실제 보관 정책.
- 기존 Android 패키지 이름/서명 키 여부. 키 비밀번호는 문서에 기록하지 않는다.
- 실기기 테스트 가능 여부와 비공개 테스트 참여자 확보.

## 공식 근거

- TWA: https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities
- Bubblewrap: https://github.com/GoogleChromeLabs/bubblewrap/blob/main/packages/cli/README.md
- 신규 개인 계정 테스트: https://support.google.com/googleplay/android-developer/answer/14151465
- 계정 삭제 웹 링크: https://support.google.com/googleplay/android-developer/answer/13327111

신규 개인 계정(2023-11-13 이후)은 프로덕션 접근 신청 전 최소 12명이 14일 연속 참여한 비공개 테스트가 필요하다. 심사 승인을 보장하거나 테스트 기간을 생략할 수는 없다.
## 확정 사항 (2026-10-04)

- 개인 개발자 계정 withSempre, 기존 초안 앱 Sempre 사용.
- 패키지 이름: com.withsempre.app (첨부 Play Console 화면 확인).
- 첫 출시: 연습·기록·AI 분석·랭킹. 영상·레슨·입시룸 진입은 보류.
- 기존 업로드와 서명 키 유무 확인 후 Android 패키징 진행.

- Play 앱 서명 SHA-256을 public/.well-known/assetlinks.json에 반영. 배포 후 HTTPS 200 및 JSON 응답 확인 필요. 로컬 설치용 업로드 키 지문과 Play 배포 키 지문은 구분한다.

## Android 생성 상태

- android/twa-manifest.json: com.withsempre.app, versionCode 1, versionName 1.0.0, withsempre.com 연결.
- 업로드 키: android/upload-key.jks (Git 제외). 암호 파일: .local-tools/signing/upload-key-password.txt (Git 제외). 두 파일은 안전한 별도 위치에 함께 백업해야 한다.
- public/.well-known/assetlinks.json: Google Play 인증서와 로컬 테스트용 업로드 인증서 포함.
- 실제 휴대폰 테스트와 공개 연결 파일 배포 확인은 아직 수행 전.

- Android 빌드 성공. android/releases/sempre-1.0.0.aab (Play 제출용), sempre-1.0.0.apk (기기 테스트용) 서명 및 검증 완료. 실기기 동작과 서버 배포 상태는 별도 검증 필요.
