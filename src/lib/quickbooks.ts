/**
 * QuickBooks Online (QBO) integration.
 *
 * Handles OAuth2 (authorization-code flow), token storage + refresh,
 * and a small wrapper around the QBO REST API.
 *
 * Note: QBO does NOT have a "Leads" entity in its API. Leads live in
 * ClientHub; on conversion we push them to QBO as a Customer.
 */

import { getDatabase } from './database-postgresql';
import { encryptSecret, decryptSecret } from './secret-crypto';

const PROVIDER = 'quickbooks';

const AUTH_BASE = 'https://appcenter.intuit.com/connect/oauth2';
const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';

// Minimum scopes for CRM + invoicing.
export const DEFAULT_SCOPES = ['com.intuit.quickbooks.accounting'];

export type QboEnv = 'sandbox' | 'production';

export interface QboConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: QboEnv;
}

export function getQboConfig(): QboConfig {
  const clientId = process.env.QBO_CLIENT_ID;
  const clientSecret = process.env.QBO_CLIENT_SECRET;
  const redirectUri = process.env.QBO_REDIRECT_URI;
  const environment = (process.env.QBO_ENVIRONMENT || 'sandbox') as QboEnv;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'QuickBooks is not configured. Set QBO_CLIENT_ID, QBO_CLIENT_SECRET and QBO_REDIRECT_URI.'
    );
  }
  return { clientId, clientSecret, redirectUri, environment };
}

function apiBaseUrl(env: QboEnv): string {
  return env === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';
}

/* ---------------------------------------------------------------------------
 * OAuth helpers
 * ------------------------------------------------------------------------ */

export function buildAuthorizationUrl(state: string): string {
  const cfg = getQboConfig();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    response_type: 'code',
    scope: DEFAULT_SCOPES.join(' '),
    redirect_uri: cfg.redirectUri,
    state,
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;            // seconds
  x_refresh_token_expires_in: number;
  token_type: string;
}

async function postToken(body: URLSearchParams): Promise<TokenResponse> {
  const cfg = getQboConfig();
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QBO token request failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function exchangeCodeForTokens(code: string, realmId: string): Promise<void> {
  const cfg = getQboConfig();
  const tokens = await postToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: cfg.redirectUri,
    })
  );
  await saveTokens(tokens, realmId, cfg.environment);
}

export async function refreshTokens(): Promise<TokenResponse> {
  const integration = await loadIntegrationRaw();
  if (!integration) throw new Error('QuickBooks not connected');
  const refreshToken = decryptSecret(integration.refresh_token_encrypted);
  if (!refreshToken) throw new Error('No refresh token stored');

  const tokens = await postToken(
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })
  );
  await saveTokens(tokens, integration.realm_id, integration.environment);
  return tokens;
}

export async function disconnect(): Promise<void> {
  const integration = await loadIntegrationRaw();
  const refreshToken = integration?.refresh_token_encrypted
    ? decryptSecret(integration.refresh_token_encrypted)
    : null;

  if (refreshToken) {
    try {
      const cfg = getQboConfig();
      const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
      await fetch(REVOKE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: refreshToken }),
      });
    } catch (err) {
      console.warn('QBO token revoke failed (continuing):', err);
    }
  }

  const db = await getDatabase();
  await db.query(
    `UPDATE integrations
       SET status = 'disconnected',
           access_token_encrypted = NULL,
           refresh_token_encrypted = NULL,
           token_expires_at = NULL,
           refresh_expires_at = NULL,
           realm_id = NULL,
           updated_at = CURRENT_TIMESTAMP
     WHERE provider = $1`,
    [PROVIDER]
  );
}

/* ---------------------------------------------------------------------------
 * Integration record storage
 * ------------------------------------------------------------------------ */

interface IntegrationRow {
  provider: string;
  status: string;
  realm_id: string;
  environment: QboEnv;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: Date | null;
  refresh_expires_at: Date | null;
  scope: string | null;
  last_sync_at: Date | null;
  last_error: string | null;
}

async function loadIntegrationRaw(): Promise<IntegrationRow | null> {
  const db = await getDatabase();
  const { rows } = await db.query(
    'SELECT * FROM integrations WHERE provider = $1',
    [PROVIDER]
  );
  return rows[0] || null;
}

