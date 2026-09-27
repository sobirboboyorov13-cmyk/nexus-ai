import React, { useState, useEffect, useCallback } from 'react';
import {
  X, ShieldAlert, RefreshCw, Users, Activity, KeyRound, Ticket, Gift,
  Loader2, Check, Trash2, Plus, Eye, EyeOff, CreditCard, Copy,
} from 'lucide-react';
import { useNexusStore } from '../lib/store';

type Tab = 'live' | 'grant' | 'promo' | 'keys';

const som = (n: number) => (n || 0).toLocaleString('ru-RU').replace(/\u00A0/g, ' ');

interface Live {
  online: number;
  onlineUsers: { name: string; plan: string; page: string }[];
  totalUsers: number;
  todayUsers: number;
  activeSubs: number;
  pendingOrders: number;
  revenue30: number;
  orders30: number;
}
interface KeyRow { key: string; label: string; secret: boolean; hint?: string; value: string; filled: boolean; overridden: boolean }
interface Promo {
  code: string; plan: string; months: number; maxUses: number; used: number;
  active: boolean; note?: string; createdAt: number; expiresAt?: number;
}

const PLANS = [
  { id: 'bronze', name: 'Bronza' },
  { id: 'silver', name: 'Silver' },
  { id: 'vip', name: 'VIP' },
];

