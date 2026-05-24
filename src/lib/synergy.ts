/**
 * Synergy Wholesale client.
 *
 * Calls go via a tiny PHP proxy hosted on our Synergy cPanel server
 * (static IP whitelisted with SW). See /swproxy/index.php.
 *
 * Required env (Railway):
 *   SYNERGY_PROXY_URL   e.g. https://swproxy.example.com/
 *   SYNERGY_PROXY_KEY   shared secret matching PROXY_SHARED_KEY in PHP
 */

export interface SynergyProxyResponse<T = unknown> {
  ok: boolean;
  method?: string;
  data?: T;
  error?: string;
  faultcode?: string;
  faultstring?: string;
}

export class SynergyError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'SynergyError';
  }
}

function getConfig() {
  const url = process.env.SYNERGY_PROXY_URL;
  const key = process.env.SYNERGY_PROXY_KEY;
  if (!url || !key) {
    throw new SynergyError(
      'Synergy proxy not configured. Set SYNERGY_PROXY_URL and SYNERGY_PROXY_KEY.'
    );
  }
  return { url, key };
}

/**
 * Invoke a Synergy Wholesale SOAP method through the proxy.
 * The proxy injects resellerID + apiKey — do NOT include them in params.
 */
export async function callSynergy<T = unknown>(
  method: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const { url, key } = getConfig();

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Proxy-Key': key,
    },
    body: JSON.stringify({ method, params }),
    // Don't cache SOAP responses
    cache: 'no-store',
  });

  let json: SynergyProxyResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new SynergyError(`Proxy returned non-JSON (HTTP ${res.status})`);
  }

  if (!res.ok || !json.ok) {
    throw new SynergyError(json.error || `Proxy error (HTTP ${res.status})`, json);
  }

  return json.data as T;
}

// ---- Typed helpers -------------------------------------------------------

export interface SynergyBalance {
  status: string; // 'OK'
  balance: string;
  currency?: string;
}

export const synergy = {
  balanceQuery: () => callSynergy<SynergyBalance>('balanceQuery'),

  listDomains: (params: { pageNumber?: number; pageSize?: number } = {}) =>
    callSynergy('listDomains', params),

  domainInfo: (domainName: string) =>
    callSynergy('domainInfo', { domainName }),

  checkDomain: (domainName: string) =>
    callSynergy('checkDomain', { domainName }),

  listHostingServices: () => callSynergy('listHostingServices'),
};
