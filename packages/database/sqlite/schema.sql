-- ==============================================================================
-- BillPulse Pro — Local Encrypted SQLite Database Schema
-- Mode: WAL (Write-Ahead Logging), Foreign Keys Enabled, SQLCipher AES-256
-- Target: Low-Spec PCs (2 GB–4 GB RAM) | Ultra-Fast (< 2ms local writes)
-- ==============================================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

-- 1. MERCHANT PROFILE & HARDCODED LICENSE STATE
CREATE TABLE IF NOT EXISTS merchant_profile (
    tenant_id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    company_address TEXT,
    company_gstin TEXT,
    upi_id TEXT,
    owner_mobile TEXT NOT NULL,
    business_type TEXT NOT NULL DEFAULT 'TEA_SHOP',     -- 'TEA_SHOP', 'KIRANA_STORE', 'WHOLESALE', etc.
    invoice_prefix TEXT NOT NULL DEFAULT 'TEA',         -- 'TEA', 'KRN', 'WHL', 'INV'
    billing_plan TEXT NOT NULL DEFAULT 'PER_ORDER_050', -- 'PER_ORDER_050' (Rs. 0.50) | 'PER_INVOICE_100' (Rs. 1.00)
    logo_data_uri TEXT,                                 -- Cached locally for offline rendering
    signature_data_uri TEXT,                            -- Cached locally for offline rendering
    active_year_month TEXT NOT NULL,                    -- Format: 'YYYY-MM' (e.g. '2026-11')
    last_synced_at INTEGER NOT NULL,                    -- Unix epoch timestamp (seconds)
    max_seen_timestamp INTEGER NOT NULL,                -- Monotonic clock high-water mark against OS rollback
    total_orders_month INTEGER NOT NULL DEFAULT 0,      -- Counter for orders generated this billing month
    pending_dues_paise INTEGER NOT NULL DEFAULT 0,      -- Micro-billing balance in paise (Rs. 20 base + orders * fee)
    signed_license_jwt TEXT,                            -- Cryptographically signed server license token
    device_id TEXT NOT NULL,                            -- Unique hardware/installation fingerprint hash
    terminal_code TEXT NOT NULL DEFAULT 'D1',           -- Terminal identifier for collision-free numbering
    license_status TEXT NOT NULL DEFAULT 'ACTIVE'       -- 'ACTIVE', 'WARNING', 'BLOCKED', 'REVOKED'
);

-- 2. PRODUCT & SERVICE CATALOG (F6 Quick Pills)
CREATE TABLE IF NOT EXISTS catalog_items (
    item_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    hsn_code TEXT,
    selling_rate_paise INTEGER NOT NULL,                -- Stored in paise for precision (e.g. 1500 = Rs. 15.00)
    gst_percent REAL NOT NULL DEFAULT 5.0,              -- 0.0, 5.0, 12.0, 18.0, 28.0
    image_data_uri TEXT,
    updated_at INTEGER NOT NULL
);

-- 3. MONTH-PREFIXED INVOICES & OFFLINE SYNC QUEUE
CREATE TABLE IF NOT EXISTS invoices (
    invoice_uuid TEXT PRIMARY KEY,                      -- UUIDv4 for cloud idempotent upsert
    tenant_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,                -- Format: TEA-202611-0001 or TEA-202611-D1-0001
    year_month_prefix TEXT NOT NULL,                    -- '202611' (Mandatory YYYYMM prefix)
    invoice_date TEXT NOT NULL,                         -- 'YYYY-MM-DD'
    customer_name TEXT,
    customer_phone TEXT,
    customer_gstin TEXT,
    payment_mode TEXT NOT NULL,                         -- 'CASH', 'UPI', 'CARD', 'CREDIT'
    subtotal_paise INTEGER NOT NULL,
    gst_total_paise INTEGER NOT NULL,
    discount_paise INTEGER NOT NULL DEFAULT 0,
    grand_total_paise INTEGER NOT NULL,
    billing_tier TEXT NOT NULL,                         -- 'PER_ORDER_050', 'PER_INVOICE_100'
    platform_fee_paise INTEGER NOT NULL,                -- 50 (Rs. 0.50) or 100 (Rs. 1.00)
    sync_status TEXT NOT NULL DEFAULT 'offline_queued', -- 'offline_queued' | 'synced'
    created_at_unix INTEGER NOT NULL
);

-- 4. INVOICE LINE ITEMS
CREATE TABLE IF NOT EXISTS invoice_line_items (
    line_id TEXT PRIMARY KEY,
    invoice_uuid TEXT NOT NULL REFERENCES invoices(invoice_uuid) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    qty REAL NOT NULL,
    rate_paise INTEGER NOT NULL,
    gst_percent REAL NOT NULL,
    line_total_paise INTEGER NOT NULL
);

-- PERFORMANCE & SYNC QUEUE INDEXES
CREATE INDEX IF NOT EXISTS idx_invoices_sync_status ON invoices(sync_status);
CREATE INDEX IF NOT EXISTS idx_invoices_year_month ON invoices(year_month_prefix);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at_unix);
CREATE INDEX IF NOT EXISTS idx_catalog_items_tenant ON catalog_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_line_items_invoice ON invoice_line_items(invoice_uuid);
