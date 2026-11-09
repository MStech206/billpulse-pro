import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyDesktopGuard,
  checkMonotonicClock,
  updateMonotonicTimestamp,
  generateInvoiceNumber,
  getEndOfMonthUnix,
  formatUnixToYearMonth,
  MAX_GRACE_DAYS_POST_MONTH,
} from '../src/guard.ts';

describe('BillPulse Pro — Hardcoded Desktop Guard Test Suite', () => {
  // Base mock merchant profile
  // Active month: November 2026
  // End of Nov 2026 in UTC: 2026-11-30 23:59:59 => 1796083199
  const baseProfile = {
    tenant_id: 'tenant-test-01',
    company_name: 'Metro Retail Mart',
    invoice_prefix: 'INV',
    billing_plan: 'PER_ORDER_050',
    active_year_month: '2026-11',
    last_synced_at: 1796083199, // synced at month end
    max_seen_timestamp: 1796083199,
    pending_dues_paise: 5000, // Rs. 50.00
    device_id: 'DEVICE-HWID-001',
    terminal_code: 'D1',
  };

  test('Scenario 1: Normal Online Operation in Current Month', () => {
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
    assert.equal(result.nextPrefix, 'INV-202611-');
  });

  test('Scenario 2: Mid-Month 100% Offline Operation', () => {
    // Current time: 2026-11-20 10:00:00 UTC (1795168800)
    const nowUnix = 1795168800;
    const profile = {
      ...baseProfile,
      max_seen_timestamp: 1795160000,
      last_synced_at: 1794740000, // Last synced 5 days ago
      pending_dues_paise: 250, // Rs. 2.50 accrued offline
    };

    const result = verifyDesktopGuard(profile, nowUnix, false);
    assert.equal(result.allowed, true);
    assert.equal(result.code, 'OFFLINE_ALLOWED');
    assert.equal(result.remainingGraceDays, undefined);
  });

  test('Scenario 3: Post-Month Grace Window (Day 4 of next month, Offline)', () => {
    // Active month is 2026-11. Month ended 2026-11-30 23:59:59 (1796083199)
    // 4 days later = 1796083199 + (4 * 86400) = 1796428799 (Dec 4, 2026)
    const nowUnix = 1796083199 + 4 * 86400;
    const profile = {
      ...baseProfile,
      max_seen_timestamp: nowUnix - 60,
      last_synced_at: 1796083199,
      pending_dues_paise: 1500,
    };

    const result = verifyDesktopGuard(profile, nowUnix, false);
    assert.equal(result.allowed, true);
    assert.equal(result.code, 'OFFLINE_ALLOWED');
    assert.equal(result.remainingGraceDays, 3); // 7 - 4 = 3 days remaining
    assert.equal(result.offlineDays, 4);
  });

  test('Scenario 4: Post-Month Grace Exceeded (>7 Days Offline -> HARD LOCK)', () => {
    // Active month is 2026-11. Month ended 2026-11-30 23:59:59
    // 8.5 days later = 1796083199 + (8.5 * 86400) (Dec 9, 2026)
    const nowUnix = Math.floor(1796083199 + 8.5 * 86400);
    const profile = {
      ...baseProfile,
      max_seen_timestamp: nowUnix - 60,
      last_synced_at: 1796083199,
      pending_dues_paise: 2000,
    };

    const result = verifyDesktopGuard(profile, nowUnix, false);
    assert.equal(result.allowed, false);
    assert.equal(result.code, 'BLOCKED_OFFLINE_OVER_7_DAYS');
    assert.equal(result.offlineDays, 8);
    assert.equal(result.pendingDuesINR, 20);
  });

  test('Scenario 5: Monotonic Clock Rollback Detected (>300s into past)', () => {
    const maxSeen = 1796083199;
    // User changes OS clock backward by 10 minutes (600s)
    const tamperedUnix = maxSeen - 600;

    const result = verifyDesktopGuard(baseProfile, tamperedUnix, false);
    assert.equal(result.allowed, false);
    assert.equal(result.code, 'CLOCK_TAMPERED_CONNECT_INTERNET');
  });

  test('Scenario 5b: Clock Minor Drift (<300s) Allowed', () => {
    const maxSeen = 1796083199;
    // Slight drift of 60 seconds backward should be tolerated
    const slightDriftUnix = maxSeen - 60;

    const clockCheck = checkMonotonicClock(slightDriftUnix, maxSeen);
    assert.equal(clockCheck.isTampered, false);
  });

  test('Scenario 6: Reconnected Online with Pending Dues Left', () => {
    // Month is now 2026-12, previous month was 2026-11.
    const nowUnix = 1796083199 + 2 * 86400; // Dec 2, 2026
    const profile = {
      ...baseProfile,
      max_seen_timestamp: nowUnix,
      pending_dues_paise: 4250, // Rs. 42.50 due
    };

    const result = verifyDesktopGuard(profile, nowUnix, true);
    assert.equal(result.allowed, false);
    assert.equal(result.code, 'PAYMENT_DUE_ON_RECONNECT');
    assert.equal(result.pendingDuesINR, 42.5);
  });

  test('Scenario 7: Reconnected Online with Zero Pending Dues (Instant Unlock)', () => {
    // Month is now 2026-12, all dues settled (pending_dues_paise = 0)
    const nowUnix = 1796083199 + 2 * 86400; // Dec 2, 2026
    const profile = {
      ...baseProfile,
      max_seen_timestamp: nowUnix,
      pending_dues_paise: 0,
    };

    const result = verifyDesktopGuard(profile, nowUnix, true);
    assert.equal(result.allowed, true);
    assert.equal(result.code, 'UNLOCKED_AND_VERIFIED');
    assert.equal(result.nextPrefix, 'INV-202612-');
  });

  test('Numbering Engine: Single & Multi-Terminal Format Verification', () => {
    // Single-terminal setup
    const inv1 = generateInvoiceNumber('INV', '2026-11', 1);
    assert.equal(inv1, 'INV-202611-0001');

    // Multi-terminal setup with terminal code 'D1'
    const inv2 = generateInvoiceNumber('INV', '2026-11', 42, 'D1');
    assert.equal(inv2, 'INV-202611-D1-0042');

    // Multi-terminal setup with web terminal 'W2'
    const inv3 = generateInvoiceNumber('POS', '2026-12', 1234, 'W2');
    assert.equal(inv3, 'POS-202612-W2-1234');
  });

  test('Monotonic Timestamp High-Water Updater', () => {
    assert.equal(updateMonotonicTimestamp(1000, 1500), 1500);
    assert.equal(updateMonotonicTimestamp(1500, 1200), 1500);
  });
});
