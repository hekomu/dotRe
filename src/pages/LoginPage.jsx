import { useAuth } from '../lib/AuthContext'

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8">
      <h1 className="text-5xl font-bold">Dot-Re</h1>
      <button
        onClick={signInWithGoogle}
        className="rounded border px-6 py-3 text-gray-700 shadow"
      >
        Google로 계속하기
      </button>
    </div>
  )
}