-- ==============================================================================
-- BillPulse Pro — Cloud Master Database Schema (PostgreSQL 16 / Supabase)
-- Mode: Multi-Tenant with Row-Level Security (RLS)
-- Target: Cloud Data Hub, Multi-Device Sync & Micro-Billing Ledger
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MERCHANT PROFILE & SUBSCRIPTION STATE
CREATE TABLE IF NOT EXISTS merchant_profile (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    company_gstin VARCHAR(15),
    upi_id VARCHAR(100),
    invoice_prefix VARCHAR(10) NOT NULL DEFAULT 'INV',
    billing_plan VARCHAR(30) NOT NULL DEFAULT 'PER_ORDER_050', -- 'PER_ORDER_050' | 'PER_INVOICE_100' | 'MONTHLY_UNLIMITED'
    logo_url TEXT,                                            -- Stored in Cloudflare R2 bucket
    signature_url TEXT,                                       -- Stored in Cloudflare R2 bucket
    active_year_month VARCHAR(7) NOT NULL,                    -- Format: 'YYYY-MM'
    last_synced_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
    pending_dues_paise BIGINT NOT NULL DEFAULT 0,             -- Micro-billing balance in paise
    wallet_balance_paise BIGINT NOT NULL DEFAULT 0,           -- Prepaid reserve balance
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. REGISTERED TERMINALS / DEVICE BINDINGS
CREATE TABLE IF NOT EXISTS merchant_terminals (
    device_id VARCHAR(128) PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES merchant_profile(tenant_id) ON DELETE CASCADE,
    terminal_code VARCHAR(4) NOT NULL,                        -- e.g. 'D1', 'D2', 'W1'
    terminal_name VARCHAR(100) NOT NULL,
    app_version VARCHAR(20) NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, terminal_code)
);

-- 3. PRODUCT & SERVICE CATALOG
CREATE TABLE IF NOT EXISTS catalog_items (
    item_id VARCHAR(64) PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES merchant_profile(tenant_id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    hsn_code VARCHAR(10),
    selling_rate_paise BIGINT NOT NULL,
    gst_percent NUMERIC(4,2) NOT NULL DEFAULT 5.00,
    image_url TEXT,
    updated_at BIGINT NOT NULL
);

-- 4. MONTH-PREFIXED MASTER INVOICES
CREATE TABLE IF NOT EXISTS invoices (
    invoice_uuid UUID PRIMARY KEY,                            -- Sent from client UUIDv4 for idempotent upsert
    tenant_id UUID NOT NULL REFERENCES merchant_profile(tenant_id) ON DELETE CASCADE,
    device_id VARCHAR(128) REFERENCES merchant_terminals(device_id),
    invoice_number VARCHAR(64) NOT NULL,
    year_month_prefix VARCHAR(6) NOT NULL,                    -- 'YYYYMM'
    invoice_date DATE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_gstin VARCHAR(15),
    payment_mode VARCHAR(20) NOT NULL,
    subtotal_paise BIGINT NOT NULL,
    gst_total_paise BIGINT NOT NULL,
    discount_paise BIGINT NOT NULL DEFAULT 0,
    grand_total_paise BIGINT NOT NULL,
    billing_tier VARCHAR(30) NOT NULL,
    platform_fee_paise BIGINT NOT NULL,
    sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
    created_at_unix BIGINT NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, invoice_number)
);

-- 5. INVOICE LINE ITEMS
CREATE TABLE IF NOT EXISTS invoice_line_items (
    line_id VARCHAR(64) PRIMARY KEY,
    invoice_uuid UUID NOT NULL REFERENCES invoices(invoice_uuid) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    qty NUMERIC(10,3) NOT NULL,
    rate_paise BIGINT NOT NULL,
    gst_percent NUMERIC(4,2) NOT NULL,
    line_total_paise BIGINT NOT NULL
);

-- 6. MICRO-BILLING & WALLET TRANSACTION AUDIT LOG
CREATE TABLE IF NOT EXISTS billing_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES merchant_profile(tenant_id) ON DELETE CASCADE,
    amount_paise BIGINT NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,                    -- 'INVOICE_FEE_ACCRUAL', 'WALLET_TOPUP', 'MONTHLY_SETTLEMENT'
    razorpay_payment_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR SCALE (15M+ bills/mo)
CREATE INDEX IF NOT EXISTS idx_cloud_invoices_tenant_month ON invoices(tenant_id, year_month_prefix);
CREATE INDEX IF NOT EXISTS idx_cloud_invoices_created ON invoices(created_at_unix);
CREATE INDEX IF NOT EXISTS idx_cloud_catalog_tenant ON catalog_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cloud_line_items_invoice ON invoice_line_items(invoice_uuid);
CREATE INDEX IF NOT EXISTS idx_cloud_billing_tx_tenant ON billing_transactions(tenant_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE merchant_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;
