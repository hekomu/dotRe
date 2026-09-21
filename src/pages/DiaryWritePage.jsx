import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { createDiaryWithItem, getStreakDays } from '../lib/diaryService'


export default function DiaryWritePage() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [content, setContent] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [streak, setStreak] = useState(0)

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
    if (!photoFile) {
      alert('사진을 첨부해주세요. 사진으로 아이템이 만들어져요!')
      return
    }
    setSubmitting(true)
    try {
      const { itemId } = await createDiaryWithItem({
        userId: session.user.id,
        content,
        photoFile,
      })
      navigate(`/item/${itemId}`, { replace: true })
    } catch (err) {
      alert('저장 중 오류가 발생했습니다: ' + err.message)
      setSubmitting(false)
    }
  }

  // 연속 작성일 — HomeHeader와 같은 소스(getStreakDays) 사용
  useEffect(() => {
    const id = session?.user?.id
    if (!id) return
    getStreakDays(id).then(setStreak).catch(console.error)
  }, [session])

  return (
    <div className="flex flex-col gap-2.5 px-[3.5%] py-[3%]">
      {/* ── 상단 2칸: ITEM PHOTO / 마스코트 ── */}
      <div className="flex gap-[2%]">
        {/* 사진 첨부 칸 */}
        <div className="flex-1">
          <div className="relative">
            <img src="/assets/ui/MiniTab.png" alt="" className="block w-full select-none" draggable={false} />
            {/* 미니탭 텍스트 — 위치는 left-[%], 크기는 text-[px]로 조절 */}
            <span className="absolute left-[19%] top-1/2 -translate-y-1/2 font-galmuri9 text-[12px]  text-ink">
              ITEM PHOTO
            </span>
          </div>
          <label className="relative block cursor-pointer">
            <img src="/assets/ui/PhotoBlank.png" alt="" className="block w-full select-none" draggable={false} />
            {preview && (
              <img src={preview} alt="미리보기" className="absolute inset-[9%] h-[82%] w-[82%] object-cover" />
            )}
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>

        {/* 마스코트 + 말풍선 */}
        <div className="relative flex-1 overflow-hidden rounded-[6px] bg-accent/25">
          <div className="absolute right-[14%] top-[10%] w-[70%]">
            <img src="/assets/ui/Bubble.png" alt="" className="block w-full select-none" draggable={false} />
            {/* 말풍선 안 텍스트 — 숫자만 핑크·볼드·큰 사이즈 */}
            <div className="absolute inset-x-0 top-[20%] text-center font-galmuri11 text-[11px] leading-tight text-ink">
              <div>오늘은 연속 작성</div>
              <div>
                <span className="text-[18px] font-bold text-accent-2">{streak}</span> 일째 입니다!
              </div>
            </div>
          </div>
          <img
            src="/assets/char/Mascot.png"
            alt=""
            className="absolute top-[54%] bottom-0 left-1/2 w-[82%] -translate-x-1/2 select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* ── TODAY REPORT ── */}
      <div>
        <div className="relative">
          <img src="/assets/ui/MiniTab.png" alt="" className="block w-full select-none" draggable={false} />
          <span className="absolute left-[17%] top-1/2 -translate-y-1/2 font-galmuri9 text-[12px] text-ink">
            TODAY REPORT
          </span>
        </div>
        <div className="relative">
          <img src="/assets/ui/WriteBlank.png" alt="" className="block w-full select-none" draggable={false} />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘 하루를 기록해보세요"
            className="no-scrollbar absolute inset-[6%] resize-none bg-transparent font-galmuri11 text-[10px] leading-relaxed text-ink outline-none placeholder:text-ink-dim"
          />
        </div>
      </div>

      {/* ── 하단 버튼 ── */}
      <div className="mt-1 flex items-center justify-between px-[4%]">
        <button onClick={() => navigate('/')} aria-label="홈으로" className="w-[15%]">
          <img src="/assets/ui/Back.png" alt="" className="block w-full select-none" draggable={false} />
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          aria-label={submitting ? '저장 중' : '작성 완료'}
          className="w-[42%] disabled:opacity-50"
        >
          <img src="/assets/ui/Send.png" alt="" className="block w-full select-none" draggable={false} />
        </button>

        {/* 도움말 모달은 s1-4에서 제작 예정 — 지금은 버튼만 */}
        <button aria-label="도움말" className="w-[15%]">
          <img src="/assets/ui/Support.png" alt="" className="block w-full select-none" draggable={false} />
        </button>
      </div>
    </div>
  )
}