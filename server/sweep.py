import os
import numpy as np
from PIL import Image
import postprocess_one as P

RAW = "raw_kontext.png"
OUT = "sweep"
os.makedirs(OUT, exist_ok=True)

f = P.white_balance(np.array(Image.open(RAW).convert("RGB")), P.WARMTH)
bg = P.background_mask(f)

def run(tag, n, outline=True):
    img = P.center(P.keep_main(P.pixelize(f, bg, n)), n)
    if outline:
        img = P.uniform_outline(img)
    img.resize((n * 8, n * 8), Image.NEAREST).save(os.path.join(OUT, tag + ".png"))

P.FIXED_GRID = None
print("자동 검출:", P.detect_grid(f))

# A. 격자 스윕 (외곽선 재작성 켬)
for g in (32, 40, 48, 56, 60, 64, 72):
    run(f"A_grid{g}", g)

# B. 격자 스윕 (외곽선 재작성 끔) — uniform_outline 영향 확인
for g in (32, 40, 48, 56, 60, 64, 72):
    run(f"B_noline{g}", g, outline=False)

for v in (0.36, 0.42, 0.48, 0.55):
    P.DETAIL_MIN = v
    run(f"d{v}", 72)

print("완료 → sweep 폴더")