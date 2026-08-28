import { RARITY_TABLE } from '../game/statSystem'

/** 본인·친구 공용 프로필 카드 */
export default function ProfileCard({ profile, diaryCount, repItems,
                                      editable = false, onEditSlot }) {
  const rows = [
    ['플레이어 ID', profile.nickname ?? '미설정'],
    ['생일', profile.birthday
      ? String(profile.birthday).slice(5).replace('-', '월 ') + '일'
      : '미설정'],
    ['일기 작성 횟수', `${diaryCount}회`],
  ]

  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      {profile.bio && (
        <p className="mb-3 text-center text-sm text-gray-500">
          “{profile.bio}”
        </p>
      )}

      {rows.map(([k, v]) => (
        <div key={k} className="mb-2 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
          <span className="w-24 flex-none text-sm text-gray-500">{k}</span>
          <span className="text-sm font-bold">{v}</span>
        </div>
      ))}

      <p className="mb-2 mt-4 text-sm text-gray-500">대표 아이템</p>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => {
          const it = repItems[i]
          const rarity = it ? (RARITY_TABLE[it.rarity] || RARITY_TABLE.normal) : null
          return (
            <button key={i}
              onClick={editable ? () => onEditSlot(i) : undefined}
              disabled={!editable}
              className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-lime-400 bg-gray-50">
              {it ? (
                <img src={it.image_url} alt={it.name}
                     className="pixel h-16 w-16 object-contain"
                     style={{ backgroundColor: rarity.color + '22' }} />
              ) : (
                <span className="text-2xl text-gray-300">{editable ? '+' : ''}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}