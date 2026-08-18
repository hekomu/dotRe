import { supabaseAdmin } from "./lib/supabaseAdmin.js";

// 1. 테이블 접근 확인
const { data, error } = await supabaseAdmin
  .from("items")
  .select("id, name, meta_status")
  .limit(3);

if (error) {
  console.error("DB 오류:", error.message);
  process.exit(1);
}
console.log("items 조회 성공:", data);

// 2. Storage 버킷 확인
const { data: buckets, error: sErr } = await supabaseAdmin.storage.listBuckets();
if (sErr) {
  console.error("Storage 오류:", sErr.message);
  process.exit(1);
}
console.log("버킷:", buckets.map((b) => b.name));