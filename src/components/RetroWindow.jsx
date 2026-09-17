const MENU_TABS = ['Exchange', 'Calendar', 'Report', 'Friends']
 
/**
 * "Dotre Lab" 레트로 창 프레임.
 * 타이틀바·메뉴탭은 전부 장식용(클릭 불가) — 실제 이동은 하단 TabBar가 담당.
 *
 * 바깥쪽 div가 탭바 위 남은 공간 전체(flex-1)를 차지하면서 items-center /
 * justify-center로 안쪽 창을 상하좌우 정중앙에 놓는다. 창 자체는 더 이상
 * flex-1로 "남는 공간을 꽉 채우는" 방식이 아니라 WINDOW_W / WINDOW_H 퍼센트
 * 값으로 크기가 고정돼 있어서, 그 값만 줄이면 사방 여백이 균등하게 늘면서
 * 창이 작아진다 — 크기를 조절하고 싶으면 아래 두 상수만 바꾸면 됨.
 */
const WINDOW_W = '90%' // 창 가로 폭 (부모 폭 기준)
const WINDOW_H = '89%' // 창 세로 높이 (부모 높이 기준)
 
export default function RetroWindow({ title = 'Dotre Lab - Report', children }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div
        className="flex min-h-0 flex-col shadow-[4px_4px_0_rgba(0,0,0,0.35)]"
        style={{ width: WINDOW_W, height: WINDOW_H }}
      >
        {/* 타이틀바(#ACE02A) + 메뉴탭(흰색) — 장식용, pointer-events 없음.
            타이틀바 외곽선·타이틀바/메뉴탭 사이 중간선 = accent에 맞춘 어두운 색(accent-ink),
            메뉴탭·콘텐츠 쪽 나머지 바깥 테두리 = 회색(border) */}
        <div className="flex-none">
          {/* 타이틀바 줄 — accent 배경, 테두리(위/좌/우/아래=중간선) 전부 accent-ink */}
          <div className="flex items-center gap-2 rounded-t-[10px] border-2 border-accent-ink bg-accent px-2 py-1">
            <span className="truncate font-galmuri9 text-[11px] font-bold text-accent-ink">
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
    </div>
  )
}
 