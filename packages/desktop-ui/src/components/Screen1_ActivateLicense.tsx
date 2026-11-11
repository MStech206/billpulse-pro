import React, { useState } from 'react';

interface ActivateLicenseProps {
  onActivated: (licenseData: {
    serialNumber: string;
    mobile: string;
    deviceId: string;
  }) => void;
  onQuit?: () => void;
}

export const Screen1_ActivateLicense: React.FC<ActivateLicenseProps> = ({
  onActivated,
  onQuit,
}) => {
  const [serialNumber, setSerialNumber] = useState('BP-2026-9842-1084');
  const [activationKey, setActivationKey] = useState('ACT-7841-B9X2-K991');
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Simulated hardware UUID from motherboard/CPU
  const detectedHardwareId = 'DEV-HWID-WIN-882194';

  const handleActivate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!serialNumber.trim() || !activationKey.trim() || !mobileNumber.trim()) {
      setErrorMessage('Please enter all required fields.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    // Simulate online verification & hardware binding handshake
    setTimeout(() => {
      setIsLoading(false);
      onActivated({
        serialNumber,
        mobile: mobileNumber,
        deviceId: detectedHardwareId,
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans select-none">
      {/* Top Header Bar */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-emerald-400 tracking-wider text-base">BillPulse Pro</span>
          <span className="text-slate-400 text-xs px-2 py-0.5 bg-slate-700 rounded">Terminal v1.0</span>
        </div>
        <div className="text-xs text-slate-400">
          Hardware Fingerprint: <span className="font-mono text-slate-300">{detectedHardwareId}</span>
        </div>
      </header>

      {/* Center Activation Box (Modeled on reference screen) */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-emerald-600 px-6 py-3 text-white font-semibold flex items-center justify-between">
            <span>Activate Terminal License</span>
            <span className="text-xs font-normal opacity-90">First-Time Setup</span>
          </div>

          <form onSubmit={handleActivate} className="p-8 space-y-6">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Serial Number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                placeholder="BP-2026-XXXX-XXXX"
                className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-emerald-300 font-mono tracking-wider focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Activation Key
              </label>
              <input
                type="text"
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                placeholder="ACT-XXXX-XXXX-XXXX"
                className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-emerald-300 font-mono tracking-wider focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Merchant Mobile / Email ID
              </label>
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="9876543210 or shop@apexretail.in"
                className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                This mobile number will be used to manage this license and receive month-end Razorpay settlement receipts.
              </p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded border border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
              <div>
                <span>Terminal Allocation: </span>
                <span className="font-bold text-slate-200">Counter 1 (D1)</span>
              </div>
              <div className="text-emerald-400 flex items-center space-x-1">
                <span>●</span>
                <span>Hardware Bound</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 rounded text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Binding Hardware & Activating...</span>
              ) : (
                <span>Activate & Proceed to Setup (Enter)</span>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Bottom Keyboard Hotkey Helper */}
      <footer className="bg-slate-800/90 border-t border-slate-700 px-6 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div>
          <span className="font-semibold text-slate-300">[Esc]</span> Quit
        </div>
        <div>
          <span className="font-semibold text-slate-300">[Tab]</span> Next Field
        </div>
        <div>
          <span className="font-semibold text-emerald-400">[Enter / A]</span> Activate License
        </div>
      </footer>
    </div>
  );
};
