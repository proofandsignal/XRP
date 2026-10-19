import { NETWORKS, rpc } from "./runtime.mjs"

export function normalizeMptIssuanceId(value) {
  const id = String(value ?? "").toUpperCase()
  if (!/^[0-9A-F]{48}$/.test(id)) throw new Error("Invalid MPTokenIssuanceID")
  return id
}
