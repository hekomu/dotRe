import os, glob
import numpy as np
from PIL import Image
from scipy import ndimage

BASE = os.path.dirname(os.path.abspath(__file__))

FIXED_GRID    = None     # 전 아이템 통일. 디테일 부족하면
CANDIDATES    = [56, 60, 64, 72]
COLORS        = 32
WARMTH        = 0.0
PREVIEW       = 8

SOFT_MIN      = 150   # 배경으로 흡수할 최소 밝기 (그림자 포함)
SOFT_SAT      = 28    # 배경으로 흡수할 최대 채도
HOLE_MIN      = 244
HOLE_SAT      = 10
HOLE_MAX_AREA = 0.12
OPAQUE_MIN    = 0.45   # 블록에서 이 비율 이상 전경이면 칠함
DETAIL_MIN    = 0.36   # 이 비율만 차지해도 후보로 인정
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

    # 가로·세로 양방향의 경계 강도
    ex = np.abs(np.diff(g, axis=1)).sum(axis=0)
    ey = np.abs(np.diff(g, axis=0)).sum(axis=1)
    prof = ex + ey[:len(ex)]
    prof = prof - prof.mean()

    W = g.shape[1]
    scores = []
    for n in CANDIDATES:
        step = W / n
        on, off = [], []
        for i in range(len(prof)):
            # 격자선 위치에 얼마나 가까운지
            d = abs(((i + 1) % step) - step / 2)
            (on if d > step / 2 - 1.2 else off).append(prof[i])
        if not on or not off:
            continue
        # 격자선 위 강도가 그 외보다 얼마나 높은가
        scores.append((np.mean(on) - np.mean(off), n))

    if not scores:
        return CANDIDATES[0]
    return max(scores)[1]


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


if __name__ == "__main__":
    import sys, json

    if len(sys.argv) < 3:
        print("usage: postprocess_one.py <input> <output>", file=sys.stderr)
        sys.exit(2)

    src_path, dst_path = sys.argv[1], sys.argv[2]

    try:
        f = white_balance(np.array(Image.open(src_path).convert("RGB")), WARMTH)
        bg = background_mask(f)
        n = detect_grid(f)
        img = uniform_outline(center(keep_main(pixelize(f, bg, n)), n))

        opaque = float((np.array(img)[:, :, 3] > 0).mean())
        if opaque < 0.02:
            print("EMPTY_RESULT", file=sys.stderr)
            sys.exit(3)

        img.save(dst_path)
        print(json.dumps({"grid": int(n), "fill": round(opaque, 3)}))
    except Exception as e:
        print(f"{type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)