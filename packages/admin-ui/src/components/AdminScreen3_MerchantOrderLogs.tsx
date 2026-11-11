import React from 'react';
import {
  MerchantAdminRecord,
  formatPaiseToINR,
} from '../../shared/src/types.js';

interface MerchantOrderLogsProps {
  merchant: MerchantAdminRecord;
  onBack: () => void;
  onUpdateStatus: (tenantId: string, newStatus: 'ACTIVE' | 'SUSPENDED' | 'REVOKED') => void;
}

export const AdminScreen3_MerchantOrderLogs: React.FC<MerchantOrderLogsProps> = ({
  merchant,
  onBack,
  onUpdateStatus,
}) => {
  // Sample mock order logs for this specific merchant
  const sampleOrders = [
    {
      uuid: '550e8400-e29b-41d4-a716-446655440042',
      invoice_number: `${merchant.company_name.includes('Tea') ? 'TEA' : 'INV'}-202611-0042`,
      date: '2026-11-11 16:45',
      items: 'Special Milk Tea x 2, Crispy Samosa x 1, Filter Coffee x 1',
      mode: 'CASH',
      subtotal_inr: '65.00',
      gst_inr: '3.25',
      grand_total_inr: '68.25',
      fee_inr: '0.50',
    },
    {
      uuid: '550e8400-e29b-41d4-a716-446655440041',
      invoice_number: `${merchant.company_name.includes('Tea') ? 'TEA' : 'INV'}-202611-0041`,
      date: '2026-11-11 16:12',
      items: 'Filter Coffee x 2, Veg Sandwich x 1',
      mode: 'UPI',
      subtotal_inr: '80.00',
      gst_inr: '4.00',
      grand_total_inr: '84.00',
      fee_inr: '0.50',
    },
    {
      uuid: '550e8400-e29b-41d4-a716-446655440040',
      invoice_number: `${merchant.company_name.includes('Tea') ? 'TEA' : 'INV'}-202611-0040`,
      date: '2026-11-11 15:30',
      items: 'Special Milk Tea x 4, Osmania Biscuit x 4',
      mode: 'CASH',
      subtotal_inr: '100.00',
      gst_inr: '5.00',
      grand_total_inr: '105.00',
      fee_inr: '0.50',
    },
    {
      uuid: '550e8400-e29b-41d4-a716-446655440039',
      invoice_number: `${merchant.company_name.includes('Tea') ? 'TEA' : 'INV'}-202611-0039`,
      date: '2026-11-11 14:50',
      items: 'Fresh Lime Soda x 2, Crispy Samosa x 2',
      mode: 'UPI',
      subtotal_inr: '90.00',
      gst_inr: '4.50',
      grand_total_inr: '94.50',
      fee_inr: '0.50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button & Top Profile Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-emerald-400 font-semibold flex items-center space-x-1 transition"
        >
          <span>← Back to Merchant Registry</span>
        </button>

        <div className="flex items-center space-x-2">
          {merchant.license_status === 'BLOCKED' || merchant.license_status === 'SUSPENDED' ? (
            <button
              onClick={() => onUpdateStatus(merchant.tenant_id, 'ACTIVE')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition shadow"
            >
              Unlock Terminal Access
            </button>
          ) : (
            <button
              onClick={() => onUpdateStatus(merchant.tenant_id, 'SUSPENDED')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition shadow"
            >
              Suspend Terminal Access
            </button>
          )}

          <button
            onClick={() => alert(`Payment reminder link sent via WhatsApp to ${merchant.owner_mobile}`)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold"
          >
            Send WhatsApp Payment Link
          </button>
        </div>
      </div>

      {/* Merchant Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Merchant Profile</span>
          <h2 className="text-lg font-bold text-slate-100 mt-1">{merchant.company_name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Mobile: {merchant.owner_mobile}</p>
          <span className="inline-block mt-2 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300">
            {merchant.business_type.replace('_', ' ')}
          </span>
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Terminal & Hardware</span>
          <p className="text-xs font-mono text-slate-200 mt-1">Serial: {merchant.serial_number}</p>
          <p className="text-xs text-slate-400 mt-0.5">Terminal: Counter 1 (D1)</p>
          <p className="text-xs text-slate-400 mt-0.5">Last Sync: 2 mins ago</p>
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">License State</span>
          <div className="mt-1">
            <span
              className={`px-2.5 py-1 rounded text-xs font-bold tracking-wider inline-block ${
                merchant.license_status === 'ACTIVE'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : merchant.license_status === 'WARNING'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-rose-950 text-rose-300 border border-rose-700'
              }`}
            >
              {merchant.license_status}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Payment Status: <span className="font-semibold text-slate-200">{merchant.payment_status}</span>
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Fixed Base:</span>
            <span>₹{formatPaiseToINR(merchant.monthly_base_fee_paise)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Orders ({merchant.total_orders_month}):</span>
            <span>₹{formatPaiseToINR(merchant.order_fees_paise)}</span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-emerald-400 text-sm">
            <span>Total Dues:</span>
            <span>₹{formatPaiseToINR(merchant.total_due_paise)}</span>
          </div>
        </div>
      </div>

      {/* Orders Audit Trail Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">
            Counter Order Logs ({merchant.total_orders_month} Total Bills Synced)
          </h3>
          <span className="text-xs text-slate-400">Showing recent verified invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Invoice #</th>
                <th className="py-3 px-3">Date &amp; Time</th>
                <th className="py-3 px-6">Ordered Items Summary</th>
                <th className="py-3 px-3 text-center">Mode</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-3 text-right">GST</th>
                <th className="py-3 px-4 text-right">Bill Total</th>
                <th className="py-3 px-5 text-right">Platform Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {sampleOrders.map((ord) => (
                <tr key={ord.uuid} className="hover:bg-slate-800/40">
                  <td className="py-3 px-5 font-mono font-bold text-slate-100">{ord.invoice_number}</td>
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{ord.date}</td>
                  <td className="py-3 px-6 text-slate-200">{ord.items}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300 font-mono">
                      {ord.mode}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400">₹{ord.subtotal_inr}</td>
                  <td className="py-3 px-3 text-right text-slate-400">₹{ord.gst_inr}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-100">₹{ord.grand_total_inr}</td>
                  <td className="py-3 px-5 text-right font-bold text-emerald-400">₹{ord.fee_inr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
