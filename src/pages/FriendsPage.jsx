import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import {
  searchUserByEmail,
  sendFriendRequest,
  getReceivedRequests,
  acceptFriendRequest,
  getMyFriends,
} from '../lib/friendService'

export default function FriendsPage() {
  const { session } = useAuth()
  const myId = session?.user.id

  const [email, setEmail] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [requests, setRequests] = useState([])
  const [friends, setFriends] = useState([])

  // 받은 요청 + 친구 목록 새로고침
  const refresh = async () => {
    if (!myId) return
    setRequests(await getReceivedRequests(myId))
    setFriends(await getMyFriends(myId))
  }

  useEffect(() => {
    refresh()
  }, [myId])

  const handleSearch = async () => {
    try {
      const user = await searchUserByEmail(email.trim())
      setSearchResult(user ?? 'none')
    } catch (err) {
      alert('검색 오류: ' + err.message)
    }
  }

  const handleSendRequest = async () => {
    try {
      await sendFriendRequest(myId, searchResult.id)
      alert('친구 신청을 보냈습니다.')
      setSearchResult(null)
      setEmail('')
    } catch (err) {
      alert('신청 오류: ' + err.message)
    }
  }

  const handleAccept = async (requestId) => {
    await acceptFriendRequest(requestId)
    await refresh()
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="text-xl font-bold">친구</h2>

      {/* 친구 찾기 */}
      <section>
        <h3 className="mb-2 font-bold">친구 찾기</h3>
        <div className="flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="친구 이메일 입력"
            className="flex-1 rounded border p-2"
          />
          <button onClick={handleSearch} className="rounded bg-gray-200 px-4">
            검색
          </button>
        </div>

        {searchResult === 'none' && (
          <p className="mt-2 text-sm text-gray-500">해당 사용자를 찾을 수 없습니다.</p>
        )}
        {searchResult && searchResult !== 'none' && (
          <div className="mt-2 flex items-center justify-between rounded border p-2">
            <span>{searchResult.full_name ?? searchResult.email}</span>
            <button
              onClick={handleSendRequest}
              className="rounded bg-green-400 px-3 py-1 text-sm font-bold"
            >
              친구 신청
            </button>
          </div>
        )}
      </section>

      {/* 받은 친구 요청 */}
      <section>
        <h3 className="mb-2 font-bold">받은 요청 ({requests.length})</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-gray-500">받은 요청이 없습니다.</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="flex items-center justify-between rounded border p-2">
              <span>{req.requester?.full_name ?? req.requester?.email}</span>
              <button
                onClick={() => handleAccept(req.id)}
                className="rounded bg-blue-400 px-3 py-1 text-sm font-bold text-white"
              >
                수락
              </button>
            </div>
          ))
        )}
      </section>

      {/* 내 친구 목록 */}
      <section>
        <h3 className="mb-2 font-bold">내 친구 ({friends.length})</h3>
        {friends.length === 0 ? (
          <p className="text-sm text-gray-500">아직 친구가 없습니다.</p>
        ) : (
          friends.map((f) => (
            <div key={f.relationId} className="rounded border p-2">
              {f.full_name ?? f.email}
            </div>
          ))
        )}
      </section>
    </div>
  )
}