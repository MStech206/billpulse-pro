/**
 * BillPulse Pro — Standardized Desktop Guard & Post-Month 7th-to-11th Grace Engine
 *
 * Implements:
 * 1. Monotonic high-water mark to detect OS clock rollbacks (>300s).
 * 2. Mandatory YYYYMM month prefix enforcement.
 * 3. Day 1–7 Post-Month: Soft green reminder (Allowed).
 * 4. Day 7–11 Post-Month: Urgent orange warning ("Blocked after 11th" — Allowed).
 * 5. Day 11+ Post-Month: Hard block (Creation blocked until Razorpay UPI payment).
 * 6. Payment settlement verification: Unlocks immediately when dues == 0.
 */

import type {
  MerchantProfile,
  GuardEvaluationResult,
  BillingPlan,
} from '../../shared/src/types.js';

export const DAY_7_GRACE_DAYS = 7;
export const DAY_11_BLOCK_DAYS = 11;
export const SECONDS_PER_DAY = 86400;
export const CLOCK_ROLLBACK_TOLERANCE_SECONDS = 300; // 5 minutes

export function getEndOfMonthUnix(yearMonth: string): number {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return Math.floor(endOfMonth.getTime() / 1000);
}

export function formatUnixToYearMonth(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function checkMonotonicClock(
  nowUnix: number,
  maxSeenTimestamp: number
): { isTampered: boolean; message?: string } {
  if (nowUnix < maxSeenTimestamp - CLOCK_ROLLBACK_TOLERANCE_SECONDS) {
    const rolledBackSeconds = maxSeenTimestamp - nowUnix;
    return {
      isTampered: true,
      message: `System clock rolled back by ${rolledBackSeconds}s. Maximum recorded timestamp was ${maxSeenTimestamp}.`,
    };
  }
  return { isTampered: false };
}

export function updateMonotonicTimestamp(currentMax: number, nowUnix: number): number {
  return Math.max(currentMax, nowUnix);
}

export function generateInvoiceNumber(
  prefix: string,
  yearMonth: string,
  sequenceNumber: number,
  terminalCode?: string
): string {
  const cleanYearMonth = yearMonth.replace('-', '');
  const seqPadded = String(sequenceNumber).padStart(4, '0');
  if (terminalCode && terminalCode.trim().length > 0) {
    return `${prefix}-${cleanYearMonth}-${terminalCode.trim().toUpperCase()}-${seqPadded}`;
  }
  return `${prefix}-${cleanYearMonth}-${seqPadded}`;
}

/**
 * Core Standardized Desktop Verification Algorithm
 */
export function verifyDesktopGuard(
  profile: MerchantProfile,
  nowUnix: number,
  isInternetConnected: boolean
): GuardEvaluationResult {
  // 1. Anti-Tamper System Clock Check
  const clockCheck = checkMonotonicClock(nowUnix, profile.max_seen_timestamp);
  if (clockCheck.isTampered) {
    return {
      allowed: false,
      code: 'CLOCK_TAMPERED_CONNECT_INTERNET',
      message: clockCheck.message || 'System clock rollback detected. Connect to internet to re-verify time.',
    };
  }

  // 2. Administrative Revocation Check
  if (profile.license_status === 'REVOKED' || profile.license_status === 'SUSPENDED') {
    return {
      allowed: false,
      code: 'BLOCKED_POST_MONTH_EXCEEDED',
      message: 'License has been suspended or revoked by the platform administrator.',
    };
  }

  const currentYearMonth = formatUnixToYearMonth(nowUnix); // e.g. '2026-12'
  const isMonthExceeded = currentYearMonth > profile.active_year_month;

  // 3. Compute days elapsed since active billing month ended
  const activeMonthEndUnix = getEndOfMonthUnix(profile.active_year_month);
  const referenceTimestamp = Math.max(profile.last_synced_at, activeMonthEndUnix);
  const offlineDaysAfterMonthEnd = isMonthExceeded
    ? Math.floor(Math.max(0, nowUnix - referenceTimestamp) / SECONDS_PER_DAY)
    : 0;

  const duesINR = profile.pending_dues_paise / 100;

  // 4. In-Month Operation: Normal billing
  if (!isMonthExceeded) {
    if (!isInternetConnected) {
      return {
        allowed: true,
        code: 'OFFLINE_ALLOWED',
        message: 'Normal offline billing active for the current calendar month.',
      };
    }
    return {
      allowed: true,
      code: 'UNLOCKED_AND_VERIFIED',
      nextPrefix: `${profile.invoice_prefix}-${currentYearMonth.replace('-', '')}-`,
      message: 'Online billing active and synchronized.',
    };
  }

  // 5. Post-Month Operation: 7th to 11th Policy
  const daysUntilBlock = Math.max(0, DAY_11_BLOCK_DAYS - offlineDaysAfterMonthEnd);

  // If already paid up:
  if (profile.pending_dues_paise === 0) {
    return {
      allowed: true,
      code: 'UNLOCKED_AND_VERIFIED',
      nextPrefix: `${profile.invoice_prefix}-${currentYearMonth.replace('-', '')}-`,
      message: 'Previous month settled. New month cycle fully unlocked.',
    };
  }

  // PHASE A: Day 11+ -> HARD BLOCK (Offline or Online with unpaid balance)
  if (offlineDaysAfterMonthEnd > DAY_11_BLOCK_DAYS) {
    return {
      allowed: false,
      code: 'BLOCKED_POST_MONTH_EXCEEDED',
      offlineDays: offlineDaysAfterMonthEnd,
      daysUntilBlock: 0,
      pendingDuesINR: duesINR,
      message: `Your application is blocked. Past month dues of Rs. ${duesINR.toFixed(2)} must be paid via Razorpay to resume billing.`,
    };
  }

  // PHASE B: Day 7 to Day 11 -> URGENT ORANGE WARNING (Billing Allowed)
  if (offlineDaysAfterMonthEnd > DAY_7_GRACE_DAYS) {
    return {
      allowed: true,
      code: 'POST_MONTH_WARNING',
      offlineDays: offlineDaysAfterMonthEnd,
      daysUntilBlock,
      pendingDuesINR: duesINR,
      message: `Your application may be blocked after the 11th! ${daysUntilBlock} day(s) remaining. Pay Rs. ${duesINR.toFixed(2)} via UPI.`,
    };
  }

  // PHASE C: Day 1 to Day 7 -> SOFT GREEN REMINDER (Billing Allowed)
  return {
    allowed: true,
    code: 'POST_MONTH_REMINDER',
    offlineDays: offlineDaysAfterMonthEnd,
    daysUntilBlock,
    pendingDuesINR: duesINR,
    message: `Past month dues: Rs. ${duesINR.toFixed(2)}. Grace period active (${daysUntilBlock} days left).`,
  };
}
