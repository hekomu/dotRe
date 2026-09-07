/** 등급별 가격 — 주간 평가 보상(C 50 / B 120 / A 220 / S 350)을 기준으로 조정 */
export const ITEM_PRICES = {
  normal: 40,
  rare:   80,
  epic:   150,
  unique: 280,
};

export function priceOf(rarity) {
  return ITEM_PRICES[rarity] ?? ITEM_PRICES.normal;
}