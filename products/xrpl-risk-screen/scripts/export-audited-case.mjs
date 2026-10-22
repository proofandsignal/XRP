import { buildAuditedDemoPack } from "../lib/demoEvidenceAudit.mjs"

const id = process.argv[2]
if (!id || process.argv.length !== 3) {
  console.error("Usage: node scripts/export-audited-case.mjs RLUSD-001|RLUSD-002|RLUSD-003")
  process.exitCode = 2
} else {
  try {
    const pack = await buildAuditedDemoPack(id)
    if (!pack) throw new Error("Unknown case ID")
    process.stdout.write(JSON.stringify(pack, null, 2) + "\n")
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
