-- ==============================================================================
-- BillPulse Pro — Seed Data for Local Development & Testing
-- ==============================================================================

-- 1. Sample Merchant Profile
INSERT OR REPLACE INTO merchant_profile (
    tenant_id,
    company_name,
    company_address,
    company_gstin,
    upi_id,
    invoice_prefix,
    billing_plan,
    logo_data_uri,
    signature_data_uri,
    active_year_month,
    last_synced_at,
    max_seen_timestamp,
    pending_dues_paise,
    signed_license_jwt,
    device_id,
    terminal_code
) VALUES (
    'tenant-demo-001',
    'Apex Retail & Wholesale Superstore',
    'Shop #12, Commercial Ring Road, Bengaluru, KA - 560001',
    '29AABCU9603R1ZM',
    'apexretail@upi',
    'INV',
    'PER_ORDER_050',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    '2026-11',
    1794220800,
    1794220800,
    0,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo.signature',
    'DEV-MOCK-HARDWARE-UUID-9988',
    'D1'
);

-- 2. Fast-Moving Catalog Items (F6 Quick Pills)
INSERT OR REPLACE INTO catalog_items (item_id, tenant_id, item_name, hsn_code, selling_rate_paise, gst_percent, updated_at) VALUES
('ITEM-101', 'tenant-demo-001', 'Basmati Rice Premium (1kg)', '1006', 12000, 5.0, 1794220800),
('ITEM-102', 'tenant-demo-001', 'Sunflower Cooking Oil (1L)', '1512', 14500, 5.0, 1794220800),
('ITEM-103', 'tenant-demo-001', 'Refined Wheat Flour (Maida) 500g', '1101', 3500, 5.0, 1794220800),
('ITEM-104', 'tenant-demo-001', 'Organic Turmeric Powder (200g)', '0910', 4800, 5.0, 1794220800),
('ITEM-105', 'tenant-demo-001', 'Thermal Receipt Paper Rolls (58mm 10-pack)', '4811', 28000, 18.0, 1794220800);

-- 3. Sample Invoices (Offline Queued)
INSERT OR REPLACE INTO invoices (
    invoice_uuid,
    tenant_id,
    invoice_number,
    year_month_prefix,
    invoice_date,
    customer_name,
    customer_phone,
    customer_gstin,
    payment_mode,
    subtotal_paise,
    gst_total_paise,
    discount_paise,
    grand_total_paise,
    billing_tier,
    platform_fee_paise,
    sync_status,
    created_at_unix
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'tenant-demo-001',
    'INV-202611-D1-0001',
    '202611',
    '2026-11-09',
    'Ramesh Kumar',
    '9876543210',
    NULL,
    'UPI',
    26500,
    1325,
    0,
    27825,
    'PER_ORDER_050',
    50,
    'offline_queued',
    1794220800
);

INSERT OR REPLACE INTO invoice_line_items (line_id, invoice_uuid, item_name, qty, rate_paise, gst_percent, line_total_paise) VALUES
('LINE-101-1', '550e8400-e29b-41d4-a716-446655440001', 'Basmati Rice Premium (1kg)', 1.0, 12000, 5.0, 12600),
('LINE-101-2', '550e8400-e29b-41d4-a716-446655440001', 'Sunflower Cooking Oil (1L)', 1.0, 14500, 5.0, 15225);
