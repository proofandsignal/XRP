import express from "express";
import {
  compatibleRequirements,
  evaluatePaymentIntent,
  requirementToIntent,
  validatePaymentRequired
} from "../../../packages/agentpay-guard-core/src/index.mjs";

function classifyX402({ paymentRequired, facilitatorUrl, policy }) {
  const validated = validatePaymentRequired(paymentRequired);
  const candidates = compatibleRequirements(validated);

  if (!candidates.length) {
    return {
      decision: "BLOCK",
      reason: "NO_COMPATIBLE_XRPL_REQUIREMENT",
      candidates: []
    };
  }

  const evaluated = candidates.map((requirement) => {
    try {
      const intent = requirementToIntent({
        paymentRequired: validated,
        requirement,
        facilitatorUrl
      });
      return {
        intent,
        decision: evaluatePaymentIntent(intent, policy)
      };
    } catch (error) {
      return {
        intent: null,
        decision: {
          decision: "BLOCK",
          reasons: [error?.message ?? String(error)]
        }
      };
    }
  });

  const allowed = evaluated.filter(
    (item) => item.decision?.decision === "ALLOW"
  );
  const reviews = evaluated.filter(
    (item) => item.decision?.decision === "REVIEW"
  );

  if (allowed.length > 1) {
    return {
      decision: "BLOCK",
      reason: "AMBIGUOUS_ALLOWED_REQUIREMENTS",
      candidates: evaluated
    };
  }

  if (allowed.length === 1) {
    return {
      decision: "ALLOW",
      selected_intent_hash: allowed[0].decision.intent_hash,
      selected: allowed[0],
      candidates: evaluated
    };
  }

  return {
    decision: reviews.length ? "REVIEW" : "BLOCK",
    reason: reviews.length
      ? "HUMAN_REVIEW_REQUIRED"
      : "PAYMENT_POLICY_BLOCK",
    candidates: evaluated
  };
}

export function createApp({ policy, facilitatorUrl }) {
  if (!policy) throw new Error("policy required");
  if (!facilitatorUrl) throw new Error("facilitatorUrl required");

  const app = express();
  app.use(express.json({ limit: "128kb" }));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      product: "AgentPay Guard",
      version: "0.1.0",
      signing_enabled: false
    });
  });

  app.post("/v1/intent/evaluate", (req, res) => {
    try {
      const decision = evaluatePaymentIntent(req.body, policy);
      res.json(decision);
    } catch (error) {
      res.status(400).json({
        decision: "BLOCK",
        reasons: [error?.message ?? String(error)]
      });
    }
  });

  app.post("/v1/x402/evaluate", (req, res) => {
    try {
      const result = classifyX402({
        paymentRequired: req.body?.payment_required,
        facilitatorUrl,
        policy
      });
      res.json(result);
    } catch (error) {
      res.status(400).json({
        decision: "BLOCK",
        reason: error?.message ?? String(error),
        candidates: []
      });
    }
  });

  return app;
}

export { classifyX402 };
