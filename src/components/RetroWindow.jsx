const MENU_TABS = ['Exchange', 'Calendar', 'Report', 'Friends']

/**
 * "Dotre Lab" 레트로 창 프레임.
 * 타이틀바·메뉴탭은 전부 장식용(클릭 불가) — 실제 이동은 하단 TabBar가 담당.
 * .shell의 우주 배경 위에 "떠있는 창"처럼 보이도록 사방에 넉넉한 여백을 주고
 * (상하 여백을 같게 둬서 자연스럽게 세로 중앙 정렬됨), 콘텐츠 영역은 흰 배경 +
 * 검정 텍스트로 채운다. 아직 스타일이 확정 안 된 개별 요소(프로필 박스,
 * 상점 버튼 등)는 창 배경이 아니라 그 요소 자체에 회색을 임시로 입히면 됨
 * — index.css의 `.placeholder-box` 클래스 참고.
 */
export default function RetroWindow({ title = 'Dotre Lab - Report', children }) {
  return (
    <div className="mx-4 my-8 flex min-h-0 flex-1 flex-col shadow-[4px_4px_0_rgba(0,0,0,0.35)]">
      {/* 타이틀바(#ACE02A) + 메뉴탭(흰색) — 장식용, pointer-events 없음.
          타이틀바 외곽선·타이틀바/메뉴탭 사이 중간선 = accent에 맞춘 어두운 색(accent-ink),
          메뉴탭·콘텐츠 쪽 나머지 바깥 테두리 = 회색(border) */}
      <div className="flex-none">
        {/* 타이틀바 줄 — accent 배경, 테두리(위/좌/우/아래=중간선) 전부 accent-ink */}
        <div className="flex items-center gap-2 rounded-t-[10px] border-2 border-accent-ink bg-accent px-2 py-1">
          <span className="truncate font-galmuri9 text-[11px] font-bold text-black">
            {title}
          </span>
          <div className="ml-auto flex flex-none items-center gap-1" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-sm border border-accent-ink bg-surface" />
            <span className="h-2.5 w-2.5 rounded-sm border border-accent-ink bg-surface" />
            <span className="flex h-2.5 w-2.5 items-center justify-center rounded-sm border border-accent-ink bg-surface text-[7px] leading-none">
              ✕
            </span>
          </div>
        </div>
        {/* 메뉴탭 줄 — 흰색. 위쪽 테두리는 안 그림(바로 위 타이틀바 아래 테두리가 중간선 역할),
            좌/우/아래만 회색 */}
        <div
          className="flex gap-3 overflow-x-auto border-x-2 border-b-2 border-border bg-surface px-2 py-1 font-galmuri9 text-[10px] font-bold text-ink-dim"
          aria-hidden="true"
        >
          {MENU_TABS.map((m) => (
            <span key={m} className="flex-none">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* 콘텐츠 영역 — 흰 배경 + 검정 텍스트. 바깥 테두리는 회색(--color-border) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-[10px] border-2 border-t-0 border-border bg-surface text-black">
        {children}
      </div>
    </div>
  )
}
