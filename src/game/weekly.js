import { CATEGORY_KEYS, CATEGORY_LABELS } from "./statSystem.js";

/** 등급표 — 높은 순. reward는 지급 너트 */
export const GRADE_TABLE = [
  { grade: "S+", min: 8, reward: 500, color: "#f43f5e" },
  { grade: "S",  min: 7, reward: 350, color: "#f59e0b" },
  { grade: "A",  min: 5, reward: 220, color: "#a855f7" },
  { grade: "B",  min: 3, reward: 120, color: "#3b82f6" },
  { grade: "C",  min: 1, reward: 50,  color: "#22c55e" },
  { grade: "F",  min: 0, reward: 0,   color: "#9ca3af" },
];

/** 보너스 카테고리 순환 순서 — 배열을 섞어두면 덜 규칙적으로 보인다 */
const BONUS_CYCLE = [
  "food", "tech", "toy", "plant", "fashion", "stationery",
  "drink", "tool", "accessory", "animal", "misc",
];

const DAY = 24 * 60 * 60 * 1000;

/** 그 날짜가 속한 주의 월요일 00:00 (로컬) */
export function weekStartOf(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

/** Date → 'YYYY-MM-DD' */
export function toKey(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 그 주의 보너스 카테고리 — 주차 번호로 결정되어 누가 언제 봐도 같다 */
export function getBonusCategory(weekStart) {
  const index = Math.floor(weekStart.getTime() / (7 * DAY));
  const key = BONUS_CYCLE[((index % BONUS_CYCLE.length) + BONUS_CYCLE.length) % BONUS_CYCLE.length];
  return { key, label: CATEGORY_LABELS?.[key] ?? key };
}

export function gradeOf(totalCount) {
  return GRADE_TABLE.find((g) => totalCount >= g.min) ?? GRADE_TABLE.at(-1);
}

/** 아이템 목록 → 평가 결과 */
export function evaluate(items, bonusKey) {
  const itemCount = items.length;
  const bonusCount = items.filter((i) => i.category === bonusKey).length;
  const totalCount = itemCount + bonusCount;
  const { grade, reward } = gradeOf(totalCount);
  return { itemCount, bonusCount, totalCount, grade, reward };
}

export { CATEGORY_KEYS };