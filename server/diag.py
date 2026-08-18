import os
import numpy as np
from PIL import Image
import postprocess_one as P

RAW = "raw_kontext.png"
OUT = "diag"
PREVIEW = 8
os.makedirs(OUT, exist_ok=True)

f0 = P.white_balance(np.array(Image.open(RAW).convert("RGB")), P.WARMTH)
bg = P.background_mask(f0)

P.FIXED_GRID = None
print("자동 검출 격자:", P.detect_grid(f0), " / 현재 고정값: 64")

def save(img, name, n):
    img.resize((n * PREVIEW, n * PREVIEW), Image.NEAREST).save(
        os.path.join(OUT, name))

# A. 현재 설정(64)에서 단계별로 저장
P.DETAIL_MIN = 0.40
a = P.pixelize(f0, bg, 64);                          save(a, "A1_pixelize.png", 64)
b = P.center(P.keep_main(a), 64);                    save(b, "A2_keepmain.png", 64)
c = P.uniform_outline(b, strip=P.OUTLINE_STRIP, thick=P.OUTLINE_THICK)
save(c, "A3_outline.png", 64)

# B. 격자만 바꿔서 pixelize 단계 비교
for n in (48, 56, 64, 72, 80, 96):
    save(P.pixelize(f0, bg, n), f"B_grid{n}.png", n)

# C. 격자 64 고정, DETAIL_MIN만 비교
for d in (0.24, 0.32, 0.40):
    P.DETAIL_MIN = d
    save(P.pixelize(f0, bg, 64), f"C_detail{d}.png", 64)

print("완료 → diag 폴더")