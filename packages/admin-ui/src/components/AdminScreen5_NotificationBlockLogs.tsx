import React from 'react';
import { BlockLogEntry, formatPaiseToINR } from '../../shared/src/types.js';

interface NotificationBlockLogsProps {
  logs: BlockLogEntry[];
}

export const AdminScreen5_NotificationBlockLogs: React.FC<NotificationBlockLogsProps> = ({ logs }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <h1 className="text-lg font-bold text-slate-100">7th Warning &amp; 11th Block Audit Logs</h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete historical timeline of automated Day 7 grace warnings, Day 11 terminal lockouts, and Razorpay payment unblocks.
        </p>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">Enforcement Event Timeline</h2>
          <span className="text-xs text-slate-400">{logs.length} Total Audit Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-4 text-center">Event Type</th>
                <th className="py-3 px-5">Merchant Shop</th>
                <th className="py-3 px-3">Mobile</th>
                <th className="py-3 px-4 text-right">Dues Amount</th>
                <th className="py-3 px-6">Event Details &amp; System Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {logs.map((log) => (
                <tr key={log.log_id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-5 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp_unix * 1000).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider inline-block ${
                        log.event_type === 'DAY_11_BLOCKED'
                          ? 'bg-rose-950 text-rose-300 border border-rose-700'
                          : log.event_type === 'DAY_7_WARNING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      }`}
                    >
                      {log.event_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-5 font-semibold text-slate-100">{log.company_name}</td>
                  <td className="py-3 px-3 font-mono text-slate-300">{log.owner_mobile}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400 font-mono">
                    ₹{formatPaiseToINR(log.amount_due_paise)}
                  </td>
                  <td className="py-3 px-6 text-slate-300 leading-relaxed">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
