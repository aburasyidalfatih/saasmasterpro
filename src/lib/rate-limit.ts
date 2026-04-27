/**
 * Rate limiter with Redis support (Upstash) and in-memory fallback.
 *
 * Production: set UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN in .env
 * Development: falls back to in-memory Map automatically.
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// ==================== REDIS-BASED (PRODUCTION) ====================

let redisRatelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  redisRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "smp:ratelimit",
  })
}

// ==================== IN-MEMORY FALLBACK (DEVELOPMENT) ====================

const memoryMap = new Map<string, { count: number; resetAt: number }>()

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = memoryMap.get(key)

  if (!entry || now > entry.resetAt) {
    memoryMap.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count }
}

// Safety: cap in-memory map size to prevent unbounded growth in serverless
const MAX_MAP_SIZE = 10000

// Cleanup stale entries every 60s — unref() so it doesn't prevent process exit
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryMap) {
      if (now > entry.resetAt) memoryMap.delete(key)
    }
    // Emergency clear if map grows too large
    if (memoryMap.size > MAX_MAP_SIZE) memoryMap.clear()
  }, 60000)

  // Allow Node.js to exit naturally without waiting for this timer
  if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref()
  }
}

// ==================== UNIFIED INTERFACE ====================

export async function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<{ success: boolean; remaining: number }> {
  // Use Redis in production
  if (redisRatelimit) {
    const result = await redisRatelimit.limit(key)
    return { success: result.success, remaining: result.remaining }
  }

  // Fallback to in-memory
  return memoryRateLimit(key, limit, windowMs)
}
