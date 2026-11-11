/**
 * BillPulse Pro — Shared Core Types, Business Presets & Configuration Models
 */

export type BusinessType =
  | 'TEA_SHOP'
  | 'KIRANA_STORE'
  | 'GENERAL_STORE'
  | 'MEDICAL_STORE'
  | 'WHOLESALE'
  | 'RESTAURANT'
  | 'BAKERY'
  | 'STATIONERY'
  | 'HARDWARE'
  | 'CUSTOM';

export type BillingPlan = 'PER_ORDER_050' | 'PER_INVOICE_100';

export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CREDIT';

export type SyncStatus = 'offline_queued' | 'synced' | 'sync_failed';

export type LicenseStatus = 'ACTIVE' | 'WARNING' | 'BLOCKED' | 'SUSPENDED' | 'REVOKED';

export type GuardStatusCode =
  | 'CLOCK_TAMPERED_CONNECT_INTERNET'
  | 'OFFLINE_ALLOWED'
  | 'POST_MONTH_REMINDER'    // Days 1 to 7: Soft green reminder
  | 'POST_MONTH_WARNING'     // Days 7 to 11: Orange warning ("Blocked after 11th")
  | 'BLOCKED_POST_MONTH_EXCEEDED' // Day 11+: Hard block until Razorpay settlement
  | 'PAYMENT_DUE_ON_RECONNECT'
  | 'UNLOCKED_AND_VERIFIED';

export const MONTHLY_BASE_FEE_PAISE = 2000; // Rs. 20.00
export const DAY_7_GRACE_DAYS = 7;
export const DAY_11_BLOCK_DAYS = 11;
export const CLOCK_ROLLBACK_TOLERANCE_SECONDS = 300; // 5 minutes

export interface MerchantProfile {
  tenant_id: string;
  company_name: string;
  company_address?: string;
  company_gstin?: string;
  upi_id?: string;
  owner_mobile: string;
  business_type: BusinessType;
  invoice_prefix: string; // e.g. 'TEA', 'KRN', 'INV'
  billing_plan: BillingPlan;
  logo_data_uri?: string;
  signature_data_uri?: string;
  active_year_month: string; // 'YYYY-MM' (e.g. '2026-11')
  last_synced_at: number; // Unix timestamp in seconds
  max_seen_timestamp: number; // Monotonic clock guard
  pending_dues_paise: number; // Stored in paise
  total_orders_month: number;
  signed_license_jwt?: string;
  device_id: string;
  terminal_code: string; // e.g. 'D1', 'D2', 'W1'
  license_status: LicenseStatus;
}

export interface CatalogItem {
  item_id: string;
  tenant_id: string;
  item_name: string;
  hsn_code?: string;
  selling_rate_paise: number;
  gst_percent: number; // e.g. 0, 5, 12, 18, 28
  image_data_uri?: string;
  updated_at: number;
}

export interface InvoiceLineItem {
  line_id: string;
  invoice_uuid: string;
  item_name: string;
  qty: number;
  rate_paise: number;
  gst_percent: number;
  line_total_paise: number;
}

export interface Invoice {
  invoice_uuid: string;
  tenant_id: string;
  invoice_number: string; // e.g. 'TEA-202611-0001' or 'TEA-202611-D1-0001'
  year_month_prefix: string; // '202611'
  invoice_date: string; // 'YYYY-MM-DD'
  customer_name?: string;
  customer_phone?: string;
  customer_gstin?: string;
  payment_mode: PaymentMode;
  subtotal_paise: number;
  gst_total_paise: number;
  discount_paise: number;
  grand_total_paise: number;
  billing_tier: BillingPlan;
  platform_fee_paise: number; // 50 (Rs. 0.50) or 100 (Rs. 1.00)
  sync_status: SyncStatus;
  created_at_unix: number;
  items?: InvoiceLineItem[];
}

