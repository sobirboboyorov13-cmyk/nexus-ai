import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { useNexusStore } from '../lib/store';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    currentUser,
    registeredUsers,
    loginUser,
    registerUser,
    loginWithGoogle,
    switchUser,
    fetchServerUsers,
  } = useNexusStore();

  const [mode, setMode] = useState<'login' | 'register' | 'switch'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthModalOpen) {
      fetchServerUsers();
    }
  }, [isAuthModalOpen, fetchServerUsers]);

  if (!isAuthModalOpen) return null;

  const canClose = Boolean(currentUser.isLoggedIn && currentUser.id);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Iltimos, emailingizni kiriting');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await loginUser(email.trim(), password.trim(), name.trim());
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Kirishda xatolik yuz berdi');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Ism va email kiritilishi shart');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('Parol kamida 4 belgidan iborat bo‘lishi lozim');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await registerUser(name.trim(), email.trim(), password.trim());
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || "Ro'yxatdan o'tishda xatolik yuz berdi");
    }
  };

  const handleGoogleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Iltimos, avval pastdagi maydonga o‘zingizning shaxsiy Gmail / Google pochtangizni kiriting');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    const targetEmail = email.trim().toLowerCase();
    const targetName = name.trim() || targetEmail.split('@')[0];
    const targetAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(targetEmail)}`;

    const res = await loginWithGoogle(targetEmail, targetName, targetAvatar);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Google orqali ulanishda xatolik yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1c1c1c] dark:bg-[#1c1c1c] border border-[#2f2f2f] rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col space-y-4 text-[#ececec]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
              R
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                RENAX AI — {mode === 'login' ? 'Tizimga kirish' : mode === 'register' ? 'Ro‘yxatdan o‘tish' : 'Hisobni almashtirish'}
              </h3>
              <p className="text-[11px] text-zinc-400">Har bir foydalanuvchi uchun shaxsiy chatlar va balans</p>
            </div>
          </div>
          {canClose && (
            <button
              onClick={() => setAuthModalOpen(false)}
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
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            className={`py-2 font-semibold rounded-lg transition-colors ${
              mode === 'login' ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-[#8e8e8e] hover:text-white'
            }`}
          >
            Kirish (Sign In)
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            className={`py-2 font-semibold rounded-lg transition-colors ${
              mode === 'register' ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-[#8e8e8e] hover:text-white'
            }`}
          >
            Ro‘yxatdan o‘tish (Sign Up)
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Mode: Login */}
        {mode === 'login' && (
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Shaxsiy Email yoki Gmail manzilingiz</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="masalan: ismingiz@gmail.com"
                className="w-full px-3.5 py-2.5 text-xs bg-[#141414] border border-[#2f2f2f] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Google Fast Sign In */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleSubmit}
              className="w-full py-2.5 px-3 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              title="Kiritilgan Gmail orqali tezkor kirish"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>Gmail orqali 1-klikda kirish</span>
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#1c1c1c] px-2 text-[10px] text-zinc-400 uppercase font-mono">yoki parol bilan</span>
              <div className="border-t border-white/10 w-full" />
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Parol</label>
                <input
                  type="password"
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
                    <span>Tizimga kirish</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
        {/* Mode: Register */}
        {mode === 'register' && (
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Shaxsiy Email yoki Gmail manzilingiz</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="masalan: ismingiz@gmail.com"
                className="w-full px-3.5 py-2.5 text-xs bg-[#141414] border border-[#2f2f2f] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Google Fast Registration Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleSubmit}
              className="w-full py-2.5 px-3 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              title="Kiritilgan Gmail orqali hisob ochish"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>Google orqali ro‘yxatdan o‘tish</span>
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#1c1c1c] px-2 text-[10px] text-zinc-400 uppercase font-mono">yoki yangi parol bilan</span>
              <div className="border-t border-white/10 w-full" />
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Ism va familiyangiz</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="masalan: Jasur Rahimov"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#141414] border border-[#2f2f2f] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Parol o‘ylab toping</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kamida 4 ta belgi"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#141414] border border-[#2f2f2f] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] text-[11px] text-zinc-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Har bir yangi hisobga <strong>50 bepul kredit</strong> xush kelibsiz bonusi sifatida beriladi.</span>
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
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Ro‘yxatdan o‘tish (+50 kredit)</span>
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
