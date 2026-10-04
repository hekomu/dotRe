/** 등급 키 → 뱃지 에셋 경로. 실제 rarity 키가 다르면 여기만 고치면 됨 */
export const GRADE_ICON = {
  normal: '/assets/icons/GradeNormal.png',
  rare:   '/assets/icons/GradeRare.png',
  epic:   '/assets/icons/GradeEpic.png',
  unique: '/assets/icons/GradeUnique.png',
}

export const gradeIcon = (r) => GRADE_ICON[r] ?? GRADE_ICON.normal