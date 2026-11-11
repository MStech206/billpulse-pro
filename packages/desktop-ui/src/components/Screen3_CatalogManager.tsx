import React, { useState } from 'react';
import { CatalogItem } from '../../shared/src/types.js';

interface CatalogManagerProps {
  items: CatalogItem[];
  onUpdateItems: (newItems: CatalogItem[]) => void;
  onGoToBilling: () => void;
}

export const Screen3_CatalogManager: React.FC<CatalogManagerProps> = ({
  items,
  onUpdateItems,
  onGoToBilling,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemRate, setNewItemRate] = useState('');
  const [newItemGst, setNewItemGst] = useState('5.0');
  const [newItemHsn, setNewItemHsn] = useState('');

  const filteredItems = items.filter((item) =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemRate.trim()) return;

    const ratePaise = Math.round(parseFloat(newItemRate) * 100);
    const newItem: CatalogItem = {
      item_id: `ITEM-${Date.now()}`,
      tenant_id: 'active-tenant',
      item_name: newItemName.trim(),
      hsn_code: newItemHsn.trim() || undefined,
      selling_rate_paise: ratePaise,
      gst_percent: parseFloat(newItemGst) || 5.0,
      updated_at: Math.floor(Date.now() / 1000),
    };

    onUpdateItems([...items, newItem]);
    setNewItemName('');
    setNewItemRate('');
    setNewItemHsn('');
    setIsAddingNew(false);
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdateItems(items.filter((i) => i.item_id !== itemId));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-emerald-400 text-lg">F6: Product & Item Catalog</span>
          <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-0.5 rounded">
            {items.length} Items Configured
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAddingNew(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
          >
            + Add New Item
          </button>
          <button
            onClick={onGoToBilling}
            className="bg-slate-700 hover:bg-slate-600 text-emerald-300 text-xs font-semibold px-4 py-1.5 rounded border border-emerald-500/30"
          >
            Go to Billing Counter [F4] →
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-6">
        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search items by name or HSN code..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Add New Item Inline Form */}
        {isAddingNew && (
          <form
            onSubmit={handleAddItem}
            className="bg-slate-800 border border-emerald-500/50 rounded-lg p-5 grid grid-cols-1 md:grid-cols-5 gap-4 items-end shadow-lg"
          >
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Item Name</label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Masala Dosa"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Selling Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={newItemRate}
                onChange={(e) => setNewItemRate(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">GST Slab (%)</label>
              <select
                value={newItemGst}
                onChange={(e) => setNewItemGst(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="0.0">0% (Nil)</option>
                <option value="5.0">5% (Standard Food/Grain)</option>
                <option value="12.0">12%</option>
                <option value="18.0">18% (Standard Retail)</option>
                <option value="28.0">28%</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 rounded"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Catalog Items Grid (Clickable visual pills) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {filteredItems.map((item) => (
            <div
              key={item.item_id}
              className="bg-slate-800 border border-slate-700 hover:border-emerald-500/60 rounded-lg p-3.5 transition flex flex-col justify-between shadow-sm group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-slate-100 text-sm leading-tight">
                    {item.item_name}
                  </h3>
                  <button
                    onClick={() => handleDeleteItem(item.item_id)}
                    title="Remove item"
                    className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 text-xs transition"
                  >
                    ✕
                  </button>
                </div>
                {item.hsn_code && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">HSN: {item.hsn_code}</p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-base font-bold text-emerald-400">
                  ₹{(item.selling_rate_paise / 100).toFixed(2)}
                </span>
                <span className="text-[10px] bg-slate-700/80 text-slate-300 px-1.5 py-0.5 rounded">
                  GST {item.gst_percent}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            No items found matching "{searchTerm}". Click "+ Add New Item" above.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 px-6 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div>
          Tip: Tap any item card on the <span className="text-emerald-400 font-semibold">[F4]</span> Billing screen to instantly add to receipt.
        </div>
        <div>
          <button
            onClick={onGoToBilling}
            className="text-emerald-400 hover:underline font-semibold"
          >
            Launch POS Billing [F4] →
          </button>
        </div>
      </footer>
    </div>
  );
};
