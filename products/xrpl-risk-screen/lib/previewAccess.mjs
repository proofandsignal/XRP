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

function deny(res, status, body, challenge = false) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "pragma": "no-cache",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "vary": "Authorization"
  }
  if (challenge) headers["www-authenticate"] = 'Basic realm="XRPL Private QA", charset="UTF-8"'
  res.writeHead(status, headers)
  res.end(JSON.stringify({ error: body }))
  return false
}

export function authorizePreviewRequest(req, res, env = process.env) {
  if (!previewProtectionRequired(env)) return true

  const user = env.DEMO_USER
  const password = env.DEMO_PASSWORD
  if (typeof user !== "string" || typeof password !== "string" ||
      !user.trim() || !password.trim() || user.includes(":")) {
    return deny(res, 503, "Private preview credentials are not configured")
  }

  const expected = "Basic " + Buffer.from(user + ":" + password, "utf8").toString("base64")
  const supplied = typeof req.headers?.authorization === "string" ? req.headers.authorization : ""
  if (!secureEqual(supplied, expected)) return deny(res, 401, "Authentication required", true)
  return true
}
