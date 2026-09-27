import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Sparkles, Shield, Send, ArrowRight, ArrowLeft, User, AtSign, Phone,
  Lock, Check, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink,
} from 'lucide-react';
import { useNexusStore } from '../lib/store';

type Step = 'identity' | 'phone' | 'otp' | 'password';
const STEPS: Step[] = ['identity', 'phone', 'otp', 'password'];
const STEP_LABELS: Record<Step, string> = {
  identity: 'Ism va username',
  phone: 'Telefon raqam',
  otp: 'SMS tasdiqlash',
  password: 'Parol yaratish',
};

const formatPhone = (digits: string) => {
  const d = digits.slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.join(' ');
};

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    authView,
    setAuthView,
    currentUser,
    registerWithPhone,
    loginWithIdentifier,
    setDirectUser,
  } = useNexusStore();

  // ---- Umumiy holat
  const [step, setStep] = useState<Step>('identity');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // ---- Ro'yxatdan o'tish maydonlari
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameState, setUsernameState] = useState<'idle' | 'checking' | 'free' | 'taken' | 'invalid'>('idle');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifyToken, setVerifyToken] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [devCode, setDevCode] = useState('');
  const [freeCreditsAvailable, setFreeCreditsAvailable] = useState(true);

  // ---- Kirish maydonlari
  const [identifier, setIdentifier] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // ---- Telegram (qo'shimcha usul)
  const [tgSession, setTgSession] = useState<{ sessionId: string; botUrl: string; botUsername: string } | null>(null);
  const [tgCode, setTgCode] = useState('');

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const isLoggedIn = Boolean(currentUser?.isLoggedIn && currentUser?.id && currentUser.id !== 'user-guest');

  // Resend taymer
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Username bandligini tekshirish (debounce)
  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (!clean) { setUsernameState('idle'); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(clean)) { setUsernameState('invalid'); return; }
    setUsernameState('checking');
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-availability?username=${encodeURIComponent(clean)}`);
        const data = await res.json();
        setUsernameState(data.usernameTaken ? 'taken' : 'free');
      } catch {
        setUsernameState('idle');
      }
    }, 450);
    return () => clearTimeout(t);
  }, [username]);

  // Telegram sessiyasini kuzatish
  useEffect(() => {
    if (!tgSession) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/telegram/check-session?sessionId=${encodeURIComponent(tgSession.sessionId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'authenticated' && data.user) {
          clearInterval(interval);
          setTgSession(null);
          setDirectUser({
            id: data.user.id, name: data.user.name, email: data.user.email,
            role: data.user.role, credits: data.user.credits, createdAt: data.user.createdAt,
            avatar: data.user.avatarUrl, isLoggedIn: true,
          });
        }
      } catch { /* qayta urinish */ }
    }, 1500);
    return () => clearInterval(interval);
  }, [tgSession, setDirectUser]);

  const resetAll = useCallback(() => {
    setStep('identity'); setError(''); setNotice(''); setBusy(false);
    setName(''); setUsername(''); setUsernameState('idle'); setPhoneDigits('');
    setOtp(['', '', '', '', '', '']); setVerifyToken(''); setPassword(''); setPassword2('');
    setIdentifier(''); setLoginPass(''); setDevCode(''); setTgSession(null); setTgCode('');
  }, []);

  if (!isAuthModalOpen) return null;

  const close = () => { setAuthModalOpen(false); setError(''); setNotice(''); };
  const fullPhone = `+998${phoneDigits}`;

  // ================= Amallar =================
  const goStep = (next: Step) => { setError(''); setNotice(''); setStep(next); };

  const submitIdentity = () => {
    if (name.trim().length < 2) return setError('Ismingizni to‘liq kiriting.');
    if (usernameState === 'invalid') return setError('Username 3-20 ta lotin harf, raqam yoki _ dan iborat bo‘lsin.');
    if (usernameState === 'taken') return setError('Bu username band. Boshqasini tanlang.');
    if (usernameState !== 'free') return setError('Username tekshirilmoqda, biroz kuting.');
    goStep('phone');
  };

  const sendOtp = async (resend = false) => {
    if (phoneDigits.length !== 9) return setError('Telefon raqamni to‘liq kiriting: +998 XX XXX XX XX');
    setBusy(true); setError(''); setNotice(''); setDevCode('');
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kod yuborishda xatolik');
      setResendIn(data.resendAfter || 60);
      if (data.devCode) setDevCode(String(data.devCode));
      setNotice(resend ? 'Yangi kod yuborildi.' : `${fullPhone} raqamiga 6 xonali kod yuborildi.`);
      setOtp(['', '', '', '', '', '']);
      goStep('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } catch (e: any) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  const verifyOtp = async (codeOverride?: string) => {
    const code = (codeOverride ?? otp.join('')).replace(/\D/g, '');
    if (code.length !== 6) return setError('6 xonali kodni to‘liq kiriting.');
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kod noto‘g‘ri');
      setVerifyToken(data.verifyToken);
      setFreeCreditsAvailable(Boolean(data.freeCreditsAvailable));
      goStep('password');
    } catch (e: any) {
      setError(e.message);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setBusy(false); }
  };

  const finishRegister = async () => {
    if (password.length < 6) return setError('Parol kamida 6 ta belgidan iborat bo‘lsin.');
    if (password !== password2) return setError('Parollar mos kelmadi.');
    setBusy(true); setError('');
    const res = await registerWithPhone({ name: name.trim(), username: username.trim().toLowerCase(), phone: fullPhone, password, verifyToken });
    setBusy(false);
    if (!res.success) return setError(res.error || 'Ro‘yxatdan o‘tishda xatolik');
    resetAll();
  };

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !loginPass) return setError('Username/telefon va parolni kiriting.');
    setBusy(true); setError('');
    const res = await loginWithIdentifier(identifier.trim(), loginPass);
    setBusy(false);
    if (!res.success) return setError(res.error || 'Kirishda xatolik');
    resetAll();
  };

  const startTelegram = async () => {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/auth/telegram/init-session', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Telegram sessiyasi ochilmadi');
      setTgSession(data);
      window.open(data.botUrl, '_blank', 'noopener,noreferrer');
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const verifyTgCode = async () => {
    const code = tgCode.replace(/\D/g, '');
    if (code.length !== 6) return setError('Bot yuborgan 6 xonali kodni kiriting.');
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/auth/telegram/verify-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kod noto‘g‘ri');
      setDirectUser({
        id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role,
        credits: data.user.credits, createdAt: data.user.createdAt, avatar: data.user.avatarUrl, isLoggedIn: true,
      });
      resetAll();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const handleOtpChange = (i: number, val: string) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) { const next = [...otp]; next[i] = ''; setOtp(next); return; }
    if (digits.length > 1) {
      const next = [...otp];
      digits.split('').slice(0, 6 - i).forEach((d, k) => { next[i + k] = d; });
      setOtp(next);
      const filled = next.join('');
      if (filled.length === 6 && !next.includes('')) verifyOtp(filled);
      else otpRefs.current[Math.min(i + digits.length, 5)]?.focus();
      return;
    }
    const next = [...otp]; next[i] = digits; setOtp(next);
    if (i < 5) otpRefs.current[i + 1]?.focus();
    else if (!next.includes('')) verifyOtp(next.join(''));
  };

  // ================= Stillar =================
  const inputCls =
    'w-full pl-11 pr-11 py-3.5 text-sm rounded-2xl outline-none transition-all bg-white/70 dark:bg-white/[0.04] ' +
    'border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 ' +
    'focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15 dark:focus:border-violet-400/60';
  const iconCls = 'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500';
  const primaryBtn =
    'w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 ' +
    'bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:brightness-110 active:scale-[0.99] ' +
    'shadow-lg shadow-violet-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  const ghostBtn =
    'py-3 px-4 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ' +
    'bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/[0.09] text-zinc-700 dark:text-zinc-200 ' +
    'border border-zinc-200 dark:border-white/10';

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-zinc-900/50 dark:bg-black/70 backdrop-blur-xl renax-fade-in">
      <div className="relative w-full max-w-md renax-pop-in">
        {/* Orqa fon nuri */}
        <div className="pointer-events-none absolute -inset-16 -z-10 opacity-70">
          <div className="absolute top-0 left-1/4 w-56 h-56 bg-violet-500/30 rounded-full blur-[90px] renax-float" />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-blue-500/25 rounded-full blur-[90px] renax-float-slow" />
        </div>

        <div className="relative rounded-[28px] overflow-hidden border border-zinc-200/80 dark:border-white/10 bg-white/95 dark:bg-[#131316]/95 backdrop-blur-2xl shadow-2xl max-h-[92dvh] overflow-y-auto ios-scroll">
          {/* Yuqori gradient chizig'i */}
          <div className="h-[3px] w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500" />

          <div className="p-6 sm:p-7 space-y-5">
            {/* Sarlavha */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-violet-600/30">
                  R
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-[#131316]" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                    RENAX <span className="renax-grad-text">AI</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {authView === 'login' ? 'Hisobingizga qayting' : 'Bir daqiqada hisob oching'}
                  </p>
                </div>
              </div>
              {isLoggedIn && (
                <button onClick={close} className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
              {!isLoggedIn && (
                <button onClick={close} title="Keyinroq" className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Rejim almashtirgich */}
            <div className="relative grid grid-cols-2 p-1 rounded-2xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 text-xs font-semibold">
              <span
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white dark:bg-white/10 shadow-sm transition-transform duration-300"
                style={{ transform: authView === 'login' ? 'translateX(2px)' : 'translateX(calc(100% + 6px))' }}
              />
              <button onClick={() => { setAuthView('login'); setError(''); }} className={`relative z-10 py-2.5 rounded-xl transition-colors cursor-pointer ${authView === 'login' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                Kirish
              </button>
              <button onClick={() => { setAuthView('register'); setError(''); }} className={`relative z-10 py-2.5 rounded-xl transition-colors cursor-pointer ${authView === 'register' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                Ro‘yxatdan o‘tish
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" /><span>{error}</span>
              </div>
            )}
            {notice && !error && (
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" /><span>{notice}</span>
              </div>
            )}

            {/* ================= KIRISH ================= */}
            {authView === 'login' && (
              <form onSubmit={doLogin} className="space-y-3">
                <div className="relative">
                  <AtSign className={iconCls} />
                  <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Username yoki telefon raqam" className={inputCls} autoComplete="username" />
                </div>
                <div className="relative">
                  <Lock className={iconCls} />
                  <input type={showPass ? 'text' : 'password'} value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="Parol" className={inputCls} autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button type="submit" disabled={busy} className={primaryBtn}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Kirish <ArrowRight className="w-4 h-4" /></>}
                </button>
                <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                  Hisobingiz yo‘qmi?{' '}
                  <button type="button" onClick={() => { setAuthView('register'); setError(''); }} className="font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer">
                    Ro‘yxatdan o‘ting
                  </button>
                </p>
              </form>
            )}

            {/* ================= RO'YXATDAN O'TISH ================= */}
            {authView === 'register' && (
              <div className="space-y-4">
                {/* Bosqich indikatori */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    {STEPS.map((s, i) => (
                      <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= stepIndex ? 'bg-gradient-to-r from-violet-500 to-blue-500' : 'bg-zinc-200 dark:bg-white/10'}`} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">{STEP_LABELS[step]}</span>
                    <span className="text-zinc-400">{stepIndex + 1} / 4</span>
                  </div>
                </div>

                {/* 1-bosqich: ism + username */}
                {step === 'identity' && (
                  <div className="space-y-3 renax-slide-in">
                    <div className="relative">
                      <User className={iconCls} />
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz" className={inputCls} />
                    </div>
                    <div>
                      <div className="relative">
                        <AtSign className={iconCls} />
                        <input
                          value={username}
                          onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                          placeholder="username"
                          className={inputCls}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2">
                          {usernameState === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
                          {usernameState === 'free' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {(usernameState === 'taken' || usernameState === 'invalid') && <AlertCircle className="w-4 h-4 text-red-500" />}
                        </span>
                      </div>
                      <p className={`mt-1.5 text-[11px] ${usernameState === 'taken' || usernameState === 'invalid' ? 'text-red-500' : 'text-zinc-400'}`}>
                        {usernameState === 'taken' ? 'Bu username band.'
                          : usernameState === 'invalid' ? '3-20 ta belgi: a-z, 0-9, _'
                          : usernameState === 'free' ? 'Bu username bo‘sh — olishingiz mumkin.'
                          : 'Kirish uchun ishlatiladi: 3-20 ta belgi (a-z, 0-9, _).'}
                      </p>
                    </div>
                    <button onClick={submitIdentity} className={primaryBtn}>Davom etish <ArrowRight className="w-4 h-4" /></button>
                  </div>
                )}

                {/* 2-bosqich: telefon */}
                {step === 'phone' && (
                  <div className="space-y-3 renax-slide-in">
                    <div className="flex items-center rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/15 transition-all overflow-hidden">
                      <span className="flex items-center gap-2 pl-4 pr-3 py-3.5 text-sm font-semibold text-zinc-600 dark:text-zinc-300 border-r border-zinc-200 dark:border-white/10">
                        <Phone className="w-4 h-4 text-zinc-400" />+998
                      </span>
                      <input
                        inputMode="numeric"
                        value={formatPhone(phoneDigits)}
                        onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 9))}
                        placeholder="90 123 45 67"
                        className="flex-1 bg-transparent px-4 py-3.5 text-sm tracking-wide outline-none text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600"
                      />
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-violet-50 dark:bg-violet-500/[0.07] border border-violet-200/70 dark:border-violet-500/20">
                      <Shield className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-px" />
                      <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                        <strong className="text-zinc-800 dark:text-white">1 telefon = 1 bepul paket.</strong> Raqam SMS kod bilan tasdiqlanadi.
                        Bitta raqam bilan ikkinchi akkaunt ochilsa, bepul kredit berilmaydi.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => goStep('identity')} className={ghostBtn}><ArrowLeft className="w-4 h-4" /></button>
                      <button onClick={() => sendOtp()} disabled={busy || phoneDigits.length !== 9} className={primaryBtn}>
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Kod yuborish <Send className="w-4 h-4" /></>}
                      </button>
                    </div>
                  </div>
                )}

                {/* 3-bosqich: OTP */}
                {step === 'otp' && (
                  <div className="space-y-4 renax-slide-in">
                    <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                      <span className="font-semibold text-zinc-800 dark:text-white">{fullPhone}</span> raqamiga yuborilgan kodni kiriting
                    </p>

                    <div className="flex justify-center gap-2">
                      {otp.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          value={d}
                          inputMode="numeric"
                          maxLength={6}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                          }}
                          className="w-11 h-14 text-center text-xl font-bold rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15 transition-all"
                        />
                      ))}
                    </div>

                    {devCode && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 text-[11px] text-amber-700 dark:text-amber-300 text-center">
                        SMS provayder ulanmagan (test rejimi). Kod: <strong className="font-mono tracking-widest">{devCode}</strong>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px]">
                      <button onClick={() => goStep('phone')} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer">Raqamni o‘zgartirish</button>
                      <button
                        onClick={() => sendOtp(true)}
                        disabled={resendIn > 0 || busy}
                        className="font-semibold text-violet-600 dark:text-violet-400 disabled:text-zinc-400 disabled:cursor-not-allowed hover:underline cursor-pointer"
                      >
                        {resendIn > 0 ? `Qayta yuborish (${resendIn}s)` : 'Kodni qayta yuborish'}
                      </button>
                    </div>

                    <button onClick={() => verifyOtp()} disabled={busy || otp.join('').length !== 6} className={primaryBtn}>
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Tasdiqlash <Check className="w-4 h-4" /></>}
                    </button>
                  </div>
                )}

                {/* 4-bosqich: parol */}
                {step === 'password' && (
                  <div className="space-y-3 renax-slide-in">
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-200 dark:border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                        <strong className="text-zinc-800 dark:text-white">{fullPhone}</strong> tasdiqlandi.{' '}
                        {freeCreditsAvailable
                          ? 'Ro‘yxatdan o‘tgach bepul kredit paketi beriladi.'
                          : 'Bu raqam bepul paketni olgan — yangi bonus berilmaydi.'}
                      </p>
                    </div>

                    <div className="relative">
                      <Lock className={iconCls} />
                      <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parol (kamida 6 ta belgi)" className={inputCls} />
                      <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className={iconCls} />
                      <input type={showPass ? 'text' : 'password'} value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="Parolni takrorlang" className={inputCls} />
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => goStep('otp')} className={ghostBtn}><ArrowLeft className="w-4 h-4" /></button>
                      <button onClick={finishRegister} disabled={busy} className={primaryBtn}>
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Hisobni yaratish</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= Telegram (qo'shimcha) ================= */}
            <div className="pt-1 space-y-3">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
                <span className="text-[10px] uppercase tracking-widest text-zinc-400">yoki</span>
                <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
              </div>

              {!tgSession ? (
                <button onClick={startTelegram} disabled={busy} className={`${ghostBtn} w-full`}>
                  <Send className="w-4 h-4 text-sky-500" /> Telegram orqali davom etish
                </button>
              ) : (
                <div className="space-y-2 p-3 rounded-2xl bg-sky-50 dark:bg-sky-500/[0.07] border border-sky-200 dark:border-sky-500/20">
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 text-center">
                    Botda <strong>Start</strong> tugmasini bosing yoki bot yuborgan 6 xonali kodni kiriting.
                  </p>
                  <a href={tgSession.botUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" /> Telegramda ochish
                  </a>
                  <div className="flex gap-2">
                    <input
                      value={tgCode}
                      onChange={(e) => setTgCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6 xonali kod"
                      className="flex-1 px-3 py-2.5 text-center tracking-widest font-mono text-sm rounded-xl bg-white/80 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white outline-none focus:border-sky-500"
                    />
                    <button onClick={verifyTgCode} disabled={busy || tgCode.length !== 6} className="px-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-xs font-bold cursor-pointer">
                      Kirish
                    </button>
                  </div>
                  <button onClick={() => setTgSession(null)} className="w-full text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer">Bekor qilish</button>
                </div>
              )}

              <p className="text-center text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                Davom etish orqali siz xizmat shartlari va maxfiylik siyosatiga rozilik bildirasiz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
