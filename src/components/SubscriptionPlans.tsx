import React, { useEffect, useState } from 'react';
import { Check, Send, Sparkles, Crown, Zap, Loader2, Infinity as InfinityIcon } from 'lucide-react';
import { useNexusStore } from '../lib/store';

export interface PlanCfg {
  id: 'bronze' | 'silver' | 'vip';
  name: string;
  price: number;
  msgMonth: number;
  msgDay: number;
  imgDay: number;
  unlimitedImages: boolean;
  tier: number;
}

const ICONS = { bronze: Zap, silver: Sparkles, vip: Crown } as const;
const som = (n: number) => n.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');

export const SubscriptionPlans: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { currentUser, subscription, requireAuth } = useNexusStore();
  const [plans, setPlans] = useState<PlanCfg[]>([]);
  const [busy, setBusy] = useState<string>('');
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/subscription/plans')
      .then((r) => r.json())
      .then((d) => setPlans(d.plans || []))
      .catch(() => {});
  }, []);

  const buy = async (planId: string) => {
    if (!requireAuth()) return;
    setBusy(planId);
    setErr('');
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xatolik');
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy('');
    }
  };

  if (!plans.length) {
    return (
      <div className="flex items-center justify-center py-10 text-zinc-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {err && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs">
          {err}
        </div>
      )}

      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        {plans.map((p) => {
          const Icon = ICONS[p.id] || Zap;
          const active = subscription?.planId === p.id;
          const popular = p.id === 'silver';
          return (
            <div
              key={p.id}
              className={`relative rounded-2xl p-5 border flex flex-col transition-all ${
                popular
                  ? 'border-violet-500 bg-white dark:bg-[#1a1a1e] ring-2 ring-violet-500/20 shadow-xl'
                  : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-[#171719] hover:border-violet-400/50'
              }`}
            >
              {popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600">
                  Eng mashhur
                </span>
              )}
              {active && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                  Faol
                </span>
              )}

              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white grid place-items-center">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{p.name}</h3>
                  <p className="text-[10px] text-zinc-500">1 oylik obuna</p>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">{som(p.price)}</span>
                <span className="text-xs text-zinc-500 ml-1">so'm / oy</span>
              </div>

              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300 flex-1 mb-4">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span><b className="text-zinc-900 dark:text-white">{som(p.msgMonth)}</b> ta xabar / oy</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Kuniga {som(p.msgDay)} tagacha — bir kunda ko'p ishlasangiz ham yetadi</span>
                </li>
                <li className="flex items-start gap-2">
                  {p.unlimitedImages
                    ? <InfinityIcon className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                    : <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />}
                  <span>
                    Rasm: <b className="text-zinc-900 dark:text-white">
                      {p.unlimitedImages ? 'cheksiz' : `${p.imgDay} ta / kun`}
                    </b>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{p.tier === 0 ? 'Oddiy modellar' : p.tier === 1 ? 'Oddiy + kuchli modellar' : 'Barcha modellar'}</span>
                </li>
              </ul>

              <button
                onClick={() => buy(p.id)}
                disabled={busy === p.id}
                className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  popular || active ? 'renax-cta text-white' : 'btn-secondary-nexus text-zinc-900 dark:text-white'
                }`}
              >
                {busy === p.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    {active ? 'Uzaytirish' : 'Telegram orqali sotib olish'}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-center text-zinc-500 dark:text-zinc-400 leading-relaxed">
        Tugmani bossangiz Telegram boti ochiladi. To'lovni bot orqali qilasiz —
        tasdiqlangach obuna <b>avtomatik</b> shu hisobingizga ulanadi, saytni yangilash shart emas.
      </p>
    </div>
  );
};
