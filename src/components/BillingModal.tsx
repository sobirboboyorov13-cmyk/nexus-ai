import React, { useState } from 'react';
import { X, Coins, Sparkles, Send, ShieldCheck } from 'lucide-react';
import { useNexusStore } from '../lib/store';
import { PLANS, PlanItem, PurchaseModal } from './PurchaseModal';

export const BillingModal: React.FC = () => {
  const {
    isBillingModalOpen,
    setBillingModalOpen,
    creditBalance,
    transactions,
    setCurrentTab
  } = useNexusStore();

  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState<PlanItem['id']>('silver');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  if (!isBillingModalOpen) return null;

  const handleSelectPlan = (planId: PlanItem['id']) => {
    setSelectedPlanForPurchase(planId);
    setIsPurchaseModalOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-white dark:bg-[#1e1e1e] border border-zinc-200 dark:border-[#2f2f2f] rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col space-y-4 max-h-[85vh] overflow-y-auto text-zinc-900 dark:text-[#ececec] transition-colors">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-[#2e2e2e]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">RENAX AI Tariflari</h3>
                <span className="text-[10px] text-zinc-500 dark:text-[#8e8e8e]">Kreditlar va hisobingizni to‘ldirish</span>
              </div>
            </div>
            <button
              onClick={() => setBillingModalOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Balance */}
          <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-[#171717] border border-zinc-200 dark:border-[#2e2e2e] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-zinc-500 dark:text-[#8e8e8e] block">Mavjud hisob balansingiz</span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">{creditBalance} kredit</span>
            </div>
            <button
              onClick={() => {
                setBillingModalOpen(false);
                setCurrentTab('billing');
              }}
              className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer"
            >
              Batafsil sahifa →
            </button>
          </div>

          {/* 3 Plans */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-700 dark:text-[#8e8e8e] block">
              Tarif paketini tanlang:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border text-center space-y-2.5 flex flex-col justify-between transition-all ${
                    p.popular
                      ? 'bg-purple-50/50 dark:bg-[#261f30] border-purple-500 shadow-sm ring-1 ring-purple-500/30'
                      : 'bg-zinc-50 dark:bg-[#171717] border-zinc-200 dark:border-[#2a2a2a]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">{p.name}</span>
                      {p.popular && (
                        <span className="text-[9px] bg-purple-600 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                          TOP
                        </span>
                      )}
                    </div>
                    <div className="text-base font-black text-zinc-900 dark:text-white mt-1 font-mono">{p.price}</div>
                    <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                      +{p.credits} kredit
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(p.id)}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      p.popular
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black'
                    }`}
                  >
                    Tanlash
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-500 dark:text-[#8e8e8e] block">So‘nggi tranzaksiyalar</span>
            <div className="border border-zinc-200 dark:border-[#2e2e2e] rounded-xl overflow-hidden max-h-36 overflow-y-auto bg-zinc-50 dark:bg-[#171717]">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-zinc-200 dark:divide-[#2a2a2a] text-zinc-700 dark:text-[#a3a3a3]">
                  {transactions.slice(0, 4).map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-100 dark:hover:bg-[#202020]">
                      <td className="p-2 text-zinc-900 dark:text-white truncate max-w-xs">{tx.reason}</td>
                      <td className={`p-2 text-right font-mono font-semibold ${tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        selectedPlanId={selectedPlanForPurchase}
      />
    </>
  );
};
