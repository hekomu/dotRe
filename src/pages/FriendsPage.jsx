import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import {
  searchUserByEmail,
  sendFriendRequest,
  getReceivedRequests,
  acceptFriendRequest,
  getMyFriends,
} from '../lib/friendService'

const TABS = [
  ['list', '친구목록'],
  ['search', '친구찾기'],
  ['requests', '친구요청'],
]

export default function FriendsPage() {
  const { session } = useAuth()
  const myId = session?.user.id

  const [tab, setTab] = useState('list')
  const [keyword, setKeyword] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [requests, setRequests] = useState([])
  const [friends, setFriends] = useState([])
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    if (!myId) return
    const [reqs, fr] = await Promise.all([
      getReceivedRequests(myId),
      getMyFriends(myId),
    ])
    setRequests(reqs)
    setFriends(fr)
  }

  useEffect(() => { refresh() }, [myId])

  const handleSearch = async () => {
    const q = keyword.trim()
    if (!q) return
    setBusy(true)
    try {
      const user = await searchUserByEmail(q)
      setSearchResult(user ?? 'none')
    } catch (err) {
      alert('검색 오류: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleSendRequest = async () => {
    setBusy(true)
    try {
      const result = await sendFriendRequest(myId, searchResult.id)
      const messages = {
        self: '자기 자신에게는 신청할 수 없습니다.',
        already_friend: '이미 친구입니다.',
        already_pending: '이미 신청을 보냈거나 받은 상태입니다.',
      }
      if (result.ok) {
        alert('친구 신청을 보냈습니다.')
        setSearchResult(null)
        setKeyword('')
      } else {
        alert(messages[result.reason] ?? '신청할 수 없습니다.')
      }
    } catch (err) {
      alert('신청 오류: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleAccept = async (requestId) => {
    setBusy(true)
    try {
      const result = await acceptFriendRequest(requestId)
      if (!result || result.length === 0) {
        alert('이미 처리된 요청입니다.')
      }
      await refresh()
    } catch (err) {
      alert('수락 오류: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  const label = (p) => p?.nickname ?? p?.full_name ?? p?.email ?? '알 수 없음'

  return (
    <div className="p-4">
      {/* 탭 */}
      <div className="mb-4 flex border-b">
        {TABS.map(([key, name]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 pb-2 text-sm ${
              tab === key
                ? 'border-b-2 border-green-400 font-bold'
                : 'text-gray-400'
            }`}>
            {name}
            {key === 'requests' && requests.length > 0 && (
              <span className="ml-1 rounded-full bg-red-400 px-1.5 text-[10px] text-white">
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 친구목록 */}
      {tab === 'list' && (
        friends.length === 0 ? (
          <p className="mt-8 text-center text-sm text-gray-400">
            아직 친구가 없어요. 친구찾기에서 닉네임으로 검색해보세요.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((f) => (
              <div key={f.relationId}
                   className="flex items-center gap-3 rounded-xl border p-3">
                <div className="h-10 w-10 rounded-full bg-gray-100" />
                <span className="font-bold">{label(f)}</span>
              </div>
            ))}
          </div>
        )
      )}

      {/* 친구찾기 */}
      {tab === 'search' && (
        <div>
          <div className="flex gap-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="친구 닉네임 입력"
              className="flex-1 rounded border p-2"
            />
            <button onClick={handleSearch} disabled={busy}
                    className="rounded bg-gray-200 px-4 disabled:opacity-50">
              검색
            </button>
          </div>

          {searchResult === 'none' && (
            <p className="mt-3 text-sm text-gray-400">
              해당 닉네임의 사용자를 찾을 수 없습니다.
            </p>
          )}

          {searchResult && searchResult !== 'none' && (
            <div className="mt-3 flex items-center justify-between rounded-xl border p-3">
              <span className="font-bold">{label(searchResult)}</span>
              <button onClick={handleSendRequest} disabled={busy}
                      className="rounded bg-green-400 px-3 py-1 text-sm font-bold disabled:opacity-50">
                친구 신청
              </button>
            </div>
          )}
        </div>
      )}

      {/* 친구요청 */}
      {tab === 'requests' && (
        requests.length === 0 ? (
          <p className="mt-8 text-center text-sm text-gray-400">받은 요청이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {requests.map((req) => (
              <div key={req.id}
                   className="flex items-center justify-between rounded-xl border p-3">
                <span className="font-bold">{label(req.requester)}</span>
                <button onClick={() => handleAccept(req.id)} disabled={busy}
                        className="rounded bg-green-400 px-3 py-1 text-sm font-bold disabled:opacity-50">
                  수락
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}