async function saveTokens(tokens: TokenResponse, realmId: string, env: QboEnv) {
  const db = await getDatabase();
  const now = Date.now();
  const accessExpiresAt = new Date(now + tokens.expires_in * 1000);
  const refreshExpiresAt = new Date(now + tokens.x_refresh_token_expires_in * 1000);

  await db.query(
    `INSERT INTO integrations
       (provider, status, realm_id, environment,
        access_token_encrypted, refresh_token_encrypted,
        token_expires_at, refresh_expires_at, scope, updated_at)
     VALUES ($1, 'connected', $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
     ON CONFLICT (provider) DO UPDATE SET
       status = 'connected',
       realm_id = EXCLUDED.realm_id,
       environment = EXCLUDED.environment,
       access_token_encrypted = EXCLUDED.access_token_encrypted,
       refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
       token_expires_at = EXCLUDED.token_expires_at,
       refresh_expires_at = EXCLUDED.refresh_expires_at,
       scope = EXCLUDED.scope,
       last_error = NULL,
       updated_at = CURRENT_TIMESTAMP`,
    [
      PROVIDER,
      realmId,
      env,
      encryptSecret(tokens.access_token),
      encryptSecret(tokens.refresh_token),
      accessExpiresAt,
      refreshExpiresAt,
      DEFAULT_SCOPES.join(' '),
    ]
  );
}

export interface QboStatus {
  connected: boolean;
  environment: QboEnv | null;
  realmId: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  expiresAt: string | null;
}

export async function getStatus(): Promise<QboStatus> {
  const row = await loadIntegrationRaw();
  if (!row || row.status !== 'connected') {
    return {
      connected: false,
      environment: null,
      realmId: null,
      lastSyncAt: null,
      lastError: row?.last_error ?? null,
      expiresAt: null,
    };
  }
  return {
    connected: true,
    environment: row.environment,
    realmId: row.realm_id,
    lastSyncAt: row.last_sync_at?.toISOString() ?? null,
    lastError: row.last_error,
    expiresAt: row.token_expires_at?.toISOString() ?? null,
  };
}

/* ---------------------------------------------------------------------------
 * API client (with auto-refresh)
 * ------------------------------------------------------------------------ */

async function getValidAccessToken(): Promise<{ token: string; realmId: string; env: QboEnv }> {
  const row = await loadIntegrationRaw();
  if (!row || row.status !== 'connected') {
    throw new Error('QuickBooks not connected');
  }

  const expiresAt = row.token_expires_at?.getTime() ?? 0;
  // Refresh if we're within 60s of expiry.
  if (expiresAt - Date.now() < 60_000) {
    const refreshed = await refreshTokens();
    return { token: refreshed.access_token, realmId: row.realm_id, env: row.environment };
  }
  const token = decryptSecret(row.access_token_encrypted);
  if (!token) throw new Error('No access token stored');
  return { token, realmId: row.realm_id, env: row.environment };
}

