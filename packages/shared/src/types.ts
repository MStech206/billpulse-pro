/**
 * BillPulse Pro — Shared Core Types & Interfaces
 */

export type BillingPlan = 'PER_ORDER_050' | 'PER_INVOICE_100' | 'MONTHLY_UNLIMITED';

export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CREDIT';

export type SyncStatus = 'offline_queued' | 'synced' | 'sync_failed';

export type GuardStatusCode =
  | 'CLOCK_TAMPERED_CONNECT_INTERNET'
  | 'BLOCKED_OFFLINE_OVER_7_DAYS'
  | 'OFFLINE_ALLOWED'
  | 'PAYMENT_DUE_ON_RECONNECT'
  | 'UNLOCKED_AND_VERIFIED';

export interface MerchantProfile {
  tenant_id: string;
  company_name: string;
  company_address?: string;
  company_gstin?: string;
  upi_id?: string;
  invoice_prefix: string;
  billing_plan: BillingPlan;
  logo_data_uri?: string;
  signature_data_uri?: string;
  active_year_month: string; // 'YYYY-MM'
  last_synced_at: number; // Unix timestamp in seconds
  max_seen_timestamp: number; // Monotonic clock guard
  pending_dues_paise: number; // Stored in paise
  signed_license_jwt?: string;
  device_id: string;
  terminal_code: string; // e.g. 'D1', 'D2', 'W1'
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
  invoice_number: string; // e.g. 'INV-202611-D1-0001'
  year_month_prefix: string; // '202611'
  invoice_date: string; // 'YYYY-MM-DD'
  customer_name: string;
  customer_phone?: string;
  customer_gstin?: string;
  payment_mode: PaymentMode;
  subtotal_paise: number;
  gst_total_paise: number;
  discount_paise: number;
  grand_total_paise: number;
  billing_tier: BillingPlan;
  platform_fee_paise: number; // 50, 100, or 0
  sync_status: SyncStatus;
  created_at_unix: number;
  items?: InvoiceLineItem[];
}

export interface GuardEvaluationResult {
  allowed: boolean;
  code: GuardStatusCode;
  message?: string;
  offlineDays?: number;
  remainingGraceDays?: number;
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
  license_status: 'VALID' | 'PAYMENT_REQUIRED';
  signed_license_jwt?: string;
}

/**
 * Format paise to INR display string (e.g. 50 -> "0.50", 12500 -> "125.00")
 */
export function formatPaiseToINR(paise: number): string {
  return (paise / 100).toFixed(2);
}

/**
 * Compute platform fee in paise for an invoice based on billing tier
 */
export function getPlatformFeePaise(billingTier: BillingPlan): number {
  switch (billingTier) {
    case 'PER_ORDER_050':
      return 50; // Rs. 0.50
    case 'PER_INVOICE_100':
      return 100; // Rs. 1.00
    case 'MONTHLY_UNLIMITED':
      return 0; // Included in monthly flat fee
  }
}
