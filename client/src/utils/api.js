const STORAGE_KEY = 'auth_v1';

export function getAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(auth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  try {
    window.dispatchEvent(new Event('auth:changed'));
  } catch {
    // ignore
  }
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  try {
    window.dispatchEvent(new Event('auth:changed'));
  } catch {
    // ignore
  }
}

export function getToken() {
  return getAuth()?.token || null;
}

export function getUser() {
  return getAuth()?.user || null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryResponse(res) {
  return res && [502, 503, 504].includes(res.status);
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.json) headers.set('Content-Type', 'application/json');
  // Avoid ngrok free-plan interstitial breaking API calls.
  headers.set('ngrok-skip-browser-warning', 'true');

  const method = String(options.method || 'GET').toUpperCase();
  const retry = options.retry === true || (options.retry === undefined && (method === 'GET' || method === 'HEAD'));
  const maxRetries = Number.isFinite(options.maxRetries) ? options.maxRetries : 2;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 15000;

  let attempt = 0;
  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(path, {
        ...options,
        headers,
        signal: controller.signal,
        body: options.json ? JSON.stringify(options.json) : options.body,
      });

      if (res.status === 401) {
        clearAuth();
      }

      if (!retry || !shouldRetryResponse(res) || attempt >= maxRetries) {
        return res;
      }

      attempt += 1;
      await sleep(250 * Math.pow(2, attempt));
    } catch (e) {
      if (!retry || attempt >= maxRetries) throw e;
      attempt += 1;
      await sleep(250 * Math.pow(2, attempt));
    } finally {
      clearTimeout(t);
    }
  }

  throw new Error('Request failed after retries.');
}
