import React from 'react';
import { X, AlertCircle, PartyPopper } from 'lucide-react';
import { useNexusStore } from '../lib/store';
import { SubscriptionPlans } from './SubscriptionPlans';

export const BillingModal: React.FC = () => {
  const { isBillingModalOpen, setBillingModalOpen, limitInfo, setLimitInfo, subscription } = useNexusStore();

  const isGood = Boolean(limitInfo?.title?.includes('faollashdi'));
  const open = isBillingModalOpen || (isGood && Boolean(limitInfo));
  if (!open) return null;

  const close = () => { setBillingModalOpen(false); setLimitInfo(null); };

  // Obuna faollashgani haqidagi quvonchli xabar — kichik oyna
  if (isGood && limitInfo) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md renax-fade-in">
        <div className="renax-pop-in max-w-sm w-full rounded-3xl p-6 text-center bg-white dark:bg-[#131316] border border-zinc-200 dark:border-white/10 shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full grid place-items-center bg-emerald-500/15 border border-emerald-500/40 text-emerald-500">
            <PartyPopper className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold mb-1.5">{limitInfo.title}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">{limitInfo.message}</p>
          <button onClick={close} className="w-full py-3 rounded-2xl renax-cta text-white text-sm font-bold">
            Davom etish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md renax-fade-in">
      <div className="renax-pop-in w-full max-w-3xl max-h-[92dvh] overflow-y-auto ios-scroll rounded-3xl bg-white dark:bg-[#131316] border border-zinc-200 dark:border-white/10 shadow-2xl">
        <div className="h-[3px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500" />
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold">Tarifni tanlang</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {subscription ? `Joriy: ${subscription.plan.name}` : 'To\u2018lov Telegram bot orqali'}
              </p>
            </div>
            <button onClick={close} className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          {limitInfo && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">{limitInfo.title}</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-200/80 mt-0.5">{limitInfo.message}</p>
              </div>
            </div>
          )}

          <SubscriptionPlans />
        </div>
      </div>
    </div>
  );
};
