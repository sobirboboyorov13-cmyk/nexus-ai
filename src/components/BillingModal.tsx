import React from 'react';
import { X, Coins } from 'lucide-react';
import { useNexusStore } from '../lib/store';

export const BillingModal: React.FC = () => {
  const {
    isBillingModalOpen,
    setBillingModalOpen,
    creditBalance,
    transactions,
    addCredits
  } = useNexusStore();

  if (!isBillingModalOpen) return null;

  const packs = [
    { name: 'Starter', credits: 500, price: '$10' },
    { name: 'Pro', credits: 2500, price: '$39', popular: true },
    { name: 'Scale', credits: 10000, price: '$129' },
  ];

  const handleBuyCredits = async (credits: number, packName: string) => {
    await addCredits(credits, `Top-Up xaridi: ${packName} (+${credits} kredit)`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#212121] border border-[#2f2f2f] rounded-xl max-w-lg w-full p-5 shadow-2xl flex flex-col space-y-4 max-h-[85vh] overflow-y-auto text-[#ececec]">
        <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e]">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#a3a3a3]" />
            <h3 className="text-sm font-semibold text-white">Credits & Usage</h3>
          </div>
          <button
            onClick={() => setBillingModalOpen(false)}
            className="p-1 rounded-md text-[#8e8e8e] hover:text-white hover:bg-[#2a2a2a]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8e8e8e] block">Available Credits</span>
            <span className="text-2xl font-bold text-white font-mono">{creditBalance}</span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-[#8e8e8e] block">Add Credits</span>
          <div className="grid grid-cols-3 gap-2">
            {packs.map((p) => (
              <div
                key={p.name}
                className={`p-3 rounded-lg border text-center space-y-2 flex flex-col justify-between ${
                  p.popular
                    ? 'bg-[#2a2a2a] border-[#444444]'
                    : 'bg-[#1a1a1a] border-[#2a2a2a]'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-white">{p.name}</div>
                  <div className="text-base font-bold text-white mt-1">{p.price}</div>
                  <div className="text-[11px] text-[#a3a3a3] font-mono">+{p.credits}</div>
                </div>

                <button
                  onClick={() => handleBuyCredits(p.credits, p.name)}
                  className="w-full py-1.5 rounded-md bg-white hover:bg-[#e5e5e5] text-black text-xs font-medium transition-colors"
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-medium text-[#8e8e8e] block">Recent Transactions</span>
          <div className="border border-[#2e2e2e] rounded-lg overflow-hidden max-h-40 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-[#2a2a2a] text-[#a3a3a3]">
                {transactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#252525]">
                    <td className="p-2 text-white truncate max-w-xs">{tx.reason}</td>
                    <td className="p-2 text-right font-mono font-medium">
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
  );
};
