const dotenv = require('dotenv');

dotenv.config({ override: true });

function scoreModelName(name) {
  const n = String(name || '').toLowerCase();
  // Higher is better for "cheap + stable" text chat.
  let score = 0;

  // Prefer flash-lite for cost.
  if (n.includes('flash') && n.includes('lite')) score += 50;
  else if (n.includes('flash')) score += 30;

  // Prefer newer generations a bit (heuristic).
  if (n.includes('2.5')) score += 6;
  else if (n.includes('2.0')) score += 4;
  else if (n.includes('1.5')) score += 2;

  // Avoid pro/ultra by default.
  if (n.includes('pro')) score -= 20;
  if (n.includes('ultra')) score -= 30;

  // Prefer models that look like standard chat (not embeddings/vision-only).
  if (n.includes('embed')) score -= 100;
  if (n.includes('image')) score -= 10;

  return score;
}

async function fetchModels(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  if (!res.ok) throw new Error(`list models failed: ${res.status} ${text}`);
  const json = JSON.parse(text);
  return Array.isArray(json.models) ? json.models : [];
}

async function main() {
  const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY in server/.env');
    process.exit(1);
  }

  const models = await fetchModels(apiKey);
  const candidates = models
    .map((m) => ({
      name: String(m.name || '').replace(/^models\//, ''),
      supported: Array.isArray(m.supportedGenerationMethods) ? m.supportedGenerationMethods : [],
      inputTokenLimit: m.inputTokenLimit ?? null,
      outputTokenLimit: m.outputTokenLimit ?? null,
    }))
    .filter((m) => m.name && m.supported.includes('generateContent'));

  candidates.sort((a, b) => scoreModelName(b.name) - scoreModelName(a.name) || a.name.localeCompare(b.name));

  const bestChat = candidates[0]?.name || null;

  // Meanings can be even cheaper; prefer flash-lite if available.
  const bestMeaning = candidates.find((m) => m.name.toLowerCase().includes('flash') && m.name.toLowerCase().includes('lite'))?.name
    || candidates.find((m) => m.name.toLowerCase().includes('flash'))?.name
    || bestChat;

  console.log('Recommended (cheap + stable, kid-level prompts handled in server):');
  console.log(`- GEMINI_MODEL=${bestChat || '(none found)'}`);
  console.log(`- GEMINI_MODEL_MEANINGS=${bestMeaning || '(none found)'}`);

  console.log('\nTop 8 candidates:');
  for (const m of candidates.slice(0, 8)) {
    console.log(`- ${m.name} (in=${m.inputTokenLimit ?? '?'}, out=${m.outputTokenLimit ?? '?'}) score=${scoreModelName(m.name)}`);
  }

  if (!bestChat) process.exit(1);
}

main().catch((e) => {
  console.error('Error:', e?.message || e);
  process.exit(1);
});
