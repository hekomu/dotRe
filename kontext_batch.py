import os, glob, replicate, requests

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "kontext_test")
OUT = os.path.join(SRC, "out")
os.makedirs(OUT, exist_ok=True)

SUBJECTS = {
    #"doll.jpg":  "the plush doll",
    "cake.jpg":  "the slice of cake",
    #"shoes.jpg": "the pair of sneakers",
    "mug.jpg":   "a single mug",
    "switch.jpg":  "the handheld game console",
}

TEMPLATE = (
    "Convert {s} into a single pixel art game item sprite. "
    "Show only {s} by itself — remove every other object, "
    "including plates, cutlery, hands, tables and duplicate items. "
    "Chunky visible pixels, dark outline, flat limited color palette, "
    "no shadow, plain white background. "
    "Keep {s} exactly the same object with the same shape, "
    "proportions and viewing angle."
)

for fname, subject in SUBJECTS.items():
    path = os.path.join(SRC, fname)
    if not os.path.exists(path):
        print(f"건너뜀 (파일 없음): {fname}")
        continue

    print(f"생성 중: {fname}")
    with open(path, "rb") as f:
        out = replicate.run(
            "black-forest-labs/flux-kontext-pro",
            input={
                "input_image": f,
                "prompt": TEMPLATE.format(s=subject),
                "output_format": "png",
                "aspect_ratio": "1:1",
            },
        )
    dst = os.path.join(OUT, os.path.splitext(fname)[0] + "_pixel.png")
    with open(dst, "wb") as f:
        f.write(requests.get(str(out)).content)
    print(f"  저장: {dst}")

print("완료")