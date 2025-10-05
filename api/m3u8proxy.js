// api/m3u8proxy.js
export const config = { runtime: 'edge' };

// allowed schemes
const ALLOWED = new Set(['http:', 'https:']);

// headers we never forward
const HOP_BY_HOP = new Set([
  'connection','keep-alive','proxy-authenticate','proxy-authorization',
  'te','trailer','transfer-encoding','upgrade','host'
]);

function cors(extra = {}) {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,HEAD,OPTIONS',
    'access-control-allow-headers': '*',
    'access-control-max-age': '86400',
    ...extra,
  };
}

function buildForwardHeaders(req, headerJson) {
  const out = new Headers();
  for (const [k, v] of req.headers.entries()) {
    const lower = k.toLowerCase();
    if (!HOP_BY_HOP.has(lower)) out.set(lower, v);
  }
  if (!out.has('user-agent')) out.set('user-agent', 'Mozilla/5.0');
  if (!out.has('accept')) out.set('accept', '*/*');
  if (!out.has('accept-language')) out.set('accept-language', 'en-US,en;q=0.8');

  // preserve Origin/Referer if present
  if (req.headers.get('origin') && !out.has('origin')) out.set('origin', req.headers.get('origin'));
  if (req.headers.get('referer') && !out.has('referer')) out.set('referer', req.headers.get('referer'));

  if (headerJson) {
    try {
      const obj = JSON.parse(headerJson);
      for (const [k, v] of Object.entries(obj)) out.set(k.toLowerCase(), String(v));
    } catch { /* ignore bad JSON */ }
  }
  return out;
}

// try to decode blob:https:/?v=...  -> an https URL
function tryDecodeBlobLike(line) {
  // Examples we saw: blob:https:/?v=<percent-encoded base64 or URL>&safe=
  try {
    const u = new URL(line);
    const vParam = u.searchParams.get('v');
    if (!vParam) return null;
    // 1) maybe it's already an encoded URL
    const once = decodeURIComponent(vParam);
    if (once.startsWith('http://') || once.startsWith('https://')) return once;

    // 2) maybe base64 of a URL
    // normalize URL-safe base64
    let b64 = once.replace(/-/g, '+').replace(/_/g, '/');
    // pad
    while (b64.length % 4) b64 += '=';
    const decoded = atob(b64);
    if (decoded.startsWith('http://') || decoded.startsWith('https://')) return decoded;
  } catch {
    /* fall through */
  }
  return null;
}

// rewrite an M3U8 body so all URIs are absolute and (optionally) proxied again
function rewriteM3U8(text, baseUrl, proxiedOrigin, headersParam) {
  const base = new URL(baseUrl);
  const lines = text.split(/\r?\n/);

  const mkProxyUrl = (absUrl) => {
    // route back through this proxy so headers (origin/referer) are preserved
    const p = new URL('/m3u8proxy/m3u8-proxy', proxiedOrigin);
    p.searchParams.set('url', absUrl);
    if (headersParam) p.searchParams.set('headers', headersParam);
    // many callers add &safe=; keep a blank to not change semantics if they expect it
    p.searchParams.set('safe', '');
    return p.toString();
  };

  const out = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line; // comments/directives untouched

    // Case 1: blob:https:/?v=...  -> decode to real URL
    if (/^blob:https:\/\//i.test(trimmed) || /^blob:https:\/\?/i.test(trimmed) || /^blob:https:\//i.test(trimmed)) {
      const decoded = tryDecodeBlobLike(trimmed);
      if (decoded) return mkProxyUrl(decoded);
      // if we can't decode, drop back to original line (it will error rather than loop)
      return line;
    }

    // Case 2: absolute http(s)
    if (/^https?:\/\//i.test(trimmed)) {
      return mkProxyUrl(trimmed);
    }

    // Case 3: protocol-relative //host/path
    if (/^\/\//.test(trimmed)) {
      const abs = `${base.protocol}${trimmed}`;
      return mkProxyUrl(abs);
    }

    // Case 4: root-relative /path
    if (/^\//.test(trimmed)) {
      const abs = `${base.origin}${trimmed}`;
      return mkProxyUrl(abs);
    }

    // Case 5: relative path
    const abs = new URL(trimmed, base).toString();
    return mkProxyUrl(abs);
  });

  return out.join('\n');
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }

  const selfUrl = new URL(req.url);
  const rawTarget = selfUrl.searchParams.get('url');
  const headersParam = selfUrl.searchParams.get('headers');
  const debug = selfUrl.searchParams.get('__debug') === '1';

  if (!rawTarget) {
    return new Response('Missing url', { status: 400, headers: cors() });
  }

  // parse target (handle double-encoded)
  let targetStr = rawTarget;
  let target;
  try {
    target = new URL(targetStr);
  } catch {
    try {
      targetStr = decodeURIComponent(rawTarget);
      target = new URL(targetStr);
    } catch {
      return new Response('Invalid url', { status: 400, headers: cors() });
    }
  }
  if (!ALLOWED.has(target.protocol)) {
    return new Response('Unsupported protocol', { status: 400, headers: cors() });
  }

  const fwdHeaders = buildForwardHeaders(req, headersParam);

  if (debug) {
    const preview = {
      target: target.toString(),
      proxyOrigin: selfUrl.origin,
      headers: [...fwdHeaders.entries()].filter(([k]) => k !== 'authorization'),
    };
    return new Response(JSON.stringify(preview, null, 2), {
      status: 200,
      headers: { ...cors(), 'content-type': 'application/json' }
    });
  }

  try {
    const upstream = await fetch(target.toString(), {
      method: 'GET',
      headers: fwdHeaders,
      redirect: 'follow',
    });

    // collect headers + CORS
    const h = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(cors())) h.set(k, v);

    // If it's an m3u8, rewrite any broken URIs (blob:/ relative/etc.) to absolute proxied links
    const ct = h.get('content-type') || '';
    const isM3U8 = ct.includes('application/vnd.apple.mpegurl') || ct.includes('audio/mpegurl') || ct.includes('application/x-mpegURL') || target.pathname.toLowerCase().endsWith('.m3u8');

    if (isM3U8 && upstream.ok) {
      const playlist = await upstream.text();
      const rewritten = rewriteM3U8(playlist, target.toString(), selfUrl.origin, headersParam);
      h.set('content-type', 'application/vnd.apple.mpegurl');
      // prevent caching of rewritten blobs
      h.set('cache-control', 'no-store');
      return new Response(rewritten, { status: 200, headers: h });
    }

    // Non-m3u8: just stream through (segments, keys, etc.)
    return new Response(upstream.body, { status: upstream.status, headers: h });
  } catch (err) {
    const body = { error: 'fetch_failed', message: String(err), target: target.toString() };
    return new Response(JSON.stringify(body), {
      status: 502,
      headers: { ...cors(), 'content-type': 'application/json' }
    });
  }
}
