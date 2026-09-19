const MENU_TABS = ['Exchange', 'Calendar', 'Report', 'Friends']

const WINDOW_W = '90%'
const WINDOW_H = '89%'

// WindowBar.png 실제 크기(1610x318) 비율 — 콘텐츠가 시작할 위치를 여기서 자동 계산
const WINDOWBAR_RATIO = 318 / 1610 // ≈ 0.1975

export default function RetroWindow({ title = 'Dotre Lab - Report', activeTab = null, children }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div
        className="relative flex min-h-0 flex-col shadow-[4px_4px_0_rgba(0,0,0,0.35)]"
        style={{ width: WINDOW_W, height: WINDOW_H }}
      >
        {/* 흰 배경 — 창 맨 위(0)부터 시작. 이미지가 이 위에 겹쳐서 얹히므로 틈이 생길 수가 없음 */}
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border-2 border-border bg-surface text-black"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* 이미지가 덮을 만큼만 투명 여백 — 비율로 계산해서 항상 이미지 높이랑 정확히 일치 */}
          <div
            className="flex-none"
            style={{ paddingTop: `${(WINDOWBAR_RATIO * 100).toFixed(2)}%` }}
            aria-hidden="true"
          />
          {children}
        </div>

        {/* 타이틀바+탭줄 이미지 — 흰 배경 위에 그대로 겹쳐서 얹음 */}
        <div className="absolute inset-x-0 top-0">
          <img
            src="/assets/ui/WindowBar.png"
            alt=""
            className="block w-full h-auto select-none"
            draggable={false}
          />
          <span className="absolute left-[10%] top-[6%] font-galmuri9 text-[16px] font-bold text-accent-ink">
            {title}
          </span>
          <div
            className="absolute inset-x-0 left-[7%] top-[62%] flex gap-10 overflow-x-auto px-3 font-galmuri9 text-[12px] text-ink-dim"
            aria-hidden="true"
          >
            {MENU_TABS.map((m) => (
              <span
                key={m}
                className={`flex-none pb-0.5 ${
                  m === activeTab ? 'border-b-2 border-accent-2 text-ink' : ''
                }`}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}