import xrpl from "xrpl";

const REQUIREMENT_KEYS = new Set([
  "scheme",
  "network",
  "amount",
  "maxAmountRequired",
  "asset",
  "payTo",
  "maxTimeoutSeconds",
  "extra"
]);

const EXTRA_KEYS = new Set([
  "sourceTag",
  "invoiceId",
  "issuer",
  "areFeesSponsored",
  "resource",
  "description"
]);

function decodeBase64Json(value) {
  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    throw new Error("INVALID_PAYMENT_REQUIRED_HEADER");
  }
}

function assertPlainObject(value, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(code);
  }
}

function assertNoUnknownKeys(object, allowed, codePrefix) {
  const unknown = Object.keys(object).filter((key) => !allowed.has(key));
  if (unknown.length) {
    throw new Error(`${codePrefix}:${unknown.sort().join(",")}`);
  }
}

export function validatePaymentRequired(payload) {
  assertPlainObject(payload, "INVALID_PAYMENT_REQUIRED");

  if (payload.x402Version !== 2) {
    throw new Error("UNSUPPORTED_X402_VERSION");
  }

  if (!Array.isArray(payload.accepts) || payload.accepts.length === 0) {
    throw new Error("NO_PAYMENT_REQUIREMENTS");
  }

  for (const requirement of payload.accepts) {
    assertPlainObject(requirement, "INVALID_REQUIREMENT");
    assertNoUnknownKeys(
      requirement,
      REQUIREMENT_KEYS,
      "UNREVIEWED_REQUIREMENT_FIELDS"
    );

    if (requirement.extra !== undefined) {
      assertPlainObject(requirement.extra, "INVALID_REQUIREMENT_EXTRA");
      assertNoUnknownKeys(
        requirement.extra,
        EXTRA_KEYS,
        "UNREVIEWED_EXTRA_FIELDS"
      );
    }
  }

  return payload;
}

export async function readPaymentRequired(response) {
  if (response.status !== 402) {
    throw new Error("EXPECTED_402");
  }

  const header =
    response.headers.get("PAYMENT-REQUIRED") ??
    response.headers.get("payment-required");

  if (header) {
    return validatePaymentRequired(decodeBase64Json(header));
  }

  let body;
  try {
    body = await response.clone().json();
  } catch {
    throw new Error("MISSING_PAYMENT_REQUIRED");
  }

  return validatePaymentRequired(body);
}

function amountFromRequirement(requirement) {
  return requirement.amount ?? requirement.maxAmountRequired ?? null;
}

export function requirementToIntent({
  paymentRequired,
  requirement,
  facilitatorUrl
}) {
  if (requirement.scheme !== "exact") {
    throw new Error("SCHEME_NOT_SUPPORTED");
  }
  if (!String(requirement.network ?? "").startsWith("xrpl:")) {
    throw new Error("NETWORK_NOT_XRPL");
  }

  const amount = amountFromRequirement(requirement);
  if (!amount || !/^[1-9][0-9]*$/.test(String(amount))) {
    throw new Error("INVALID_XRP_AMOUNT");
  }

  if (requirement.asset !== "XRP") {
    throw new Error("ASSET_NOT_SUPPORTED_IN_LAB004B");
  }

  if (!xrpl.isValidAddress(requirement.payTo)) {
    throw new Error("INVALID_PAY_TO");
  }

  const sourceTag = requirement.extra?.sourceTag;

  return {
    protocol: "x402",
    network:
      requirement.network === "xrpl:1"
        ? "xrpl:testnet"
        : requirement.network,
    asset: requirement.asset,
    amount_drops: String(amount),
    pay_to: requirement.payTo,
    facilitator_url: facilitatorUrl,
    source_tag: sourceTag ?? null,
    resource:
      paymentRequired.resource?.url ??
      paymentRequired.resource?.resource ??
      requirement.extra?.resource ??
      null,
    request_id:
      requirement.extra?.invoiceId ??
      paymentRequired.resource?.url ??
      "x402-request"
  };
}

export function compatibleRequirements(paymentRequired) {
  return paymentRequired.accepts.filter(
    (requirement) =>
      requirement?.scheme === "exact" &&
      typeof requirement?.network === "string" &&
      requirement.network.startsWith("xrpl:") &&
      requirement.asset === "XRP"
  );
}
