import React, { useState } from 'react';
import {
  MessageSquare,
  Image as ImageIcon,
  Film,
  Sparkles,
  CreditCard,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Trash2,
  Coins,
  LogOut,
  User,
  Sun,
  Moon,
  Search,
  X,
  Pencil,
  Check
} from 'lucide-react';
import { useNexusStore } from '../lib/store';
import { NavTab } from '../types/nexus';

export const Sidebar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    isSidebarCollapsed,
    setSidebarCollapsed,
    creditBalance,
    setBillingModalOpen,
    chatSessions,
    activeSessionId,
    createNewChat,
    switchChatSession,
    deleteChatSession,
    renameChatSession,
    currentUser,
    setAuthModalOpen,
    logoutUser,
    theme,
    toggleTheme,
    searchChatQuery,
    setSearchChatQuery,
  } = useNexusStore();

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartRename = (session: { id: string; title?: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title || '');
  };

  const handleSaveRename = (sessionId: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    if (editingTitle.trim()) {
      renameChatSession(sessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
  };

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'image', label: 'Rasm yaratish', icon: ImageIcon },
    { id: 'video', label: 'Video yaratish', icon: Film },
    { id: 'pipeline', label: 'AI jarayonlar', icon: Sparkles },
    { id: 'billing', label: 'Tariflar & Rejalar', icon: CreditCard },
  ];

  // Strictly filter chat sessions for current user with real-time search
  const userChatSessions = chatSessions.filter(
    (s) => !!currentUser.id && s.userId === currentUser.id
  );

  const filteredChatSessions = userChatSessions.filter((s) => {
    if (!searchChatQuery.trim()) return true;
    const q = searchChatQuery.toLowerCase();
    const titleMatch = s.title?.toLowerCase().includes(q);
    const msgMatchA = (s.messagesA || []).some((m) => m.content?.toLowerCase().includes(q));
    const msgMatchB = (s.messagesB || []).some((m) => m.content?.toLowerCase().includes(q));
    return titleMatch || msgMatchA || msgMatchB;
  });

  return (
    <aside
      id="nexus-sidebar"
      className={`relative flex flex-col h-screen border-r border-zinc-200 dark:border-[#262626] bg-zinc-50 dark:bg-[#111111] text-zinc-800 dark:text-[#ececec] transition-all duration-200 z-30 select-none ${
        isSidebarCollapsed ? 'w-14' : 'w-64'
      }`}
    >
      {/* Top Header & Collapse/Expand Toggle */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-zinc-200 dark:border-[#262626]">
        {!isSidebarCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 border border-white/20 flex items-center justify-center text-white text-sm font-extrabold shadow-sm">
              R
            </div>
            <div className="flex flex-col">
              <div className="font-bold text-sm tracking-tight text-zinc-900 dark:text-[#f4f4f4] flex items-center gap-1 leading-tight">
                RENAX <span className="text-purple-600 dark:text-purple-400 font-extrabold">AI</span>
              </div>
              <small className="text-[9px] tracking-wider font-semibold text-zinc-500 dark:text-[#8e8e8e] uppercase">RENAXAI.UZ</small>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 border border-white/20 flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-opacity mx-auto cursor-pointer"
            title="RENAX AI - Sidebar ochish"
          >
            R
          </button>
        )}

        {!isSidebarCollapsed && (
          <button
            id="collapse-sidebar-btn"
            onClick={() => setSidebarCollapsed(true)}
            className="p-1.5 rounded-md text-zinc-500 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-[#ececec] hover:bg-zinc-200 dark:hover:bg-[#212121] transition-colors cursor-pointer"
            title="Sidebar yopish (Collapse sidebar)"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-2 py-3 space-y-1 overflow-y-auto flex flex-col">
        {/* Simple "New Chat" button like ChatGPT */}
        <button
          onClick={createNewChat}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-300 dark:border-[#333333] bg-white dark:bg-[#1a1a1a] hover:bg-zinc-100 dark:hover:bg-[#242424] text-zinc-900 dark:text-[#ececec] transition-colors mb-2 cursor-pointer shadow-sm ${
            isSidebarCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Yangi suhbat (New Chat)"
        >
          <Plus className="w-4 h-4 text-zinc-700 dark:text-[#ececec]" />
          {!isSidebarCollapsed && <span>Yangi suhbat</span>}
        </button>

        {/* Modules Navigation */}
        <div className="space-y-0.5 mb-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'nexus-active-item bg-zinc-200 dark:bg-[#262626] text-zinc-900 dark:text-white font-semibold'
                    : 'text-zinc-600 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-[#ececec] hover:bg-zinc-200/60 dark:hover:bg-[#1a1a1a]'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={item.label}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Saved Chat Sessions History (Chatlar saqlanishi) */}
        {!isSidebarCollapsed && (
          <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-zinc-200 dark:border-[#262626]">
            <div className="px-2 pb-1.5 text-[11px] font-medium text-zinc-500 dark:text-[#737373] uppercase tracking-wider flex items-center justify-between">
              <span>Suhbatlar tarixi</span>
              <span className="text-[10px] font-mono text-zinc-400 dark:text-[#555555]">
                {filteredChatSessions.length} / {userChatSessions.length}
              </span>
            </div>

            {/* Chat Search Box */}
            <div className="px-2 pb-2">
              <div className="relative flex items-center bg-white dark:bg-[#1c1c20] border border-zinc-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs focus-within:border-purple-500 transition-colors shadow-xs">
                <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-[#737373] shrink-0 mr-1.5" />
                <input
                  type="text"
                  value={searchChatQuery}
                  onChange={(e) => setSearchChatQuery(e.target.value)}
                  placeholder="Chatlardan qidirish..."
                  className="w-full bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-[#737373] focus:outline-none"
                />
                {searchChatQuery && (
                  <button
                    onClick={() => setSearchChatQuery('')}
                    className="p-0.5 text-zinc-400 dark:text-[#737373] hover:text-zinc-900 dark:hover:text-white transition-colors"
                    title="Tozalash"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
              {filteredChatSessions.length === 0 ? (
                <div className="px-2 py-4 text-[11px] text-zinc-400 dark:text-[#737373] text-center">
                  {searchChatQuery ? "Mos keluvchi suhbat topilmadi" : "Hozircha saqlangan suhbatlar yo'q"}
                </div>
              ) : (
                filteredChatSessions.map((session) => {
                  const isActive = activeSessionId === session.id && currentTab === 'chat';
                  return (
                    <div
                      key={session.id}
                      className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'nexus-active-item bg-zinc-200 dark:bg-[#242424] text-zinc-900 dark:text-white font-medium border-l-2 border-purple-500'
                          : 'text-zinc-600 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-[#ececec] hover:bg-zinc-200/50 dark:hover:bg-[#1a1a1a]'
                      }`}
                      onClick={() => switchChatSession(session.id)}
                    >
                      {editingSessionId === session.id ? (
                        <div
                          className="flex items-center gap-1 min-w-0 flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(session.id, e);
                              if (e.key === 'Escape') setEditingSessionId(null);
                            }}
                            className="w-full bg-white dark:bg-[#18181b] border border-purple-500 rounded px-1.5 py-0.5 text-xs text-zinc-900 dark:text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleSaveRename(session.id, e)}
                            className="p-1 text-emerald-500 hover:text-emerald-600 rounded cursor-pointer shrink-0"
                            title="Saqlash"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 text-zinc-400 dark:text-[#737373]" />
                            <span className="truncate">{session.title || 'Suhbat'}</span>
                          </div>

                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => handleStartRename(session, e)}
                              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded cursor-pointer transition-colors"
                              title="Nomini o'zgartirish"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChatSession(session.id);
                              }}
                              className="p-1 text-zinc-400 hover:text-rose-500 rounded cursor-pointer transition-colors"
                              title="Suhbatni o'chirish"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom User Profile & Auth Panel */}
      <div className="p-2 border-t border-zinc-200 dark:border-[#262626] space-y-1.5 bg-zinc-50 dark:bg-[#111111]">
        {/* RENAX Pro Plan Box */}
        {!isSidebarCollapsed && (
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 border border-purple-500/20 mb-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1 text-purple-600 dark:text-purple-300">
                ✦ RENAX Pro
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-[#8e8e8e]">59 000 so‘mdan</span>
            </div>
            <button
              onClick={() => setCurrentTab('billing')}
              className="w-full py-1 text-[11px] font-semibold rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              Tariflarni ko‘rish
            </button>
          </div>
        )}

        {/* Day / Light Mode Switcher in Sidebar */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors hover:bg-zinc-200 dark:hover:bg-[#1f1f1f] text-zinc-600 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-white cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-0' : 'justify-between'
          }`}
          title={theme === 'dark' ? "Kunduzgi rejim (Light Mode)" : "Tungi rejim (Dark Mode)"}
        >
          <div className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
            )}
            {!isSidebarCollapsed && <span>{theme === 'dark' ? 'Kunduzgi rejim' : 'Tungi rejim'}</span>}
          </div>
        </button>

        {/* Balance */}
        <button
          onClick={() => setBillingModalOpen(true)}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors hover:bg-zinc-200 dark:hover:bg-[#1f1f1f] text-zinc-600 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-white cursor-pointer ${
            isSidebarCollapsed ? 'justify-center px-0' : 'justify-between'
          }`}
          title="Credits & Balance"
        >
          <div className="flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            {!isSidebarCollapsed && <span>Balans</span>}
          </div>
          {!isSidebarCollapsed && (
            <span className="font-mono text-xs text-zinc-900 dark:text-[#e5e5e5] font-semibold">
              {creditBalance}
            </span>
          )}
        </button>

        {/* User Account Card */}
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#171717] border border-zinc-200 dark:border-[#262626] transition-colors shadow-2xs">
            <div
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
              title="Hisobni boshqarish"
            >
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-900 dark:text-[#ececec] truncate">
                  {currentUser.name || 'Foydalanuvchi'}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-[#737373] truncate">{currentUser.email || 'Email yo‘q'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                logoutUser();
              }}
              className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-[#262626] rounded-md transition-colors cursor-pointer shrink-0"
              title="Hisobdan chiqish (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-[#1f1f1f] text-zinc-600 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            title={`Profil: ${currentUser.name}`}
          >
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-semibold text-xs flex items-center justify-center">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </button>
        )}
      </div>
    </aside>
  );
};
