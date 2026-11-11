import React, { useState } from 'react';
import {
  BusinessType,
  BillingPlan,
  BUSINESS_PRESETS,
  MerchantProfile,
} from '../../shared/src/types.js';

interface ShopConfigProps {
  initialMobile?: string;
  onSaved: (profile: Partial<MerchantProfile>) => void;
}

export const Screen2_ShopConfig: React.FC<ShopConfigProps> = ({
  initialMobile = '9876543210',
  onSaved,
}) => {
  const [businessType, setBusinessType] = useState<BusinessType>('TEA_SHOP');
  const [shopName, setShopName] = useState('Syed Tea Corner');
  const [shopAddress, setShopAddress] = useState('Shop #12, Market Ring Road, Bengaluru - 560001');
  const [ownerMobile, setOwnerMobile] = useState(initialMobile);
  const [gstin, setGstin] = useState('');
  const [upiId, setUpiId] = useState('syedtea@upi');
  const [billingPlan, setBillingPlan] = useState<BillingPlan>('PER_ORDER_050');
  const [invoicePrefix, setInvoicePrefix] = useState('TEA');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const handleBusinessTypeChange = (type: BusinessType) => {
    setBusinessType(type);
    const preset = BUSINESS_PRESETS[type];
    if (preset) {
      setInvoicePrefix(preset.defaultPrefix);
      setBillingPlan(preset.defaultPlan);
      if (type === 'TEA_SHOP') setShopName('Syed Tea Corner');
      else if (type === 'KIRANA_STORE') setShopName('Apex Kirana & Superstore');
      else if (type === 'WHOLESALE') setShopName('Metro Wholesale Mandi');
      else if (type === 'RESTAURANT') setShopName('Royal Biryani & Cafe');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setSignaturePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaved({
      company_name: shopName,
      company_address: shopAddress,
      owner_mobile: ownerMobile,
      company_gstin: gstin || undefined,
      upi_id: upiId || undefined,
      business_type: businessType,
      invoice_prefix: invoicePrefix.toUpperCase(),
      billing_plan: billingPlan,
      logo_data_uri: logoPreview || undefined,
      signature_data_uri: signaturePreview || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-emerald-400 text-lg">Shop Setup & Configuration</h1>
          <p className="text-xs text-slate-400">Configure your business type once; change anytime via [F7]</p>
        </div>
        <div className="text-xs bg-slate-700/70 px-3 py-1.5 rounded text-slate-300">
          Terminal Status: <span className="text-emerald-400 font-semibold">Activated (D1)</span>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        <form onSubmit={handleSave} className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6 shadow-xl">
          {/* Business Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Business Type (Auto-configures catalog & tax slabs)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
              {(Object.keys(BUSINESS_PRESETS) as BusinessType[]).map((type) => {
                const isSelected = businessType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleBusinessTypeChange(type)}
                    className={`p-3 rounded text-left border transition text-xs font-medium flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-500/50'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span>{BUSINESS_PRESETS[type].name.split('/')[0]}</span>
                    <span className="text-[10px] opacity-75 mt-1 font-mono">
                      Prefix: {BUSINESS_PRESETS[type].defaultPrefix}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shop Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-700/60">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Shop / Trading Name
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Syed Tea Corner"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Owner Mobile Number
              </label>
              <input
                type="text"
                required
                value={ownerMobile}
                onChange={(e) => setOwnerMobile(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Shop Address (Prints on invoice header)
              </label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Shop number, street, city, pin code"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                GSTIN (Optional — Leave blank for composite/unregistered)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="29AABCU9603R1ZM"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3.5 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Merchant UPI ID (Generates dynamic customer payment QR)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="shopname@upi or 9876543210@paytm"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Billing Plan & Invoice Prefix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-700/60">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Print Format & Platform Rate
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 bg-slate-900/60 border border-slate-700 rounded cursor-pointer">
                  <input
                    type="radio"
                    name="billingPlan"
                    checked={billingPlan === 'PER_ORDER_050'}
                    onChange={() => setBillingPlan('PER_ORDER_050')}
                    className="text-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-emerald-300">Compact Thermal Receipt (₹0.50/order)</span>
                    <p className="text-[11px] text-slate-400">Best for Tea Shops, Kiranas & Fast Retail (58mm/80mm USB Thermal)</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-slate-900/60 border border-slate-700 rounded cursor-pointer">
                  <input
                    type="radio"
                    name="billingPlan"
                    checked={billingPlan === 'PER_INVOICE_100'}
                    onChange={() => setBillingPlan('PER_INVOICE_100')}
                    className="text-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-emerald-300">Full GST Tax Invoice (₹1.00/invoice)</span>
                    <p className="text-[11px] text-slate-400">Best for Wholesalers, Distributors & Hardware (A4/A5 Laser Print)</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Invoice Serial Prefix
              </label>
              <input
                type="text"
                required
                maxLength={5}
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                placeholder="e.g. TEA or KRN"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3.5 py-2 text-sm text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Invoices will be numbered:{' '}
                <span className="text-emerald-400 font-mono font-semibold">
                  {invoicePrefix}-202611-0001
                </span>
              </p>

              {/* Logo / Stamp upload */}
              <div className="mt-4 flex items-center space-x-4">
                <label className="cursor-pointer text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded">
                  Upload Logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {logoPreview && <img src={logoPreview} alt="Logo" className="w-8 h-8 rounded border" />}

                <label className="cursor-pointer text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded">
                  Upload Stamp/Sign
                  <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                </label>
                {signaturePreview && <img src={signaturePreview} alt="Stamp" className="w-8 h-8 rounded border" />}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 rounded-lg shadow-lg transition flex items-center justify-center space-x-2"
          >
            <span>Save Configuration & Start Billing [Enter] →</span>
          </button>
        </form>
      </main>
    </div>
  );
};