export async function qboFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const { token, realmId, env } = await getValidAccessToken();
  const url = `${apiBaseUrl(env)}/v3/company/${realmId}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QBO API ${res.status} ${path}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/* ---------------------------------------------------------------------------
 * Customer sync
 * ------------------------------------------------------------------------ */

interface QboCustomer {
  Id: string;
  SyncToken: string;
  DisplayName: string;
  CompanyName?: string;
  PrimaryEmailAddr?: { Address?: string };
  PrimaryPhone?: { FreeFormNumber?: string };
  Active?: boolean;
}

interface QboQueryResponse<T> {
  QueryResponse: {
    Customer?: T[];
    Item?: T[];
    startPosition?: number;
    maxResults?: number;
    totalCount?: number;
  };
}

export interface CustomerSyncResult {
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
}

export interface ProductSyncResult {
  fetched: number;
  inserted: number;
  updated: number;
}

export async function syncCustomersFromQbo(): Promise<CustomerSyncResult> {
  const db = await getDatabase();
  const result: CustomerSyncResult = { fetched: 0, inserted: 0, updated: 0, skipped: 0 };

  const pageSize = 100;
  let startPos = 1;

  while (true) {
    const query = encodeURIComponent(
      `SELECT * FROM Customer WHERE Active = true STARTPOSITION ${startPos} MAXRESULTS ${pageSize}`
    );
    const data = await qboFetch<QboQueryResponse<QboCustomer>>(`/query?query=${query}`);
    const customers = data.QueryResponse.Customer ?? [];
    if (customers.length === 0) break;

    for (const c of customers) {
      result.fetched++;
      const phone = c.PrimaryPhone?.FreeFormNumber?.trim() || null;
      const email = c.PrimaryEmailAddr?.Address?.trim() || null;
      const name = c.DisplayName || c.CompanyName || 'Unnamed';
      // Phone is required by the contacts schema — fall back to a stable placeholder
      // that ties the row to the QBO id; user can fix it later.
      const phoneValue = phone ?? `qbo:${c.Id}`;

      const upsert = await db.query(
        `INSERT INTO contacts (
            name, phone, email, company_name,
            quickbooks_id, quickbooks_sync_token,
            lead_status, sync_to_quickbooks,
            last_synced_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, 'customer', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (phone) DO UPDATE SET
            name = EXCLUDED.name,
            email = COALESCE(EXCLUDED.email, contacts.email),
            company_name = COALESCE(EXCLUDED.company_name, contacts.company_name),
            quickbooks_id = EXCLUDED.quickbooks_id,
            quickbooks_sync_token = EXCLUDED.quickbooks_sync_token,
            sync_to_quickbooks = TRUE,
            last_synced_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
         RETURNING (xmax = 0) AS inserted`,
        [name, phoneValue, email, c.CompanyName ?? null, c.Id, c.SyncToken]
      );
      if (upsert.rows[0]?.inserted) result.inserted++;
      else result.updated++;
    }

    if (customers.length < pageSize) break;
    startPos += pageSize;
  }

  await db.query(
    `UPDATE integrations SET last_sync_at = CURRENT_TIMESTAMP, last_error = NULL WHERE provider = $1`,
    [PROVIDER]
  );

  return result;
}

/* ---------------------------------------------------------------------------
 * Product / service (Item) sync
 * ------------------------------------------------------------------------ */

interface QboItem {
  Id: string;
  SyncToken: string;
  Name: string;
  Sku?: string;
  Description?: string;
  UnitPrice?: number;
  Type?: string; // 'Service' | 'NonInventory' | 'Inventory'
  Active?: boolean;
  Taxable?: boolean;
  IncomeAccountRef?: { value: string; name?: string };
}

export async function syncProductsFromQbo(): Promise<ProductSyncResult> {
  const db = await getDatabase();
  const result: ProductSyncResult = { fetched: 0, inserted: 0, updated: 0 };

  const pageSize = 100;
  let startPos = 1;

  while (true) {
    const query = encodeURIComponent(
      `SELECT * FROM Item STARTPOSITION ${startPos} MAXRESULTS ${pageSize}`
    );
    const data = await qboFetch<QboQueryResponse<QboItem>>(`/query?query=${query}`);
    const items = data.QueryResponse.Item ?? [];
    if (items.length === 0) break;

    for (const it of items) {
      result.fetched++;
      const upsert = await db.query(
        `INSERT INTO products (
            name, sku, description, unit_price, product_type, active, taxable,
            quickbooks_id, quickbooks_sync_token, income_account_ref,
            last_synced_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (quickbooks_id) DO UPDATE SET
            name = EXCLUDED.name,
            sku = EXCLUDED.sku,
            description = EXCLUDED.description,
            unit_price = EXCLUDED.unit_price,
            product_type = EXCLUDED.product_type,
            active = EXCLUDED.active,
            taxable = EXCLUDED.taxable,
            quickbooks_sync_token = EXCLUDED.quickbooks_sync_token,
            income_account_ref = EXCLUDED.income_account_ref,
            last_synced_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
         RETURNING (xmax = 0) AS inserted`,
        [
          it.Name,
          it.Sku ?? null,
          it.Description ?? null,
          it.UnitPrice ?? null,
          it.Type ?? null,
          it.Active ?? true,
          it.Taxable ?? null,
          it.Id,
          it.SyncToken,
          it.IncomeAccountRef?.value ?? null,
        ]
      );
      if (upsert.rows[0]?.inserted) result.inserted++;
      else result.updated++;
    }

    if (items.length < pageSize) break;
    startPos += pageSize;
  }

  return result;
}

/* ---------------------------------------------------------------------------
 * Full sync (one button)
 * ------------------------------------------------------------------------ */

export interface FullSyncResult {
  customers: CustomerSyncResult;
  products: ProductSyncResult;
}

export async function syncAll(): Promise<FullSyncResult> {
  const customers = await syncCustomersFromQbo();
  const products = await syncProductsFromQbo();
  return { customers, products };
}

/* ---------------------------------------------------------------------------
 * Push a single contact to QBO as a Customer
 * ------------------------------------------------------------------------ */

interface ContactRow {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  company_name: string | null;
  quickbooks_id: string | null;
}

/**
 * Idempotent push of a contact to QBO. If quickbooks_id is set, no-op
 * (we already know about them — call a future updateCustomer if you want
 * to push edits). Returns the QBO customer id.
 */
export async function pushContactToQbo(contactId: number): Promise<string> {
  const db = await getDatabase();
  const { rows } = await db.query<ContactRow>(
    `SELECT id, name, phone, email, company_name, quickbooks_id
       FROM contacts WHERE id = $1`,
    [contactId]
  );
  const contact = rows[0];
  if (!contact) throw new Error('Contact not found');
  if (contact.quickbooks_id) return contact.quickbooks_id;

  // Build the QBO Customer payload. Skip phone if it's a placeholder we
  // generated during a previous pull.
  const phoneIsReal = contact.phone && !contact.phone.startsWith('qbo:');
  const payload: Record<string, unknown> = {
    DisplayName: contact.name,
  };
  if (contact.company_name) payload.CompanyName = contact.company_name;
  if (contact.email) payload.PrimaryEmailAddr = { Address: contact.email };
  if (phoneIsReal) payload.PrimaryPhone = { FreeFormNumber: contact.phone };

  const response = await qboFetch<{ Customer: { Id: string; SyncToken: string } }>(
    '/customer',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  const qboId = response.Customer.Id;
  await db.query(
    `UPDATE contacts
        SET quickbooks_id = $1,
            quickbooks_sync_token = $2,
            sync_to_quickbooks = TRUE,
            lead_status = 'customer',
            last_synced_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
    [qboId, response.Customer.SyncToken, contactId]
  );
  return qboId;
}

