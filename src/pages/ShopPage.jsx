import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getShop, buyItem, getFurniture, buyFurniture } from '../lib/api'
import { RARITY_TABLE } from '../game/statSystem'
import { FURNITURE_CATEGORY_KEYS, FURNITURE_CATEGORY_LABELS } from '../game/furniture'

/** 등급 → 뱃지 에셋. 실제 rarity 키가 다르면 여기만 고치면 됨 */
const GRADE_ICON = {
  normal: '/assets/icons/GradeNormal.png',
  rare:   '/assets/icons/GradeRare.png',
  epic:   '/assets/icons/GradeEpic.png',
  unique: '/assets/icons/GradeUnique.png',
}
const gradeIcon = (r) => GRADE_ICON[r] ?? GRADE_ICON.normal

const MAX_QTY = 5

export default function ShopPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('item')          // item | furniture
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('all')     // all | mine | friend
  const [qty, setQty] = useState({})
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const [furniture, setFurniture] = useState(null)
  const [furnCategory, setFurnCategory] = useState(FURNITURE_CATEGORY_KEYS[0])

  // 장바구니: [{ kind:'item'|'furn', entity, qty }]
  const [cart, setCart] = useState([])
  const [confirmTarget, setConfirmTarget] = useState(null)  // C 창
  const [showCart, setShowCart] = useState(false)           // D 창
  const [done, setDone] = useState(false)                   // E 창

  const loadItems = () => { getShop().then(setData).catch((e) => setError(e.message)) }
  const loadFurniture = () => { getFurniture().then(setFurniture).catch((e) => setError(e.message)) }

  useEffect(() => { loadItems(); loadFurniture() }, [])

  /* ── 장바구니 ── */
  const addToCart = (kind, entity, n = 1) => {
    setCart((c) => {
      const i = c.findIndex((x) => x.kind === kind && x.entity.id === entity.id)
      if (i === -1) return [...c, { kind, entity, qty: n }]
      const next = [...c]
      const cap = kind === 'item' ? MAX_QTY : 1
      next[i] = { ...next[i], qty: Math.min(cap, next[i].qty + n) }
      return next
    })
  }
  const setCartQty = (kind, id, n) => {
    setCart((c) => c
      .map((x) => (x.kind === kind && x.entity.id === id ? { ...x, qty: n } : x))
      .filter((x) => x.qty > 0))
  }

  const cartCount = cart.reduce((s, x) => s + x.qty, 0)
  const cartTotal = cart.reduce((s, x) => s + x.entity.price * x.qty, 0)

  /* ── 결제 ── */
  const runPurchase = async (list) => {
    setBusy('pay')
    try {
      for (const row of list) {
        if (row.kind === 'item') await buyItem(row.entity.id, row.qty)
        else await buyFurniture(row.entity.id)
      }
      setConfirmTarget(null)
      setShowCart(false)
      setCart((c) => c.filter((x) => !list.includes(x)))
      setDone(true)
      loadItems(); loadFurniture()
      setQty({})
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(null)
    }
  }

  if (error) {
    return <div className="flex h-full items-center justify-center px-6 text-center font-galmuri11 text-[11px] text-ink">{error}</div>
  }
  if (!data || !furniture) {
    return <div className="flex h-full items-center justify-center font-galmuri11 text-[11px] text-ink">불러오는 중...</div>
  }

  const list = data.items.filter((it) =>
    filter === 'all' ? true : filter === 'mine' ? !it.fromFriend : it.fromFriend
  )
  const furnList = furniture.items.filter((f) => f.category === furnCategory)
  const nuts = tab === 'item' ? data.nuts : furniture.nuts

  const confirmTotal = confirmTarget ? confirmTarget.entity.price * confirmTarget.qty : 0

  return (
    <div className="relative h-full overflow-hidden">
      {/* ── 상점 배경 ── */}
      <img src="/assets/ui/ShopBackgroud.png" alt=""
           className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none"
           draggable={false} />

      <div className="relative flex h-full flex-col px-[5%] pb-[4%] pt-[5%]">

        {/* ── 헤더: 로고 / 보유 너트 ── */}
        <div className="flex flex-none items-start justify-between">
          <img src="/assets/icons/TmShop.png" alt="상점"
               className=" w-[36%] select-none" draggable={false} />

          <div className="relative w-[30%]">
            <img src="/assets/ui/NutBar.png" alt="" className="block w-full select-none" draggable={false} />
            <div className="absolute inset-0 flex items-center justify-center gap-1">
              <img src="/assets/icons/Nuts.png" alt="" className="h-[65%] w-auto" draggable={false} />
              <span className="font-galmuri9 text-[18px]  text-ink">{nuts}</span>
            </div>
          </div>
        </div>

        {/* ── 아이템 / 인테리어 영역 탭 ── */}
        <div className="relative mx-auto mt-[1%] w-[64%] flex-none">
          <img src={tab === 'item' ? '/assets/ui/ItemPick.png' : '/assets/ui/InteriorPick.png'}
               alt={tab === 'item' ? '아이템' : '인테리어'}
               className="block w-full select-none" draggable={false} />
          <button onClick={() => setTab('item')} aria-label="아이템"
                  className="btn-icon absolute inset-y-0 left-0 w-1/2" />
          <button onClick={() => setTab('furniture')} aria-label="인테리어"
                  className="btn-icon absolute inset-y-0 right-0 w-1/2" />
        </div>

        {/* ── 본문 패널 ── */}
        <div className="mt-[3%] flex min-h-0 flex-1 overflow-hidden rounded-[8px] border-2 border-border bg-surface">

          {tab === 'item' ? (
            /* ───────── A: 아이템 ───────── */
            <div className="flex min-h-0 w-full flex-col p-[3%]">
              {/* 필터 */}
              <div className="flex flex-none justify-center gap-[7%]">
                {[['all', '전체'], ['mine', '내가만든'], ['friend', '교환받은']].map(([k, label]) => (
                  <button key={k} onClick={() => setFilter(k)}
                          className={`btn-icon pb-1 font-galmuri11 text-[12px] ${
                            filter === k
                              ? 'border-b-2 border-accent-2  text-ink'
                              : 'text-ink-dim'
                          }`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* 목록 */}
              <div className="no-scrollbar mt-[4%] min-h-0 flex-1 overflow-y-auto">
                {list.length === 0 ? (
                  <p className="mt-8 text-center font-galmuri11 text-[10px] text-ink-dim">
                    아직 아이템이 없어요. 일기를 작성해보세요!
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {list.map((it) => {
                      const owned = it.ownedCount ?? 0
                      const remaining = Math.max(1, MAX_QTY - owned)
                      const n = qty[it.id] ?? 1
                      const canBuy = !it.maxedOut && data.nuts >= it.price * n

                      return (
                        <div key={it.id} className="relative w-full">
                          <img src="/assets/ui/ItemBar.png" alt=""
                               className="block w-full select-none" draggable={false} />

                          {/* 썸네일 */}
                          <img src={it.image_url} alt=""
                               className="pixel absolute left-[5%] top-[12%] h-[80%] w-[17%] object-contain"
                               draggable={false} />

                          {/* 등급 뱃지 */}
                          <img src={gradeIcon(it.rarity)} alt=""
                               className="absolute left-[1.5%] top-[5%] w-[12%] select-none" draggable={false} />

                          {/* 이름 — 최대 2줄 */}
                          <p className="absolute left-[28%] right-[13%] top-[10%] line-clamp-2 font-galmuri11 text-[11px] leading-snug text-ink">
                            {it.name}
                          </p>

                          {/* 수량 */}
                          {!it.maxedOut && (
                            <div className="absolute left-[29%] top-[58%] flex items-center gap-1">
                              <button onClick={() => setQty((q) => ({ ...q, [it.id]: Math.max(1, n - 1) }))}
                                      aria-label="감소" className="btn-icon w-[22px]">
                                <img src="/assets/ui/Minus.png" alt="" className="block w-full" draggable={false} />
                              </button>
                              <span className="w-4 text-center font-galmuri9 text-[12px] text-ink">{n}</span>
                              <button onClick={() => setQty((q) => ({ ...q, [it.id]: Math.min(remaining, n + 1) }))}
                                      aria-label="증가" className="btn-icon w-[22px]">
                                <img src="/assets/ui/Plus.png" alt="" className="block w-full" draggable={false} />
                              </button>
                            </div>
                          )}

                          {/* 장바구니 담기 */}
                          <button onClick={() => addToCart('item', it, n)}
                                  disabled={it.maxedOut}
                                  aria-label="장바구니에 담기"
                                  className="btn-icon absolute right-[3%] top-[10%] w-[8.5%] disabled:opacity-40">
                            <img src="/assets/ui/CartAdd.png" alt="" className="block w-full" draggable={false} />
                          </button>

                          {/* 가격 버튼 */}
                          <button onClick={() => setConfirmTarget({ kind: 'item', entity: it, qty: n })}
                                  disabled={!canBuy}
                                  className="btn-icon absolute right-[2%] top-[56%] flex w-[23%] items-center justify-center gap-1 rounded-full border-2 border-accent-ink bg-accent py-1 disabled:opacity-40">
                            <img src="/assets/icons/Nuts.png" alt="" className="h-[14px] w-[14px]" draggable={false} />
                            <span className="font-galmuri9 text-[11px] font-bold text-ink">{it.price * n}</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ───────── B: 인테리어 ───────── */
            <div className="flex min-h-0 w-full">
               {/* 좌측 카테고리 */}
              <div className="flex w-[15%] flex-none flex-col">
                {FURNITURE_CATEGORY_KEYS.map((key) => {
                  const on = furnCategory === key
                  return (
                    <button
                      key={key}
                      onClick={() => setFurnCategory(key)}
                      className={`btn-icon relative flex-1 rounded-l-[0px] border border-[#959595] font-galmuri11 text-[12px] ${
                        on
                          ? 'z-10 -mr-px border-r-0 bg-surface text-ink'
                          : 'bg-accent text-ink'
                      }`}
                    >
                      {FURNITURE_CATEGORY_LABELS[key]}
                    </button>
                  )
                })}
              </div>

              {/* 상품 그리드 */}
              <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-[4%]">
                {furnList.length === 0 ? (
                  <p className="mt-8 text-center font-galmuri11 text-[10px] text-ink-dim">
                    이 카테고리엔 아직 가구가 없어요.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {furnList.map((f) => {
                      const canBuyFurn = !f.owned && furniture.nuts >= f.price
                      return (
                        <div key={f.id} className="relative w-full">
                          <img src="/assets/ui/InteriorBar.png" alt=""
                               className="block w-full select-none" draggable={false} />

                          {/* 썸네일 */}
                          {f.image_url && (
                            <img src={f.image_url} alt=""
                                 className="pixel absolute left-[10%] top-[6%] h-[42%] w-[80%] object-contain"
                                 draggable={false} />
                          )}

                          {/* 이름 — 최대 2줄 */}
                          <p className="absolute inset-x-[6%] top-[53%] line-clamp-2 text-center font-galmuri11 text-[12px] leading-snug text-ink">
                            {f.name}
                          </p>

                          {/* 가격 */}
                          <button onClick={() => setConfirmTarget({ kind: 'furn', entity: f, qty: 1 })}
                                  disabled={!canBuyFurn}
                                  className="btn-icon absolute left-[16%] top-[79%] flex w-[55%] items-center justify-center gap-1 rounded-full border-2 border-accent-ink bg-accent py-0.5 disabled:opacity-40">
                            <img src="/assets/icons/Nuts.png" alt="" className="h-[12px] w-[12px]" draggable={false} />
                            <span className="font-galmuri9 text-[10px] font-bold text-ink">{f.price}</span>
                          </button>

                          {/* 담기 */}
                          <button onClick={() => addToCart('furn', f, 1)}
                                  disabled={f.owned}
                                  aria-label="장바구니에 담기"
                                  className="btn-icon absolute right-[6%] top-[79%] w-[18%] disabled:opacity-40">
                            <img src="/assets/ui/CartAdd.png" alt="" className="block w-full" draggable={false} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 하단: 뒤로가기 / 장바구니 ── */}
        <div className="mt-[3%] flex flex-none items-center justify-between">
          <button onClick={() => navigate('/')} aria-label="홈으로" className="btn-icon w-[14%]">
            <img src="/assets/ui/Back.png" alt="" className="block w-full select-none" draggable={false} />
          </button>

          <button onClick={() => setShowCart(true)} aria-label="장바구니"
                  className="btn-icon relative w-[38%]">
            <img src="/assets/ui/Cart.png" alt="" className="block w-full select-none" draggable={false} />
            {cart.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full   bg-accent-2 px-1 font-galmuri9 text-[9px] font-bold text-white">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ───────── C: 단일 결제확인 ───────── */}
      {confirmTarget && (
        <div className="absolute inset-0 z-40 flex items-center justify-center px-[8%] backdrop-blur-sm"
             onClick={() => setConfirmTarget(null)}>
          <div className="relative w-full overflow-hidden rounded-[8px] border-2 border-border bg-surface shadow-[3px_3px_0_rgba(0,0,0,0.25)]"
               onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setConfirmTarget(null)} aria-label="닫기"
                    className="btn-icon absolute right-[4%] top-[3%] w-[11%]">
              <img src="/assets/ui/XButton.png" alt="" className="block w-full" draggable={false} />
            </button>

            <img src="/assets/ui/BuyTex.png" alt="결제확인"
                 className="mx-auto mt-[9%] w-[45%] select-none" draggable={false} />

            <img src={confirmTarget.entity.image_url} alt=""
                 className="pixel mx-auto mt-[5%] h-[72px] w-[72px] rounded-[6px] border-2 border-border bg-white object-contain"
                 draggable={false} />

            <div className="mt-[6%] bg-accent/25 px-4 py-3 text-center">
              <p className="font-galmuri11 text-[12px] font-bold text-ink">
                “{confirmTarget.entity.name}”
              </p>
              <p className="mt-1 font-galmuri11 text-[11px] text-ink">
                {confirmTarget.qty}개를 구매합니다.
              </p>
            </div>

            <div className="mt-[6%] flex items-center justify-center gap-2">
              <img src="/assets/icons/Nuts.png" alt="" className="h-[16px] w-[16px]" draggable={false} />
              <span className="font-galmuri11 text-[11px] text-ink">보유 너트</span>
              <span className="font-galmuri9 text-[12px] font-bold text-ink">{nuts}</span>
              <span className="font-galmuri9 text-[12px] text-ink-dim">→</span>
              <span className="font-galmuri9 text-[12px] font-bold text-accent-2">{nuts - confirmTotal}</span>
            </div>

            <button onClick={() => runPurchase([confirmTarget])}
                    disabled={busy === 'pay'}
                    className="btn-icon mx-auto my-[7%] block w-[40%] disabled:opacity-50">
              <img src="/assets/ui/Buy.png" alt="구매하기" className="block w-full" draggable={false} />
            </button>
          </div>
        </div>
      )}

      {/* ───────── D: 장바구니 ───────── */}
      {showCart && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 px-[6%]"
             onClick={() => setShowCart(false)}>
          <div className="flex max-h-[88%] w-full flex-col overflow-hidden rounded-[8px] border-2 border-border bg-surface shadow-[3px_3px_0_rgba(0,0,0,0.25)]"
               onClick={(e) => e.stopPropagation()}>

            <div className="relative flex-none pb-[2%] pt-[4%]">
              <button onClick={() => setShowCart(false)} aria-label="닫기"
                      className="btn-icon absolute right-[2%] top-[14%] w-[7%]">
                <img src="/assets/ui/XButton.png" alt="" className="block w-full" draggable={false} />
              </button>
              <img src="/assets/ui/CartTex.png" alt="장바구니"
                   className="mx-auto w-[32%] select-none" draggable={false} />
            </div>

            {/* 담은 목록 */}
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-[5%] pb-[3%]">
              {cart.length === 0 ? (
                <p className="py-10 text-center font-galmuri11 text-[10px] text-ink-dim">
                  담은 상품이 없어요.
                </p>
              ) : (
                [['item', '아이템'], ['furn', '인테리어']].map(([kind, label]) => {
                  const rows = cart.filter((x) => x.kind === kind)
                  if (rows.length === 0) return null
                  return (
                    <div key={kind} className="mt-[4%]">
                      <p className="font-galmuri9 text-[13px] font-bold text-ink">{label}</p>
                      <div className="mt-1 border-b-2 border-accent-2" />

                      {rows.map((row) => (
                        <div key={row.entity.id} className="border-b border-dashed border-border py-[4%]">
                          <div className="flex items-start gap-2">
                            <p className="min-w-0 flex-1 line-clamp-2 font-galmuri11 text-[11px] text-ink">
                              {row.entity.name}
                            </p>
                            <img src={row.entity.image_url} alt=""
                                 className="pixel h-11 w-11 flex-none rounded-[6px] border-2 border-border bg-white object-contain"
                                 draggable={false} />
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-galmuri11 text-[10px] text-ink-dim">
                              가격: {row.entity.price * row.qty} 너트
                            </span>

                            <div className="flex items-center gap-2">
                              <button onClick={() => setCartQty(row.kind, row.entity.id, row.qty - 1)}
                                      aria-label="감소" className="btn-icon w-[20px]">
                                <img src="/assets/ui/Minus.png" alt="" className="block w-full" draggable={false} />
                              </button>
                              <span className="w-4 text-center font-galmuri9 text-[11px] font-bold text-ink">{row.qty}</span>
                              <button onClick={() => setCartQty(row.kind, row.entity.id,
                                        Math.min(row.kind === 'item' ? MAX_QTY : 1, row.qty + 1))}
                                      aria-label="증가" className="btn-icon w-[20px]">
                                <img src="/assets/ui/Plus.png" alt="" className="block w-full" draggable={false} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })
              )}
            </div>

            {/* 합계 — 스크롤과 무관하게 항상 하단 고정 */}
            <div className="flex flex-none items-center justify-between border-t-[3px] border-accent px-[5%] py-[3%]">
              <div>
                <p className="font-galmuri11 text-[10px] text-ink-dim">총 {cartCount}개 상품</p>
                <p className="font-galmuri9 text-[16px] font-bold text-ink">
                  {cartTotal.toLocaleString()} 너트
                </p>
              </div>
              <button onClick={() => runPurchase(cart)}
                      disabled={cart.length === 0 || busy === 'pay'}
                      className="btn-icon w-[38%] disabled:opacity-40">
                <img src="/assets/ui/Buy.png" alt="구매하기" className="block w-full" draggable={false} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────── E: 구매 완료 ───────── */}
      {done && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-[8%]">
          <div className="relative w-full overflow-hidden rounded-[8px] border-2 border-border bg-surface px-[6%] py-[8%] text-center shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
            <button onClick={() => setDone(false)} aria-label="닫기"
                    className="btn-icon absolute right-[4%] top-[3%] w-[11%]">
              <img src="/assets/ui/XButton.png" alt="" className="block w-full" draggable={false} />
            </button>

            <p className="mt-[6%] font-galmuri11 text-[11px] text-ink-dim">결제가 완료되었습니다.</p>
            <p className="mt-[4%] font-galmuri9 text-[18px] font-bold leading-relaxed text-ink">
              이용해주셔서<br />감사합니다!
            </p>

            <div className="relative mx-auto mt-[8%] w-[62%]">
              <img src="/assets/ui/Sparkle.png" alt=""
                   className="absolute -left-[18%] top-[6%] w-[22%] select-none" draggable={false} />
              <img src="/assets/char/Mascot.png" alt=""
                   className="pixel block w-full select-none" draggable={false} />
              <img src="/assets/ui/Sparkle.png" alt=""
                   className="absolute -right-[18%] bottom-[8%] w-[22%] select-none" draggable={false} />
            </div>

            <button onClick={() => navigate('/')}
                    className="btn-icon mx-auto mt-[10%] block w-[55%]">
              <img src="/assets/ui/GoHome.png" alt="홈으로 바로가기" className="block w-full" draggable={false} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}