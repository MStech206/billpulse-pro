import React, { useState } from 'react';
import {
  MerchantAdminRecord,
  formatPaiseToINR,
} from '../../shared/src/types.js';

interface MerchantListProps {
  merchants: MerchantAdminRecord[];
  initialFilter?: string;
  onSelectMerchant: (tenantId: string) => void;
  onUpdateStatus: (tenantId: string, newStatus: 'ACTIVE' | 'SUSPENDED' | 'REVOKED') => void;
}

export const AdminScreen2_MerchantList: React.FC<MerchantListProps> = ({
  merchants,
  initialFilter = 'ALL',
  onSelectMerchant,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter);

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.owner_mobile.includes(searchTerm) ||
      m.serial_number.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'UNPAID') return m.payment_status === 'UNPAID';
    if (statusFilter === 'WARNING') return m.license_status === 'WARNING';
    if (statusFilter === 'BLOCKED') return m.license_status === 'BLOCKED' || m.license_status === 'SUSPENDED';
    if (statusFilter === 'ACTIVE') return m.license_status === 'ACTIVE';

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Search & Filter Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-100">Merchant Terminal Registry</h1>
            <p className="text-xs text-slate-400">
              Manage shop licenses, inspect counter dues, and remotely grant or revoke access.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Showing <span className="font-bold text-slate-200">{filteredMerchants.length}</span> of {merchants.length} shops
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search by shop name, mobile number, or serial number..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 w-full"
          />

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
            {['ALL', 'UNPAID', 'WARNING', 'BLOCKED', 'ACTIVE'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === f
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Shop Details</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Serial &amp; Terminal</th>
                <th className="py-3 px-3 text-center">Orders</th>
                <th className="py-3 px-3 text-right">Base Fee</th>
                <th className="py-3 px-3 text-right">Order Fees</th>
                <th className="py-3 px-3 text-right">Total Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-5 text-center">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredMerchants.map((m) => (
                <tr key={m.tenant_id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-5">
                    <div className="font-semibold text-slate-100 text-sm">{m.company_name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{m.owner_mobile}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] text-slate-300">
                      {m.business_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                    <div>{m.serial_number}</div>
                    <div className="text-[10px] text-slate-500">Terminal {m.terminal_count} (D1)</div>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-200">
                    {m.total_orders_month}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400">
                    ₹{formatPaiseToINR(m.monthly_base_fee_paise)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400">
                    ₹{formatPaiseToINR(m.order_fees_paise)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400 text-sm">
                    ₹{formatPaiseToINR(m.total_due_paise)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider inline-block ${
                        m.license_status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : m.license_status === 'WARNING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-rose-950 text-rose-300 border border-rose-700'
                      }`}
                    >
                      {m.license_status}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {m.payment_status === 'PAID' ? '✅ Paid' : '⏳ Unpaid'}
                    </div>
                  </td>
                  <td className="py-3 px-5 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => onSelectMerchant(m.tenant_id)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium"
                      >
                        Logs
                      </button>

                      {m.license_status === 'BLOCKED' || m.license_status === 'SUSPENDED' ? (
                        <button
                          onClick={() => onUpdateStatus(m.tenant_id, 'ACTIVE')}
                          className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded text-[11px] font-semibold border border-emerald-500/50"
                        >
                          Unlock
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateStatus(m.tenant_id, 'SUSPENDED')}
                          className="px-2 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded text-[11px] font-semibold border border-rose-500/50"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredMerchants.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    No merchants found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
