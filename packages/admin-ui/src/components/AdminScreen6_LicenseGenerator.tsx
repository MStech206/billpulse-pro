import React, { useState } from 'react';
import { BillingPlan, LicenseKeyRecord } from '../../shared/src/types.js';
import { generateLicenseCredentials } from '../../api/src/server.js';

interface LicenseGeneratorProps {
  existingKeys: LicenseKeyRecord[];
  onKeyCreated: (newKey: LicenseKeyRecord) => void;
}

export const AdminScreen6_LicenseGenerator: React.FC<LicenseGeneratorProps> = ({
  existingKeys,
  onKeyCreated,
}) => {
  const [shopName, setShopName] = useState('');
  const [mobile, setMobile] = useState('');
  const [rateTier, setRateTier] = useState<BillingPlan>('PER_ORDER_050');
  const [generatedKey, setGeneratedKey] = useState<LicenseKeyRecord | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const newCredentials = generateLicenseCredentials(rateTier);
    newCredentials.assigned_shop_name = shopName.trim() || 'New Merchant';
    onKeyCreated(newCredentials);
    setGeneratedKey(newCredentials);
    setShopName('');
    setMobile('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <h1 className="text-lg font-bold text-slate-100">License Key &amp; Serial Number Generator</h1>
        <p className="text-xs text-slate-400 mt-1">
          Issue new cryptographically signed credentials to activate fresh counter installations.
        </p>
      </div>

      {/* Generator Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
        <h2 className="text-sm font-bold text-slate-200 mb-4">Issue New Terminal License</h2>
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Shop / Business Name</label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Green Bakery"
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Owner Mobile (Optional)</label>
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile"
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Billing Plan Tier</label>
            <select
              value={rateTier}
              onChange={(e) => setRateTier(e.target.value as BillingPlan)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="PER_ORDER_050">₹0.50 / order (Thermal Receipt + ₹20 base)</option>
              <option value="PER_INVOICE_100">₹1.00 / invoice (Full GST A4 + ₹20 base)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs transition shadow-lg"
          >
            Generate Key Credentials
          </button>
        </form>

        {/* Newly Generated Result Card */}
        {generatedKey && (
          <div className="mt-6 p-5 bg-emerald-950/40 border border-emerald-600/50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                ✅ License Generated Successfully for {generatedKey.assigned_shop_name}
              </span>
              <span className="text-[10px] text-slate-400">Share with shopkeeper to activate desktop terminal</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] block">SERIAL NUMBER</span>
                  <span className="font-bold text-slate-100">{generatedKey.serial_number}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedKey.serial_number)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] rounded"
                >
                  Copy
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] block">ACTIVATION KEY</span>
                  <span className="font-bold text-slate-100">{generatedKey.activation_key}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedKey.activation_key)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] rounded"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Existing Keys Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">Issued License Credentials ({existingKeys.length})</h3>
          <span className="text-xs text-slate-400">Tied to single hardware installations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Serial Number</th>
                <th className="py-3 px-5">Activation Key</th>
                <th className="py-3 px-4">Assigned Shop</th>
                <th className="py-3 px-3">Plan Tier</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {existingKeys.map((k) => (
                <tr key={k.license_id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-5 text-emerald-400 font-bold">{k.serial_number}</td>
                  <td className="py-3 px-5 text-slate-300">{k.activation_key}</td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-200">
                    {k.assigned_shop_name || 'Unassigned'}
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-sans">
                    {k.rate_tier === 'PER_INVOICE_100' ? '₹1.00 (A4 Tax)' : '₹0.50 (Thermal)'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                        k.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : k.status === 'UNUSED'
                          ? 'bg-blue-950 text-blue-300 border border-blue-700'
                          : 'bg-rose-950 text-rose-300 border border-rose-700'
                      }`}
                    >
                      {k.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500 font-sans">
                    {new Date(k.created_at).toLocaleDateString('en-IN')}
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
