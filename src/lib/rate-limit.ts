import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitAction = "publish" | "edit" | "view";

const LIMITS: Record<RateLimitAction, { points: number; window: `${number} ${"s" | "m" | "h" | "d"}` }> = {
  publish: { points: 5, window: "1 d" },
  edit: { points: 20, window: "1 d" },
  view: { points: 30, window: "1 m" },
};

const enabled = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

const redis = enabled ? Redis.fromEnv() : null;

const limiters = new Map<RateLimitAction, Ratelimit>();

function getLimiter(action: RateLimitAction): Ratelimit {
  let limiter = limiters.get(action);
  if (!limiter) {
    const { points, window } = LIMITS[action];
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(points, window),
      prefix: `lloguer:${action}`,
    });
    limiters.set(action, limiter);
  }
  return limiter;
}

/**
 * Returns true when the action is allowed.
 * Mutations ("publish"/"edit") fail closed when Upstash errors; views fail open.
 * When Upstash is not configured (local dev), everything is allowed.
 */
export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string,
): Promise<boolean> {
  if (!redis) return true;
  try {
    const { success } = await getLimiter(action).limit(identifier);
    return success;
  } catch (e) {
    console.error(`rate-limit ${action} failed:`, e);
    return action === "view";
  }
}
