/** 보유 너트 표시 바 — NutBar.png + 너트 아이콘 + 숫자.
 *  value: 표시할 너트 수 / widthClass: 바 가로 폭 / textClass: 숫자 크기 */
export default function NutsBar({ value, widthClass = 'w-[30%]', textClass = 'text-[18px]' }) {
  return (
    <div className={`relative ${widthClass}`}>
      <img src="/assets/ui/NutBar.png" alt="" className="block w-full select-none" draggable={false} />
      <div className="absolute inset-x-0 bottom-[14%] top-0 flex items-center justify-center gap-1">
        <img src="/assets/icons/Nuts.png" alt="" className="h-[68%] w-auto" draggable={false} />
        <span className={`font-galmuri9 text-ink ${textClass}`}>{value}</span>
      </div>
    </div>
  )
}