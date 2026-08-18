import "dotenv/config";
import express from "express";
import cors from "cors";
import { requireAuth } from "./lib/auth.js";
import { enqueue } from "./lib/queue.js";
import { generateItem } from "./pipeline/generateItem.js";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

/** 아이템 생성 요청 — 즉시 응답하고 생성은 백그라운드에서 */
app.post("/api/items", requireAuth, async (req, res) => {
  const { diaryId, streakDays = 0 } = req.body;
  if (!diaryId) return res.status(400).json({ error: "diaryId가 필요합니다" });

  // 1. 일기 확인 (본인 것인지, 사진이 있는지)
  const { data: diary, error: dErr } = await supabaseAdmin
    .from("diaries")
    .select("id, user_id, content, photo_url")
    .eq("id", diaryId)
    .single();

  if (dErr || !diary) return res.status(404).json({ error: "일기를 찾을 수 없습니다" });
  if (diary.user_id !== req.user.id) return res.status(403).json({ error: "권한이 없습니다" });
  if (!diary.photo_url) return res.status(400).json({ error: "사진이 없습니다" });

  // 2. 이미 만든 아이템이 있으면 그것을 돌려줌 (중복 생성 방지)
  const { data: existing } = await supabaseAdmin
    .from("items")
    .select("id")
    .eq("diary_id", diaryId)
    .eq("creator_id", req.user.id)
    .maybeSingle();

  if (existing) return res.json({ itemId: existing.id, reused: true });

  // 3. 빈 껍데기 생성 (프론트는 이 id로 Realtime 구독)
  const { data: item, error: iErr } = await supabaseAdmin
    .from("items")
    .insert({
      diary_id: diaryId,
      owner_id: req.user.id,
      creator_id: req.user.id,
      meta_status: "pending"
    })
    .select("id")
    .single();

  if (iErr) return res.status(500).json({ error: iErr.message });

  // 4. 큐에 투입 (기다리지 않음)
  enqueue(diaryId, () =>
    generateItem({
      itemId: item.id,
      userId: req.user.id,
      photoUrl: diary.photo_url,
      textLength: (diary.content || "").length,
      streakDays
    })
  );

  res.json({ itemId: item.id });
});

/** 다시 생성 — 같은 사진으로 한 번 더 */
app.post("/api/items/:itemId/regenerate", requireAuth, async (req, res) => {
  const { itemId } = req.params;

  const { data: item } = await supabaseAdmin
    .from("items")
    .select("id, diary_id, owner_id, creator_id")
    .eq("id", itemId)
    .single();

  if (!item) return res.status(404).json({ error: "아이템을 찾을 수 없습니다" });
  if (item.creator_id !== req.user.id) return res.status(403).json({ error: "권한이 없습니다" });

  const { data: diary } = await supabaseAdmin
    .from("diaries")
    .select("content, photo_url")
    .eq("id", item.diary_id)
    .single();

  if (!diary?.photo_url) return res.status(400).json({ error: "사진이 없습니다" });

  await supabaseAdmin.from("items")
    .update({ meta_status: "pending", error_msg: null })
    .eq("id", itemId);

  enqueue(`regen-${itemId}`, () =>
    generateItem({
      itemId,
      userId: req.user.id,
      photoUrl: diary.photo_url,
      textLength: (diary.content || "").length,
      streakDays: req.body.streakDays || 0
    })
  );

  res.json({ itemId });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`서버 실행 중 → http://localhost:${PORT}`));