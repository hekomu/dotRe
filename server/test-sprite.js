import { readFile, writeFile } from "node:fs/promises";
import { analyzePhoto } from "./ai/analyze.js";
import { makeSprite } from "./ai/kontext.js";
import { rollRarity, generateItemStats } from "./game/statSystem.js";

const file = process.argv[2];
if (!file) { console.error("usage: node test-sprite.js <image>"); process.exit(2); }

const photo = await readFile(file);

// 1. 등급 먼저 (일기 조건은 테스트용 고정값)
const pre = rollRarity({ textLength: 300, streakDays: 7 });
console.log("등급:", pre.rarity, "/ 총량:", pre.budget);

// 2. 분석 — 등급을 알려줘 작명 톤을 맞춤
const info = await analyzePhoto(photo, pre.rarity);


if (!info.found) {
  console.log("거부:", info.reject_reason);
  process.exit(0);
}

info.subject_phrase = "the plush doll"; //진단용 임시
info.distractors = [];

console.log("이름:", info.name);
console.log("설명:", info.description);
console.log("프롬프트 재료:", info.subject_phrase, "/ 제거:", info.distractors);

import { buildPrompt } from "./ai/kontext.js";
console.log("=== PROMPT ===");
console.log(buildPrompt(info));
console.log("길이:", buildPrompt(info).length);

// 3. 스프라이트 생성
const { sprite, meta } = await makeSprite(photo, info, "image/jpeg", "raw_kontext.png");
await writeFile("sprite_test.png", sprite);
console.log("스프라이트:", meta, "→ sprite_test.png");


// 4. 스탯
const s = generateItemStats({ category: info.category, preRolled: pre });
console.log(s.rarityLabel, s.power, s.stats);