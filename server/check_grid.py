import glob
import numpy as np
from PIL import Image
import postprocess_one as P

P.FIXED_GRID = None   # 자동 검출 강제

targets = sorted(glob.glob("../kontext_test/out/*.png")) + ["raw_kontext.png"]

for path in targets:
    f = P.white_balance(np.array(Image.open(path).convert("RGB")), P.WARMTH)
    print(f"{P.detect_grid(f):>3}  {path}")