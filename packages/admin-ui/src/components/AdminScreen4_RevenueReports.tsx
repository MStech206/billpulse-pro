import React from 'react';
import { AdminDashboardMetrics, formatPaiseToINR } from '../../shared/src/types.js';

interface RevenueReportsProps {
  metrics: AdminDashboardMetrics;
}

export const AdminScreen4_RevenueReports: React.FC<RevenueReportsProps> = ({ metrics }) => {
  const sampleTransactions = [
    {
      tx_id: 'pay_Px819402941',
      merchant_name: 'Apex Kirana Store',
      mobile: '9845012345',
      amount_inr: '160.00',
      cycle: 'November 2026',
      date: '2026-11-09 11:20',
      method: 'Razorpay UPI (PhonePe)',
      status: 'CAPTURED',
    },
    {
      tx_id: 'pay_Px772819031',
      merchant_name: 'Royal Biryani Cafe',
      mobile: '9845099881',
      amount_inr: '210.00',
      cycle: 'November 2026',
      date: '2026-11-08 18:40',
      method: 'Razorpay UPI (GPay)',
      status: 'CAPTURED',
    },
    {
      tx_id: 'pay_Px661209381',
      merchant_name: 'Green City Medicals',
      mobile: '9822011223',
      amount_inr: '190.00',
      cycle: 'November 2026',
      date: '2026-11-08 14:15',
      method: 'Razorpay UPI (Paytm)',
      status: 'CAPTURED',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Header & Summary Cards */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-100">Revenue &amp; Settlement Reports</h1>
            <p className="text-xs text-slate-400">
              Audited breakdown of ₹20 base subscription fees and ₹0.50/₹1.00 per-order transaction fees.
            </p>
          </div>
          <button
            onClick={() => alert('Exporting monthly revenue ledger to CSV...')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold"
          >
            Export Ledger (CSV)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Monthly Base Subscription (₹20/shop)</span>
            <div className="text-xl font-bold text-slate-100 mt-1">
              ₹{(metrics.total_merchants * 20).toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{metrics.total_merchants} active terminals</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Order Metering Fees (₹0.50 / ₹1.00)</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              ₹{formatPaiseToINR(metrics.total_revenue_expected_paise - metrics.total_merchants * 2000)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{metrics.total_orders_this_month} counter bills processed</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Total Monthly Revenue Expected</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              ₹{formatPaiseToINR(metrics.total_revenue_expected_paise)}
            </div>
            <p className="text-[11px] text-emerald-400 mt-1">
              Collected: ₹{formatPaiseToINR(metrics.total_revenue_collected_paise)}
            </p>
          </div>
        </div>
      </div>

      {/* Razorpay Webhook Payment Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">Razorpay Verified Settlements</h2>
          <span className="text-xs text-slate-400">Cryptographically verified webhooks</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Razorpay Payment ID</th>
                <th className="py-3 px-4">Merchant Shop</th>
                <th className="py-3 px-3">Billing Cycle</th>
                <th className="py-3 px-3">Date &amp; Time</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount Settled</th>
                <th className="py-3 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {sampleTransactions.map((tx) => (
                <tr key={tx.tx_id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-5 font-mono text-emerald-400 font-medium">{tx.tx_id}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100">{tx.merchant_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{tx.mobile}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{tx.cycle}</td>
                  <td className="py-3 px-3 text-slate-400">{tx.date}</td>
                  <td className="py-3 px-3 text-slate-300">{tx.method}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400 text-sm">
                    ₹{tx.amount_inr}
                  </td>
                  <td className="py-3 px-5 text-center">
                    <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded-full text-[10px] font-bold">
                      {tx.status}
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
