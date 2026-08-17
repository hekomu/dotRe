import os, glob
import numpy as np
from PIL import Image
from scipy import ndimage

BASE = os.path.dirname(os.path.abspath(__file__))
SRC  = os.path.join(BASE, "kontext_test", "out")
DST  = os.path.join(SRC, "final")
os.makedirs(DST, exist_ok=True)

FIXED_GRID    = 64     # 전 아이템 통일. 디테일 부족하면 96
CANDIDATES    = [32, 40, 48, 56, 64, 72, 80, 96]
COLORS        = 32
WARMTH        = 0.0
PREVIEW       = 8

SOFT_MIN      = 150   # 배경으로 흡수할 최소 밝기 (그림자 포함)
SOFT_SAT      = 28    # 배경으로 흡수할 최대 채도
HOLE_MIN      = 244
HOLE_SAT      = 10
HOLE_MAX_AREA = 0.12
OPAQUE_MIN    = 0.45   # 블록에서 이 비율 이상 전경이면 칠함
DETAIL_MIN    = 0.40   # 이 비율만 차지해도 후보로 인정
DARK_GAP      = 50     # 다수색보다 이만큼 어두우면 디테일로 판단 45

OUTLINE_STRIP = 2    # 외곽선 탐색 깊이
OUTLINE_THICK = 1
OUTLINE_TOL   = 70   # 외곽선으로 볼 밝기 여유
OUTLINE_SAT   = 40   # 외곽선으로 볼 최대 채도


def uniform_outline(img, strip=OUTLINE_STRIP, thick=OUTLINE_THICK):
    """가장자리의 '어둡고 무채색인' 픽셀만 외곽선으로 보고 재작성"""
    arr = np.array(img)
    solid = arr[:, :, 3] > 0
    if solid.sum() < 8:
        return img

    rgb = arr[:, :, :3].astype(int)
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    sat = rgb.max(axis=2) - rgb.min(axis=2)

    dy, dx = np.unravel_index(
        np.argmin(np.where(solid, lum, np.inf)), lum.shape)
    dark = arr[dy, dx, :3].copy()

    # 가장자리에서 strip 이내 + 어둡고 + 채도 낮음 → 외곽선으로 판정
    dist = ndimage.distance_transform_edt(solid)
    is_line = (solid & (dist <= strip) &
               (lum <= lum[dy, dx] + OUTLINE_TOL) &
               (sat <= OUTLINE_SAT))

    keep = solid & ~is_line
    if keep.any() and is_line.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~keep, return_indices=True)
        arr[:, :, :3] = np.where(is_line[:, :, None],
                                 arr[:, :, :3][iy, ix], arr[:, :, :3])

    cross = ndimage.generate_binary_structure(2, 1)
    inner = ndimage.binary_erosion(solid, cross, iterations=thick)
    arr[solid & ~inner, :3] = dark
    return Image.fromarray(arr, "RGBA")

def white_balance(arr, warmth):
    f = arr.astype(np.float64)
    ref = np.array([np.percentile(f[:, :, c], 99) for c in range(3)])
    ref[ref < 1] = 1
    f = np.clip(f * (ref.max() / ref), 0, 255)
    if warmth > 0:
        f[:, :, 0] *= (1 - 0.08 * warmth)
        f[:, :, 2] *= (1 + 0.08 * warmth)
        f = np.clip(f, 0, 255)
    return f


def background_mask(f):
    """어두운 외곽선에서 멈추는 배경 판정 — 그림자는 배경으로 흡수"""
    mn = f.min(axis=2)
    sat = f.max(axis=2) - mn
    soft = (mn >= SOFT_MIN) & (sat <= SOFT_SAT)

    lbl, n = ndimage.label(soft)
    border = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
    border.discard(0)
    bg = np.isin(lbl, list(border))

    strict = (mn >= HOLE_MIN) & (sat <= HOLE_SAT)
    for i in range(1, n + 1):
        if i in border:
            continue
        comp = lbl == i
        if comp.sum() / lbl.size > HOLE_MAX_AREA:
            continue
        if strict[comp].mean() >= 0.9:
            bg |= comp
    return bg


