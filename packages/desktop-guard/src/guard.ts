/**
 * BillPulse Pro — Hardcoded Desktop Guard & Monotonic Clock Anti-Tamper Engine
 *
 * Implements the core offline security policies:
 * 1. Monotonic high-water mark to detect OS clock rollbacks (>300s).
 * 2. Mandatory YYYYMM month prefix enforcement.
 * 3. 7-day post-month grace period for offline operation.
 * 4. Hard block on Day 8+ post-month if internet remains disconnected.
 * 5. Reconnection dues verification & Razorpay settlement gate.
 */

import type { MerchantProfile, GuardEvaluationResult } from '../../shared/src/types.js';

export const MAX_GRACE_DAYS_POST_MONTH = 7;
export const SECONDS_PER_DAY = 86400;
export const CLOCK_ROLLBACK_TOLERANCE_SECONDS = 300; // 5 minutes

/**
 * Returns the Unix epoch timestamp (in seconds) for the final second of the given 'YYYY-MM'
 */
export function getEndOfMonthUnix(yearMonth: string): number {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  // Date with day 0 of month+1 is the last day of month in UTC
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return Math.floor(endOfMonth.getTime() / 1000);
}

/**
 * Format a Unix timestamp (seconds) into 'YYYY-MM' string in UTC
 */
export function formatUnixToYearMonth(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Validates the current system clock against monotonic high-water mark
 */
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

/**
 * Updates the monotonic high-water mark timestamp safely
 */
export function updateMonotonicTimestamp(currentMax: number, nowUnix: number): number {
  return Math.max(currentMax, nowUnix);
}

/**
 * Generates an invoice number complying with the mandatory YYYYMM format:
 * Format: {PREFIX}-{YYYYMM}-{TERMINAL}-{SEQ} (e.g. INV-202611-D1-0001)
 * or {PREFIX}-{YYYYMM}-{SEQ} if terminal code is omitted.
 */
export function generateInvoiceNumber(
  prefix: string,
  yearMonth: string, // '2026-11' or '202611'
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
 * Core Hardcoded Desktop Verification Algorithm
 * Evaluates whether new invoice creation is allowed based on:
 * - Anti-tamper clock check
 * - Active billing month status
 * - Days elapsed post-month-end
 * - Internet connectivity state
 * - Pending micro-billing dues
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

  const currentYearMonth = formatUnixToYearMonth(nowUnix); // e.g. '2026-12'
  const isMonthExceeded = currentYearMonth > profile.active_year_month;

  // 2. Compute days elapsed since the active billing month ended
  const activeMonthEndUnix = getEndOfMonthUnix(profile.active_year_month);
  const referenceTimestamp = Math.max(profile.last_synced_at, activeMonthEndUnix);
  const offlineDaysAfterMonthEnd = isMonthExceeded
    ? Math.floor(Math.max(0, nowUnix - referenceTimestamp) / SECONDS_PER_DAY)
    : 0;

  // 3. Offline Evaluation: Allow up to 7 days after month-end; block on Day 8+
  if (!isInternetConnected) {
    if (isMonthExceeded && offlineDaysAfterMonthEnd > MAX_GRACE_DAYS_POST_MONTH) {
      return {
        allowed: false,
        code: 'BLOCKED_OFFLINE_OVER_7_DAYS',
        offlineDays: offlineDaysAfterMonthEnd,
        pendingDuesINR: profile.pending_dues_paise / 100,
        message: `Offline grace period exceeded (${offlineDaysAfterMonthEnd} days since month-end). Internet connection required to continue billing.`,
      };
    }

    const remainingGraceDays = isMonthExceeded
      ? Math.max(0, MAX_GRACE_DAYS_POST_MONTH - offlineDaysAfterMonthEnd)
      : undefined;

    return {
      allowed: true,
      code: 'OFFLINE_ALLOWED',
      remainingGraceDays,
      offlineDays: isMonthExceeded ? offlineDaysAfterMonthEnd : 0,
      message: isMonthExceeded
        ? `Post-month grace active: ${remainingGraceDays} day(s) remaining. Connect internet soon.`
        : 'Billing permitted offline in current calendar month.',
    };
  }

  // 4. Online Reconnection Evaluation: Check if pending payment is left for exceeded month
  if (isMonthExceeded && profile.pending_dues_paise > 0) {
    return {
      allowed: false,
      code: 'PAYMENT_DUE_ON_RECONNECT',
      pendingDuesINR: profile.pending_dues_paise / 100,
      message: `Pending dues of Rs. ${(profile.pending_dues_paise / 100).toFixed(2)} detected for closed billing month. Settle via Razorpay to unlock.`,
    };
  }

  // 5. All Clear: Roll over active_year_month and unlock full desktop access
  const nextPrefix = `${profile.invoice_prefix}-${currentYearMonth.replace('-', '')}-`;
  return {
    allowed: true,
    code: 'UNLOCKED_AND_VERIFIED',
    nextPrefix,
    message: 'Billing verified and fully unlocked for the active cycle.',
  };
}
