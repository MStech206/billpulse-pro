-- ==============================================================================
-- BillPulse Pro — Seed Data for Development, Testing & Admin Demonstration
-- ==============================================================================

-- 1. Sample Merchant Profiles
INSERT OR REPLACE INTO merchant_profile (
    tenant_id, company_name, company_address, company_gstin, upi_id, owner_mobile,
    business_type, invoice_prefix, billing_plan, active_year_month, last_synced_at,
    max_seen_timestamp, total_orders_month, pending_dues_paise, device_id, terminal_code, license_status
) VALUES
(
    'tenant-tea-001',
    'Syed Tea Corner',
    'Shop #12, Market Ring Road, Bengaluru, KA - 560001',
    '29AABCU9603R1ZM',
    'syedtea@upi',
    '9876543210',
    'TEA_SHOP',
    'TEA',
    'PER_ORDER_050',
    '2026-11',
    1796083199,
    1796083199,
    412,
    22600, -- Rs. 20 base + 412 * Rs. 0.50 = Rs. 226.00 (Unpaid)
    'DEV-HWID-TEA-001',
    'D1',
    'WARNING' -- Day 8 into December: Warning state
),
(
    'tenant-krn-002',
    'Apex Kirana Store',
    'Crossroad 4, Jayanagar, Bengaluru, KA - 560041',
    '29AABCK1234Q1Z1',
    'apexkirana@upi',
    '9845012345',
    'KIRANA_STORE',
    'KRN',
    'PER_ORDER_050',
    '2026-11',
    1796083199,
    1796083199,
    280,
    0, -- Paid up! (dues = 0)
    'DEV-HWID-KRN-002',
    'D1',
    'ACTIVE'
),
(
    'tenant-whl-003',
    'Metro Wholesale Mandi',
    'APMC Yard, Gate 2, Yeshwanthpur, Bengaluru, KA - 560022',
    '29AABCM9988P1Z5',
    'metromandi@upi',
    '9811099887',
    'WHOLESALE',
    'WHL',
    'PER_INVOICE_100',
    '2026-11',
    1796083199,
    1796083199,
    180,
    134000, -- Rs. 20 base + 180 * Rs. 1.00 = Rs. 200.00 + past overdue = Rs. 1,340.00 (Unpaid on Day 12)
    'DEV-HWID-WHL-003',
    'D1',
    'BLOCKED' -- Day 12: Blocked state
);

-- 2. Fast-Moving Catalog Items for Tea Shop (F6 Quick Pills)
INSERT OR REPLACE INTO catalog_items (item_id, tenant_id, item_name, hsn_code, selling_rate_paise, gst_percent, updated_at) VALUES
('ITEM-TEA-01', 'tenant-tea-001', 'Special Milk Tea', '2101', 1500, 5.0, 1794220800),
('ITEM-TEA-02', 'tenant-tea-001', 'Filter Coffee', '0901', 2000, 5.0, 1794220800),
('ITEM-TEA-03', 'tenant-tea-001', 'Crispy Samosa', '1905', 1500, 5.0, 1794220800),
('ITEM-TEA-04', 'tenant-tea-001', 'Fresh Lime Soda', '2202', 3000, 5.0, 1794220800),
('ITEM-TEA-05', 'tenant-tea-001', 'Osmania Biscuit (2pc)', '1905', 1000, 5.0, 1794220800),
('ITEM-TEA-06', 'tenant-tea-001', 'Veg Sandwich', '2106', 4000, 5.0, 1794220800);

-- 3. Sample Order for Syed Tea Corner
INSERT OR REPLACE INTO invoices (
    invoice_uuid, tenant_id, invoice_number, year_month_prefix, invoice_date,
    customer_name, customer_phone, payment_mode, subtotal_paise, gst_total_paise,
    discount_paise, grand_total_paise, billing_tier, platform_fee_paise, sync_status, created_at_unix
) VALUES (
    '550e8400-e29b-41d4-a716-446655440042',
    'tenant-tea-001',
    'TEA-202611-0042',
    '202611',
    '2026-11-11',
    'Counter Cash Customer',
    NULL,
    'CASH',
    6500, -- Rs. 65.00
    325,  -- Rs. 3.25 (5% GST)
    0,
    6825, -- Rs. 68.25
    'PER_ORDER_050',
    50,   -- Rs. 0.50 platform fee
    'synced',
    1794220800
);

INSERT OR REPLACE INTO invoice_line_items (line_id, invoice_uuid, item_name, qty, rate_paise, gst_percent, line_total_paise) VALUES
('LINE-42-1', '550e8400-e29b-41d4-a716-446655440042', 'Special Milk Tea', 2.0, 1500, 5.0, 3150),
('LINE-42-2', '550e8400-e29b-41d4-a716-446655440042', 'Crispy Samosa', 1.0, 1500, 5.0, 1575),
('LINE-42-3', '550e8400-e29b-41d4-a716-446655440042', 'Filter Coffee', 1.0, 2000, 5.0, 2100);
