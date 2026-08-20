const dotenv = require('dotenv');

dotenv.config({ override: true });

async function main() {
  const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY in server/.env');
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Request failed: ${res.status}`);
    console.error(text);
    process.exit(1);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error('Failed to parse response JSON');
    console.error(text);
    process.exit(1);
  }

  const models = Array.isArray(json.models) ? json.models : [];
  const rows = models
    .map((m) => ({
      name: String(m.name || ''),
      displayName: String(m.displayName || ''),
      supported: Array.isArray(m.supportedGenerationMethods) ? m.supportedGenerationMethods : [],
      inputTokenLimit: m.inputTokenLimit ?? null,
      outputTokenLimit: m.outputTokenLimit ?? null,
    }))
    .filter((m) => m.name && m.supported.includes('generateContent'))
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`Found ${rows.length} generateContent models`);
  for (const m of rows) {
    const short = m.name.replace(/^models\//, '');
    console.log(
      `${short}\t(in=${m.inputTokenLimit ?? '?'}, out=${m.outputTokenLimit ?? '?'})\t${m.displayName}`
    );
  }
}

main().catch((e) => {
  console.error('Error:', e?.message || e);
  process.exit(1);
});
