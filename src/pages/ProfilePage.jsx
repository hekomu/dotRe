import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getProfileFull, updateProfile, setRepItems } from '../lib/profileService'
import { getMyItems } from '../lib/diaryService'
import ProfileCard from '../components/ProfileCard'
import { RARITY_TABLE } from '../game/statSystem'

export default function ProfilePage() {
  const { session } = useAuth()
  const myId = session?.user.id
  const navigate = useNavigate()

  const [info, setInfo] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nickname: '', bio: '', birthday: '' })
  const [slotIndex, setSlotIndex] = useState(null)   // 아이템 고르는 중인 슬롯
  const [myItems, setMyItems] = useState([])
  const [busy, setBusy] = useState(false)

  const load = () => {
    if (!myId) return
    getProfileFull(myId).then((d) => {
      setInfo(d)
      setForm({
        nickname: d.profile.nickname ?? '',
        bio: d.profile.bio ?? '',
        birthday: d.profile.birthday ?? '',
      })
    })
  }
  useEffect(load, [myId])

  const openSlot = async (i) => {
    setSlotIndex(i)
    if (myItems.length === 0) {
      const items = await getMyItems(myId)
      setMyItems(items.filter((it) => it.meta_status === 'done'))
    }
  }

  const pickItem = async (item) => {
    const ids = [...(info.profile.rep_item_ids || [])]
    while (ids.length < 3) ids.push(null)
    ids[slotIndex] = item ? item.id : null
    await setRepItems(myId, ids.filter(Boolean))
    setSlotIndex(null)
    load()
  }

  const handleSave = async () => {
    setBusy(true)
    try {
      const r = await updateProfile(myId, {
        nickname: form.nickname.trim() || null,
        bio: form.bio.trim() || null,
        birthday: form.birthday || null,
      })
      if (!r.ok && r.reason === 'duplicate') {
        alert('이미 사용 중인 닉네임입니다.')
        return
      }
      setEditing(false)
      load()
    } catch (err) {
      alert('저장 실패: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!info) return <div className="p-4 text-gray-400">불러오는 중...</div>

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-xl text-gray-400">←</button>
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold">
          🥜 {info.profile.nuts ?? 0}
        </span>
      </div>

      <h2 className="mb-3 text-center text-lg font-bold">
        {info.profile.nickname ?? info.profile.full_name ?? '이름 없음'}
      </h2>

      {editing ? (
        <div className="rounded-2xl bg-white p-4 shadow">
          <label className="mb-1 block text-xs text-gray-500">플레이어 ID (닉네임)</label>
          <input value={form.nickname}
                 onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                 className="mb-3 w-full rounded border p-2" />

          <label className="mb-1 block text-xs text-gray-500">한 줄 소개</label>
          <input value={form.bio} maxLength={40}
                 onChange={(e) => setForm({ ...form, bio: e.target.value })}
                 placeholder="40자 이내"
                 className="mb-3 w-full rounded border p-2" />

          <label className="mb-1 block text-xs text-gray-500">생일</label>
          <input type="date" value={form.birthday}
                 onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                 className="mb-4 w-full rounded border p-2" />

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={busy}
                    className="flex-1 rounded-xl bg-lime-400 py-2 font-bold disabled:opacity-50">
              저장
            </button>
            <button onClick={() => setEditing(false)}
                    className="flex-1 rounded-xl bg-gray-200 py-2 font-bold">
              취소
            </button>
          </div>
        </div>
      ) : (
        <>
          <ProfileCard {...info} editable onEditSlot={openSlot} />
          <button onClick={() => setEditing(true)}
                  className="mt-3 w-full rounded-xl bg-gray-200 py-2 font-bold">
            정보 수정
          </button>
        </>
      )}

      {/* 대표 아이템 선택 */}
      {slotIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
             onClick={() => setSlotIndex(null)}>
          <div className="max-h-[70vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-4"
               onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">대표 아이템 선택</h3>
              <button onClick={() => pickItem(null)}
                      className="text-xs text-gray-400 underline">비우기</button>
            </div>

            {myItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">아이템이 없어요.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {myItems.map((it) => {
                  const rarity = RARITY_TABLE[it.rarity] || RARITY_TABLE.normal
                  return (
                    <button key={it.id} onClick={() => pickItem(it)}
                            className="flex flex-col items-center">
                      <img src={it.image_url} alt={it.name}
                           className="pixel h-16 w-16 rounded-lg"
                           style={{ backgroundColor: rarity.color + '22' }} />
                      <span className="mt-1 line-clamp-1 text-[11px]">{it.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}