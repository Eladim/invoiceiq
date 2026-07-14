import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "@/lib/env";

/**
 * Upload rate limiter (SPEC §9): 10 uploads per minute per user, sliding window,
 * backed by Upstash Redis so the counter is shared across serverless instances.
 *
 * Optional by design — if the Upstash env vars aren't set (e.g. local dev), the
 * limiter is disabled and `checkUploadRateLimit` allows every request.
 */
const limiter =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: env.UPSTASH_REDIS_REST_URL,
          token: env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(10, "60 s"),
        prefix: "ratelimit:upload",
        analytics: true,
      })
    : null;

/** Returns `true` if the request is within the limit (or the limiter is off). */
export async function checkUploadRateLimit(userId: string): Promise<boolean> {
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit(userId);
    return success;
  } catch (err) {
    // Never let a limiter outage block a legitimate upload — fail open.
    console.error("Rate limiter error (allowing request):", err);
    return true;
  }
}