export interface GuardEvaluationResult {
  allowed: boolean;
  code: GuardStatusCode;
  message?: string;
  offlineDays?: number;
  daysUntilBlock?: number;
  pendingDuesINR?: number;
  nextPrefix?: string;
}

export interface SyncBatchPayload {
  tenant_id: string;
  device_id: string;
  terminal_code: string;
  invoices: Invoice[];
  client_timestamp: number;
}

export interface SyncBatchResponse {
  synced_ids: string[];
  failed_ids: string[];
  pending_dues_paise: number;
  pending_dues_inr: number;
  active_year_month: string;
  license_status: LicenseStatus;
  signed_license_jwt?: string;
}

// ==========================================
// BUSINESS CONFIGURATION PRESETS
// ==========================================

export interface BusinessPresetConfig {
  name: string;
  defaultPrefix: string;
  defaultGstPercent: number;
  defaultPlan: BillingPlan;
  sampleItems: Array<{ name: string; rate_paise: number; gst_percent: number }>;
}

export const BUSINESS_PRESETS: Record<BusinessType, BusinessPresetConfig> = {
  TEA_SHOP: {
    name: 'Tea Shop / Chai Point',
    defaultPrefix: 'TEA',
    defaultGstPercent: 5.0,
    defaultPlan: 'PER_ORDER_050',
    sampleItems: [
      { name: 'Special Milk Tea', rate_paise: 1500, gst_percent: 5.0 },
      { name: 'Filter Coffee', rate_paise: 2000, gst_percent: 5.0 },
      { name: 'Masala Chai', rate_paise: 1500, gst_percent: 5.0 },
      { name: 'Fresh Lime Soda / Juice', rate_paise: 3000, gst_percent: 5.0 },
      { name: 'Osmania Biscuit (2pc)', rate_paise: 1000, gst_percent: 5.0 },
      { name: 'Crispy Samosa', rate_paise: 1500, gst_percent: 5.0 },
      { name: 'Veg Sandwich', rate_paise: 4000, gst_percent: 5.0 },
      { name: 'Medu Vada (1pc)', rate_paise: 1500, gst_percent: 5.0 },
    ],
  },
  KIRANA_STORE: {
    name: 'Kirana & Grocery Store',
    defaultPrefix: 'KRN',
    defaultGstPercent: 5.0,
    defaultPlan: 'PER_ORDER_050',
    sampleItems: [
      { name: 'Basmati Rice Premium (1kg)', rate_paise: 12000, gst_percent: 5.0 },
      { name: 'Sunflower Cooking Oil (1L)', rate_paise: 14500, gst_percent: 5.0 },
      { name: 'Refined Sugar (1kg)', rate_paise: 4400, gst_percent: 5.0 },
      { name: 'Chakki Fresh Atta (5kg)', rate_paise: 22000, gst_percent: 5.0 },
      { name: 'Toor Dal Premium (1kg)', rate_paise: 16000, gst_percent: 5.0 },
      { name: 'Iodized Table Salt (1kg)', rate_paise: 2500, gst_percent: 0.0 },
      { name: 'Farm Fresh Eggs (6 pack)', rate_paise: 4800, gst_percent: 0.0 },
      { name: 'Toned Milk Pouch (500ml)', rate_paise: 2700, gst_percent: 0.0 },
    ],
  },
  GENERAL_STORE: {
    name: 'General Store / Provision',
    defaultPrefix: 'GEN',
    defaultGstPercent: 12.0,
    defaultPlan: 'PER_ORDER_050',
    sampleItems: [
      { name: 'Bathing Soap (4-pack)', rate_paise: 14000, gst_percent: 18.0 },
      { name: 'Toothpaste Fresh (150g)', rate_paise: 9500, gst_percent: 18.0 },
      { name: 'Washing Detergent (1kg)', rate_paise: 12500, gst_percent: 18.0 },
      { name: 'Potato Chips Family Pack', rate_paise: 4000, gst_percent: 12.0 },
      { name: 'Soft Drink (750ml)', rate_paise: 4500, gst_percent: 28.0 },
      { name: 'Ballpoint Pen Box (5pc)', rate_paise: 5000, gst_percent: 12.0 },
    ],
  },
  MEDICAL_STORE: {
    name: 'Medical / Pharmacy Store',
    defaultPrefix: 'MED',
    defaultGstPercent: 12.0,
    defaultPlan: 'PER_ORDER_050',
    sampleItems: [
      { name: 'Paracetamol 650mg (15 tab)', rate_paise: 3200, gst_percent: 12.0 },
      { name: 'Cough Relief Syrup (100ml)', rate_paise: 9500, gst_percent: 12.0 },
      { name: 'Antacid Chewable (10 tab)', rate_paise: 2800, gst_percent: 12.0 },
      { name: 'Vitamin C 500mg (15 tab)', rate_paise: 4500, gst_percent: 12.0 },
      { name: 'First Aid Adhesive Bandage (10pc)', rate_paise: 3000, gst_percent: 12.0 },
      { name: 'Hand Sanitizer Gel (100ml)', rate_paise: 5000, gst_percent: 18.0 },
    ],
  },
  WHOLESALE: {
    name: 'Wholesaler / Distributor / Mandi',
    defaultPrefix: 'WHL',
    defaultGstPercent: 18.0,
    defaultPlan: 'PER_INVOICE_100',
    sampleItems: [
      { name: 'Basmati Rice Bag (25kg)', rate_paise: 275000, gst_percent: 5.0 },
      { name: 'Cooking Oil Tin (15kg)', rate_paise: 215000, gst_percent: 5.0 },
      { name: 'Sugar Bag (50kg)', rate_paise: 210000, gst_percent: 5.0 },
      { name: 'Wheat Flour Sack (50kg)', rate_paise: 195000, gst_percent: 5.0 },
      { name: 'Corrugated Packing Boxes (100pc)', rate_paise: 350000, gst_percent: 18.0 },
    ],
  },
  RESTAURANT: {
    name: 'Restaurant / Cafe / Food Joint',
    defaultPrefix: 'RST',
    defaultGstPercent: 5.0,
    defaultPlan: 'PER_ORDER_050',
    sampleItems: [
      { name: 'Special Chicken Biryani', rate_paise: 22000, gst_percent: 5.0 },
      { name: 'Paneer Butter Masala', rate_paise: 18000, gst_percent: 5.0 },
      { name: 'Butter Roti (2pc)', rate_paise: 4000, gst_percent: 5.0 },
      { name: 'Veg Fried Rice', rate_paise: 14000, gst_percent: 5.0 },
      { name: 'Mineral Water (1L)', rate_paise: 2000, gst_percent: 18.0 },
      { name: 'Gulab Jamun (2pc)', rate_paise: 6000, gst_percent: 5.0 },
    ],
  },
  BAKERY: {
    name: 'Bakery & Confectionery',
    defaultPrefix: 'BKR',
    defaultGstPercent: 5.0,
    defaultPlan: 'PER_ORDER_050',
    sampleItems: [
      { name: 'Fresh Milk Bread (400g)', rate_paise: 4500, gst_percent: 0.0 },
      { name: 'Eggless Chocolate Pastry', rate_paise: 6000, gst_percent: 18.0 },
      { name: 'Black Forest Cake (500g)', rate_paise: 38000, gst_percent: 18.0 },
      { name: 'Butter Cookies (250g)', rate_paise: 9000, gst_percent: 5.0 },
      { name: 'Veg Puff / Patty', rate_paise: 2000, gst_percent: 5.0 },
    ],
  },
  STATIONERY: {
    name: 'Stationery & Xerox Shop',
    defaultPrefix: 'STN',
    defaultGstPercent: 12.0,
    defaultPlan: 'PER_ORDER_050',
    sampleItems: [
      { name: 'Classmate Long Notebook (180p)', rate_paise: 6500, gst_percent: 12.0 },
      { name: 'Ball Pen Blue (Pack of 5)', rate_paise: 5000, gst_percent: 12.0 },
      { name: 'A4 Copier Paper (500 sheets)', rate_paise: 28000, gst_percent: 12.0 },
      { name: 'A4 B&W Xerox Print (per page)', rate_paise: 200, gst_percent: 12.0 },
      { name: 'Document Lamination', rate_paise: 3000, gst_percent: 18.0 },
    ],
  },
  HARDWARE: {
    name: 'Hardware, Electricals & Sanitary',
    defaultPrefix: 'HWD',
    defaultGstPercent: 18.0,
    defaultPlan: 'PER_INVOICE_100',
    sampleItems: [
      { name: 'LED Bulb 9W Cool White', rate_paise: 11000, gst_percent: 18.0 },
      { name: 'PVC Pipe 1 inch (3m)', rate_paise: 24000, gst_percent: 18.0 },
      { name: 'Stainless Steel Tap 1/2 inch', rate_paise: 45000, gst_percent: 18.0 },
      { name: 'Electrical Tape Roll', rate_paise: 2000, gst_percent: 18.0 },
      { name: 'Wall Putty (5kg)', rate_paise: 21000, gst_percent: 18.0 },
    ],
  },
  CUSTOM: {
    name: 'Custom Business Setup',
    defaultPrefix: 'INV',
    defaultGstPercent: 5.0,
    defaultPlan: 'PER_ORDER_050',
    sampleItems: [],
  },
};

