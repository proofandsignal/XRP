import { createHash, timingSafeEqual } from "node:crypto"

// The existing research server stays convenient for localhost development.
// All Render-hosted previews and explicitly protected runs fail closed.
export function previewProtectionRequired(env = process.env) {
  return Boolean(env.RENDER_SERVICE_ID) || env.RENDER === "true" || env.PREVIEW_REQUIRE_AUTH === "1"
}

function secureEqual(a, b) {
  const left = createHash("sha256").update(a).digest()
  const right = createHash("sha256").update(b).digest()
  return timingSafeEqual(left, right)
}

// Internal protected QA: bounded, per-immediate-peer failed-auth throttle.
// Never trust client-supplied X-Forwarded-For for identity; shared reverse-proxy
// peers may share a bucket. A public deployment needs a trusted edge limiter.
export function createFailureLimiter({ limit = 20, windowMs = 60_000, lockMs = 60_000,
  maxPeers = 1024, clock = () => Date.now() } = {}) {
  const peers = new Map()
  return {
    recordFailure(req) {
      const now = clock()
      const peer = String(req?.socket?.remoteAddress || "unknown")
      let entry = peers.get(peer)
      if (entry && entry.lockedUntil > now) {
        return { blocked: true, retryAfter: Math.max(1, Math.ceil((entry.lockedUntil - now) / 1000)) }
      }
      if (!entry || entry.windowUntil <= now) {
        if (!entry && peers.size >= maxPeers) {
          for (const [id, state] of peers) {
            if (state.windowUntil <= now && state.lockedUntil <= now) peers.delete(id)
          }
          // A full live table must not grow without bound from rotating peers.
          if (peers.size >= maxPeers) return { blocked: true, retryAfter: Math.ceil(lockMs / 1000) }
        }
        entry = { failures: 0, windowUntil: now + windowMs, lockedUntil: 0 }
        peers.set(peer, entry)
      }
      entry.failures++
      if (entry.failures >= limit) {
        entry.lockedUntil = now + lockMs
        return { blocked: true, retryAfter: Math.ceil(lockMs / 1000) }
      }
      return { blocked: false, retryAfter: 0 }
    }
  }
}

const previewFailureLimiter = createFailureLimiter()

function deny(res, status, body, challenge = false, extraHeaders = {}) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "pragma": "no-cache",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "vary": "Authorization",
    ...extraHeaders
  }
  if (challenge) headers["www-authenticate"] = 'Basic realm="XRPL Private QA", charset="UTF-8"'
  res.writeHead(status, headers)
  res.end(JSON.stringify({ error: body }))
  return false
}

export function authorizePreviewRequest(req, res, env = process.env, limiter = previewFailureLimiter) {
  if (!previewProtectionRequired(env)) return true

  const user = env.DEMO_USER
  const password = env.DEMO_PASSWORD
  if (typeof user !== "string" || typeof password !== "string" ||
      !user.trim() || !password.trim() || user.includes(":")) {
    return deny(res, 503, "Private preview credentials are not configured")
  }

  const expected = "Basic " + Buffer.from(user + ":" + password, "utf8").toString("base64")
  const supplied = typeof req.headers?.authorization === "string" ? req.headers.authorization : ""
  if (!secureEqual(supplied, expected)) {
    const decision = limiter.recordFailure(req)
    if (decision.blocked) return deny(res, 429, "Too many authentication attempts", false, { "retry-after": String(decision.retryAfter) })
    return deny(res, 401, "Authentication required", true)
  }
  return true
}
