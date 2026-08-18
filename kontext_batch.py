import os, glob, replicate, requests

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "kontext_test")
OUT = os.path.join(SRC, "out")
os.makedirs(OUT, exist_ok=True)

SUBJECTS = {
    "doll":  "the plush doll",
    "cake":  "the slice of cake",
    "shoes": "the pair of sneakers",
    "mug":   "a single mug",
    "switch":  "the handheld game console",
    "Sky" : "the sky",
    "selfie" : "One's selfie"
}
# 얼굴/표정이 있는 아이템만 등록
FACE_ITEMS = {"doll"}

TEMPLATE = (
    "Convert {s} into a single pixel art game item sprite. "
    "Show only {s} by itself — remove every other object, "
    "including plates, cutlery, hands, tables and duplicate items. "
    "Chunky visible pixels, dark outline, flat limited color palette. "
    "Isolated cutout sticker with nothing beneath it, no shadow. "
    "Neutral white balance, pure white background. "
    "{extra}"
    "Keep {s} exactly the same object with the same shape, "
    "proportions and viewing angle."
)

FACE_CLAUSE = "Keep the face expression clear and readable. "


for stem, subject in SUBJECTS.items():
    matches = glob.glob(os.path.join(SRC, stem + ".*"))
    matches = [m for m in matches
               if m.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]
    if not matches:
        print(f"건너뜀: {stem}")
        continue

    path = matches[0]
    print(f"생성 중: {os.path.basename(path)}")

    extra = FACE_CLAUSE if stem in FACE_ITEMS else ""      # ← 추가
    prompt = TEMPLATE.format(s=subject, extra=extra)       # ← 추가


    with open(path, "rb") as f:
        
        out = replicate.run(
            "black-forest-labs/flux-kontext-pro",
            input={
                "input_image": f,
                "prompt": prompt,                          # ← 여기도 변경
                "output_format": "png",
                "aspect_ratio": "1:1",
            },
        )

    dst = os.path.join(OUT, stem + "_pixel.png")
    with open(dst, "wb") as f:
        f.write(requests.get(str(out)).content)
    print(f"  저장: {dst}")

print("완료")