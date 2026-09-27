import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  Search,
  CheckCircle2,
  RefreshCw,
  Coins,
  Crown,
  Sparkles,
  UserCheck,
  Zap,
  Plus,
  Send,
  AlertCircle
} from 'lucide-react';
import { useNexusStore } from '../lib/store';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  credits: number;
  createdAt: number;
  avatarUrl?: string;
  telegramId?: string;
  telegramUsername?: string;
  isGoogleAuth?: boolean;
}

const AVAILABLE_ROLES = [
  { value: 'Admin', label: '👑 Admin (Barcha ruxsatlar)', color: 'bg-red-500/10 text-red-500 border-red-500/30' },
  { value: 'Gold', label: '🌟 Gold Plan (5,000 kredit)', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  { value: 'Silver', label: '🥈 Silver Plan (1,500 kredit)', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
  { value: 'Bronze', label: '🥉 Bronze Plan (400 kredit)', color: 'bg-orange-700/10 text-orange-500 border-orange-500/30' },
  { value: 'Free Trial', label: '🆓 Free Trial (Sinov)', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' },
];

export const AdminPanelModal: React.FC = () => {
  const { isAdminModalOpen, setAdminModalOpen, currentUser, refreshUserAndCredits } = useNexusStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{ text: string; isError?: boolean } | null>(null);
  const [customCreditInputs, setCustomCreditInputs] = useState<Record<string, string>>({});
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const isAdmin =
    currentUser.role === 'Admin' ||
    currentUser.email.toLowerCase() === 'sobirboboyorov13@gmail.com' ||
    currentUser.id === 'user-sobir';

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'x-user-id': currentUser.id,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Foydalanuvchilarni yuklashda xatolik", true);
      }
    } catch (err: any) {
      showToast(err.message || "Serverga ulanish xatosi", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminModalOpen && isAdmin) {
      fetchUsers();
    }
  }, [isAdminModalOpen]);

  const showToast = (text: string, isError = false) => {
    setNotification({ text, isError });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          targetUserId: userId,
          role: newRole,
        }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        showToast(`Foydalanuvchi statusi muvaffaqiyatli "${newRole}" ga o'zgartirildi!`);
        refreshUserAndCredits();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Statusni o'zgartirishda xatolik", true);
      }
    } catch (e: any) {
      showToast(e.message || "Xatolik yuz berdi", true);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleAddCredits = async (userId: string, amount: number) => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          targetUserId: userId,
          addCredits: amount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, credits: data.user.credits } : u))
        );
        showToast(`${amount > 0 ? '+' : ''}${amount} kredit muvaffaqiyatli qo'shildi!`);
        refreshUserAndCredits();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Kredit qo'shishda xatolik", true);
      }
    } catch (e: any) {
      showToast(e.message || "Xatolik yuz berdi", true);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCustomCreditSubmit = async (userId: string) => {
    const val = parseInt(customCreditInputs[userId] || '', 10);
    if (isNaN(val) || val === 0) {
      showToast("To'g'ri kredit miqdorini kiriting", true);
      return;
    }
    await handleAddCredits(userId, val);
    setCustomCreditInputs((prev) => ({ ...prev, [userId]: '' }));
  };

  if (!isAdminModalOpen) return null;

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">Kirish taqiqlangan</h3>
          <p className="text-sm text-zinc-400">
            Faqat tizim boshqaruvchisi (Admin - sobirboboyorov13@gmail.com) ushbu panelga kira oladi.
          </p>
          <button
            onClick={() => setAdminModalOpen(false)}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition"
          >
            Yopish
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.telegramUsername && u.telegramUsername.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      u.id.toLowerCase().includes(q)
    );
  });

  const totalCredits = users.reduce((acc, u) => acc + (u.credits || 0), 0);
  const bronzeCount = users.filter((u) => (u.role || '').toLowerCase().includes('bronze')).length;
  const silverCount = users.filter((u) => (u.role || '').toLowerCase().includes('silver')).length;
  const goldCount = users.filter((u) => (u.role || '').toLowerCase().includes('gold')).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-[#1f1f23]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white">
                  RENAX AI Boshqaruv Paneli
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Foydalanuvchilarga Bronze, Silver, Gold yoki Admin statusi va kreditlarini berish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              title="Ro'yxatni yangilash"
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-500' : ''}`} />
            </button>
            <button
              onClick={() => setAdminModalOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast feedback */}
        {notification && (
          <div
            className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 justify-center transition-all ${
              notification.isError
                ? 'bg-red-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {notification.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 text-xs">
          <div className="bg-white dark:bg-zinc-800/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Jami Foydalanuvchilar</span>
              <span className="text-base font-extrabold text-zinc-900 dark:text-white font-mono">{users.length} nafar</span>
            </div>
            <UserCheck className="w-5 h-5 text-violet-500" />
          </div>

          <div className="bg-white dark:bg-zinc-800/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Jami Kreditlar</span>
              <span className="text-base font-extrabold text-amber-500 font-mono">{totalCredits.toLocaleString()}</span>
            </div>
            <Coins className="w-5 h-5 text-amber-500" />
          </div>

          <div className="bg-white dark:bg-zinc-800/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Bronze Obunachilar</span>
              <span className="text-base font-extrabold text-orange-500 font-mono">{bronzeCount} ta (39k)</span>
            </div>
            <span className="text-xs font-bold text-orange-500">🥉</span>
          </div>

          <div className="bg-white dark:bg-zinc-800/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Silver & Gold</span>
              <span className="text-base font-extrabold text-indigo-500 font-mono">{silverCount + goldCount} ta</span>
            </div>
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism, email yoki Telegram username bo'yicha qidirish..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 px-2 py-1"
            >
              Tozalash
            </button>
          )}
        </div>

        {/* Users Table / List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && users.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <RefreshCw className="w-8 h-8 text-violet-500 animate-spin mx-auto" />
              <p className="text-xs text-zinc-500">Foydalanuvchilar ro'yxati yuklanmoqda...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-sm font-medium text-zinc-500">Hech qanday foydalanuvchi topilmadi</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isCurrentUserSobir = user.email.toLowerCase() === 'sobirboboyorov13@gmail.com' || user.id === 'user-sobir';
              const isSelf = user.id === currentUser.id;
              const isBusy = updatingUserId === user.id;

              return (
                <div
                  key={user.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isCurrentUserSobir
                      ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    {/* User Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email || user.id)}`}
                          alt={user.name}
                          className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 object-cover"
                        />
                        {isCurrentUserSobir && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 text-black rounded-full flex items-center justify-center text-[10px] font-bold">
                            👑
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                            {user.name}
                          </span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 text-[9px] bg-violet-500/10 text-violet-400 rounded-md font-medium">
                              Siz
                            </span>
                          )}
                          {user.telegramUsername && (
                            <a
                              href={`https://t.me/${user.telegramUsername}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5"
                            >
                              @{user.telegramUsername}
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                          <span className="truncate max-w-[200px] sm:max-w-xs">{user.email}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">ID: {user.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Role & Balance Controls */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0">
                      
                      {/* Current Balance Tag */}
                      <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white">
                          {user.credits.toLocaleString()} kredit
                        </span>
                      </div>

                      {/* Status / Role Select Dropdown */}
                      <div className="relative">
                        <select
                          value={user.role}
                          disabled={isBusy}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="text-xs font-medium py-1.5 px-2.5 pr-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer disabled:opacity-50"
                        >
                          {AVAILABLE_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                          {!AVAILABLE_ROLES.some((r) => r.value === user.role) && (
                            <option value={user.role}>{user.role}</option>
                          )}
                        </select>
                      </div>

                      {/* Quick Credit Adders */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAddCredits(user.id, 400)}
                          disabled={isBusy}
                          title="Bronze tarif: +400 kredit qo'shish"
                          className="px-2 py-1 text-[11px] font-bold rounded-md bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20 transition disabled:opacity-50"
                        >
                          +400
                        </button>
                        <button
                          onClick={() => handleAddCredits(user.id, 1500)}
                          disabled={isBusy}
                          title="Silver tarif: +1500 kredit qo'shish"
                          className="px-2 py-1 text-[11px] font-bold rounded-md bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 border border-slate-500/20 transition disabled:opacity-50"
                        >
                          +1500
                        </button>
                        <button
                          onClick={() => handleAddCredits(user.id, 5000)}
                          disabled={isBusy}
                          title="Gold tarif: +5000 kredit qo'shish"
                          className="px-2 py-1 text-[11px] font-bold rounded-md bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 transition disabled:opacity-50"
                        >
                          +5000
                        </button>
                      </div>

                      {/* Custom Credit Input */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="± kredit"
                          value={customCreditInputs[user.id] || ''}
                          onChange={(e) =>
                            setCustomCreditInputs((prev) => ({
                              ...prev,
                              [user.id]: e.target.value,
                            }))
                          }
                          className="w-20 px-2 py-1 text-xs rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                        />
                        <button
                          onClick={() => handleCustomCreditSubmit(user.id)}
                          disabled={isBusy || !customCreditInputs[user.id]}
                          title="Kreditni kiritish"
                          className="p-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b] flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Admin hisobi: <b>sobirboboyorov13@gmail.com</b></span>
          <button
            onClick={() => setAdminModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium transition"
          >
            Yopish
          </button>
        </div>

      </div>
    </div>
  );
};
