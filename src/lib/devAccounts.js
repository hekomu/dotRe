/** 개발자 계정 목록 — .env의 VITE_DEV_USER_IDS (콤마 구분) */
const DEV_IDS = new Set(
  (import.meta.env.VITE_DEV_USER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
)

/** 이 계정이 개발자 계정인가 — 하루 1회 제한 같은 UI 제약을 건너뛴다 */
export function isDevAccount(userId) {
  return !!userId && DEV_IDS.has(userId)
}