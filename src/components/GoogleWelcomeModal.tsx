import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight, ShieldCheck, Zap, Layers } from 'lucide-react';
import { useNexusStore } from '../lib/store';

export const GoogleWelcomeModal: React.FC = () => {
  const {
    isGoogleWelcomeOpen,
    setGoogleWelcomeOpen,
    currentUser,
    loginWithGoogle,
  } = useNexusStore();

  const [gmailInput, setGmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Automatically suggest opening for guest visitors after a short moment
  useEffect(() => {
    const hasSeenPrompt = sessionStorage.getItem('nexus_google_prompt_seen');
    if (!hasSeenPrompt && currentUser.id === 'user-guest') {
      const timer = setTimeout(() => {
        setGoogleWelcomeOpen(true);
        sessionStorage.setItem('nexus_google_prompt_seen', 'true');
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [currentUser.id, setGoogleWelcomeOpen]);

  if (!isGoogleWelcomeOpen) return null;

  const handleQuickGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    const targetEmail = gmailInput.trim() || (currentUser.email.includes('@') ? currentUser.email : 'sobir.google@gmail.com');
    const targetName = nameInput.trim() || (currentUser.id !== 'user-guest' ? currentUser.name : 'Google Foydalanuvchisi');
    const googleAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(targetEmail)}`;

    const res = await loginWithGoogle(targetEmail, targetName, googleAvatar);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Google bilan ulanishda xatolik yuz berdi');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailInput.trim()) {
      setErrorMsg('Iltimos, Gmail manzilingizni kiriting');
      return;
    }
    if (!gmailInput.includes('@')) {
      setErrorMsg('Yaroqli email yoki Gmail manzilini kiriting');
      return;
    }
    await handleQuickGoogleSignIn();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* Aurora backdrop ambient glow */}
      <div className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-3xl pointer-events-none" />

      <div className="relative bg-[#18181c] border border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col text-[#ececec]">
        {/* Top iridescent accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4285F4] via-[#9B72CF] via-[#D96570] to-[#13B5EA]" />

        {/* Close Button */}
        <button
          onClick={() => setGoogleWelcomeOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          title="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Google Brand & Gemini Sparkle */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
            {/* Official Google SVG Logo */}
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4285F4]">
                1-Click Onboarding
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-violet-500/20 to-pink-500/20 text-pink-300 border border-pink-500/30">
                Bonus +500 Kredit
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
              Nexus AI Studio'ga xush kelibsiz
            </h2>
          </div>
        </div>

        {/* Value Proposition Cards */}
        <p className="text-xs text-white/70 leading-relaxed mb-5">
          Google yoki Gmail orqali tezkor ulaning va dunyoning eng ilg'or AI modellaridan yagona chuqur xotira bilan foydalaning:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-white">500 Bepul Kredit</span>
            <span className="text-[11px] text-white/50 leading-tight">
              Barcha chat, rasm va video modellariga start
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-white">Chuqur Xotira</span>
            <span className="text-[11px] text-white/50 leading-tight">
              Gemini va Claude suhbatni eslab davom ettiradi
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-white">Tezkor & Oson</span>
            <span className="text-[11px] text-white/50 leading-tight">
              1 ta bosish bilan darhol ishlashga tayyor
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-950/60 border border-red-700/80 text-red-200 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Primary 1-Click Google Button */}
        <button
          onClick={handleQuickGoogleSignIn}
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#f1f1f1] text-black font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mb-3 cursor-pointer"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-zinc-400 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              {/* Google G Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>Google orqali davom etish</span>
              <ArrowRight className="w-4 h-4 ml-auto text-zinc-500" />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#18181c] px-3 text-[11px] text-white/40 uppercase tracking-wider font-mono">
            yoki Gmail kiriting
          </span>
          <div className="border-t border-white/10 w-full" />
        </div>

        {/* Custom Gmail Form */}
        <form onSubmit={handleFormSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              value={gmailInput}
              onChange={(e) => setGmailInput(e.target.value)}
              placeholder="masalan: sizningnomingiz@gmail.com"
              className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500/60 transition-colors"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium text-xs rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <span>Kirish</span>
            </button>
          </div>
        </form>

        {/* Footer info & Guest pass */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xavfsiz PBKDF2 shifrlash</span>
          </div>

          <button
            type="button"
            onClick={() => setGoogleWelcomeOpen(false)}
            className="hover:text-white transition-colors underline underline-offset-2 cursor-pointer"
          >
            Mehmon sifatida ko'rib chiqish &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
