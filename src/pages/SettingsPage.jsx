import { useAuth } from '../lib/AuthContext'
import { deleteMyAccount } from '../lib/profileService'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const { session, signOut } = useAuth()

  const navigate = useNavigate()


  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await signOut()
    }
  }

  const handleDeleteAccount = async () => {
    const ok = confirm(
      '정말 회원탈퇴 하시겠습니까?\n작성한 모든 일기와 아이템, 친구 관계가 삭제되며 되돌릴 수 없습니다.'
    )
    if (!ok) return
    try {
      await deleteMyAccount(session.user.id)
      alert('회원탈퇴가 완료되었습니다.')
      await signOut()
    } catch (err) {
      alert('탈퇴 처리 중 오류: ' + err.message)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-bold">설정</h2>

      <button
        onClick={handleLogout}
        className="w-full rounded border border-red-300 py-3 text-red-500"
      >
        로그아웃
      </button>

      <button
        onClick={handleDeleteAccount}
        className="w-full rounded bg-red-500 py-3 font-bold text-white"
      >
        회원탈퇴
      </button>
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => navigate(-1)}
                className="rounded px-2 py-1 text-xl text-gray-400">←</button>
      </div>
    </div>
  )
}