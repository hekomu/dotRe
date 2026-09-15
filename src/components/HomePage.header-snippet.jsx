{/*
  HomePage.jsx 교체용 스니펫 (0단계 레이아웃 요청 반영)
  ─────────────────────────────────────────────────────────
  기존 HomePage.jsx의 "1. 상단 바"(NutsBadge + HomeHeader)와
  "2. 프로필 카드"(프로필 설정 버튼) 두 블록을 이 하나의 블록으로
  교체하면 됨. MyRoom·상점/일기작성 버튼 블록은 그대로 두면 돼
  (일기 작성 버튼에 WriteButton 에셋을 쓰고 있다면 .write-btn 클래스만
  적용해서 씀 — 이번에 60%로 줄여둠. 상점 버튼에도 아래처럼
  `placeholder-box` 클래스를 추가하면 이 프로필 박스와 같은 회색
  임시 스타일이 됨).

  navigate, handleStatusLoaded 는 HomePage 컴포넌트 안에 이미 있는
  것을 그대로 씀 (import 추가 필요 없음, NutsBadge/HomeHeader만
  이번에 전달한 새 버전으로 교체).
*/}

{/* 1+2. 프로필 박스(임시 회색) + 정보 박스(흰색, 확정 스타일) — 좌우 2단 배치 */}
<div className="flex gap-3">
  {/* 좌측: 프로필(아바타 + 이름 + 너트) — 아직 스타일 미확정이라 회색 placeholder */}
  <button
    onClick={() => navigate('/profile')}
    className="placeholder-box flex flex-1 flex-col items-center gap-1.5 rounded-xl px-3 py-3"
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-line bg-white text-xl">
      👤
    </div>
    <span className="font-galmuri9 text-[11px] font-bold text-black">프로필 설정</span>
    <NutsBadge />
  </button>

  {/* 우측: 날짜 + 오늘 작성여부 + 연속작성일 — 확정 스타일(흰 배경) */}
  <div className="flex flex-1 flex-col justify-center rounded-xl border-2 border-line bg-white px-3 py-3">
    <HomeHeader onStatusLoaded={handleStatusLoaded} />
  </div>
</div>

{/* 참고: 상점 버튼에도 같은 방식으로 적용하려면 —
  <button className="placeholder-box rounded-xl px-5 py-3 font-bold" onClick={() => navigate('/shop')}>
    상점
  </button>
  처럼 기존 bg-white/10 같은 클래스를 placeholder-box로 바꿔 끼우면 됨.
*/}
