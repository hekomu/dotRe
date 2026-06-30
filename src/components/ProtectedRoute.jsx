import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  // 아직 로그인 상태 확인 중이면 잠깐 대기 화면
  if (loading) {
    return <div className="p-4">로딩 중...</div>
  }

  // 로그인 안 했으면 로그인 페이지로 보냄
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // 로그인 했으면 원래 보려던 화면을 그대로 보여줌
  return children
}