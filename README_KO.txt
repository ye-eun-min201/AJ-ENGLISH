AJ ENGLISH · Vercel 판 (v16)

밤 무대 디자인 + 카카오·구글 로그인 + Vercel 배포 구조입니다.
ChatGPT Sites 전용 파일과 'ChatGPT로 로그인'은 모두 뺐습니다.


0. 한눈에 보는 구조

  화면        client/            Vercel이 그대로 내보내는 파일 (HTML·CSS·JS)
  서버        api/index.js       /api/* 와 /auth/* 요청이 들어오는 입구
              server/            로그인 확인, DB·파일 창고 연결
              worker/            학습·게임·관리자 기능의 본체 (기존 코드 그대로)
  기록 저장   Turso              학생 기록을 담는 데이터베이스 (SQLite 호환)
  PDF 보관    Vercel Blob        수업 PDF를 담는 파일 창고
  로그인      카카오 / 구글      이름·이메일은 받지 않고 회원번호만 저장

  비유: client/ 는 가게 진열대, server/ 는 계산대, Turso 는 장부, Blob 은 창고입니다.


1. 올리는 순서 (처음 한 번)

  ① GitHub에 이 폴더를 올립니다.

  ② Vercel에서 프로젝트를 만듭니다.
     - Vercel 대시보드 → Add New → Project → GitHub 저장소 선택 → Deploy
     - Framework Preset 은 Other 그대로 둡니다. 나머지는 vercel.json 이 정합니다.
     - 이 단계에서는 화면만 뜨고 저장은 아직 안 됩니다. (아래 ③~⑥을 해야 합니다)

  ③ 데이터베이스(Turso)를 연결합니다.
     - Vercel 프로젝트 → Storage(또는 Marketplace) → Turso Cloud 추가 → 데이터베이스 만들기
     - 지역은 도쿄(Tokyo)를 고르세요. 서버가 서울에서 돌기 때문에 가까울수록 빠릅니다.
     - 프로젝트에 연결하면 TURSO_DATABASE_URL, TURSO_AUTH_TOKEN 이 자동으로 들어갑니다.
     - 표(테이블)는 사이트에 처음 접속할 때 자동으로 만들어집니다. 따로 할 일이 없습니다.

  ④ 파일 창고(Vercel Blob)를 연결합니다.
     - Vercel 프로젝트 → Storage → Blob → 새 저장소 만들기
     - 접근 방식은 반드시 Private(비공개)로 고릅니다. 만든 뒤에는 바꿀 수 없습니다.
     - 프로젝트에 연결하면 BLOB_READ_WRITE_TOKEN 이 자동으로 들어갑니다.
     - 이 단계를 건너뛰면 PDF 기능만 '준비 중'으로 나오고 나머지는 정상 동작합니다.

  ⑤ 환경변수를 넣습니다. (Vercel 프로젝트 → Settings → Environment Variables)

       ADMIN_PASSWORD         관리자 페이지(/admin) 비밀번호. 길고 어렵게.
       PUBLIC_ORIGIN          사이트 주소. 예: https://aj-english.vercel.app  (끝에 / 없이)
       KAKAO_REST_API_KEY     카카오 REST API 키          (아래 2번)
       KAKAO_CLIENT_SECRET    카카오 클라이언트 시크릿     (아래 2번)
       GOOGLE_CLIENT_ID       구글 클라이언트 ID           (아래 3번)
       GOOGLE_CLIENT_SECRET   구글 클라이언트 보안 비밀    (아래 3번)

     - 카카오만 또는 구글만 넣어도 됩니다. 넣은 쪽 버튼만 로그인 화면에 보입니다.
     - 이 값들은 비밀입니다. 코드나 GitHub에 적지 마세요.

  ⑥ 다시 배포합니다.
     - 환경변수는 새로 배포해야 적용됩니다. Deployments → 맨 위 배포 → Redeploy.

  ⑦ 확인합니다.
     - /login   카카오·구글 버튼이 보이고 로그인이 되는지
     - /        캐릭터 저장 후 새로고침해도 남아 있는지
     - /admin   ADMIN_PASSWORD 로 들어가지는지, PDF가 올라가는지


2. 카카오 로그인 설정  (developers.kakao.com)

  - 내 애플리케이션에서 앱을 하나 만듭니다.
  - [앱] > [플랫폼 키] > [REST API 키] 에서
      · REST API 키를 복사 → KAKAO_REST_API_KEY
      · 클라이언트 시크릿 코드를 복사 → KAKAO_CLIENT_SECRET  (기본으로 켜져 있습니다)
      · 리다이렉트 URI 에 아래 주소를 등록
            https://내사이트주소/auth/kakao/callback
  - 카카오 로그인 메뉴에서 '사용 설정'을 켭니다.
  - 이 사이트는 회원번호만 씁니다. 닉네임·이메일 동의항목은 추가하지 않아도 됩니다.
  - 메뉴 이름은 카카오 쪽에서 바뀔 수 있습니다. 공식 문서: developers.kakao.com/docs/ko/kakaologin/rest-api


3. 구글 로그인 설정  (console.cloud.google.com)

  - 프로젝트를 하나 만들고, OAuth 동의 화면(앱 이름·연락처 이메일)을 먼저 채웁니다.
  - 사용자 인증 정보 → OAuth 클라이언트 ID 만들기 → 유형: 웹 애플리케이션
      · 승인된 리디렉션 URI 에 아래 주소를 등록
            https://내사이트주소/auth/google/callback
      · 만들어진 클라이언트 ID → GOOGLE_CLIENT_ID
      · 클라이언트 보안 비밀 → GOOGLE_CLIENT_SECRET
  - 동의 화면이 '테스트' 상태면 등록해 둔 테스트 사용자만 로그인됩니다.
    학생 모두가 쓰려면 '프로덕션'으로 게시하세요.
  - 메뉴 이름은 구글 쪽에서 바뀔 수 있습니다.


4. 꼭 알아둘 점

  - 주소가 바뀌면(예: 내 도메인 연결) 세 곳을 함께 바꿉니다:
    PUBLIC_ORIGIN, 카카오 리다이렉트 URI, 구글 리디렉션 URI.
  - ChatGPT Sites 에 있던 학생 기록은 넘어오지 않습니다. 로그인 방식이 달라
    같은 학생인지 알 수 없기 때문입니다. 새 사이트에서 새로 시작합니다.
  - 같은 사람이라도 카카오로 들어오면 카카오 계정, 구글로 들어오면 구글 계정으로
    따로 저장됩니다. 학생에게 "늘 같은 버튼으로 로그인"하라고 알려 주세요.
  - PDF는 20MB까지. Vercel은 요청 하나에 4.5MB까지만 받아서, 큰 PDF는 화면에서
    자동으로 3MB씩 잘라 보내고 서버에서 다시 합칩니다.
  - 서버는 서울(icn1)에서 돕니다. 바꾸려면 vercel.json 의 "regions".
  - 로그인 유지 기간은 30일입니다. 꼬리말의 '로그아웃'으로 바로 끊을 수 있습니다.
  - Vercel·Turso·Blob 의 무료 한도와 요금은 각 서비스에서 확인하세요. 수시로 바뀝니다.


5. 내 컴퓨터에서 실행해 보기

  Node.js 22 가 필요합니다.

      npm install
      npm run dev          →  http://localhost:3000

  - 기록은 .local/dev.db, PDF는 .local/blob 폴더에 저장됩니다. (.local 을 지우면 초기화)
  - 카카오·구글 키가 없으면 '연습용 로그인' 화면이 대신 나옵니다. 이름만 넣으면 로그인됩니다.
    연습용 로그인은 scripts/dev.mjs 안에만 있고 배포되지 않습니다.
  - 관리자 비밀번호 기본값은 admin-dev-1234 입니다.
  - 실제 값으로 시험하려면 .env.example 을 .env.local 로 복사해 채우세요.
    이때 카카오·구글에 http://localhost:3000/auth/…/callback 도 등록해야 합니다.

  코드 검사:   npm run check
  서버 묶음:   npm run build     (worker/ · client/data.js · drizzle/ 를 고친 뒤 실행)


6. 디자인(밤 무대 테마) 고치기

  - 색: client/stage.css 맨 위 :root 변수만 바꾸면 전체가 함께 바뀝니다.
        --night 바탕  --booth 카드  --chalk 글자  --lamp 포인트  --ticket 강조  --neon 보조
        (--lamp 를 바꿀 때는 --lamp-glow 의 rgb 값도 같이)
  - 움직임: client/stage.js  (로딩 막 · 따라다니는 조명 · 카드 뒤집기 · 단어 놀이터)
    기기에서 '움직임 줄이기'를 켠 경우 정지 화면으로 보입니다.
  - 3D 놀이공원의 밤 조명: client/rail-scene.js
  - 로그인 화면: client/login.html · login.css · login.js


7. 파일 안내

  api/index.js             Vercel 함수 입구
  server/adapter.mjs       요청 처리 순서(로그인 확인 → 저장소 연결 → 본체 호출), 큰 PDF 합치기
  server/auth.mjs          카카오·구글 로그인, 로그인 유지 쿠키
  server/db.mjs            Turso 연결, 표 자동 만들기
  server/storage.mjs       Vercel Blob 연결
  server/core.mjs          자동 생성. worker/ 를 하나로 묶은 것 (직접 고치지 않음)
  server/migrations.mjs    자동 생성. drizzle/*.sql 을 옮긴 것 (직접 고치지 않음)
  worker/                  학습·게임·관리자 기능 본체
  drizzle/                 표를 만드는 SQL. 0006_auth.sql 이 로그인용으로 추가됨
  client/                  화면
  scripts/build.mjs        server/core.mjs · migrations.mjs 생성
  scripts/dev.mjs          내 컴퓨터 실행용 서버
  vercel.json              배포 설정(지역, 주소 연결 규칙, 보안 헤더)
  .env.example             환경변수 목록

  표 구조를 바꿀 때는 drizzle/ 에 다음 번호의 .sql 파일을 추가하고 npm run build 를 실행하세요.
  이미 적용된 파일은 고치지 마세요. (적용 여부는 DB의 _aj_migrations 표에 기록됩니다)


8. 보안 메모

  - 학생이 누구인지는 서버가 로그인 쿠키로만 판단합니다. 브라우저가 보낸 식별 값은 버립니다.
  - 로그인 쿠키는 스크립트가 읽을 수 없고(HttpOnly), https 에서만 전송됩니다(Secure).
  - 서버에는 쿠키 원본이 아니라 지문(SHA-256)만 저장합니다.
  - 관리자 비밀번호는 코드에 없습니다. ADMIN_PASSWORD 환경변수로만 정합니다.


9. 제3자 라이선스

  PDF.js, Three.js, PDF CMap·기본 폰트, Pretendard, Instrument Serif, Silkscreen 관련
  라이선스가 client/vendor/ 에 들어 있습니다. 재배포할 때 그대로 유지하세요.
  서버는 @libsql/client 와 @vercel/blob 패키지를 씁니다 (package.json 참고).