export const AdminPanelModal: React.FC = () => {
  const { isAdminModalOpen, setAdminModalOpen, currentUser } = useNexusStore();
  const [tab, setTab] = useState<Tab>('live');
  const [msg, setMsg] = useState<{ text: string; err?: boolean } | null>(null);
  const [busy, setBusy] = useState('');

  const [live, setLive] = useState<Live | null>(null);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [keyEdits, setKeyEdits] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [promos, setPromos] = useState<Promo[]>([]);

  // Tarif berish
  const [gUser, setGUser] = useState('');
  const [gPlan, setGPlan] = useState('bronze');
  const [gMonths, setGMonths] = useState('1');

  // Promokod yaratish
  const [pCode, setPCode] = useState('');
  const [pPlan, setPPlan] = useState('bronze');
  const [pMonths, setPMonths] = useState('1');
  const [pUses, setPUses] = useState('10');
  const [pDays, setPDays] = useState('');
  const [pNote, setPNote] = useState('');

  const H = { 'Content-Type': 'application/json', 'x-user-id': currentUser?.id || '' };
  const flash = (text: string, err = false) => { setMsg({ text, err }); setTimeout(() => setMsg(null), 4000); };

  const loadLive = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/live', { headers: H });
      if (r.ok) setLive(await r.json());
    } catch { /* jim */ }
  }, [currentUser?.id]);

  const loadKeys = async () => {
    const r = await fetch('/api/admin/keys', { headers: H });
    if (r.ok) setKeys((await r.json()).keys);
  };
  const loadPromos = async () => {
    const r = await fetch('/api/admin/promos', { headers: H });
    if (r.ok) setPromos((await r.json()).promos);
  };

  useEffect(() => {
    if (!isAdminModalOpen) return;
    loadLive(); loadKeys(); loadPromos();
    const t = setInterval(loadLive, 5000);   // real vaqt
    return () => clearInterval(t);
  }, [isAdminModalOpen, loadLive]);

  if (!isAdminModalOpen) return null;
  if (currentUser?.role !== 'Admin') {
    return (
      <div className="fixed inset-0 z-[110] grid place-items-center bg-black/60 backdrop-blur-sm p-4">
        <div className="max-w-sm w-full rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/10 p-6 text-center">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-red-500" />
          <p className="text-sm font-semibold mb-4">Bu bo‘lim faqat administrator uchun.</p>
          <button onClick={() => setAdminModalOpen(false)} className="px-5 py-2 rounded-lg bg-zinc-200 dark:bg-white/10 text-sm cursor-pointer">Yopish</button>
        </div>
      </div>
    );
  }

  const saveKey = async (k: string) => {
    setBusy(k);
    try {
      const r = await fetch('/api/admin/keys', { method: 'POST', headers: H, body: JSON.stringify({ key: k, value: keyEdits[k] ?? '' }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      flash(`${k} saqlandi — darhol kuchga kirdi`);
      setKeyEdits((p) => { const n = { ...p }; delete n[k]; return n; });
      loadKeys();
    } catch (e: any) { flash(e.message, true); } finally { setBusy(''); }
  };

  const grant = async () => {
    if (!gUser.trim()) return flash('Username kiriting', true);
    setBusy('grant');
    try {
      const r = await fetch('/api/admin/grant', {
        method: 'POST', headers: H,
        body: JSON.stringify({ username: gUser.trim().replace(/^@/, ''), plan: gPlan, months: Number(gMonths) || 1 }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      flash(`${d.user.name} (@${d.user.username}) uchun ${PLANS.find(p => p.id === gPlan)?.name} yoqildi`);
      setGUser('');
      loadLive();
    } catch (e: any) { flash(e.message, true); } finally { setBusy(''); }
  };

  const createPromo = async () => {
    setBusy('promo');
    try {
      const r = await fetch('/api/admin/promos', {
        method: 'POST', headers: H,
        body: JSON.stringify({
          code: pCode.trim() || undefined, plan: pPlan,
          months: Number(pMonths) || 1, maxUses: Number(pUses) || 1,
          days: pDays ? Number(pDays) : undefined, note: pNote.trim() || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      flash(`Promokod yaratildi: ${d.promo.code}`);
      setPCode(''); setPNote('');
      loadPromos();
    } catch (e: any) { flash(e.message, true); } finally { setBusy(''); }
  };

  const togglePromo = async (code: string, active: boolean) => {
    await fetch('/api/admin/promos/toggle', { method: 'POST', headers: H, body: JSON.stringify({ code, active }) });
    loadPromos();
  };
  const delPromo = async (code: string) => {
    await fetch('/api/admin/promos/delete', { method: 'POST', headers: H, body: JSON.stringify({ code }) });
    loadPromos();
  };

  const inp = 'w-full px-3 py-2.5 rounded-[10px] text-sm outline-none bg-white dark:bg-white/[0.04] border border-zinc-300 dark:border-white/[0.12] text-zinc-900 dark:text-white focus:border-[#2563eb]';
  const lbl = 'block text-[12px] font-medium text-zinc-600 dark:text-zinc-300 mb-1.5';
  const btn = 'px-4 py-2.5 rounded-[10px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer';

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'live', label: 'Monitoring', icon: Activity },
    { id: 'grant', label: 'Tarif berish', icon: Gift },
    { id: 'promo', label: 'Promokodlar', icon: Ticket },
    { id: 'keys', label: 'API kalitlar', icon: KeyRound },
  ];

  const Stat = ({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) => (
    <div className="p-3.5 rounded-xl bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10">
      <p className="text-[11px] text-zinc-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>{value}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[92dvh] flex flex-col rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white grid place-items-center"><ShieldAlert className="w-4 h-4" /></div>
            <div>
              <h2 className="text-[15px] font-semibold">Admin panel</h2>
              <p className="text-[11px] text-zinc-500">{currentUser.name}</p>
            </div>
          </div>
          <button onClick={() => setAdminModalOpen(false)} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"><X className="w-[18px] h-[18px]" /></button>
        </div>

        <div className="flex gap-1 px-4 pt-3 border-b border-zinc-200 dark:border-white/10 overflow-x-auto">
          {tabs.map((t) => {
            const I = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                  tab === t.id ? 'border-[#2563eb] text-[#2563eb] dark:text-[#60a5fa]' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}>
                <I className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </div>

        {msg && (
          <div className={`mx-4 mt-3 px-3.5 py-2.5 rounded-lg text-[13px] ${msg.err ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'}`}>
            {msg.text}
          </div>
        )}

        <div className="flex-1 overflow-y-auto ios-scroll p-4 space-y-4">

          {/* ---------- MONITORING ---------- */}
          {tab === 'live' && (
            <>
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
                </span>
                Real vaqtda — har 5 soniyada yangilanadi
                <button onClick={loadLive} className="ml-auto p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"><RefreshCw className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Hozir saytda" value={live?.online ?? '—'} accent />
                <Stat label="Jami foydalanuvchi" value={live?.totalUsers ?? '—'} />
                <Stat label="Bugun qo‘shilgan" value={live?.todayUsers ?? '—'} />
                <Stat label="Faol obuna" value={live?.activeSubs ?? '—'} />
                <Stat label="Kutilayotgan to‘lov" value={live?.pendingOrders ?? '—'} />
                <Stat label="30 kun to‘lov" value={live?.orders30 ?? '—'} />
                <div className="col-span-2">
                  <Stat label="30 kunlik tushum" value={`${som(live?.revenue30 || 0)} so'm`} accent />
                </div>
              </div>

              <div>
                <h3 className="text-[13px] font-semibold mb-2">Hozir saytda turganlar</h3>
                {!live?.onlineUsers?.length ? (
                  <p className="text-[13px] text-zinc-500 py-6 text-center">Hozircha hech kim yo‘q.</p>
                ) : (
                  <div className="rounded-xl border border-zinc-200 dark:border-white/10 divide-y divide-zinc-200 dark:divide-white/10 overflow-hidden">
                    {live.onlineUsers.map((u, i) => (
                      <div key={i} className="flex items-center justify-between px-3.5 py-2.5 text-[13px]">
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{u.name}
                        </span>
                        <span className="text-zinc-500 text-[12px]">{u.plan}{u.page ? ` · ${u.page}` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ---------- TARIF BERISH ---------- */}
          {tab === 'grant' && (
            <div className="max-w-md space-y-3">
              <p className="text-[13px] text-zinc-500">
                Username kiriting va tarifni tanlang — obuna darhol faollashadi, foydalanuvchiga botdan xabar boradi.
              </p>
              <div>
                <label className={lbl}>Username</label>
                <input value={gUser} onChange={(e) => setGUser(e.target.value)} placeholder="masalan: azizbek" className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Tarif</label>
                  <select value={gPlan} onChange={(e) => setGPlan(e.target.value)} className={inp}>
                    {PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Necha oy</label>
                  <input type="number" min={1} max={36} value={gMonths} onChange={(e) => setGMonths(e.target.value)} className={inp} />
                </div>
              </div>
              <button onClick={grant} disabled={busy === 'grant'} className={`${btn} w-full`}>
                {busy === 'grant' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Gift className="w-4 h-4" /> Faollashtirish</>}
              </button>
            </div>
          )}

          {/* ---------- PROMOKODLAR ---------- */}
          {tab === 'promo' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 space-y-3">
                <h3 className="text-[13px] font-semibold">Yangi promokod</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className={lbl}>Kod (bo‘sh qoldirsangiz o‘zi yaratadi)</label>
                    <input value={pCode} onChange={(e) => setPCode(e.target.value.toUpperCase())} placeholder="YANGIYIL" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Tarif</label>
                    <select value={pPlan} onChange={(e) => setPPlan(e.target.value)} className={inp}>
                      {PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Necha oy</label>
                    <input type="number" min={1} value={pMonths} onChange={(e) => setPMonths(e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Necha kishi ishlatadi</label>
                    <input type="number" min={1} value={pUses} onChange={(e) => setPUses(e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Necha kun amal qiladi</label>
                    <input type="number" min={1} value={pDays} onChange={(e) => setPDays(e.target.value)} placeholder="cheksiz" className={inp} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className={lbl}>Izoh</label>
                    <input value={pNote} onChange={(e) => setPNote(e.target.value)} placeholder="Instagram aksiyasi" className={inp} />
                  </div>
                </div>
                <button onClick={createPromo} disabled={busy === 'promo'} className={btn}>
                  {busy === 'promo' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Yaratish</>}
                </button>
              </div>

              <div>
                <h3 className="text-[13px] font-semibold mb-2">Mavjud promokodlar ({promos.length})</h3>
                {!promos.length ? (
                  <p className="text-[13px] text-zinc-500 py-6 text-center">Hozircha promokod yo‘q.</p>
                ) : (
                  <div className="rounded-xl border border-zinc-200 dark:border-white/10 divide-y divide-zinc-200 dark:divide-white/10 overflow-hidden">
                    {promos.map((p) => (
                      <div key={p.code} className="flex items-center gap-3 px-3.5 py-3 flex-wrap">
                        <code className="font-mono text-[13px] font-bold text-[#2563eb] dark:text-[#60a5fa]">{p.code}</code>
                        <button onClick={() => navigator.clipboard?.writeText(p.code)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer" title="Nusxalash">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[12px] text-zinc-500">
                          {PLANS.find((x) => x.id === p.plan)?.name} · {p.months} oy · {p.used}/{p.maxUses} ishlatilgan
                          {p.expiresAt ? ` · ${new Date(p.expiresAt).toLocaleDateString('uz-UZ')} gacha` : ''}
                          {p.note ? ` · ${p.note}` : ''}
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                          <button onClick={() => togglePromo(p.code, !p.active)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${p.active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/15 text-zinc-500'}`}>
                            {p.active ? 'Faol' : 'O‘chiq'}
                          </button>
                          <button onClick={() => delPromo(p.code)} className="p-1.5 text-zinc-400 hover:text-red-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------- API KALITLAR ---------- */}
          {tab === 'keys' && (
            <div className="space-y-3">
              <p className="text-[13px] text-zinc-500">
                Bu yerda o‘zgartirilgan kalit <b>darhol</b> kuchga kiradi — serverni qayta ishga tushirish shart emas.
                Bo‘sh qoldirib saqlasangiz, <code>.env</code> dagi qiymatga qaytadi.
              </p>
              <div className="rounded-xl border border-zinc-200 dark:border-white/10 divide-y divide-zinc-200 dark:divide-white/10 overflow-hidden">
                {keys.map((k) => {
                  const editing = keyEdits[k.key] !== undefined;
                  return (
                    <div key={k.key} className="px-3.5 py-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium truncate">{k.label}</p>
                          <code className="text-[11px] text-zinc-500">{k.key}</code>
                          {k.hint && <p className="text-[11px] text-zinc-500 mt-0.5">{k.hint}</p>}
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${k.filled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/15 text-zinc-500'}`}>
                          {k.overridden ? 'panel' : k.filled ? '.env' : 'bo‘sh'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={k.secret && !showKey[k.key] ? 'password' : 'text'}
                            value={editing ? keyEdits[k.key] : ''}
                            onChange={(e) => setKeyEdits((p) => ({ ...p, [k.key]: e.target.value }))}
                            placeholder={k.value || 'kiritilmagan'}
                            className={`${inp} pr-9 font-mono text-[12px]`}
                          />
                          {k.secret && (
                            <button onClick={() => setShowKey((p) => ({ ...p, [k.key]: !p[k.key] }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 cursor-pointer">
                              {showKey[k.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                        <button onClick={() => saveKey(k.key)} disabled={!editing || busy === k.key}
                          className="px-3 rounded-[10px] bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-30 text-white cursor-pointer">
                          {busy === k.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