/**
 * Push an edit to an already-synced contact. No-op if the contact isn't
 * synced (sync_to_quickbooks=false) or has no quickbooks_id yet.
 */
export async function updateContactInQbo(contactId: number): Promise<void> {
  const db = await getDatabase();
  const { rows } = await db.query<
    ContactRow & { sync_to_quickbooks: boolean; quickbooks_sync_token: string | null }
  >(
    `SELECT id, name, phone, email, company_name, quickbooks_id,
            quickbooks_sync_token, sync_to_quickbooks
       FROM contacts WHERE id = $1`,
    [contactId]
  );
  const contact = rows[0];
  if (!contact) throw new Error('Contact not found');
  if (!contact.sync_to_quickbooks) return;
  if (!contact.quickbooks_id || !contact.quickbooks_sync_token) {
    // Not yet in QBO — create instead.
    await pushContactToQbo(contactId);
    return;
  }

  const phoneIsReal = contact.phone && !contact.phone.startsWith('qbo:');
  const payload: Record<string, unknown> = {
    Id: contact.quickbooks_id,
    SyncToken: contact.quickbooks_sync_token,
    sparse: true,                            // partial update
    DisplayName: contact.name,
  };
  if (contact.company_name) payload.CompanyName = contact.company_name;
  if (contact.email) payload.PrimaryEmailAddr = { Address: contact.email };
  if (phoneIsReal) payload.PrimaryPhone = { FreeFormNumber: contact.phone };

  const response = await qboFetch<{ Customer: { Id: string; SyncToken: string } }>(
    '/customer',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  await db.query(
    `UPDATE contacts
        SET quickbooks_sync_token = $1,
            last_synced_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $2`,
    [response.Customer.SyncToken, contactId]
  );
}

/**
 * Set the per-contact sync flag. If turning ON and contact is not yet in QBO,
 * push them to QBO. If turning OFF, just flips the flag (we never delete in QBO).
 */
export async function setContactSync(
  contactId: number,
  enabled: boolean
): Promise<{ quickbooks_id: string | null; sync_to_quickbooks: boolean }> {
  const db = await getDatabase();

  if (enabled) {
    const qboId = await pushContactToQbo(contactId);
    return { quickbooks_id: qboId, sync_to_quickbooks: true };
  }

  await db.query(
    `UPDATE contacts
        SET sync_to_quickbooks = FALSE,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
    [contactId]
  );
  const { rows } = await db.query<{ quickbooks_id: string | null }>(
    `SELECT quickbooks_id FROM contacts WHERE id = $1`,
    [contactId]
  );
  return {
    quickbooks_id: rows[0]?.quickbooks_id ?? null,
    sync_to_quickbooks: false,
  };
}

/* ---------------------------------------------------------------------------
 * Invoice push (Phase 5)
 * ------------------------------------------------------------------------ */

interface QboInvoiceLine {
  Amount: number;
  DetailType: 'SalesItemLineDetail';
  Description?: string;
  SalesItemLineDetail: {
    Qty?: number;
    UnitPrice?: number;
    ItemRef?: { value: string };
  };
}

interface QboInvoiceResponse {
  Invoice: { Id: string; SyncToken: string; DocNumber?: string };
}

/**
 * Push an invoice to QBO. Requires the invoice's contact to be synced
 * (have a quickbooks_id). Creates on first push, updates (sparse) thereafter.
 */
export async function pushInvoiceToQbo(invoiceId: number): Promise<string> {
  const db = await getDatabase();

  const { rows: invRows } = await db.query<{
    id: number;
    invoice_number: string;
    contact_id: number | null;
    due_date: string | null;
    issued_date: string | null;
    notes: string | null;
    quickbooks_id: string | null;
    quickbooks_sync_token: string | null;
    customer_qbo_id: string | null;
  }>(
    `SELECT i.id, i.invoice_number, i.contact_id, i.due_date, i.issued_date, i.notes,
            i.quickbooks_id, i.quickbooks_sync_token,
            c.quickbooks_id AS customer_qbo_id
       FROM invoices i
       LEFT JOIN contacts c ON c.id = i.contact_id
      WHERE i.id = $1`,
    [invoiceId]
  );
  const inv = invRows[0];
  if (!inv) throw new Error('Invoice not found');
  if (!inv.customer_qbo_id) {
    throw new Error('Customer is not synced to QuickBooks. Enable sync on the contact first.');
  }

  const { rows: itemRows } = await db.query<{
    description: string;
    quantity_decimal: string | null;
    quantity: number | null;
    unit_price: string;
    total: string;
    product_qbo_id: string | null;
  }>(
    `SELECT ii.description, ii.quantity_decimal, ii.quantity, ii.unit_price, ii.total,
            p.quickbooks_id AS product_qbo_id
       FROM invoice_items ii
       LEFT JOIN products p ON p.id = ii.product_id
      WHERE ii.invoice_id = $1
      ORDER BY ii.sort_order, ii.id`,
    [invoiceId]
  );
  if (!itemRows.length) throw new Error('Invoice has no line items');

  const lines: QboInvoiceLine[] = itemRows.map((it) => {
    const qty = Number(it.quantity_decimal ?? it.quantity ?? 1);
    const price = Number(it.unit_price);
    return {
      Amount: Number(it.total),
      DetailType: 'SalesItemLineDetail',
      Description: it.description,
      SalesItemLineDetail: {
        Qty: qty,
        UnitPrice: price,
        ...(it.product_qbo_id ? { ItemRef: { value: it.product_qbo_id } } : {}),
      },
    };
  });

  const payload: Record<string, unknown> = {
    CustomerRef: { value: inv.customer_qbo_id },
    Line: lines,
    DocNumber: inv.invoice_number,
    PrivateNote: inv.notes ?? undefined,
    TxnDate: inv.issued_date ?? undefined,
    DueDate: inv.due_date ?? undefined,
  };

  let response: QboInvoiceResponse;
  if (inv.quickbooks_id && inv.quickbooks_sync_token) {
    payload.Id = inv.quickbooks_id;
    payload.SyncToken = inv.quickbooks_sync_token;
    payload.sparse = true;
    response = await qboFetch<QboInvoiceResponse>('/invoice?operation=update', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } else {
    response = await qboFetch<QboInvoiceResponse>('/invoice', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  const { Id, SyncToken } = response.Invoice;
  await db.query(
    `UPDATE invoices
        SET quickbooks_id = $1,
            quickbooks_sync_token = $2,
            last_synced_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
    [Id, SyncToken, invoiceId]
  );
  return Id;
}
