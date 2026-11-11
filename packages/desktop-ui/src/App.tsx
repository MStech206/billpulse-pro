import React, { useState } from 'react';
import {
  MerchantProfile,
  CatalogItem,
  BUSINESS_PRESETS,
} from '../../shared/src/types.js';
import { Screen1_ActivateLicense } from './components/Screen1_ActivateLicense.js';
import { Screen2_ShopConfig } from './components/Screen2_ShopConfig.js';
import { Screen3_CatalogManager } from './components/Screen3_CatalogManager.js';
import { Screen4_ExpressPOS } from './components/Screen4_ExpressPOS.js';
import { Screen5_SettlementModal } from './components/Screen5_SettlementModal.js';

export const DesktopApp: React.FC = () => {
  // Navigation tabs for testing & development
  const [currentScreen, setCurrentScreen] = useState<
    'ACTIVATION' | 'CONFIG' | 'CATALOG' | 'POS'
  >('POS');
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [simulatedDay, setSimulatedDay] = useState<number>(8); // Day 8 = Warning state

  // Initial Seed Profile (Syed Tea Corner)
  const [profile, setProfile] = useState<MerchantProfile>({
    tenant_id: 'tenant-tea-001',
    company_name: 'Syed Tea Corner',
    company_address: 'Shop #12, Market Ring Road, Bengaluru - 560001',
    company_gstin: '29AABCU9603R1ZM',
    upi_id: 'syedtea@upi',
    owner_mobile: '9876543210',
    business_type: 'TEA_SHOP',
    invoice_prefix: 'TEA',
    billing_plan: 'PER_ORDER_050',
    active_year_month: '2026-11',
    last_synced_at: 1796083199,
    max_seen_timestamp: 1796083199,
    total_orders_month: 412,
    pending_dues_paise: 22600, // Rs. 20 base + 412 * Rs. 0.50 = Rs. 226.00
    device_id: 'DEV-HWID-TEA-001',
    terminal_code: 'D1',
    license_status: 'WARNING',
  });

  // Seed Catalog from Tea Shop preset
  const [catalog, setCatalog] = useState<CatalogItem[]>(
    BUSINESS_PRESETS.TEA_SHOP.sampleItems.map((item, index) => ({
      item_id: `ITEM-TEA-0${index + 1}`,
      tenant_id: 'tenant-tea-001',
      item_name: item.name,
      selling_rate_paise: item.rate_paise,
      gst_percent: item.gst_percent,
      updated_at: Math.floor(Date.now() / 1000),
    }))
  );

  // Screen 1: When activated -> moves to Config
  const handleLicenseActivated = (data: { serialNumber: string; mobile: string; deviceId: string }) => {
    setProfile((prev) => ({
      ...prev,
      owner_mobile: data.mobile,
      device_id: data.deviceId,
      license_status: 'ACTIVE',
    }));
    setCurrentScreen('CONFIG');
  };

  // Screen 2: When shop configured -> populate items & moves to POS
  const handleShopConfigSaved = (updated: Partial<MerchantProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));

    // If business type changed, reload preset items
    if (updated.business_type && BUSINESS_PRESETS[updated.business_type]) {
      const preset = BUSINESS_PRESETS[updated.business_type];
      setCatalog(
        preset.sampleItems.map((item, idx) => ({
          item_id: `ITEM-${updated.business_type}-${idx + 1}`,
          tenant_id: profile.tenant_id,
          item_name: item.name,
          selling_rate_paise: item.rate_paise,
          gst_percent: item.gst_percent,
          updated_at: Math.floor(Date.now() / 1000),
        }))
      );
    }

    setCurrentScreen('POS');
  };

  // Screen 4: When order is punched -> accrues platform fee & increments orders count
  const handleOrderCreated = (_orderTotalPaise: number, feePaise: number) => {
    setProfile((prev) => ({
      ...prev,
      total_orders_month: prev.total_orders_month + 1,
      pending_dues_paise: prev.pending_dues_paise + feePaise,
    }));
  };

  // Screen 5: When Razorpay payment confirms
  const handlePaymentSettled = () => {
    setProfile((prev) => ({
      ...prev,
      pending_dues_paise: 0,
      license_status: 'ACTIVE',
    }));
    setShowSettlementModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Testing Switcher Toolbar */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-emerald-400">BillPulse Pro Desktop:</span>
          <button
            onClick={() => setCurrentScreen('ACTIVATION')}
            className={`px-2.5 py-1 rounded transition ${
              currentScreen === 'ACTIVATION' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            1. Activation
          </button>
          <button
            onClick={() => setCurrentScreen('CONFIG')}
            className={`px-2.5 py-1 rounded transition ${
              currentScreen === 'CONFIG' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            2. Shop Setup
          </button>
          <button
            onClick={() => setCurrentScreen('CATALOG')}
            className={`px-2.5 py-1 rounded transition ${
              currentScreen === 'CATALOG' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            3. Catalog (F6)
          </button>
          <button
            onClick={() => setCurrentScreen('POS')}
            className={`px-2.5 py-1 rounded transition ${
              currentScreen === 'POS' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            4. Express POS (F4)
          </button>
        </div>

        {/* Post-Month Grace / Block Tester Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 text-[11px]">Test Policy:</span>
          <button
            onClick={() => {
              setSimulatedDay(4);
              setShowSettlementModal(true);
            }}
            className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded text-[11px]"
          >
            Day 4 (Reminder)
          </button>
          <button
            onClick={() => {
              setSimulatedDay(8);
              setShowSettlementModal(true);
            }}
            className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-700 rounded text-[11px]"
          >
            Day 8 (Warning)
          </button>
          <button
            onClick={() => {
              setSimulatedDay(12);
              setShowSettlementModal(true);
            }}
            className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-700 rounded text-[11px]"
          >
            Day 12 (Block)
          </button>
        </div>
      </nav>

      {/* Screen Router */}
      <div className="flex-1">
        {currentScreen === 'ACTIVATION' && (
          <Screen1_ActivateLicense onActivated={handleLicenseActivated} />
        )}
        {currentScreen === 'CONFIG' && (
          <Screen2_ShopConfig
            initialMobile={profile.owner_mobile}
            onSaved={handleShopConfigSaved}
          />
        )}
        {currentScreen === 'CATALOG' && (
          <Screen3_CatalogManager
            items={catalog}
            onUpdateItems={setCatalog}
            onGoToBilling={() => setCurrentScreen('POS')}
          />
        )}
        {currentScreen === 'POS' && (
          <Screen4_ExpressPOS
            profile={profile}
            catalog={catalog}
            onOrderCreated={handleOrderCreated}
            onOpenSettlementModal={() => setShowSettlementModal(true)}
            onOpenConfig={() => setCurrentScreen('CONFIG')}
            onOpenCatalog={() => setCurrentScreen('CATALOG')}
          />
        )}
      </div>

      {/* Screen 5: Month-End Settlement Popup / Lock Overlay */}
      {showSettlementModal && (
        <Screen5_SettlementModal
          profile={profile}
          daysIntoNewMonth={simulatedDay}
          onPaymentSettled={handlePaymentSettled}
          onClose={() => setShowSettlementModal(false)}
        />
      )}
    </div>
  );
};

export default DesktopApp;
