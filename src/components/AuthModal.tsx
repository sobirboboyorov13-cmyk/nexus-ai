import React, { useState, useEffect } from 'react';
import { X, LogIn, Sparkles, CheckCircle2, Shield, Send, ArrowRight, KeyRound, ExternalLink } from 'lucide-react';
import { useNexusStore } from '../lib/store';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    currentUser,
    registeredUsers,
    loginUser,
    loginWithTelegram,
    setDirectUser,
    switchUser,
    fetchServerUsers,
  } = useNexusStore();

  const [mode, setMode] = useState<'telegram' | 'password' | 'switch'>('telegram');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Telegram Session Polling State
  const [tgSession, setTgSession] = useState<{
    sessionId: string;
    botUrl: string;
    botUsername: string;
  } | null>(null);
  const [isWaitingTelegram, setIsWaitingTelegram] = useState(false);

  useEffect(() => {
    if (isAuthModalOpen) {
      fetchServerUsers();
    }
  }, [isAuthModalOpen, fetchServerUsers]);

  // Support for Telegram Login Widget callback
  useEffect(() => {
    (window as any).onTelegramAuth = async (user: any) => {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await loginWithTelegram(user);
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Telegram orqali kirishda xatolik yuz berdi');
      }
    };

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [loginWithTelegram]);

  // Poll Telegram Session status while user is in Telegram
  useEffect(() => {
    if (!isWaitingTelegram || !tgSession) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/telegram/check-session?sessionId=${encodeURIComponent(tgSession.sessionId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'authenticated' && data.user) {
          clearInterval(interval);
          setIsWaitingTelegram(false);
          setTgSession(null);

          const profile = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            credits: data.user.credits,
            createdAt: data.user.createdAt,
            avatar: data.user.avatarUrl,
            isLoggedIn: true,
          };
          setDirectUser(profile);
        }
      } catch {
        // Polling retry
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isWaitingTelegram, tgSession, setDirectUser]);

  if (!isAuthModalOpen) return null;

  const canClose = Boolean(currentUser.isLoggedIn && currentUser.id);

  const handleStartTelegramAuth = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/telegram/init-session', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Telegram sessiyasini yaratishda xatolik');
      }

      setTgSession(data);
      setIsWaitingTelegram(true);

      // Open Telegram bot link directly
      window.open(data.botUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setErrorMsg(err.message || 'Telegram bilan ulanishda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Iltimos, emailingizni kiriting');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Iltimos, parolingizni kiriting');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await loginUser(email.trim(), password.trim());
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Kirishda xatolik yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1c1c1c] dark:bg-[#1c1c1c] border border-[#2f2f2f] rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl flex flex-col space-y-4 text-[#ececec] max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
              R
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                RENAX AI — {mode === 'telegram' ? 'Telegram orqali xavfsiz kirish' : mode === 'password' ? 'Mavjud hisobga kirish' : 'Hisobni almashtirish'}
              </h3>
              <p className="text-[11px] text-zinc-400">Har bir foydalanuvchi uchun shaxsiy chatlar va balans</p>
            </div>
          </div>
          {canClose && (
            <button
              onClick={() => {
                setIsWaitingTelegram(false);
                setAuthModalOpen(false);
              }}
              className="p-1 rounded-md text-[#8e8e8e] hover:text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#141414] border border-[#2a2a2a] rounded-xl text-xs">
          <button
            type="button"
            onClick={() => { setMode('telegram'); setErrorMsg(''); setIsWaitingTelegram(false); }}
            className={`py-2 font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'telegram' ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-[#8e8e8e] hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span>Telegram (Tavsiya)</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('password'); setErrorMsg(''); setIsWaitingTelegram(false); }}
            className={`py-2 font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'password' ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-[#8e8e8e] hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Parol bilan</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* MODE: TELEGRAM (PRIMARY & ANTI-ABUSE) */}
        {mode === 'telegram' && (
          <div className="space-y-4 pt-1">
            {!isWaitingTelegram ? (
              <>
                {/* Hero Promo Box */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-sky-950/40 via-[#181818] to-purple-950/30 border border-sky-500/20 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-400/30 text-sky-400 flex items-center justify-center mx-auto shadow-inner">
                    <Send className="w-6 h-6 -ml-0.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Telegram orqali 1-bosishda kirish</h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                      Parol eslab qolish shart emas. Yangi foydalanuvchilarga darhol <strong>+50 bepul kredit</strong> taqdim etiladi.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Xush kelibsiz bonusi: 50 kredit</span>
                  </div>
                </div>

                {/* Anti-Abuse Guarantee Badge */}
                <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5 text-[11px] text-zinc-400">
                  <Shield className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Anti-Abuse himoyasi:</strong> Qalbaki akkauntlar oldini olish uchun har bir haqiqiy Telegram profiliga faqat bir martalik boshlang'ich bonus beriladi.
                  </span>
                </div>

                {/* Big Action Button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleStartTelegramAuth}
                  className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Telegram orqali kirish / Ro‘yxatdan o‘tish</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            ) : (
              /* WAITING FOR TELEGRAM CONFIRMATION SCREEN */
              <div className="p-5 rounded-xl bg-zinc-900/90 border border-sky-500/30 text-center space-y-4">
                <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-sky-500/20 animate-ping" />
                  <div className="w-14 h-14 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400">
                    <Send className="w-6 h-6 -ml-0.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Telegram ochilmoqda...</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    Telegram botida <strong>"Start"</strong> yoki <strong>"Boshlash"</strong> tugmasini bosing. Tizim avtomatik tasdiqlanadi.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {tgSession && (
                    <a
                      href={tgSession.botUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Telegramda ochish</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsWaitingTelegram(false);
                      setTgSession(null);
                    }}
                    className="py-2 text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE: PASSWORD (FOR EXISTING ACCOUNTS & ADMINS) */}
        {mode === 'password' && (
          <div className="space-y-3 pt-1">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
              Ushbu bo‘lim faqat avval ro‘yxatdan o‘tgan hisoblar va administratorlar uchun. Yangi foydalanuvchilar yuqoridagi <strong>Telegram</strong> orqali ro‘yxatdan o‘tadi.
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Email manzilingiz</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="masalan: admin@renax.ai"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#141414] border border-[#2f2f2f] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Parol</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolingiz..."
                  className="w-full px-3.5 py-2.5 text-xs bg-[#141414] border border-[#2f2f2f] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Hisobga kirish</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Mode: Quick User Switch */}
        {mode === 'switch' && (
          <div className="space-y-2 pt-1">
            <span className="text-xs text-[#8e8e8e] block">Serverdagi saqlangan hisoblar:</span>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {registeredUsers.map((u) => {
                const isActive = currentUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      switchUser(u.id);
                      setAuthModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                      isActive
                        ? 'bg-[#2a2a2a] border-[#444444]'
                        : 'bg-[#171717] border-[#2a2a2a] hover:bg-[#202020]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#333333] text-white flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <div className="text-[10px] text-[#8e8e8e] truncate max-w-[200px]">{u.email}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-medium text-white">{u.credits} cr</span>
                      <span className="text-[10px] text-[#737373] block">{u.role}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
