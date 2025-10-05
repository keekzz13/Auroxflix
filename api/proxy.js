// api/proxy.js
export const config = { runtime: 'edge' };

/**
 * Point this to YOUR upstream for the generic proxy.
 * If you were previously rewriting /proxy → https://a.quickwatch.co,
 * keep that here. Otherwise, set it to your own backend host.
 */
const UPSTREAM = 'https://a.quickwatch.co';

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

function buildForwardHeaders(req, headersParam) {
  const out = new Headers();

  // copy incoming headers (minus hop-by-hop)
  for (const [k, v] of req.headers.entries()) {
    const lower = k.toLowerCase();
    if (!HOP_BY_HOP.has(lower)) out.set(lower, v);
  }

  // sensible defaults
  if (!out.has('user-agent')) out.set('user-agent', 'Mozilla/5.0');
  if (!out.has('accept')) out.set('accept', '*/*');

  // keep Origin/Referer if present (some upstreams require them)
  if (!out.has('origin') && req.headers.get('origin')) out.set('origin', req.headers.get('origin'));
  if (!out.has('referer') && req.headers.get('referer')) out.set('referer', req.headers.get('referer'));

  // allow overrides via ?headers={}
  if (headersParam) {
    try {
      const obj = JSON.parse(headersParam);
      for (const [k, v] of Object.entries(obj)) out.set(k.toLowerCase(), String(v));
    } catch {
      // ignore bad JSON
    }
  }
  return out;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }

  const inUrl = new URL(req.url);
  const debug = inUrl.searchParams.get('__debug') === '1';
  const headersParam = inUrl.searchParams.get('headers');

  // preserve original subpath after /proxy (e.g. /proxy/some/path?qs=1)
  const upstreamPath = inUrl.pathname.replace(/^\/proxy/, '') || '/';
  const dest = new URL(UPSTREAM + upstreamPath + inUrl.search);

  const forwardHeaders = buildForwardHeaders(req, headersParam);

  if (debug) {
    const preview = {
      dest: dest.toString(),
      method: 'GET',
      headers: [...forwardHeaders.entries()].filter(([k]) => k !== 'authorization'),
    };
    return new Response(JSON.stringify(preview, null, 2), {
      status: 200,
      headers: { ...cors(), 'content-type': 'application/json' }
    });
  }

  try {
    const upstream = await fetch(dest.toString(), {
      method: 'GET',
      headers: forwardHeaders,
      redirect: 'follow',
    });

    // pass through upstream headers + CORS, keep upstream status
    const h = new Headers(upstream.headers);
    const c = cors();
    for (const k in c) h.set(k, c[k]);

    return new Response(upstream.body, { status: upstream.status, headers: h });
  } catch (err) {
    const body = { error: 'fetch_failed', message: String(err), dest: dest.toString() };
    return new Response(JSON.stringify(body), {
      status: 502,
      headers: { ...cors(), 'content-type': 'application/json' }
    });
  }
}
