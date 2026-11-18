// Private single-instance XRPL preview budget. No outbound calls and no identity
// claims: authenticated scanner requests consume a shared, bounded cost allowance.
// Public/multi-instance services require a separately reviewed edge quota.
export const SCANNER_COSTS = Object.freeze({
  "/api/account": 6, // Trust-line pagination can make account scans expensive.
  "/api/amm": 4,     // Structural cross-check makes multiple upstream calls.
  "/api/mpt": 3      // Issuance plus optional permissioned-domain lookup.
})

export function createScannerBudget({ maxCost = 18, windowMs = 60_000,
  maxConcurrent = 2, clock = () => Date.now() } = {}) {
  if (![maxCost, windowMs, maxConcurrent].every(v => Number.isSafeInteger(v) && v > 0)) {
    throw new Error("Invalid XRPL scanner budget configuration")
  }
  let windowStart = clock()
  let spent = 0
  let inFlight = 0
  const noop = () => {}

  return {
    acquire(method, path) {
      const cost = method === "GET" ? SCANNER_COSTS[path] : undefined
      if (!cost) return { allowed: true, cost: 0, release: noop }
      const now = clock()
      if (now < windowStart || now - windowStart >= windowMs) {
        windowStart = now
        spent = 0
      }
      if (spent + cost > maxCost) {
        return { allowed: false, error: "XRPL_RPC_BUDGET_EXCEEDED",
          retryAfter: Math.max(1, Math.ceil((windowStart + windowMs - now) / 1_000)) }
      }
      if (inFlight >= maxConcurrent) {
        return { allowed: false, error: "XRPL_RPC_CONCURRENCY_LIMIT", retryAfter: 1 }
      }
      spent += cost
      inFlight += 1
      let released = false
      return {
        allowed: true, cost,
        release() {
          if (released) return
          released = true
          inFlight -= 1
        }
      }
    }
  }
}
