import React from 'react';
import {
  AdminDashboardMetrics,
  MerchantAdminRecord,
  formatPaiseToINR,
} from '../../shared/src/types.js';

interface AdminDashboardProps {
  metrics: AdminDashboardMetrics;
  merchants: MerchantAdminRecord[];
  onNavigateToMerchants: (filterStatus?: string) => void;
  onNavigateToGenerator: () => void;
}

export const AdminScreen1_Dashboard: React.FC<AdminDashboardProps> = ({
  metrics,
  merchants,
  onNavigateToMerchants,
  onNavigateToGenerator,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Platform Overview & Live Metrics</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time monitoring across all active desktop counter terminals, month-end dues, and Razorpay collections.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateToMerchants('UNPAID')}
            className="px-3.5 py-2 bg-amber-600/20 text-amber-300 border border-amber-600/40 rounded-lg text-xs font-semibold hover:bg-amber-600/30 transition"
          >
            Review {metrics.unpaid_merchants_count} Unpaid Shops
          </button>
          <button
            onClick={onNavigateToGenerator}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 shadow-lg transition"
          >
            + Generate License Key
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Merchants */}
        <div
          onClick={() => onNavigateToMerchants()}
          className="bg-slate-900 border border-slate-800 p-5 rounded-xl cursor-pointer hover:border-slate-700 transition"
        >
          <div className="text-xs font-medium text-slate-400">Total Merchants</div>
          <div className="text-2xl font-bold text-slate-100 mt-2">{metrics.total_merchants}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center space-x-1">
            <span>●</span>
            <span>{metrics.active_merchants} Active &amp; Paid</span>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-xs font-medium text-slate-400">Total Counter Orders</div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {metrics.total_orders_this_month.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all shops this cycle</div>
        </div>

        {/* Card 3: Revenue Expected */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-xs font-medium text-slate-400">Total Revenue Expected</div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            ₹{formatPaiseToINR(metrics.total_revenue_expected_paise)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Base fees (₹20) + orders accrued
          </div>
        </div>

        {/* Card 4: Unpaid / Warning / Blocked Status */}
        <div
          onClick={() => onNavigateToMerchants('WARNING')}
          className="bg-slate-900 border border-slate-800 p-5 rounded-xl cursor-pointer hover:border-slate-700 transition"
        >
          <div className="text-xs font-medium text-slate-400">Action Required</div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {metrics.warning_merchants + metrics.blocked_merchants} Shops
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex space-x-2">
            <span className="text-amber-400">{metrics.warning_merchants} in Warning</span>
            <span>•</span>
            <span className="text-rose-400">{metrics.blocked_merchants} Blocked</span>
          </div>
        </div>
      </div>

      {/* Recent Shops & Live Activity Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">Recent Merchant Activity</h2>
          <button
            onClick={() => onNavigateToMerchants()}
            className="text-xs text-emerald-400 hover:underline font-semibold"
          >
            View All Merchants ({merchants.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Shop Name</th>
                <th className="py-3 px-4">Business Type</th>
                <th className="py-3 px-4">Owner Mobile</th>
                <th className="py-3 px-4 text-center">Orders Count</th>
                <th className="py-3 px-4 text-right">Month Dues</th>
                <th className="py-3 px-6 text-center">License Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {merchants.slice(0, 5).map((m) => (
                <tr key={m.tenant_id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-6 font-semibold text-slate-100">{m.company_name}</td>
                  <td className="py-3 px-4 text-slate-300">
                    <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700/80 text-[10px]">
                      {m.business_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{m.owner_mobile}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-200">
                    {m.total_orders_month}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">
                    ₹{formatPaiseToINR(m.total_due_paise)}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                        m.license_status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : m.license_status === 'WARNING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-rose-950 text-rose-300 border border-rose-700'
                      }`}
                    >
                      {m.license_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
