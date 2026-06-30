import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { createDiaryWithItem } from '../lib/diaryService'

export default function DiaryWritePage() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [content, setContent] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // 사진 선택 시 미리보기 만들기
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhotoFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  // 완료 버튼
  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('일기를 입력해주세요.')
      return
    }
    setSubmitting(true)
    try {
      const { item } = await createDiaryWithItem({
        userId: session.user.id,
        content,
        photoFile,
      })
      // 생성된 아이템 정보를 들고 결과 화면으로 이동
      navigate('/item-result', { state: { item } })
    } catch (err) {
      alert('저장 중 오류가 발생했습니다: ' + err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-bold">일기 작성</h2>

      {/* 사진 선택 영역 */}
      <label className="flex h-48 cursor-pointer items-center justify-center border-2 border-dashed text-gray-400">
        {preview ? (
          <img src={preview} alt="미리보기" className="h-full object-contain" />
        ) : (
          <span className="text-4xl">+</span>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </label>

      {/* 일기 입력 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="오늘 하루를 기록해보세요"
        className="h-32 w-full rounded border p-2"
      />

      {/* 완료 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="rounded bg-green-400 py-3 font-bold disabled:opacity-50"
      >
        {submitting ? '생성 중...' : '일기 작성 완료!'}
      </button>
    </div>
  )
}