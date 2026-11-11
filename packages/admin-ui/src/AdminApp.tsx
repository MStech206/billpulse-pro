import React, { useState } from 'react';
import {
  MerchantAdminRecord,
  AdminDashboardMetrics,
  BlockLogEntry,
  LicenseKeyRecord,
} from '../../shared/src/types.js';
import { calculateAdminMetrics } from '../../api/src/server.js';
import { AdminScreen1_Dashboard } from './components/AdminScreen1_Dashboard.js';
import { AdminScreen2_MerchantList } from './components/AdminScreen2_MerchantList.js';
import { AdminScreen3_MerchantOrderLogs } from './components/AdminScreen3_MerchantOrderLogs.js';
import { AdminScreen4_RevenueReports } from './components/AdminScreen4_RevenueReports.js';
import { AdminScreen5_NotificationBlockLogs } from './components/AdminScreen5_NotificationBlockLogs.js';
import { AdminScreen6_LicenseGenerator } from './components/AdminScreen6_LicenseGenerator.js';

export const AdminApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'DASHBOARD' | 'MERCHANTS' | 'ORDER_LOGS' | 'REVENUE' | 'BLOCK_LOGS' | 'LICENSES'
  >('DASHBOARD');

  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('tenant-tea-001');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');

  // Seed Merchants
  const [merchants, setMerchants] = useState<MerchantAdminRecord[]>([
    {
      tenant_id: 'tenant-tea-001',
      company_name: 'Syed Tea Corner',
      business_type: 'TEA_SHOP',
      owner_mobile: '9876543210',
      serial_number: 'BP-2026-9842-1084',
      active_year_month: '2026-11',
      total_orders_month: 412,
      monthly_base_fee_paise: 2000,
      order_fees_paise: 20600, // 412 * Rs. 0.50
      total_due_paise: 22600,  // Rs. 226.00
      total_due_inr: 226.0,
      payment_status: 'UNPAID',
      license_status: 'WARNING', // Day 8 of Dec
      days_into_month: 8,
      last_synced_at: Math.floor(Date.now() / 1000) - 120,
      terminal_count: 1,
    },
    {
      tenant_id: 'tenant-krn-002',
      company_name: 'Apex Kirana Store',
      business_type: 'KIRANA_STORE',
      owner_mobile: '9845012345',
      serial_number: 'BP-2026-4412-8890',
      active_year_month: '2026-11',
      total_orders_month: 280,
      monthly_base_fee_paise: 2000,
      order_fees_paise: 14000,
      total_due_paise: 16000,
      total_due_inr: 160.0,
      payment_status: 'PAID',
      license_status: 'ACTIVE',
      days_into_month: 8,
      last_synced_at: Math.floor(Date.now() / 1000) - 300,
      terminal_count: 1,
    },
    {
      tenant_id: 'tenant-whl-003',
      company_name: 'Metro Wholesale Mandi',
      business_type: 'WHOLESALE',
      owner_mobile: '9811099887',
      serial_number: 'BP-2026-1102-7744',
      active_year_month: '2026-11',
      total_orders_month: 180,
      monthly_base_fee_paise: 2000,
      order_fees_paise: 18000, // 180 * Rs. 1.00
      total_due_paise: 134000, // Rs. 1,340.00 including past overdue
      total_due_inr: 1340.0,
      payment_status: 'UNPAID',
      license_status: 'BLOCKED', // Day 12 of Dec
      days_into_month: 12,
      last_synced_at: Math.floor(Date.now() / 1000) - 86400,
      terminal_count: 2,
    },
    {
      tenant_id: 'tenant-med-004',
      company_name: 'City Care Pharmacy',
      business_type: 'MEDICAL_STORE',
      owner_mobile: '9833019283',
      serial_number: 'BP-2026-3391-4402',
      active_year_month: '2026-11',
      total_orders_month: 350,
      monthly_base_fee_paise: 2000,
      order_fees_paise: 17500,
      total_due_paise: 19500,
      total_due_inr: 195.0,
      payment_status: 'PAID',
      license_status: 'ACTIVE',
      days_into_month: 8,
      last_synced_at: Math.floor(Date.now() / 1000) - 60,
      terminal_count: 1,
    },
  ]);

  // Seed Block / Warning Logs
  const [blockLogs, setBlockLogs] = useState<BlockLogEntry[]>([
    {
      log_id: 'log-001',
      tenant_id: 'tenant-whl-003',
      company_name: 'Metro Wholesale Mandi',
      owner_mobile: '9811099887',
      event_type: 'DAY_11_BLOCKED',
      timestamp_unix: Math.floor(Date.now() / 1000) - 3600 * 24,
      amount_due_paise: 134000,
      details: 'Counter terminal locked automatically on Day 12 post-month. Dues of Rs. 1,340.00 unpaid.',
    },
    {
      log_id: 'log-002',
      tenant_id: 'tenant-tea-001',
      company_name: 'Syed Tea Corner',
      owner_mobile: '9876543210',
      event_type: 'DAY_7_WARNING',
      timestamp_unix: Math.floor(Date.now() / 1000) - 3600 * 12,
      amount_due_paise: 22600,
      details: 'Warning notification triggered on counter terminal: Application may be blocked after 11th.',
    },
    {
      log_id: 'log-003',
      tenant_id: 'tenant-krn-002',
      company_name: 'Apex Kirana Store',
      owner_mobile: '9845012345',
      event_type: 'UNBLOCKED_PAYMENT',
      timestamp_unix: Math.floor(Date.now() / 1000) - 3600 * 48,
      amount_due_paise: 16000,
      details: 'Razorpay UPI payment confirmed (pay_Px819402941). Cycle unlocked.',
    },
  ]);

  // Seed License Keys
  const [licenseKeys, setLicenseKeys] = useState<LicenseKeyRecord[]>([
    {
      license_id: 'lic-001',
      serial_number: 'BP-2026-9842-1084',
      activation_key: 'ACT-7841-B9X2-K991',
      assigned_shop_name: 'Syed Tea Corner',
      rate_tier: 'PER_ORDER_050',
      max_terminals: 1,
      status: 'ACTIVE',
      created_at: '2026-11-01T10:00:00Z',
    },
    {
      license_id: 'lic-002',
      serial_number: 'BP-2026-4412-8890',
      activation_key: 'ACT-3321-K892-P012',
      assigned_shop_name: 'Apex Kirana Store',
      rate_tier: 'PER_ORDER_050',
      max_terminals: 1,
      status: 'ACTIVE',
      created_at: '2026-11-01T11:30:00Z',
    },
    {
      license_id: 'lic-003',
      serial_number: 'BP-2026-1102-7744',
      activation_key: 'ACT-9901-L772-M441',
      assigned_shop_name: 'Metro Wholesale Mandi',
      rate_tier: 'PER_INVOICE_100',
      max_terminals: 2,
      status: 'ACTIVE',
      created_at: '2026-11-02T09:15:00Z',
    },
  ]);

  const metrics: AdminDashboardMetrics = calculateAdminMetrics(merchants);

  const handleUpdateStatus = (tenantId: string, newStatus: 'ACTIVE' | 'SUSPENDED' | 'REVOKED') => {
    setMerchants((prev) =>
      prev.map((m) => {
        if (m.tenant_id === tenantId) {
          return {
            ...m,
            license_status: newStatus,
            payment_status: newStatus === 'ACTIVE' ? 'PAID' : m.payment_status,
          };
        }
        return m;
      })
    );

    const targetMerchant = merchants.find((m) => m.tenant_id === tenantId);
    if (targetMerchant) {
      setBlockLogs((prev) => [
        {
          log_id: `log-${Date.now()}`,
          tenant_id: tenantId,
          company_name: targetMerchant.company_name,
          owner_mobile: targetMerchant.owner_mobile,
          event_type: newStatus === 'ACTIVE' ? 'ADMIN_GRANTED' : 'ADMIN_REVOKED',
          timestamp_unix: Math.floor(Date.now() / 1000),
          amount_due_paise: targetMerchant.total_due_paise,
          details: `Administrator manually updated status to ${newStatus}.`,
        },
        ...prev,
      ]);
    }
  };

  const selectedMerchant =
    merchants.find((m) => m.tenant_id === selectedMerchantId) || merchants[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Admin Navigation Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center font-bold text-white text-base shadow">
            BP
          </div>
          <div>
            <span className="font-extrabold text-slate-100 text-base tracking-wide">
              BillPulse Pro — Platform Admin Control Center
            </span>
            <span className="text-[11px] text-slate-400 block">
              Centralized Merchant Terminal Management &amp; Razorpay Settlement Hub
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              activeTab === 'DASHBOARD' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              setMerchantFilter('ALL');
              setActiveTab('MERCHANTS');
            }}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              activeTab === 'MERCHANTS' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Merchants ({merchants.length})
          </button>
          <button
            onClick={() => setActiveTab('ORDER_LOGS')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              activeTab === 'ORDER_LOGS' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Order Logs
          </button>
          <button
            onClick={() => setActiveTab('REVENUE')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              activeTab === 'REVENUE' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Revenue Reports
          </button>
          <button
            onClick={() => setActiveTab('BLOCK_LOGS')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              activeTab === 'BLOCK_LOGS' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Block Logs ({blockLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('LICENSES')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              activeTab === 'LICENSES' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Key Generator
          </button>
        </div>
      </header>

      {/* Main Tab Screen Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        {activeTab === 'DASHBOARD' && (
          <AdminScreen1_Dashboard
            metrics={metrics}
            merchants={merchants}
            onNavigateToMerchants={(filter) => {
              if (filter) setMerchantFilter(filter);
              setActiveTab('MERCHANTS');
            }}
            onNavigateToGenerator={() => setActiveTab('LICENSES')}
          />
        )}

        {activeTab === 'MERCHANTS' && (
          <AdminScreen2_MerchantList
            merchants={merchants}
            initialFilter={merchantFilter}
            onSelectMerchant={(tenantId) => {
              setSelectedMerchantId(tenantId);
              setActiveTab('ORDER_LOGS');
            }}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {activeTab === 'ORDER_LOGS' && selectedMerchant && (
          <AdminScreen3_MerchantOrderLogs
            merchant={selectedMerchant}
            onBack={() => setActiveTab('MERCHANTS')}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {activeTab === 'REVENUE' && <AdminScreen4_RevenueReports metrics={metrics} />}

        {activeTab === 'BLOCK_LOGS' && <AdminScreen5_NotificationBlockLogs logs={blockLogs} />}

        {activeTab === 'LICENSES' && (
          <AdminScreen6_LicenseGenerator
            existingKeys={licenseKeys}
            onKeyCreated={(newKey) => setLicenseKeys([newKey, ...licenseKeys])}
          />
        )}
      </main>

      {/* Admin Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs text-slate-500">
        <div>Logged in as: <span className="font-semibold text-slate-300">Super Admin (Platform Owner)</span></div>
        <div>Fastify Cluster &bull; Supabase PostgreSQL 16 &bull; Razorpay Webhook Verifier Active</div>
      </footer>
    </div>
  );
};

export default AdminApp;
