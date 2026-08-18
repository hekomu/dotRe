import "dotenv/config";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import path from "node:path";
import Replicate from "replicate";

const run = promisify(execFile);
const replicate = new Replicate();

const PY = process.env.PYTHON_BIN;
const SCRIPT = process.env.POSTPROCESS_PY;

/** 분석 결과로 Kontext 프롬프트를 조립 */
export function buildPrompt({ subject_phrase: s, distractors = [], has_face }) {
  return [
    `Convert ${s} into a single pixel art game item sprite.`,
    `Show only ${s} by itself — remove every other object,`,
    "including plates, cutlery, hands, tables and duplicate items.",
    "Chunky visible pixels, dark outline, flat limited color palette.",
    "Isolated cutout sticker with nothing beneath it, no shadow.",
    "Neutral white balance, pure white background.",
    has_face ? "Keep the face expression clear and readable." : "",
    `Keep ${s} exactly the same object with the same shape, proportions and viewing angle.`
  ].filter(Boolean).join(" ");
}

/** 원본 사진 버퍼 + 분석 결과 → 후처리까지 끝난 투명 PNG 버퍼 */
export async function makeSprite(photoBuffer, info, mimeType = "image/jpeg", keepRaw = null) {
  const id = randomUUID();
  const rawPath = path.join(tmpdir(), `dotre_${id}_raw.png`);
  const outPath = path.join(tmpdir(), `dotre_${id}.png`);

  try {
    const dataUrl = `data:${mimeType};base64,${photoBuffer.toString("base64")}`;
    const result = await replicate.run("black-forest-labs/flux-kontext-pro", {
      input: {
        input_image: new Blob([photoBuffer], { type: mimeType }),
        prompt: buildPrompt(info),
        output_format: "png",
        aspect_ratio: "1:1"
      }
    });

    const url = Array.isArray(result) ? String(result[0]) : String(result);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`DOWNLOAD_FAILED_${res.status}`);
    await writeFile(rawPath, Buffer.from(await res.arrayBuffer()));

    const { stdout } = await run(PY, [SCRIPT, rawPath, outPath], { timeout: 90_000 });
    const meta = JSON.parse(stdout.trim());

    return { sprite: await readFile(outPath), meta };
  } finally {
    if (keepRaw) {
      await writeFile(keepRaw, await readFile(rawPath).catch(() => Buffer.alloc(0)));
    }
    await Promise.allSettled([unlink(rawPath), unlink(outPath)]);
  }
}