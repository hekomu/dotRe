import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

# ── 조절 상수 ────────────────────────────────────────────────

FRINGE_MIN    = 115   # 가장자리에서 이 밝기 이상이면 배경 잔재로 간주
FRINGE_SAT    = 60    # 배경 잔재로 볼 최대 채도
FRINGE_ITERS  = 4     # 깎아낼 최대 겹 수

SHRINK = 1    # 무조건 깎아낼 겹 수

SOFT_MIN      = 150   # 배경으로 흡수할 최소 밝기 (그림자 포함)
SOFT_SAT      = 45    # 배경으로 흡수할 최대 채도
HOLE_MIN      = 244   # 내부 구멍 판정 밝기 (더 엄격)
HOLE_SAT      = 10
HOLE_MAX_AREA = 0.12  # 이 비율보다 큰 내부 흰 영역은 보존
MIN_PIECE     = 0.02  # 이 비율보다 작은 조각은 제거
PAD           = 12    # 사방 여백 (px)
OUT_SIZE      = None  # 정수로 두면 그 크기로 축소. None이면 원본 유지


def white_balance(arr):
    """배경을 흰색 기준으로 정규화 — 조명 색 틀어짐 제거"""
    f = arr.astype(np.float64)
    ref = np.array([np.percentile(f[:, :, c], 99) for c in range(3)])
    ref[ref < 1] = 1
    return np.clip(f * (ref.max() / ref), 0, 255)


def background_mask(f):
    """테두리에서 이어진 밝은 무채색 영역 = 배경. 그림자도 흡수"""
    mn = f.min(axis=2)
    sat = f.max(axis=2) - mn
    soft = (mn >= SOFT_MIN) & (sat <= SOFT_SAT)

    lbl, n = ndimage.label(soft)
    border = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
    border.discard(0)
    bg = np.isin(lbl, list(border))

    # 손잡이 구멍처럼 안쪽에 갇힌 작고 새하얀 영역도 배경으로
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


def defringe(alpha, f):
    """가장자리의 밝은 잔재를 한 겹씩 제거 — 어두운 외곽선에서 멈춤"""
    mn = f.min(axis=2)
    sat = f.max(axis=2) - mn
    light = (mn >= FRINGE_MIN) & (sat <= FRINGE_SAT)

    
    cross = ndimage.generate_binary_structure(2, 1)
    a = alpha.copy()
    for _ in range(FRINGE_ITERS):
        solid = a > 0
        edge = solid & ~ndimage.binary_erosion(solid, cross)
        kill = edge & light
        if not kill.any():
            break
        a[kill] = 0
    return a

def keep_main(alpha):
    """분리된 작은 조각(그림자 잔해) 제거"""
    solid = alpha > 0
    lbl, n = ndimage.label(solid)
    if n <= 1:
        return alpha
    sizes = ndimage.sum(solid, lbl, range(1, n + 1))
    keep = {i + 1 for i, s in enumerate(sizes) if s / solid.size >= MIN_PIECE}
    if not keep:
        keep = {int(np.argmax(sizes)) + 1}
    alpha = alpha.copy()
    alpha[~np.isin(lbl, list(keep))] = 0
    return alpha



def trim_and_center(img):
    """여백 잘라내고 정사각형 가운데 정렬"""
    bbox = img.getbbox()
    if not bbox:
        return img
    obj = img.crop(bbox)
    side = max(obj.width, obj.height) + PAD * 2
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(obj, ((side - obj.width) // 2, (side - obj.height) // 2))
    return canvas


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("usage: postprocess_simple.py <input> <output>", file=sys.stderr)
        sys.exit(2)

    src_path, dst_path = sys.argv[1], sys.argv[2]

    try:
        f = white_balance(np.array(Image.open(src_path).convert("RGB")))
        bg = background_mask(f)

        alpha = np.where(bg, 0, 255).astype(np.uint8)
        alpha = defringe(alpha, f)  
        if SHRINK:                                   # ← 추가
            cross = ndimage.generate_binary_structure(2, 1)
            alpha = np.where(
                ndimage.binary_erosion(alpha > 0, cross, iterations=SHRINK),
                alpha, 0)        # ← 추가
        alpha = keep_main(alpha)

        rgb = f.astype(np.uint8)
        rgb[alpha == 0] = 0                       # 투명부는 검게 (헤일로 방지)
        img = trim_and_center(Image.fromarray(np.dstack([rgb, alpha]), "RGBA"))

        if OUT_SIZE:
            img = img.resize((OUT_SIZE, OUT_SIZE), Image.BOX)

        opaque = float((np.array(img)[:, :, 3] > 0).mean())
        if opaque < 0.02:
            print("EMPTY_RESULT", file=sys.stderr)
            sys.exit(3)

        img.save(dst_path)
        print(json.dumps({"size": img.width, "fill": round(opaque, 3)}))
    except Exception as e:
        print(f"{type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)