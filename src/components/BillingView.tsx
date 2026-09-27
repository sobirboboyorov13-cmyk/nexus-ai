import React from 'react';
import { History, Sparkles, Clock, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { useNexusStore } from '../lib/store';
import { SubscriptionPlans } from './SubscriptionPlans';

const som = (n: number) => n.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');

const Meter: React.FC<{ icon: React.ReactNode; label: string; used: number; total: number; unlimited?: boolean }> = ({
  icon, label, used, total, unlimited,
}) => {
  const pct = unlimited ? 0 : Math.min(100, total ? (used / total) * 100 : 0);
  return (
    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#171719] border border-zinc-200 dark:border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          {icon}{label}
        </span>
        <span className="text-xs font-bold text-zinc-900 dark:text-white">
          {unlimited ? 'cheksiz' : `${som(Math.max(0, total - used))} / ${som(total)}`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
          style={{ width: `${unlimited ? 6 : 100 - pct}%` }}
        />
      </div>
    </div>
  );
};

export const BillingView: React.FC = () => {
  const { transactions, currentUser, subscription } = useNexusStore();
  const plan = subscription?.plan;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto ios-scroll p-4 sm:p-6 space-y-6">
      <div className="pb-4 border-b border-zinc-200 dark:border-white/10">
        <div className="inline-block text-[10px] font-extrabold uppercase tracking-widest renax-grad-text mb-1">
          RENAX MEMBERSHIP
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">Sizga mos tarifni tanlang</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          To'lov Telegram bot orqali. Tasdiqlangach obuna avtomatik faollashadi.
        </p>
      </div>

      {/* Joriy holat */}
      {subscription && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl renax-guest-card">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Joriy tarif</span>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold">{plan?.name || 'Bepul sinov'}</h3>
                {subscription.planId !== 'free' && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Clock className="w-3 h-3" />{subscription.daysLeft} kun qoldi
                  </span>
                )}
              </div>
            </div>
            {subscription.planId === 'free' && (
              <span className="text-[11px] text-zinc-500 max-w-xs">
                Bepul sinovdasiz. To'liq imkoniyat uchun tarif tanlang.
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Meter icon={<MessageSquare className="w-3.5 h-3.5" />} label="Oylik xabar"
              used={subscription.used.month} total={plan?.msgMonth || 0} />
            <Meter icon={<Sparkles className="w-3.5 h-3.5" />} label="Bugungi xabar"
              used={subscription.used.day} total={plan?.msgDay || 0} />
            <Meter icon={<ImageIcon className="w-3.5 h-3.5" />} label="Bugungi rasm"
              used={subscription.used.images} total={plan?.imgDay || 0} unlimited={plan?.unlimitedImages} />
          </div>
        </div>
      )}

      <SubscriptionPlans />

      {/* Tarix */}
      {transactions.length > 0 && (
        <div className="pt-2">
          <h3 className="flex items-center gap-2 text-sm font-bold mb-2.5">
            <History className="w-4 h-4 text-zinc-400" />Tranzaksiyalar tarixi
          </h3>
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden divide-y divide-zinc-200 dark:divide-white/10">
            {transactions.slice(0, 12).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-white dark:bg-[#171719]">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{t.reason}</p>
                  <p className="text-[10px] text-zinc-500">{new Date(t.timestamp).toLocaleString('uz-UZ')}</p>
                </div>
                <span className={`text-xs font-bold font-mono shrink-0 ml-3 ${t.type === 'addition' ? 'text-emerald-500' : 'text-zinc-400'}`}>
                  {t.type === 'addition' ? '+' : ''}{t.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
