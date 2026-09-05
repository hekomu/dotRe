import { analyzePhoto, REJECT_MESSAGE } from "../ai/analyze.js";
import { makeSprite } from "../ai/kontext.js";
import { rollRarity, generateItemStats } from "../game/statSystem.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

const BUCKET = "item-images";

async function fail(itemId, msg) {
  await supabaseAdmin.from("items")
    .update({ meta_status: "failed", error_msg: msg })
    .eq("id", itemId);
}

export async function generateItem({ itemId, userId, photoUrl,
                                     textLength = 0, streakDays = 0 }) {
  try {
    // 1. 원본 사진 로드
    const res = await fetch(photoUrl);
    if (!res.ok) throw new Error("PHOTO_FETCH_FAILED");
    const mime = res.headers.get("content-type") || "image/jpeg";
    const photo = Buffer.from(await res.arrayBuffer());

    // 2. 등급 먼저 굴리고, 그 등급을 알려주며 분석 (작명 톤을 맞추기 위함)
    const pre = rollRarity({ textLength, streakDays });
    const info = await analyzePhoto(photo, pre.rarity);

    if (!info.found) {
      await fail(itemId,
        REJECT_MESSAGE[info.reject_reason] || REJECT_MESSAGE.no_object);
      return { ok: false, reason: info.reject_reason };
    }

    // 3. 스프라이트 생성 (Kontext + 파이썬 후처리)
    const { sprite } = await makeSprite(photo, info, mime);

    // 4. Storage 업로드
    const { data: prev } = await supabaseAdmin
      .from("items").select("image_url").eq("id", itemId).maybeSingle();

    const key = `${userId}/${itemId}_${Date.now()}.png`;
    const up = await supabaseAdmin.storage.from(BUCKET)
      .upload(key, sprite, { contentType: "image/png", upsert: true });
    if (up.error) throw up.error;

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key);

    // 이전 이미지 정리 (실패해도 진행)
    if (prev?.image_url) {
      const oldPath = prev.image_url.split(`/${BUCKET}/`)[1];
      if (oldPath) {
        await supabaseAdmin.storage.from(BUCKET)
          .remove([decodeURIComponent(oldPath)])
          .catch(() => {});
      }
    }

    // 5. 스탯 (등급은 재사용 — 두 번 굴리면 이름과 스탯이 어긋남)
    const s = generateItemStats({ category: info.category, preRolled: pre });

    // 6. DB 반영 → 프론트가 Realtime으로 수신
    const { error } = await supabaseAdmin.from("items").update({
      image_url:   pub.publicUrl,
      name:        info.name,
      description: info.description,
      category:    info.category,
      rarity:      s.rarity,
      stats:       s.stats,
      power:       s.power,
      diary_score: s.diaryScore,
      meta_status: "done",
      error_msg:   null
    }).eq("id", itemId);
    if (error) throw error;

    return { ok: true, itemId };
  } catch (err) {
    console.error("[generateItem]", itemId, err);
    await fail(itemId, "아이템 생성에 실패했어요. 잠시 후 다시 시도해주세요");
    return { ok: false, reason: "error" };
  }
}