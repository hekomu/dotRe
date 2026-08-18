/** 작업을 하나씩 순서대로 처리하는 최소 큐 (Redis 불필요) */
const pending = new Set();
let chain = Promise.resolve();

export function enqueue(key, task) {
  if (pending.has(key)) return false;   // 같은 일기 중복 요청 차단
  pending.add(key);

  chain = chain
    .then(() => task())
    .catch((e) => console.error("[queue]", key, e))
    .finally(() => pending.delete(key));

  return true;
}