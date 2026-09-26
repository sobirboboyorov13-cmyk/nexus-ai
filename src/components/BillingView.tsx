import React, { useState } from 'react';
import { History, Check, Sparkles, Send, ShieldCheck, Zap } from 'lucide-react';
import { useNexusStore } from '../lib/store';
import { PLANS, PlanItem, PurchaseModal } from './PurchaseModal';

export const BillingView: React.FC = () => {
  const { creditBalance, transactions, currentUser } = useNexusStore();
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState<PlanItem['id']>('silver');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const handleOpenPurchase = (planId: PlanItem['id']) => {
    setSelectedPlanForPurchase(planId);
    setIsPurchaseModalOpen(true);
  };

  return (
    <div id="nexus-billing-view" className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6 space-y-6 bg-zinc-50 dark:bg-[#141414] text-zinc-900 dark:text-[#ececec] transition-colors">
      
      {/* Header section with kicker */}
      <div className="pb-4 border-b border-zinc-200 dark:border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full mb-1">
            RENAX MEMBERSHIP
          </div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Sizga mos tarifni tanlang
          </h2>
          <p className="text-xs text-zinc-500 dark:text-[#8e8e8e] max-w-xl">
            Istalgan tarifni Telegram bot yoki Click/Payme orqali sotib oling. To‘lov tasdiqlangach obuna akkauntingizga avtomatik ulanadi.
          </p>
        </div>

        {/* Current user & credits pill */}
        <div className="flex items-center gap-3 bg-white dark:bg-[#1f1f1f] border border-zinc-200 dark:border-[#2f2f2f] px-4 py-2.5 rounded-xl shadow-2xs">
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 dark:text-[#8e8e8e] block font-medium">Mavjud balans</span>
            <span className="text-base font-extrabold text-zinc-900 dark:text-white font-mono">{creditBalance} kredit</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4 fill-amber-500" />
          </div>
        </div>
      </div>

      {/* 3 Pricing Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl p-5 border flex flex-col justify-between transition-all relative ${
              plan.popular
                ? 'bg-white dark:bg-[#1c1c1c] border-purple-500 shadow-xl ring-2 ring-purple-500/20'
                : 'bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-[#2c2c2c] shadow-2xs hover:border-zinc-300 dark:hover:border-[#404040]'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full tracking-wider shadow-sm">
                ENG MASHHUR
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                    plan.id === 'bronze'
                      ? 'bg-amber-700/20 text-amber-700 dark:text-amber-400'
                      : plan.id === 'silver'
                      ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                      : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {plan.name.charAt(0)}
                  </div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">{plan.name}</h3>
                </div>
              </div>

              <div className="my-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white font-mono tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-[#8e8e8e] font-medium">{plan.period}</span>
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>+{plan.credits} AI hisoblash krediti</span>
                </div>
              </div>

              {/* Features list */}
              <ul className="space-y-2 py-3 border-t border-zinc-100 dark:border-[#262626] text-xs text-zinc-600 dark:text-[#a3a3a3]">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 mt-auto">
              <button
                onClick={() => handleOpenPurchase(plan.id)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                  plan.popular
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/25 shadow-md'
                    : 'bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Sotib olish</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Fair use note */}
      <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-[#2c2c2c] flex items-center justify-between text-xs text-zinc-500 dark:text-[#8e8e8e]">
        <span>* Cheksiz chat va yuqori tezlik adolatli foydalanish siyosati (Fair Use Policy) asosida taqdim etiladi.</span>
        <div className="flex items-center gap-1.5 shrink-0 text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Xavfsiz to‘lov tizimi</span>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-[#8e8e8e] uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-zinc-400" />
          Tranzaksiyalar tarixi
        </h3>

        <div className="border border-zinc-200 dark:border-[#2f2f2f] rounded-xl overflow-hidden bg-white dark:bg-[#1c1c1c] shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 dark:bg-[#181818] text-zinc-600 dark:text-[#8e8e8e] border-b border-zinc-200 dark:border-[#2f2f2f]">
              <tr>
                <th className="p-3 font-semibold">Amal / Tavsif</th>
                <th className="p-3 text-right font-semibold">Kreditlar</th>
                <th className="p-3 text-right font-semibold">Qoldiq</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#262626] text-zinc-700 dark:text-[#a3a3a3]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-zinc-400 dark:text-[#737373]">
                    Tranzaksiyalar mavjud emas
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-[#222222]">
                    <td className="p-3 text-zinc-900 dark:text-white font-medium">{tx.reason}</td>
                    <td className={`p-3 text-right font-mono font-semibold ${tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </td>
                    <td className="p-3 text-right font-mono text-zinc-500 dark:text-zinc-400">{tx.balanceAfter}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Telegram Purchase Modal */}
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        selectedPlanId={selectedPlanForPurchase}
      />
    </div>
  );
};
