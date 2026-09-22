import { useEffect } from 'react'

export default function HelpModal({ onClose }) {
  // Esc 키로 닫기
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80dvh] w-full max-w-[360px] flex-col overflow-hidden rounded-[10px] border-2 border-line bg-surface shadow-[4px_4px_0_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 타이틀바 */}
        <div className="flex flex-none items-center gap-2 border-b-2 border-line bg-accent px-3 py-2">
          <span className="flex-1 font-galmuri9 text-[14px] font-bold black">
            사진 첨부 도움말
          </span>
         <button
        onClick={onClose}
        aria-label="닫기"
        className="btn-icon flex h-5 w-5 items-center justify-center rounded-sm border border-accent-ink bg-surface font-galmuri9 text-[9px] leading-none text-accent-ink"
        >
        ✕
        </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 font-galmuri11 text-[10px] leading-relaxed text-ink">
          <h3 className="font-galmuri9 text-[12px] font-bold text-accent-ink">📷 이런 사진이 좋아요</h3>
          <ul className="mb-3 mt-1.5 space-y-1">
            <li>· <b>물건 하나만</b> 가운데에 크게</li>
            <li>· 가장자리가 잘리지 않게 전체가 들어오게</li>
            <li>· 정방향의 사진</li>
            <li>· 밝은 곳에서, 단순한 배경으로</li>
          </ul>

          <h3 className="font-galmuri9 text-[12px] font-bold text-accent-2">🚫 아이템 변환이 어려워요</h3>
          <ul className="mb-2 mt-1.5 space-y-1">
            <li>· 얼굴이 중심인 사진</li>
            <li>· 하늘·바다·거리 같은 단조로운 풍경</li>
            <li>· 방 전체나 벽·바닥만 찍힌 사진</li>
            <li>· 화면 캡처, 글자 위주 이미지</li>
          </ul>

          <h3 className="font-galmuri9 text-[12px] font-bold text-accent-ink">✨ 좋은 등급이 나오려면</h3>
          <ul className="mb-3 mt-1.5 space-y-1">
            <li>· <b>300자</b>까지는 길게 쓸수록 확률이 올라요</li>
            <li>· <b>연속 10일</b>까지는 이어갈수록 확률이 올라요</li>
            <li>· 짧게 써도 유니크는 나와요. 운이 따른다면요!</li>
          </ul>

          <h3 className="font-galmuri9 text-[12px] font-bold text-ink">📌 알아두세요</h3>
          <ul className="mt-1.5 space-y-1">
            <li>· 아이템은 하루에 하나 만들 수 있어요</li>
            <li>· 마음에 안 들면 하루 한 번 다시 뽑을 수 있어요</li>
            <li>· 물건 종류에 따라 4가지 능력치 중 강한 능력치가 달라져요</li>
          </ul>
        </div>

        {/* 하단 닫기 버튼 */}
        <div className="flex-none border-t-2 border-border p-3">
          <button
            onClick={onClose}
            className="w-full rounded-full border-2 border-line bg-accent py-2 font-galmuri9 text-[12px] font-bold black"
          >
            확인했어요!
          </button>
        </div>
      </div>
    </div>
  )
}