import { useAuth } from '../lib/AuthContext'

export default function SettingsPage() {
  const { signOut } = useAuth()

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await signOut()
      // 로그아웃되면 가드(ProtectedRoute)가 자동으로 로그인 페이지로 보냄
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
    </div>
  )
}