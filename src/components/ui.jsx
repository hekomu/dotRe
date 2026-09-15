import { STAT_KEYS, STAT_LABELS, STAT_BAR_MAX, RARITY_TABLE } from '../game/statSystem'

/* ────────────────────────────────────────────────────────────
   Dotre Lab 공통 컴포넌트 뼈대 (0단계)
   - 실제 페이지 배치(1~3단계)에서 이 파일의 컴포넌트들을 가져다 쓴다.
   - 여기서는 "생김새"만 완성하고, 각 페이지의 핸들러/상태는
     기존 로직을 그대로 props로 연결하면 된다.
   ──────────────────────────────────────────────────────────── */

/* ── Button ──────────────────────────────────────────────────
   variant: 'solid'(라임) | 'pink' | 'ghost'
   size:    'sm' | 'md' | 'lg'                                  */
const BUTTON_VARIANTS = {
  solid: 'bg-accent text-accent-ink border-line',
  pink: 'bg-accent-2 text-white border-line',
  ghost: 'bg-surface text-ink border-line',
}

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-[11px]',
  md: 'h-11 px-4 text-[13px]',
  lg: 'h-12 px-6 text-[14px]',
}

export function Button({
  variant = 'solid',
  size = 'md',
  className = '',
  disabled = false,
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-1 rounded-full border-2',
        'font-galmuri11 font-bold shadow-[0_3px_0_var(--color-line)]',
        'transition-transform active:translate-y-[3px] active:shadow-none',
        'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}

/* ── CircleButton ── 아이콘 전용 원형 버튼 (같은 시각언어) ─────── */
export function CircleButton({ variant = 'ghost', size = 'md', className = '', children, ...props }) {
  const dim = { sm: 'h-8 w-8 text-[13px]', md: 'h-11 w-11 text-[16px]', lg: 'h-12 w-12 text-[18px]' }
  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-full border-2',
        'shadow-[0_3px_0_var(--color-line)]',
        'transition-transform active:translate-y-[3px] active:shadow-none',
        'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
        BUTTON_VARIANTS[variant],
        dim[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}

/* ── GradeBadge ── 등급 뱃지. 제작된 에셋(badge-<rarity>.png)이 있으면
   그걸 쓰고, 없으면 RARITY_TABLE 색상으로 대체 표시한다.           */
export function GradeBadge({ rarity = 'normal', size = 'md', className = '' }) {
  const info = RARITY_TABLE[rarity] || RARITY_TABLE.normal
  const dim = { sm: 'h-5 text-[9px] px-1.5', md: 'h-6 text-[10px] px-2', lg: 'h-7 text-[11px] px-2.5' }

  return (
    <span
      className={[
        'pixel inline-flex select-none items-center justify-center rounded-full border-2 border-line font-galmuri9 font-bold text-white',
        dim[size],
        className,
      ].join(' ')}
      style={{ backgroundColor: info.color }}
    >
      {info.label}
    </span>
  )
}

/* ── Modal ── 배경 클릭 시 닫힘. footer는 버튼 영역.              */
export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[320px] rounded-2xl border-2 border-line bg-surface p-4 shadow-[0_4px_0_var(--color-line)]"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="mb-3 font-galmuri11 text-[14px] font-bold text-ink">{title}</h2>
        )}
        <div className="text-ink">{children}</div>
        {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

/* ── StatList ── luck/cool/energy/cute 4개 스탯 바 + power(선택) ─ */
export function StatList({ stats = {}, power }) {
  return (
    <div className="flex flex-col gap-1.5">
      {STAT_KEYS.map((key) => {
        const label = STAT_LABELS[key]
        const value = stats[key] ?? 0
        const pct = Math.min(100, Math.round((value / STAT_BAR_MAX) * 100))
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="w-14 flex-none font-galmuri9 text-[10px] text-ink-dim">
              {label.icon} {label.ko}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full border border-line bg-surface-2">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: label.color }}
              />
            </div>
            <span className="w-6 flex-none text-right font-galmuri9 text-[10px] text-ink">
              {value}
            </span>
          </div>
        )
      })}
      {power != null && (
        <div className="mt-1 flex items-center justify-between border-t border-border pt-1.5">
          <span className="font-galmuri9 text-[10px] text-ink-dim">종합 전투력</span>
          <span className="font-galmuri11 text-[13px] font-bold text-accent-ink">{power}</span>
        </div>
      )}
    </div>
  )
}

/* ── QuantityStepper ── 상점 구매 수량(1~max) 조절 ────────────── */
export function QuantityStepper({ value, min = 1, max = 5, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <CircleButton
        size="sm"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        −
      </CircleButton>
      <span className="w-6 text-center font-galmuri11 text-[13px] font-bold text-ink">
        {value}
      </span>
      <CircleButton
        size="sm"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        +
      </CircleButton>
    </div>
  )
}

/* ── CategoryTabs ── 가구/상점 카테고리 필터 알약탭 ───────────── */
export function CategoryTabs({ categories = [], value, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {categories.map((cat) => {
        const active = cat.key === value
        return (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            className={[
              'flex-none rounded-full border-2 border-line px-3 py-1 font-galmuri9 text-[10px] font-bold',
              active ? 'bg-accent text-accent-ink' : 'bg-surface text-ink-dim',
            ].join(' ')}
          >
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── PartActionButton ── 커스터마이징 3상태 버튼 ───────────────
   state: 'equipped' | 'owned' | 'buy'                           */
export function PartActionButton({ state = 'buy', price, onClick, disabled }) {
  if (state === 'equipped') {
    return (
      <Button variant="solid" size="sm" disabled className="opacity-100">
        장착중
      </Button>
    )
  }
  if (state === 'owned') {
    return (
      <Button variant="ghost" size="sm" onClick={onClick} disabled={disabled}>
        장착하기
      </Button>
    )
  }
  return (
    <Button variant="pink" size="sm" onClick={onClick} disabled={disabled}>
      {price != null ? `${price} 구매` : '구매'}
    </Button>
  )
}

/* ── AssetPlaceholder ── image_url 없는 아이템/가구용 자리표시자.
   실제 에셋이 채워지면 각 페이지에서 자연스럽게 <img>로 교체됨.    */
export function AssetPlaceholder({ name, className = '' }) {
  return (
    <div
      className={[
        'flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-surface-2 p-1 text-center',
        className,
      ].join(' ')}
    >
      <span className="text-[16px]">🖼️</span>
      {name && (
        <span className="line-clamp-2 font-galmuri9 text-[9px] leading-tight text-ink-dim">
          {name}
        </span>
      )}
    </div>
  )
}
