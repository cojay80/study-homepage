function parsePricingJson(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function getPricingConfig() {
  return parsePricingJson(process.env.AI_PRICING_JSON) || { gemini: {}, openai: {} };
}

function safeFiniteNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getModelRates(provider, model) {
  const cfg = getPricingConfig();
  const p = String(provider || '').toLowerCase();
  const m = String(model || '').trim();
  const rates = cfg?.[p]?.[m];
  if (!rates) return null;

  const input = safeFiniteNumber(rates.input_usd_per_m);
  const output = safeFiniteNumber(rates.output_usd_per_m);
  if (input === null || output === null) return null;
  return { inputUsdPerM: input, outputUsdPerM: output };
}

function estimateCostUsd({ provider, model, promptTokens, completionTokens }) {
  const rates = getModelRates(provider, model);
  if (!rates) return null;

  const inTok = safeFiniteNumber(promptTokens);
  const outTok = safeFiniteNumber(completionTokens);
  if (inTok === null && outTok === null) return null;

  const inCost = inTok === null ? 0 : (inTok / 1_000_000) * rates.inputUsdPerM;
  const outCost = outTok === null ? 0 : (outTok / 1_000_000) * rates.outputUsdPerM;
  const total = inCost + outCost;
  return Number.isFinite(total) ? total : null;
}

function isPricingConfigured() {
  const cfg = getPricingConfig();
  const providers = Object.keys(cfg || {});
  for (const p of providers) {
    const models = Object.values(cfg[p] || {});
    for (const m of models) {
      const input = safeFiniteNumber(m?.input_usd_per_m);
      const output = safeFiniteNumber(m?.output_usd_per_m);
      if ((input && input > 0) || (output && output > 0)) return true;
    }
  }
  return false;
}

module.exports = {
  getPricingConfig,
  getModelRates,
  estimateCostUsd,
  isPricingConfigured,
};