// ==========================================
// ADMIN WEB PANEL DATA MODELS
// ==========================================

export interface MerchantAdminRecord {
  tenant_id: string;
  company_name: string;
  business_type: BusinessType;
  owner_mobile: string;
  serial_number: string;
  active_year_month: string;
  total_orders_month: number;
  monthly_base_fee_paise: number; // 2000 (Rs. 20)
  order_fees_paise: number;       // total_orders * fee
  total_due_paise: number;        // base + order_fees
  total_due_inr: number;
  payment_status: 'PAID' | 'UNPAID';
  license_status: LicenseStatus;
  days_into_month: number;        // e.g. 5 on Dec 5th
  last_synced_at: number;
  terminal_count: number;
}

export interface AdminDashboardMetrics {
  total_merchants: number;
  active_merchants: number;
  blocked_merchants: number;
  warning_merchants: number;
  total_orders_this_month: number;
  total_revenue_expected_paise: number;
  total_revenue_collected_paise: number;
  unpaid_merchants_count: number;
}

export interface BlockLogEntry {
  log_id: string;
  tenant_id: string;
  company_name: string;
  owner_mobile: string;
  event_type: 'DAY_7_WARNING' | 'DAY_11_BLOCKED' | 'UNBLOCKED_PAYMENT' | 'ADMIN_GRANTED' | 'ADMIN_REVOKED';
  timestamp_unix: number;
  amount_due_paise: number;
  details: string;
}

export interface LicenseKeyRecord {
  license_id: string;
  serial_number: string;
  activation_key: string;
  assigned_tenant_id?: string;
  assigned_shop_name?: string;
  rate_tier: BillingPlan;
  max_terminals: number;
  status: 'UNUSED' | 'ACTIVE' | 'REVOKED';
  created_at: string;
}

/**
 * Calculates total month-end dues in paise:
 * Rs. 20 fixed base fee + (total_orders * order_rate)
 */
export function calculateMonthEndDuesPaise(
  totalOrders: number,
  tier: BillingPlan
): number {
  const perOrderFee = tier === 'PER_INVOICE_100' ? 100 : 50;
  return MONTHLY_BASE_FEE_PAISE + totalOrders * perOrderFee;
}

export function formatPaiseToINR(paise: number): string {
  return (paise / 100).toFixed(2);
}
