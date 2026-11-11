import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyDesktopGuard,
  checkMonotonicClock,
  updateMonotonicTimestamp,
  generateInvoiceNumber,
  getEndOfMonthUnix,
  formatUnixToYearMonth,
  DAY_7_GRACE_DAYS,
  DAY_11_BLOCK_DAYS,
} from '../src/guard.ts';

describe('BillPulse Pro — Standardized Desktop Guard Test Suite', () => {
  // Base mock merchant profile
  // Active month: November 2026
  // End of Nov 2026 in UTC: 2026-11-30 23:59:59 => 1796083199
  const baseProfile = {
    tenant_id: 'tenant-tea-001',
    company_name: 'Syed Tea Corner',
    owner_mobile: '9876543210',
    business_type: 'TEA_SHOP',
    invoice_prefix: 'TEA',
    billing_plan: 'PER_ORDER_050',
    active_year_month: '2026-11',
    last_synced_at: 1796083199,
    max_seen_timestamp: 1796083199,
    pending_dues_paise: 22600, // Rs. 226.00 (Rs. 20 base + 412 orders * Rs. 0.50)
    total_orders_month: 412,
    device_id: 'DEVICE-HWID-TEA-01',
    terminal_code: 'D1',
    license_status: 'ACTIVE',
  };

  test('Scenario 1: Normal In-Month Billing (Online)', () => {
    // Current time: 2026-11-15 12:00:00 UTC (1794744000)
    const nowUnix = 1794744000;
    const profile = {
      ...baseProfile,
      max_seen_timestamp: 1794740000,
      last_synced_at: 1794740000,
      pending_dues_paise: 0,
    };

    const result = verifyDesktopGuard(profile, nowUnix, true);
    assert.equal(result.allowed, true);
    assert.equal(result.code, 'UNLOCKED_AND_VERIFIED');
    assert.equal(result.nextPrefix, 'TEA-202611-');
  });

  test('Scenario 2: Normal In-Month Billing (Offline)', () => {
    // Current time: 2026-11-20 10:00:00 UTC (1795168800)
    const nowUnix = 1795168800;
    const profile = {
      ...baseProfile,
      max_seen_timestamp: 1795160000,
      last_synced_at: 1794740000,
    };

    const result = verifyDesktopGuard(profile, nowUnix, false);
    assert.equal(result.allowed, true);
    assert.equal(result.code, 'OFFLINE_ALLOWED');
  });

  test('Scenario 3: Post-Month Grace Period (Day 4 — Soft Reminder)', () => {
    // Month ended 2026-11-30 23:59:59 (1796083199)
    // 4 days into Dec 2026 = 1796083199 + (4 * 86400)
    const nowUnix = 1796083199 + 4 * 86400;
    const profile = {
      ...baseProfile,
      max_seen_timestamp: nowUnix - 60,
    };

    const result = verifyDesktopGuard(profile, nowUnix, false);
    assert.equal(result.allowed, true);
    assert.equal(result.code, 'POST_MONTH_REMINDER');
    assert.equal(result.offlineDays, 4);
    assert.equal(result.daysUntilBlock, 7); // 11 - 4 = 7 days left until block
    assert.equal(result.pendingDuesINR, 226);
  });

  test('Scenario 4: Post-Month Warning Period (Day 8 — Urgent "Blocked after 11th" Warning)', () => {
    // 8.5 days into Dec 2026 = 1796083199 + (8.5 * 86400) (Dec 9th)
    const nowUnix = Math.floor(1796083199 + 8.5 * 86400);
    const profile = {
      ...baseProfile,
      max_seen_timestamp: nowUnix - 60,
    };

    const result = verifyDesktopGuard(profile, nowUnix, false);
    assert.equal(result.allowed, true); // Still allowed to bill!
    assert.equal(result.code, 'POST_MONTH_WARNING');
    assert.equal(result.offlineDays, 8);
    assert.equal(result.daysUntilBlock, 3); // 11 - 8 = 3 days left
    assert.match(result.message, /blocked after the 11th/);
  });

  test('Scenario 5: Post-Month Grace Exceeded (Day 12 — HARD BLOCK)', () => {
    // 12 days into Dec 2026 = 1796083199 + (12 * 86400) (Dec 12th)
    const nowUnix = 1796083199 + 12 * 86400;
    const profile = {
      ...baseProfile,
      max_seen_timestamp: nowUnix - 60,
    };

    const result = verifyDesktopGuard(profile, nowUnix, false);
    assert.equal(result.allowed, false); // Blocked!
    assert.equal(result.code, 'BLOCKED_POST_MONTH_EXCEEDED');
    assert.equal(result.offlineDays, 12);
    assert.equal(result.daysUntilBlock, 0);
    assert.match(result.message, /blocked/);
  });

  test('Scenario 6: Day 12 with Cleared Razorpay Payment (Instant Unlock)', () => {
    // 12 days into Dec 2026, but merchant paid dues via Razorpay UPI (dues = 0)
    const nowUnix = 1796083199 + 12 * 86400;
    const profile = {
      ...baseProfile,
      max_seen_timestamp: nowUnix,
      pending_dues_paise: 0, // Cleared!
    };

    const result = verifyDesktopGuard(profile, nowUnix, true);
    assert.equal(result.allowed, true);
    assert.equal(result.code, 'UNLOCKED_AND_VERIFIED');
    assert.equal(result.nextPrefix, 'TEA-202612-');
  });

  test('Scenario 7: Monotonic Clock Rollback Detected (>300s)', () => {
    const maxSeen = 1796083199;
    const tamperedUnix = maxSeen - 600; // 10 minutes backward

    const result = verifyDesktopGuard(baseProfile, tamperedUnix, false);
    assert.equal(result.allowed, false);
    assert.equal(result.code, 'CLOCK_TAMPERED_CONNECT_INTERNET');
  });

  test('Scenario 8: Admin Revoked License', () => {
    const nowUnix = 1794744000;
    const profile = {
      ...baseProfile,
      max_seen_timestamp: nowUnix,
      license_status: 'REVOKED',
    };

    const result = verifyDesktopGuard(profile, nowUnix, true);
    assert.equal(result.allowed, false);
    assert.equal(result.code, 'BLOCKED_POST_MONTH_EXCEEDED');
    assert.match(result.message, /revoked/);
  });

  test('Scenario 9: Invoice Number Generation for Tea Shop & Kirana', () => {
    const teaInv = generateInvoiceNumber('TEA', '2026-11', 42);
    assert.equal(teaInv, 'TEA-202611-0042');

    const krnInv = generateInvoiceNumber('KRN', '2026-11', 105, 'D1');
    assert.equal(krnInv, 'KRN-202611-D1-0105');
  });
});
