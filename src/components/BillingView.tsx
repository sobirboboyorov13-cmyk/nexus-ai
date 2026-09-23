import React from 'react';
import { Coins, History } from 'lucide-react';
import { useNexusStore } from '../lib/store';

export const BillingView: React.FC = () => {
  const { creditBalance, transactions, addCredits } = useNexusStore();

  const creditPacks = [
    { name: 'Boshlang\'ich to\'plam', credits: 500, price: '$10', desc: 'Tezkor sinovlar va qisqa suhbatlar uchun.' },
    { name: 'Pro to\'plam', credits: 2500, price: '$39', desc: 'Ijodkorlar, dasturchilar va ish oqimlari uchun.', popular: true },
    { name: 'Ultra to\'plam', credits: 10000, price: '$129', desc: 'Katta hajmdagi professional vazifalar uchun.' },
  ];

  const handleBuy = async (credits: number, name: string) => {
    await addCredits(credits, `Top-Up xaridi: ${name} (+${credits} kredit)`);
  };

  return (
    <div id="nexus-billing-view" className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6 bg-zinc-50 dark:bg-[#171717] text-zinc-900 dark:text-[#ececec] transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-[#262626]">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Kreditlar va hisob balansi</h2>
          <p className="text-xs text-zinc-500 dark:text-[#8e8e8e]">Matn, rasm va video modellari uchun hisoblash kreditlarini boshqaring.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] shadow-2xs space-y-1">
          <div className="text-xs text-zinc-500 dark:text-[#8e8e8e] font-medium">Mavjud hisob</div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">{creditBalance} kredit</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] shadow-2xs space-y-1">
          <div className="text-xs text-zinc-500 dark:text-[#8e8e8e] font-medium">Joriy tarif</div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">Standart (Ishlatganingizga qarab)</div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-[#8e8e8e] uppercase tracking-wider">
          Kredit paketlari
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {creditPacks.map((pack) => (
            <div
              key={pack.name}
              className={`p-4 rounded-xl border space-y-3 flex flex-col justify-between transition-all ${
                pack.popular
                  ? 'bg-white dark:bg-[#242424] border-purple-500 shadow-md ring-1 ring-purple-500/20'
                  : 'bg-white dark:bg-[#212121] border-zinc-200 dark:border-[#2f2f2f] shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{pack.name}</h4>
                  {pack.popular && (
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold px-2 py-0.5 rounded-full">Ommabop</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-[#8e8e8e] mt-1">{pack.desc}</p>
                <div className="text-xl font-bold text-zinc-900 dark:text-white mt-3 font-mono">{pack.price}</div>
                <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-0.5">+{pack.credits} kredit</div>
              </div>

              <button
                onClick={() => handleBuy(pack.credits, pack.name)}
                className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-[#e5e5e5] text-white dark:text-black text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Paketni xarid qilish
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-[#8e8e8e] uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-zinc-400" />
          Tranzaksiyalar tarixi
        </h3>

        <div className="border border-zinc-200 dark:border-[#2f2f2f] rounded-xl overflow-hidden bg-white dark:bg-[#212121] shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 dark:bg-[#1c1c1c] text-zinc-600 dark:text-[#8e8e8e] border-b border-zinc-200 dark:border-[#2f2f2f]">
              <tr>
                <th className="p-3 font-semibold">Amal / Tavsif</th>
                <th className="p-3 text-right font-semibold">Kreditlar</th>
                <th className="p-3 text-right font-semibold">Qoldiq</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#2a2a2a] text-zinc-700 dark:text-[#a3a3a3]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-zinc-400 dark:text-[#737373]">
                    Tranzaksiyalar mavjud emas
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-[#262626]">
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
    </div>
  );
};