def detect_grid(f):
    if FIXED_GRID:
        return FIXED_GRID
    g = f.mean(axis=2)
    prof = np.abs(np.diff(g, axis=1)).sum(axis=0)
    prof = prof - prof.mean()
    W = g.shape[1]
    best, best_score = CANDIDATES[0], -1e18
    for n in CANDIDATES:
        idx = np.round(np.arange(1, n) * (W / n)).astype(int) - 1
        idx = idx[(idx >= 0) & (idx < len(prof))]
        if len(idx) == 0:
            continue
        s = prof[idx].mean()
        if s > best_score:
            best, best_score = n, s
    return best


def pixelize(f, bg, n):
    """블록별 대표색 선택 — 어두운 소수색은 우선 보존"""
    q = Image.fromarray(f.astype(np.uint8)).quantize(
        colors=COLORS, method=Image.MEDIANCUT)
    idx = np.array(q)
    pal = np.array(q.getpalette()[:COLORS * 3]).reshape(-1, 3)
    lum = pal @ np.array([0.299, 0.587, 0.114])

    H, W = idx.shape
    by = np.broadcast_to((np.arange(H) * n // H)[:, None], (H, W))
    bx = np.broadcast_to((np.arange(W) * n // W)[None, :], (H, W))

    counts = np.zeros((n, n, COLORS))
    fg = ~bg
    np.add.at(counts, (by[fg], bx[fg], idx[fg]), 1)

    total = np.zeros((n, n))
    np.add.at(total, (by, bx), 1)

    filled = counts.sum(axis=2)
    share = counts / np.maximum(filled[:, :, None], 1)

    major = counts.argmax(axis=2)
    major_lum = lum[major]

    # 다수색보다 충분히 어두우면서 최소 점유율을 넘는 색을 후보로
    cand = (share >= DETAIL_MIN) & \
           (lum[None, None, :] <= major_lum[:, :, None] - DARK_GAP)
    darkest = np.where(cand, lum[None, None, :], np.inf).argmin(axis=2)
    chosen = np.where(cand.any(axis=2), darkest, major)

    color = pal[chosen]
    alpha = np.where(filled / np.maximum(total, 1) >= OPAQUE_MIN, 255, 0)
    color[alpha == 0] = 0
    return Image.fromarray(
        np.dstack([color, alpha]).astype(np.uint8), "RGBA")


def keep_main(img):
    """분리된 조각(그림자·받침) 제거 — 가장 큰 덩어리만 유지"""
    arr = np.array(img)
    solid = arr[:, :, 3] > 0
    lbl, n = ndimage.label(solid)
    if n <= 1:
        return img
    sizes = ndimage.sum(solid, lbl, range(1, n + 1))
    main = int(np.argmax(sizes)) + 1
    arr[(lbl != main) & solid] = 0
    return Image.fromarray(arr, "RGBA")

def center(img, size):
    """크기 변경 없이 여백만 정리"""
    bbox = img.getbbox()
    if not bbox:
        return img
    obj = img.crop(bbox)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(obj, ((size - obj.width) // 2, (size - obj.height) // 2))
    return canvas


for path in sorted(glob.glob(os.path.join(SRC, "*.png"))):
    name = os.path.splitext(os.path.basename(path))[0]
    f = white_balance(np.array(Image.open(path).convert("RGB")), WARMTH)

    bg = background_mask(f)
    n = detect_grid(f)
    img = center(keep_main(pixelize(f, bg, n)), n)

    #img.save(os.path.join(DST, f"{name}.png"))
    img = uniform_outline(center(keep_main(pixelize(f, bg, n)), n))
    img.resize((n * PREVIEW, n * PREVIEW), Image.NEAREST).save(
        os.path.join(DST, f"{name}@{PREVIEW}x.png"))
    print(f"{name}: 격자 {n}px, 채움 {(np.array(img)[:,:,3]>0).mean():.0%}")

print("완료")