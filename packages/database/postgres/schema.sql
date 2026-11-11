-- ==============================================================================
-- BillPulse Pro — Cloud Master Database Schema (PostgreSQL 16 / Supabase)
-- Multi-Tenant Architecture with Admin Control & License Management
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ADMIN USERS (Platform Owner & Support Staff)
CREATE TABLE IF NOT EXISTS admin_users (
    admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'SUPER_ADMIN', -- 'SUPER_ADMIN', 'SUPPORT'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MERCHANT PROFILE & SUBSCRIPTION STATE
CREATE TABLE IF NOT EXISTS merchant_profile (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    company_gstin VARCHAR(15),
    upi_id VARCHAR(100),
    owner_mobile VARCHAR(20) NOT NULL UNIQUE,
    business_type VARCHAR(50) NOT NULL DEFAULT 'TEA_SHOP',
    invoice_prefix VARCHAR(10) NOT NULL DEFAULT 'TEA',
    billing_plan VARCHAR(30) NOT NULL DEFAULT 'PER_ORDER_050',
    logo_url TEXT,
    signature_url TEXT,
    active_year_month VARCHAR(7) NOT NULL,                    -- Format: 'YYYY-MM'
    last_synced_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
    total_orders_month INT NOT NULL DEFAULT 0,
    monthly_base_fee_paise BIGINT NOT NULL DEFAULT 2000,      -- Fixed Rs. 20.00
    pending_dues_paise BIGINT NOT NULL DEFAULT 0,             -- Total Month-End Due
    license_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',     -- 'ACTIVE', 'WARNING', 'BLOCKED', 'REVOKED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MERCHANT LICENSES & HARDWARE BINDINGS
CREATE TABLE IF NOT EXISTS merchant_licenses (
    license_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES merchant_profile(tenant_id) ON DELETE SET NULL,
    serial_number VARCHAR(32) NOT NULL UNIQUE,               -- e.g. 'BP-2026-9842-1084'
    activation_key_hash VARCHAR(128) NOT NULL,
    max_terminals INT NOT NULL DEFAULT 1,
    rate_tier VARCHAR(30) NOT NULL DEFAULT 'PER_ORDER_050',
    status VARCHAR(20) NOT NULL DEFAULT 'UNUSED',            -- 'UNUSED', 'ACTIVE', 'REVOKED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS merchant_terminals (
    device_id VARCHAR(128) PRIMARY KEY,                      -- Machine hardware hash
    tenant_id UUID NOT NULL REFERENCES merchant_profile(tenant_id) ON DELETE CASCADE,
    terminal_code VARCHAR(4) NOT NULL,                        -- 'D1', 'D2', 'W1'
    terminal_name VARCHAR(100) NOT NULL,
    app_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, terminal_code)
);

-- 4. PRODUCT & SERVICE CATALOG
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

-- 5. MASTER INVOICES & ORDERS
CREATE TABLE IF NOT EXISTS invoices (
    invoice_uuid UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES merchant_profile(tenant_id) ON DELETE CASCADE,
    device_id VARCHAR(128) REFERENCES merchant_terminals(device_id),
    invoice_number VARCHAR(64) NOT NULL,
    year_month_prefix VARCHAR(6) NOT NULL,                    -- 'YYYYMM'
    invoice_date DATE NOT NULL,
    customer_name VARCHAR(255),
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

CREATE TABLE IF NOT EXISTS invoice_line_items (
    line_id VARCHAR(64) PRIMARY KEY,
    invoice_uuid UUID NOT NULL REFERENCES invoices(invoice_uuid) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    qty NUMERIC(10,3) NOT NULL,
    rate_paise BIGINT NOT NULL,
    gst_percent NUMERIC(4,2) NOT NULL,
    line_total_paise BIGINT NOT NULL
);

-- 6. NOTIFICATION & BLOCK AUDIT LOGS (7th Warning & 11th Block Tracking)
CREATE TABLE IF NOT EXISTS notification_block_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES merchant_profile(tenant_id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL,                          -- 'DAY_7_WARNING', 'DAY_11_BLOCKED', 'UNBLOCKED_PAYMENT', 'ADMIN_GRANTED', 'ADMIN_REVOKED'
    amount_due_paise BIGINT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. RAZORPAY BILLING & SETTLEMENT TRANSACTIONS
CREATE TABLE IF NOT EXISTS billing_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES merchant_profile(tenant_id) ON DELETE CASCADE,
    amount_paise BIGINT NOT NULL,
    razorpay_payment_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    billing_year_month VARCHAR(7) NOT NULL,                   -- e.g. '2026-11'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR SCALE
CREATE INDEX IF NOT EXISTS idx_cloud_invoices_tenant_month ON invoices(tenant_id, year_month_prefix);
CREATE INDEX IF NOT EXISTS idx_cloud_invoices_created ON invoices(created_at_unix);
CREATE INDEX IF NOT EXISTS idx_cloud_catalog_tenant ON catalog_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cloud_block_logs_tenant ON notification_block_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cloud_licenses_serial ON merchant_licenses(serial_number);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE merchant_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_block_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;
