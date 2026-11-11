import React, { useState } from 'react';
import {
  MerchantProfile,
  CatalogItem,
  PaymentMode,
  formatPaiseToINR,
} from '../../shared/src/types.js';

interface CartLine {
  item: CatalogItem;
  qty: number;
}

interface ExpressPOSProps {
  profile: MerchantProfile;
  catalog: CatalogItem[];
  onOrderCreated: (orderTotalPaise: number, feePaise: number) => void;
  onOpenSettlementModal: () => void;
  onOpenConfig: () => void;
  onOpenCatalog: () => void;
}

export const Screen4_ExpressPOS: React.FC<ExpressPOSProps> = ({
  profile,
  catalog,
  onOrderCreated,
  onOpenSettlementModal,
  onOpenConfig,
  onOpenCatalog,
}) => {
  const [customerMobile, setCustomerMobile] = useState('');
  const [cart, setCart] = useState<CartLine[]>([
    // Default sample line for instant visual appeal
    { item: catalog[0] || { item_id: '1', item_name: 'Special Milk Tea', selling_rate_paise: 1500, gst_percent: 5 }, qty: 2 },
    { item: catalog[2] || { item_id: '3', item_name: 'Crispy Samosa', selling_rate_paise: 1500, gst_percent: 5 }, qty: 1 },
  ]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [isOffline, setIsOffline] = useState(false);
  const [lastPrintedInvoice, setLastPrintedInvoice] = useState<string | null>(null);

  // Cart calculations
  const subtotalPaise = cart.reduce(
    (acc, line) => acc + line.item.selling_rate_paise * line.qty,
    0
  );
  const gstTotalPaise = Math.round(subtotalPaise * 0.05); // Standard intrastate 5%
  const grandTotalPaise = subtotalPaise + gstTotalPaise;

  const currentInvoiceNumber = `${profile.invoice_prefix}-${profile.active_year_month.replace('-', '')}-${String(
    profile.total_orders_month + 1
  ).padStart(4, '0')}`;

  const handleAddItemToCart = (item: CatalogItem) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.item.item_id === item.item_id);
      if (existing) {
        return prev.map((line) =>
          line.item.item_id === item.item_id ? { ...line, qty: line.qty + 1 } : line
        );
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.item.item_id === itemId) {
            const newQty = line.qty + delta;
            return newQty > 0 ? { ...line, qty: newQty } : null;
          }
          return line;
        })
        .filter(Boolean) as CartLine[]
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handlePrintAndCashOut = () => {
    if (cart.length === 0) return;

    const platformFeePaise = profile.billing_plan === 'PER_INVOICE_100' ? 100 : 50;
    onOrderCreated(grandTotalPaise, platformFeePaise);
    setLastPrintedInvoice(currentInvoiceNumber);

    // Reset for next customer
    setCart([]);
    setCustomerMobile('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Counter Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-extrabold text-emerald-400 text-lg tracking-wide">
            {profile.company_name}
          </span>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            {profile.business_type.replace('_', ' ')}
          </span>
          <span className="text-xs text-slate-400">Prefix: {profile.invoice_prefix}</span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Offline / Online Toggle Simulator */}
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`text-xs px-2.5 py-1 rounded flex items-center space-x-1.5 transition ${
              isOffline
                ? 'bg-amber-950/80 text-amber-300 border border-amber-700'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span>{isOffline ? 'Working Offline (SQLite)' : 'Online (Synced)'}</span>
          </button>

          {/* Month Dues Tracker Button */}
          <button
            onClick={onOpenSettlementModal}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded border border-slate-700 flex items-center space-x-1.5"
          >
            <span>Dues:</span>
            <span className="font-bold text-emerald-400">
              ₹{formatPaiseToINR(profile.pending_dues_paise)}
            </span>
            <span className="text-[10px] text-slate-400">({profile.total_orders_month} orders)</span>
          </button>

          <button
            onClick={onOpenCatalog}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded"
          >
            Catalog [F6]
          </button>
          <button
            onClick={onOpenConfig}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded"
          >
            Settings [F7]
          </button>
        </div>
      </header>

      {/* Main Split-Screen Counter */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Side: Order Punching & Fast Items (7 Columns) */}
        <section className="lg:col-span-7 p-5 flex flex-col justify-between border-r border-slate-800 overflow-y-auto space-y-4">
          <div>
            {/* Customer input & fast pills */}
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="text"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                placeholder="Customer Mobile (Optional - Enter for digital bill receipt)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-slate-400 font-mono">Bill #{currentInvoiceNumber}</span>
            </div>

            {/* Quick Tap Item Pills (F6 fast items) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Tap to Add Items
                </span>
                <button
                  onClick={onOpenCatalog}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Manage Items →
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {catalog.slice(0, 8).map((item) => (
                  <button
                    key={item.item_id}
                    onClick={() => handleAddItemToCart(item)}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 hover:border-emerald-500/50 rounded text-left transition shadow-sm flex flex-col justify-between"
                  >
                    <span className="text-xs font-medium text-slate-100 line-clamp-1">
                      {item.item_name}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 mt-1">
                      ₹{formatPaiseToINR(item.selling_rate_paise)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Cart Line Items Table */}
            <div className="mt-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Current Order Items ({cart.length})
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700/60">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {cart.map((line) => (
                      <tr key={line.item.item_id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-medium text-slate-200">
                          {line.item.item_name}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="inline-flex items-center space-x-1.5 bg-slate-800 rounded px-1.5 py-0.5">
                            <button
                              onClick={() => handleUpdateQty(line.item.item_id, -1)}
                              className="text-slate-400 hover:text-white px-1 font-bold"
                            >
                              -
                            </button>
                            <span className="font-semibold text-emerald-300 w-4 text-center">
                              {line.qty}
                            </span>
                            <button
                              onClick={() => handleUpdateQty(line.item.item_id, 1)}
                              className="text-slate-400 hover:text-white px-1 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          ₹{formatPaiseToINR(line.item.selling_rate_paise)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">
                          ₹{formatPaiseToINR(line.item.selling_rate_paise * line.qty)}
                        </td>
                      </tr>
                    ))}
                    {cart.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-500">
                          Cart is empty. Tap any item above or search to add.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Checkout Controls */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            {/* Payment Mode Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Payment Mode
              </span>
              <div className="flex space-x-2">
                {(['CASH', 'UPI', 'CARD', 'CREDIT'] as PaymentMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${
                      paymentMode === mode
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Print and Cash Out Action */}
            <div className="flex space-x-3">
              <button
                onClick={handleClearCart}
                disabled={cart.length === 0}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold rounded"
              >
                Clear [Esc]
              </button>
              <button
                onClick={handlePrintAndCashOut}
                disabled={cart.length === 0}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded shadow-lg transition flex items-center justify-center space-x-2"
              >
                <span>Print & Cash Out [F10] — ₹{formatPaiseToINR(grandTotalPaise)}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Side: Live WYSIWYG Receipt Preview (5 Columns) */}
        <section className="lg:col-span-5 bg-slate-900/60 p-6 flex flex-col items-center justify-center overflow-y-auto">
          <div className="w-full max-w-sm bg-white text-slate-900 p-6 rounded shadow-2xl font-mono text-xs border border-slate-300">
            {/* Receipt Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <h2 className="font-bold text-sm tracking-wide uppercase">
                {profile.company_name}
              </h2>
              {profile.company_address && (
                <p className="text-[10px] text-slate-600 mt-0.5">{profile.company_address}</p>
              )}
              {profile.owner_mobile && (
                <p className="text-[10px] text-slate-600">Ph: {profile.owner_mobile}</p>
              )}
              {profile.company_gstin && (
                <p className="text-[10px] text-slate-600">GSTIN: {profile.company_gstin}</p>
              )}
            </div>

            {/* Receipt Metadata */}
            <div className="py-2 text-[10px] text-slate-600 border-b border-dashed border-slate-400 flex justify-between">
              <span>Inv: {currentInvoiceNumber}</span>
              <span>{new Date().toLocaleDateString('en-IN')}</span>
            </div>

            {/* Line Items List */}
            <div className="py-3 border-b border-dashed border-slate-400 space-y-1.5">
              {cart.map((line, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {line.item.item_name} x {line.qty}
                  </span>
                  <span className="font-semibold">
                    ₹{formatPaiseToINR(line.item.selling_rate_paise * line.qty)}
                  </span>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center text-slate-400 py-3 italic">
                  No items in order
                </div>
              )}
            </div>

            {/* Subtotal & Tax */}
            <div className="py-2.5 text-[11px] space-y-1 border-b border-dashed border-slate-400">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{formatPaiseToINR(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (5% split)</span>
                <span>₹{formatPaiseToINR(gstTotalPaise)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                <span>GRAND TOTAL</span>
                <span>₹{formatPaiseToINR(grandTotalPaise)}</span>
              </div>
            </div>

            {/* Payment & Customer QR */}
            <div className="pt-3 text-center text-[10px] text-slate-600">
              <p>Paid by: <span className="font-bold">{paymentMode}</span></p>
              {profile.upi_id && (
                <div className="my-2 p-2 bg-slate-50 border border-slate-200 rounded inline-block">
                  <div className="w-20 h-20 bg-slate-900 mx-auto flex items-center justify-center text-white text-[9px] font-mono">
                    [UPI QR]
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1">{profile.upi_id}</p>
                </div>
              )}
              <p className="mt-1 font-semibold">Thank you! Visit again.</p>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-slate-400">
            Platform Fee: <span className="text-emerald-400 font-semibold">₹0.50</span> accrued locally
          </div>
        </section>
      </main>

      {/* Counter Status Bar */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-2 flex items-center justify-between text-xs text-slate-400">
        <div>
          [F4] New Bill &nbsp;|&nbsp; [F6] Catalog &nbsp;|&nbsp; [F7] Settings &nbsp;|&nbsp; [F10] Print & Cash Out
        </div>
        <div>
          Orders This Month:{' '}
          <span className="font-bold text-slate-200">{profile.total_orders_month}</span>
        </div>
      </footer>
    </div>
  );
};
