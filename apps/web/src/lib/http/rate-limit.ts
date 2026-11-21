// ponytail: in-memory sliding window, per-process only. Counters reset on restart and are
// not shared across instances; upgrade to Redis/DB-backed counters if we run >1 instance.
const hits = new Map<string, number[]>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return { ok: true };
}

export function clientIp(request: Request): string {
  // Behind a proxy the first X-Forwarded-For hop is the client; falls back to a shared bucket.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function tooManyRequests(retryAfterSeconds: number): Response {
  return Response.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
