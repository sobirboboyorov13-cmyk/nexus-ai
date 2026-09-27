import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, ArrowLeft, ArrowRight, Loader2, Eye, EyeOff, Send, Check, RotateCcw,
} from 'lucide-react';
import { useNexusStore } from '../lib/store';

type View = 'login' | 'register';
type Step = 'form' | 'code';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen, setAuthModalOpen, authView, setAuthView,
    loginWithIdentifier, finishTelegramRegister,
  } = useNexusStore();

  const [step, setStep] = useState<Step>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Kirish
  const [identifier, setIdentifier] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Ro'yxatdan o'tish
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [uState, setUState] = useState<'idle' | 'checking' | 'free' | 'taken' | 'invalid'>('idle');
  const [regId, setRegId] = useState('');
  const [botUrl, setBotUrl] = useState('');
  const [connected, setConnected] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [lockedFor, setLockedFor] = useState(0);
  const boxes = useRef<Array<HTMLInputElement | null>>([]);

  // Telegramda Start bosilganini kuzatamiz
  useEffect(() => {
    if (step !== 'code' || !regId || connected) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/auth/register/status?regId=${regId}`);
        if (!r.ok) return;
        const d = await r.json();
        if (d.connected) {
          setConnected(true);
          setTimeout(() => boxes.current[0]?.focus(), 100);
        }
      } catch { /* jim */ }
    }, 2000);
    return () => clearInterval(t);
  }, [step, regId, connected]);

  // Username band emasligini yozayotganda tekshiramiz
  useEffect(() => {
    if (authView !== 'register' || step !== 'form') return;
    const u = username.trim();
    if (!u) { setUState('idle'); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(u)) { setUState('invalid'); return; }
    setUState('checking');
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/auth/check-availability?username=${encodeURIComponent(u)}`);
        const d = await r.json();
        setUState(d.usernameTaken ? 'taken' : 'free');
      } catch { setUState('idle'); }
    }, 400);
    return () => clearTimeout(t);
  }, [username, authView, step]);

  useEffect(() => {
    if (lockedFor <= 0) return;
    const t = setTimeout(() => setLockedFor((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [lockedFor]);

  const reset = useCallback(() => {
    setStep('form'); setError(''); setBusy(false);
    setName(''); setUsername(''); setPassword('');
    setIdentifier(''); setLoginPass('');
    setRegId(''); setBotUrl(''); setConnected(false);
    setCode(['', '', '', '', '', '']); setLockedFor(0);
  }, []);

  if (!isAuthModalOpen) return null;
  const close = () => { setAuthModalOpen(false); setError(''); };

  const switchView = (v: View) => { setAuthView(v); setError(''); setStep('form'); };

  // ---- Amallar ----
  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !loginPass) return setError('Username va parolni kiriting.');
    setBusy(true); setError('');
    const r = await loginWithIdentifier(identifier.trim(), loginPass);
    setBusy(false);
    if (!r.success) return setError(r.error || 'Kirishda xatolik');
    reset();
  };

  const startRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Ismingizni to‘liq kiriting.');
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return setError('Username 3-20 ta belgi: a-z, 0-9, _');
    if (uState === 'taken') return setError('Bu username band. Boshqasini tanlang.');
    if (uState === 'checking') return setError('Username tekshirilmoqda, bir soniya kuting.');
    if (password.length < 6) return setError('Parol kamida 6 ta belgidan iborat bo‘lsin.');

    setBusy(true); setError('');
    try {
      const res = await fetch('/api/auth/register/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), username, password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Xatolik');
      setRegId(d.regId);
      setBotUrl(d.url);
      setStep('code');
      window.open(d.url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setError(err.message);
    } finally { setBusy(false); }
  };

  const verify = async (override?: string) => {
    const c = (override ?? code.join('')).replace(/\D/g, '');
    if (c.length !== 6) return setError('6 xonali kodni to‘liq kiriting.');
    setBusy(true); setError('');
    const r = await finishTelegramRegister({ regId, code: c });
    setBusy(false);
    if (!r.success) {
      setError(r.error || 'Kod noto‘g‘ri');
      if (r.lockedFor) setLockedFor(r.lockedFor);
      setCode(['', '', '', '', '', '']);
      boxes.current[0]?.focus();
      return;
    }
    reset();
  };

  const onCode = (i: number, v: string) => {
    const d = v.replace(/\D/g, '');
    if (!d) { const n = [...code]; n[i] = ''; setCode(n); return; }
    if (d.length > 1) {
      const n = [...code];
      d.split('').slice(0, 6 - i).forEach((x, k) => { n[i + k] = x; });
      setCode(n);
      if (n.join('').length === 6 && !n.includes('')) verify(n.join(''));
      else boxes.current[Math.min(i + d.length, 5)]?.focus();
      return;
    }
    const n = [...code]; n[i] = d; setCode(n);
    if (i < 5) boxes.current[i + 1]?.focus();
    else if (!n.includes('')) verify(n.join(''));
  };

  // ---- Stillar ----
  const field =
    'w-full px-4 py-3 rounded-[10px] text-[15px] outline-none transition-colors ' +
    'bg-white dark:bg-white/[0.04] border border-zinc-300 dark:border-white/[0.12] ' +
    'text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 ' +
    'focus:border-[#2563eb] dark:focus:border-[#60a5fa]';
  const primary =
    'w-full py-3 rounded-[10px] text-[15px] font-semibold text-white transition-colors ' +
    'bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] ' +
    'disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer';
  const label = 'block text-[13px] font-medium text-zinc-600 dark:text-zinc-300 mb-1.5';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/65 backdrop-blur-sm renax-fade-in">
      <div className="w-full max-w-[400px] renax-pop-in">
        <div className="rounded-[14px] bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden">
          <div className="p-7">

            {/* Sarlavha */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white grid place-items-center font-bold text-sm">R</div>
                <span className="text-[17px] font-semibold text-zinc-900 dark:text-white">RENAX AI</span>
              </div>
              <button onClick={close} className="p-1 -m-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer">
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>

            {/* ============ KIRISH ============ */}
            {authView === 'login' && (
              <form onSubmit={doLogin}>
                <h2 className="text-[22px] font-semibold text-zinc-900 dark:text-white mb-6">Kirish</h2>

                <div className="mb-3.5">
                  <label className={label}>Username</label>
                  <input value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="username" className={field} autoComplete="username" autoFocus />
                </div>

                <div className="mb-2">
                  <label className={label}>Parol</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)} placeholder="••••••••"
                      className={field} autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer">
                      {showPass ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-[13px] text-red-600 dark:text-red-400 mb-3">{error}</p>}

                <button type="submit" disabled={busy} className={`${primary} mt-4`}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Kirish <ArrowRight className="w-4 h-4" /></>}
                </button>

                <p className="mt-5 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
                  Hisobingiz yo‘qmi?{' '}
                  <button type="button" onClick={() => switchView('register')}
                    className="text-[#2563eb] dark:text-[#60a5fa] font-medium hover:underline cursor-pointer">
                    Ro‘yxatdan o‘ting
                  </button>
                </p>
              </form>
            )}

            {/* ============ RO'YXATDAN O'TISH: forma ============ */}
            {authView === 'register' && step === 'form' && (
              <form onSubmit={startRegister}>
                <h2 className="text-[22px] font-semibold text-zinc-900 dark:text-white mb-1.5">Hisob yarating</h2>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-6">
                  Tasdiqlash Telegram orqali — bir necha soniya.
                </p>

                <div className="mb-3.5">
                  <label className={label}>Ism</label>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Ismingiz" className={field} autoFocus />
                </div>

                <div className="mb-3.5">
                  <label className={label}>Username</label>
                  <div className="relative">
                    <input value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                      placeholder="username" className={field} />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {uState === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
                      {uState === 'free' && <Check className="w-4 h-4 text-emerald-600" />}
                      {(uState === 'taken' || uState === 'invalid') && <X className="w-4 h-4 text-red-500" />}
                    </span>
                  </div>
                  <p className={`mt-1.5 text-[12px] ${
                    uState === 'taken' || uState === 'invalid'
                      ? 'text-red-600 dark:text-red-400'
                      : uState === 'free'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {uState === 'taken' ? 'Bu username band — boshqasini tanlang.'
                      : uState === 'invalid' ? '3-20 ta belgi: a-z, 0-9, _'
                      : uState === 'free' ? 'Bu username bo‘sh, olishingiz mumkin.'
                      : '3-20 ta belgi: harf, raqam, _'}
                  </p>
                </div>

                <div className="mb-2">
                  <label className={label}>Parol</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="Kamida 6 ta belgi" className={field} />
                    <button type="button" onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer">
                      {showPass ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-[13px] text-red-600 dark:text-red-400 mb-3">{error}</p>}

                <button type="submit" disabled={busy} className={`${primary} mt-4`}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Telegram orqali tasdiqlash</>}
                </button>

                <p className="mt-5 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
                  Hisobingiz bormi?{' '}
                  <button type="button" onClick={() => switchView('login')}
                    className="text-[#2563eb] dark:text-[#60a5fa] font-medium hover:underline cursor-pointer">
                    Kiring
                  </button>
                </p>
              </form>
            )}

            {/* ============ RO'YXATDAN O'TISH: kod ============ */}
            {authView === 'register' && step === 'code' && (
              <div>
                <button onClick={() => { setStep('form'); setError(''); }}
                  className="flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 cursor-pointer">
                  <ArrowLeft className="w-4 h-4" /> Orqaga
                </button>

                <h2 className="text-[22px] font-semibold text-zinc-900 dark:text-white mb-1.5">Kodni kiriting</h2>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-6">
                  {connected
                    ? 'Telegram botimiz sizga 6 xonali kod yubordi.'
                    : 'Telegram oynasida Start tugmasini bosing — kod shu yerda paydo bo‘ladi.'}
                </p>

                {!connected && (
                  <div className="flex items-center gap-2.5 p-3 mb-5 rounded-[10px] bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10">
                    <Loader2 className="w-4 h-4 animate-spin text-[#2563eb] shrink-0" />
                    <span className="text-[13px] text-zinc-600 dark:text-zinc-300">Telegram kutilmoqda…</span>
                    <a href={botUrl} target="_blank" rel="noopener noreferrer"
                      className="ml-auto text-[13px] font-medium text-[#2563eb] dark:text-[#60a5fa] hover:underline shrink-0">
                      Ochish
                    </a>
                  </div>
                )}

                <div className="flex justify-between gap-2 mb-4">
                  {code.map((d, i) => (
                    <input key={i} ref={(el) => { boxes.current[i] = el; }} value={d}
                      inputMode="numeric" maxLength={6} disabled={!connected || lockedFor > 0}
                      onChange={(e) => onCode(i, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Backspace' && !code[i] && i > 0) boxes.current[i - 1]?.focus(); }}
                      className="w-[52px] h-[58px] text-center text-[22px] font-semibold rounded-[10px] outline-none transition-colors
                        bg-white dark:bg-white/[0.04] border border-zinc-300 dark:border-white/[0.12]
                        text-zinc-900 dark:text-white focus:border-[#2563eb] dark:focus:border-[#60a5fa]
                        disabled:opacity-40 disabled:cursor-not-allowed" />
                  ))}
                </div>

                {error && <p className="text-[13px] text-red-600 dark:text-red-400 mb-3">{error}</p>}

                {lockedFor > 0 && (
                  <p className="text-[13px] text-amber-600 dark:text-amber-400 mb-3">
                    Bloklandi. {Math.floor(lockedFor / 60)} daqiqa {lockedFor % 60} soniya qoldi.
                  </p>
                )}

                <button onClick={() => verify()} disabled={busy || !connected || lockedFor > 0} className={primary}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Tasdiqlash <Check className="w-4 h-4" /></>}
                </button>

                <button onClick={() => { setStep('form'); setConnected(false); setCode(['', '', '', '', '', '']); setError(''); }}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5" /> Qaytadan boshlash
                </button>
              </div>
            )}

            <p className="mt-6 text-center text-[11.5px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
              Davom etish orqali xizmat shartlariga rozilik bildirasiz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
