import "dotenv/config";
import express from "express";
import cors from "cors";
import { requireAuth } from "./lib/auth.js";
import { enqueue } from "./lib/queue.js";
import { generateItem } from "./pipeline/generateItem.js";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { weekStartOf, toKey, getBonusCategory, evaluate } from "./game/weekly.js";


const DEV_IDS = new Set(
  (process.env.DEV_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean)
);

/** 오늘 00:00 (서버 로컬 기준) */
function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 오늘 이미 아이템을 만들었는지 확인.
 * failed 상태는 세지 않는다 — 실패로 하루를 날리면 안 되니까.
 */
async function madeItemToday(userId) {
  if (DEV_IDS.has(userId)) return false;

  const { data, error } = await supabaseAdmin
    .from("items")
    .select("id")
    .eq("creator_id", userId)
    .eq("owner_id", userId)
    .neq("meta_status", "failed")
    .gte("created_at", todayStart().toISOString())
    .limit(1);
  if (error) throw error;
  return data.length > 0;
}

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
  if (await madeItemToday(req.user.id)) {
    return res.status(429).json({
      error: "오늘은 이미 아이템을 만들었어요. 내일 다시 만나요!",
    });
  }

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
    .select("id, diary_id, owner_id, creator_i, meta_status")
    .eq("id", itemId)
    .single();

  if (!item) return res.status(404).json({ error: "아이템을 찾을 수 없습니다" });

  if (item.creator_id !== req.user.id) return res.status(403).json({ error: "권한이 없습니다" });

  if (regen && item.meta_status !== "failed" && !DEV_IDS.has(req.user.id)) {
    return res.status(429).json({
      error: "다시 뽑기는 하루에 한 번만 가능해요.",
    });
  }
  const { data: regen } = await supabaseAdmin
    .from("items")
    .select("id")
    .eq("id", itemId)
    .gte("regenerated_at", todayStart().toISOString())
    .maybeSingle();

  if (regen && !DEV_IDS.has(req.user.id)) {
    return res.status(429).json({
      error: "다시 뽑기는 하루에 한 번만 가능해요.",
    });
  }

  const { data: diary } = await supabaseAdmin
    .from("diaries")
    .select("content, photo_url")
    .eq("id", item.diary_id)
    .single();

  if (!diary?.photo_url) return res.status(400).json({ error: "사진이 없습니다" });

  await supabaseAdmin.from("items")
    .update({ meta_status: "pending", error_msg: null, regenerated_at: new Date().toISOString() })
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


//주간평가
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS_SHOWN = 4;

/** 한 주 치를 계산해서 돌려준다 */
async function buildWeek(userId, start, claimedMap) {
  const end = new Date(start.getTime() + 7 * DAY_MS);
  const bonus = getBonusCategory(start);

  const { data: items, error } = await supabaseAdmin
    .from("items")
    .select("id, name, category, image_url, rarity")
    .eq("creator_id", userId)
    .eq("owner_id", userId)
    .eq("meta_status", "done")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;

  const result = evaluate(items, bonus.key);
  const key = toKey(start);
  const isCurrent = key === toKey(weekStartOf());
  const isSunday = new Date().getDay() === 0;

  return {
    weekStart: key,
    bonusCategory: bonus.key,
    bonusLabel: bonus.label,
    ...result,
    items: items.slice(0, 7),
    claimed: !!claimedMap[key],
    claimable: !claimedMap[key] && result.reward > 0 && (!isCurrent || isSunday),
    isCurrent,
    isSunday,
  };
}

/** 최근 4주 평가 현황 */
app.get("/api/weekly", requireAuth, async (req, res) => {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("nuts").eq("id", req.user.id).single();

    const { data: claims } = await supabaseAdmin
      .from("weekly_evaluations").select("week_start").eq("user_id", req.user.id);

    const claimedMap = Object.fromEntries((claims || []).map((c) => [c.week_start, true]));

    const base = weekStartOf();
    const weeks = [];
    for (let i = 0; i < WEEKS_SHOWN; i++) {
      const start = new Date(base.getTime() - i * 7 * DAY_MS);
      weeks.push(await buildWeek(req.user.id, start, claimedMap));
    }

    res.json({ nuts: profile?.nuts ?? 0, weeks });
  } catch (err) {
    console.error("[weekly]", err);
    res.status(500).json({ error: "평가 정보를 불러오지 못했습니다" });
  }
});

/** 보상 수령 */
app.post("/api/weekly/claim", requireAuth, async (req, res) => {
  const { weekStart } = req.body;
  if (!weekStart) return res.status(400).json({ error: "weekStart가 필요합니다" });

  try {
    const start = new Date(`${weekStart}T00:00:00`);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ error: "잘못된 날짜입니다" });
    }

    const week = await buildWeek(req.user.id, start, {});
    if (week.reward <= 0) return res.status(400).json({ error: "받을 보상이 없습니다" });

    const isCurrent = weekStart === toKey(weekStartOf());
    if (isCurrent && new Date().getDay() !== 0) {
      return res.status(400).json({ error: "평가는 일요일에 열려요" });
    }

    // unique 제약이 중복 수령을 막는다
    const { error: insErr } = await supabaseAdmin.from("weekly_evaluations").insert({
      user_id: req.user.id,
      week_start: weekStart,
      item_count: week.itemCount,
      bonus_category: week.bonusCategory,
      bonus_count: week.bonusCount,
      total_count: week.totalCount,
      grade: week.grade,
      reward: week.reward,
    });
    if (insErr) {
      if (insErr.code === "23505") {
        return res.status(400).json({ error: "이미 수령한 주간 평가입니다" });
      }
      throw insErr;
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles").select("nuts").eq("id", req.user.id).single();
    const nuts = (profile?.nuts ?? 0) + week.reward;

    await supabaseAdmin.from("profiles").update({ nuts }).eq("id", req.user.id);

    res.json({ ok: true, grade: week.grade, reward: week.reward, nuts });
  } catch (err) {
    console.error("[weekly/claim]", err);
    res.status(500).json({ error: "보상 수령에 실패했습니다" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`서버 실행 중 → http://localhost:${PORT}`));