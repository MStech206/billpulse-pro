import React, { useState } from 'react';
import {
  MerchantProfile,
  formatPaiseToINR,
  MONTHLY_BASE_FEE_PAISE,
} from '../../shared/src/types.js';

interface SettlementModalProps {
  profile: MerchantProfile;
  daysIntoNewMonth?: number; // 4 = Day 4 (reminder), 8 = Day 8 (warning), 12 = Day 12 (block)
  onPaymentSettled: () => void;
  onClose?: () => void;
}

export const Screen5_SettlementModal: React.FC<SettlementModalProps> = ({
  profile,
  daysIntoNewMonth = 8,
  onPaymentSettled,
  onClose,
}) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Status computation based on 7th to 11th rule
  const isBlocked = daysIntoNewMonth > 11 && profile.pending_dues_paise > 0;
  const isWarning = daysIntoNewMonth > 7 && daysIntoNewMonth <= 11 && profile.pending_dues_paise > 0;
  const isReminder = daysIntoNewMonth <= 7 && profile.pending_dues_paise > 0;
  const daysLeft = Math.max(0, 11 - daysIntoNewMonth);

  const baseFeeINR = formatPaiseToINR(MONTHLY_BASE_FEE_PAISE);
  const orderFeePaise = profile.pending_dues_paise - MONTHLY_BASE_FEE_PAISE;
  const orderFeeINR = formatPaiseToINR(Math.max(0, orderFeePaise));
  const totalDueINR = formatPaiseToINR(profile.pending_dues_paise);

  const handleSimulateRazorpayPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      onPaymentSettled();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none font-sans">
      <div
        className={`w-full max-w-lg rounded-xl overflow-hidden shadow-2xl border ${
          isBlocked
            ? 'bg-rose-950/90 border-rose-600 text-rose-50'
            : isWarning
            ? 'bg-amber-950/90 border-amber-500 text-amber-50'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Banner Alert Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between font-bold text-sm ${
            isBlocked
              ? 'bg-rose-600 text-white'
              : isWarning
              ? 'bg-amber-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>
              {isBlocked
                ? '🚫 APPLICATION BLOCKED'
                : isWarning
                ? '⚠️ URGENT: APPLICATION MAY BE BLOCKED'
                : '🔔 MONTH-END SETTLEMENT DUE'}
            </span>
          </div>
          <span className="text-xs font-normal opacity-90">
            {profile.active_year_month} Billing Cycle
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Status Message Description */}
          <div className="text-xs leading-relaxed">
            {isBlocked && (
              <p className="text-rose-200">
                Billing has been paused because the post-month grace period exceeded 11 days without payment.
                Scan the Razorpay UPI QR code below to clear dues and instantly unlock your counter.
              </p>
            )}
            {isWarning && (
              <p className="text-amber-200">
                <span className="font-bold underline">Action Required:</span> Your application will be{' '}
                <span className="font-bold">blocked after the 11th</span> if payment is not received. You have{' '}
                <span className="font-bold text-white bg-amber-700/80 px-1.5 py-0.5 rounded">
                  {daysLeft} day(s) left
                </span>{' '}
                to settle.
              </p>
            )}
            {isReminder && (
              <p className="text-slate-300">
                Your monthly billing invoice is ready. Please complete payment before the 11th to continue
                seamless offline billing.
              </p>
            )}
          </div>

          {/* Dues Breakdown Card */}
          <div className="bg-black/40 border border-white/10 rounded-lg p-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span>Fixed Monthly Platform Fee</span>
              <span>₹{baseFeeINR}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>
                Orders Generated ({profile.total_orders_month} × ₹0.50)
              </span>
              <span>₹{orderFeeINR}</span>
            </div>
            <div className="pt-2 border-t border-white/20 flex justify-between font-bold text-sm text-white">
              <span>TOTAL AMOUNT DUE</span>
              <span className="text-emerald-400">₹{totalDueINR}</span>
            </div>
          </div>

          {/* Razorpay UPI QR Code Area */}
          <div className="bg-white text-slate-900 rounded-lg p-5 text-center shadow-inner">
            <div className="inline-block p-2 bg-slate-100 border border-slate-300 rounded mb-2">
              <div className="w-36 h-36 bg-slate-900 mx-auto flex flex-col items-center justify-center text-white text-[11px] font-mono p-2">
                <span className="text-emerald-400 font-bold mb-1">RAZORPAY</span>
                <span>[DYNAMIC QR]</span>
                <span className="text-[9px] text-slate-400 mt-1">₹{totalDueINR}</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Scan with Google Pay / PhonePe / Paytm / BHIM
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Instant automatic unlock via Razorpay Webhook
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleSimulateRazorpayPayment}
              disabled={isProcessingPayment}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg transition flex items-center justify-center space-x-2"
            >
              {isProcessingPayment ? (
                <span>Confirming Razorpay Webhook...</span>
              ) : (
                <span>Pay ₹{totalDueINR} via UPI / Card (Simulate Payment)</span>
              )}
            </button>

            {!isBlocked && onClose && (
              <button
                onClick={onClose}
                className="w-full text-xs text-slate-400 hover:text-slate-200 py-1.5 text-center transition"
              >
                Remind me later (Continue billing)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
