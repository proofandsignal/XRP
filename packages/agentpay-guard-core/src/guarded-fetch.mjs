import {
  compatibleRequirements,
  readPaymentRequired,
  requirementToIntent
} from "./protocol.mjs";

export class X402GuardError extends Error {
  constructor(message, evidence) {
    super(message);
    this.name = "X402GuardError";
    this.evidence = evidence;
  }
}

export function createGuardedX402Fetch({
  rawFetch,
  payingFetch,
  evaluatePaymentIntent,
  policy,
  facilitatorUrl
}) {
  if (typeof rawFetch !== "function") throw new Error("rawFetch required");
  if (typeof payingFetch !== "function") throw new Error("payingFetch required");
  if (typeof evaluatePaymentIntent !== "function") {
    throw new Error("evaluatePaymentIntent required");
  }

  return async function guardedX402Fetch(url, init = {}) {
    const probe = await rawFetch(url, init);

    if (probe.status !== 402) {
      return {
        response: probe,
        guard: {
          decision: "NO_PAYMENT_REQUIRED",
          paying_fetch_invoked: false
        }
      };
    }

    let paymentRequired;
    try {
      paymentRequired = await readPaymentRequired(probe);
    } catch (error) {
      throw new X402GuardError(error.message, {
        decision: "BLOCK",
        reason: error.message,
        paying_fetch_invoked: false
      });
    }

    const candidates = compatibleRequirements(paymentRequired);

    if (candidates.length === 0) {
      throw new X402GuardError("NO_COMPATIBLE_XRPL_REQUIREMENT", {
        decision: "BLOCK",
        reason: "NO_COMPATIBLE_XRPL_REQUIREMENT",
        paying_fetch_invoked: false
      });
    }

    const evaluations = [];

    for (const requirement of candidates) {
      let intent;
      try {
        intent = requirementToIntent({
          paymentRequired,
          requirement,
          facilitatorUrl
        });
      } catch (error) {
        evaluations.push({
          requirement,
          intent: null,
          decision: {
            decision: "BLOCK",
            reasons: [error.message]
          }
        });
        continue;
      }

      const decision = evaluatePaymentIntent(intent, policy);
      evaluations.push({ requirement, intent, decision });
    }

    const allowed = evaluations.filter(
      (item) => item.decision?.decision === "ALLOW"
    );
    const reviews = evaluations.filter(
      (item) => item.decision?.decision === "REVIEW"
    );

    if (allowed.length > 1) {
      throw new X402GuardError("AMBIGUOUS_ALLOWED_REQUIREMENTS", {
        decision: "BLOCK",
        reason: "AMBIGUOUS_ALLOWED_REQUIREMENTS",
        candidates: evaluations,
        paying_fetch_invoked: false
      });
    }

    if (allowed.length === 0) {
      const decision = reviews.length ? "REVIEW" : "BLOCK";
      throw new X402GuardError(
        decision === "REVIEW"
          ? "HUMAN_REVIEW_REQUIRED"
          : "PAYMENT_POLICY_BLOCK",
        {
          decision,
          candidates: evaluations,
          paying_fetch_invoked: false
        }
      );
    }

    const selected = allowed[0];
    const paidResponse = await payingFetch(url, init);

    return {
      response: paidResponse,
      guard: {
        decision: "ALLOW",
        selected_intent_hash: selected.decision.intent_hash,
        selected_intent: selected.intent,
        reasons: selected.decision.reasons,
        paying_fetch_invoked: true
      }
    };
  };
}
