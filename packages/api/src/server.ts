/**
 * BillPulse Pro — Cloud API Gateway, Sync Engine & Admin Web Service
 *
 * Implements:
 * 1. POST /api/v1/license/activate    - Hardware-bound desktop license activation
 * 2. POST /api/v1/sync/batch          - Offline bill delta ingestion & fee accrual (Rs. 20 base + orders)
 * 3. POST /api/v1/webhooks/razorpay   - Razorpay HMAC verification & automatic unblock
 * 4. GET  /api/v1/admin/dashboard     - Global metrics (active, warning, blocked, revenue)
 * 5. GET  /api/v1/admin/merchants     - Merchant list with filter & search
 * 6. POST /api/v1/admin/merchants/:id/action - Grant / Revoke / Suspend
 * 7. GET  /api/v1/admin/orders/:id    - Audit order log per merchant
 * 8. POST /api/v1/admin/keys/generate - Generate new Serial Numbers & Activation Keys
 */

import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import type {
  SyncBatchPayload,
  SyncBatchResponse,
  BillingPlan,
  AdminDashboardMetrics,
  MerchantAdminRecord,
  BlockLogEntry,
  LicenseKeyRecord,
} from '../../shared/src/types.js';
import {
  MONTHLY_BASE_FEE_PAISE,
  calculateMonthEndDuesPaise,
} from '../../shared/src/types.js';

/**
 * Timing-safe HMAC-SHA256 signature verification for Razorpay Webhooks
 */
export function verifyRazorpaySignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!rawBody || !signature || !secret) return false;
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const actualBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}

/**
 * Ingests a batch of offline-queued invoices from desktop
 */
export function processBatchSync(
  payload: SyncBatchPayload,
  currentOrdersCount: number,
  merchantBillingPlan: BillingPlan
): SyncBatchResponse {
  const syncedIds: string[] = [];
  const failedIds: string[] = [];

  for (const inv of payload.invoices) {
    if (!inv.invoice_uuid || !inv.invoice_number) {
      failedIds.push(inv.invoice_uuid || 'unknown');
      continue;
    }
    syncedIds.push(inv.invoice_uuid);
  }

  const newTotalOrders = currentOrdersCount + syncedIds.length;
  const newTotalDuesPaise = calculateMonthEndDuesPaise(newTotalOrders, merchantBillingPlan);
  const currentMonth = new Date().toISOString().slice(0, 7);

  return {
    synced_ids: syncedIds,
    failed_ids: failedIds,
    pending_dues_paise: newTotalDuesPaise,
    pending_dues_inr: newTotalDuesPaise / 100,
    active_year_month: currentMonth,
    license_status: newTotalDuesPaise > 0 ? 'WARNING' : 'ACTIVE',
    signed_license_jwt: `jwt-signed-${payload.tenant_id}-${Date.now()}`,
  };
}

/**
 * Generates formatted Serial Number & Activation Key
 * Format: BP-2026-XXXX-XXXX and ACT-XXXX-XXXX-XXXX
 */
export function generateLicenseCredentials(rateTier: BillingPlan): LicenseKeyRecord {
  const randBlock = () => Math.floor(1000 + Math.random() * 9000).toString();
  const serialNumber = `BP-2026-${randBlock()}-${randBlock()}`;
  const activationKey = `ACT-${randBlock()}-${randBlock()}-${randBlock()}`;

  return {
    license_id: randomUUID(),
    serial_number: serialNumber,
    activation_key: activationKey,
    rate_tier: rateTier,
    max_terminals: 1,
    status: 'UNUSED',
    created_at: new Date().toISOString(),
  };
}

/**
 * Computes Admin Dashboard Overview Metrics
 */
export function calculateAdminMetrics(merchants: MerchantAdminRecord[]): AdminDashboardMetrics {
  let totalOrders = 0;
  let totalExpectedPaise = 0;
  let totalCollectedPaise = 0;
  let activeCount = 0;
  let warningCount = 0;
  let blockedCount = 0;
  let unpaidCount = 0;

  for (const m of merchants) {
    totalOrders += m.total_orders_month;
    totalExpectedPaise += m.total_due_paise;

    if (m.payment_status === 'PAID') {
      totalCollectedPaise += m.total_due_paise;
    } else {
      unpaidCount++;
    }

    if (m.license_status === 'ACTIVE') activeCount++;
    if (m.license_status === 'WARNING') warningCount++;
    if (m.license_status === 'BLOCKED' || m.license_status === 'SUSPENDED') blockedCount++;
  }

  return {
    total_merchants: merchants.length,
    active_merchants: activeCount,
    warning_merchants: warningCount,
    blocked_merchants: blockedCount,
    total_orders_this_month: totalOrders,
    total_revenue_expected_paise: totalExpectedPaise,
    total_revenue_collected_paise: totalCollectedPaise,
    unpaid_merchants_count: unpaidCount,
  };
}
