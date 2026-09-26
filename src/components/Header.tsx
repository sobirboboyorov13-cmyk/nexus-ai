import React, { useState } from 'react';
import {
  Search,
  Command,
  ChevronDown,
  Coins,
  PanelLeft,
  PanelLeftClose,
  Sun,
  Moon,
  User,
  Sparkles,
  Brain,
  Check
} from 'lucide-react';
import { useNexusStore } from '../lib/store';
import { CHAT_MODELS } from '../lib/models';
import { ModelIcon } from './ModelBadge';

export const Header: React.FC = () => {
  const {
    currentTab,
    chatModelA,
    setChatModelA,
    creditBalance,
    setBillingModalOpen,
    setCommandMenuOpen,
    isSidebarCollapsed,
    setSidebarCollapsed,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    theme,
    toggleTheme,
    currentUser,
    setAuthModalOpen,
    setGoogleWelcomeOpen,
    setMemoryDrawerOpen,
  } = useNexusStore();

  const [showModelMenu, setShowModelMenu] = useState(false);
  const activeModelObj = CHAT_MODELS.find(m => m.id === chatModelA) || CHAT_MODELS[0];

  const getModuleTitle = () => {
    switch (currentTab) {
      case 'chat':
        return 'Chat';
      case 'image':
        return 'Image Studio';
      case 'video':
        return 'Video Lab';
      case 'pipeline':
        return 'Workflows';
      case 'billing':
        return 'Tariflar & Rejalar';
      default:
        return 'RENAX AI';
    }
  };

  return (
    <header
      id="nexus-header"
      className="h-14 bg-white dark:bg-[#171717] border-b border-zinc-200 dark:border-[#262626] px-2 sm:px-4 flex items-center justify-between shrink-0 select-none text-zinc-900 dark:text-[#ececec] transition-colors"
    >
      {/* Left: Sidebar Toggle Button & Model/Module Selector */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {/* Reopen / Toggle Sidebar Button */}
        <button
          id="sidebar-toggle-header-btn"
          onClick={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              setMobileSidebarOpen(!isMobileSidebarOpen);
            } else {
              setSidebarCollapsed(!isSidebarCollapsed);
            }
          }}
          className="p-2 rounded-xl text-zinc-500 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-[#ececec] hover:bg-zinc-100 dark:hover:bg-[#242424] border border-transparent hover:border-zinc-200 dark:hover:border-white/5 transition-all flex items-center justify-center cursor-pointer btn-tactile shrink-0"
          title={isSidebarCollapsed ? "Sidebar ochish (Expand sidebar)" : "Sidebar yopish (Collapse sidebar)"}
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-4.5 h-4.5 text-zinc-800 dark:text-white" />
          ) : (
            <PanelLeftClose className="w-4.5 h-4.5" />
          )}
        </button>

        {currentTab === 'chat' ? (
          <div className="relative min-w-0">
            <button
              type="button"
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-zinc-100/90 dark:bg-[#202022] hover:bg-zinc-200/80 dark:hover:bg-[#28282b] border border-zinc-200/90 dark:border-white/10 shadow-2xs hover:border-purple-500/40 transition-all cursor-pointer btn-tactile max-w-[130px] sm:max-w-none"
              title="AI Modelini tanlash"
            >
              <div className="w-5 h-5 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center shrink-0">
                <ModelIcon modelId={chatModelA} className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-[#f4f4f4] truncate">
                    {activeModelObj.name}
                  </span>
                  <span className="hidden sm:inline text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded-md shrink-0">
                    {activeModelObj.badge?.split(' ')[0] || 'AI'}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 dark:text-[#8e8e8e] transition-transform duration-200 shrink-0 ${showModelMenu ? 'rotate-180' : ''}`} />
            </button>

            {showModelMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
                <div className="fixed sm:absolute top-14 sm:top-full mt-2 left-2 right-2 sm:left-0 sm:right-auto z-50 w-auto sm:w-96 max-h-[75vh] flex flex-col bg-white/98 dark:bg-[#1c1c1f]/98 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-zinc-100 dark:border-white/5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Ilg'or AI Modellari
                    </span>
                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Umumiy chuqur xotira
                    </span>
                  </div>

                  <div className="space-y-1 max-h-[380px] overflow-y-auto overscroll-contain pr-1">
                    {CHAT_MODELS.map((m) => {
                      const isSelected = chatModelA === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setChatModelA(m.id);
                            setShowModelMenu(false);
                          }}
                          className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer btn-tactile ${
                            isSelected
                              ? 'bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/30 text-zinc-950 dark:text-white shadow-2xs'
                              : 'hover:bg-zinc-100 dark:hover:bg-[#252528] border border-transparent text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-xl bg-zinc-200/70 dark:bg-[#2a2a2e] flex items-center justify-center shrink-0 mt-0.5 border border-zinc-300/40 dark:border-white/10">
                            <ModelIcon modelId={m.id} className="w-4.5 h-4.5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                {m.name}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                                  ⚡ {m.avgLatency}
                                </span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-zinc-200 dark:bg-[#333336] text-zinc-700 dark:text-zinc-300">
                                  {m.costCredits} kredit
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                              {m.description}
                            </p>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-500/10 px-1.5 py-0.2 rounded">
                                {m.badge}
                              </span>
                              <span className="text-[9px] text-zinc-400">
                                {m.contextOrResolution}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 self-center" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <span className="text-sm font-semibold text-zinc-900 dark:text-[#f4f4f4]">
            {getModuleTitle()}
          </span>
        )}
      </div>

      {/* Right: Search, Day/Light Mode, Credits & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Search / Command Menu */}
        <button
          onClick={() => setCommandMenuOpen(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-zinc-100/80 dark:bg-[#202022] hover:bg-zinc-200/80 dark:hover:bg-[#28282b] border border-zinc-200/90 dark:border-white/10 text-xs text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-[#ececec] transition-all cursor-pointer btn-tactile"
          title="Qidiruv yoki buyruqlar (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Qidiruv</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/10 text-[10px] font-mono text-zinc-500 dark:text-[#a3a3a3]">
            <Command className="w-2.5 h-2.5 inline" /> K
          </kbd>
        </button>

        {/* Deep Memory Drawer Toggle */}
        <button
          onClick={() => setMemoryDrawerOpen(true)}
          className="hidden sm:flex p-2 rounded-xl bg-zinc-100/80 dark:bg-[#202022] hover:bg-zinc-200/80 dark:hover:bg-[#28282b] border border-zinc-200/90 dark:border-white/10 text-zinc-600 dark:text-[#8e8e8e] hover:text-purple-600 dark:hover:text-purple-400 transition-all cursor-pointer btn-tactile"
          title="Chuqur Xotira (Shared Deep Memory across all models)"
        >
          <Brain className="w-3.5 h-3.5" />
        </button>

        {/* Day / Light Mode Toggle Button */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-zinc-100/80 dark:bg-[#202022] hover:bg-zinc-200/80 dark:hover:bg-[#28282b] border border-zinc-200/90 dark:border-white/10 text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer btn-tactile"
          title={theme === 'dark' ? "Kunduzgi rejim (Switch to Light Mode)" : "Tungi rejim (Switch to Dark Mode)"}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
          )}
        </button>

        {/* Credits Balance Button */}
        <button
          onClick={() => setBillingModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100/80 dark:bg-[#202022] hover:bg-zinc-200/80 dark:hover:bg-[#28282b] border border-zinc-200/90 dark:border-white/10 text-xs text-zinc-800 dark:text-[#ececec] transition-all cursor-pointer btn-tactile"
          title="Hisob balansi (Credits)"
        >
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-mono text-xs font-semibold">{creditBalance}</span>
        </button>

        {/* Google 1-Click Login Hook for Guests */}
        {currentUser.id === 'guest-user' && (
          <button
            onClick={() => setGoogleWelcomeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer btn-tactile"
            title="Google orqali kiring va 50 bepul kredit oling!"
          >
            <svg className="w-3.5 h-3.5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.02h3.88c2.28-2.09 3.66-5.18 3.66-9.12z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.02c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.11-6.7-4.96H1.28v3.12C3.26 21.36 7.35 24 12 24z"/>
              <path fill="#FBBC05" d="M5.3 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l4.02-3.12z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.28 6.61l4.02 3.12c.94-2.85 3.58-4.98 6.7-4.98z"/>
            </svg>
            <span className="hidden sm:inline">Google</span>
            <span className="text-[10px] bg-amber-400/20 text-amber-600 dark:text-amber-300 font-bold px-1 rounded border border-amber-400/30">+50</span>
          </button>
        )}

        {/* User Account Button */}
        {currentUser.isLoggedIn && currentUser.id ? (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-zinc-100/80 dark:bg-[#202022] hover:bg-zinc-200/80 dark:hover:bg-[#28282b] border border-zinc-200/90 dark:border-white/10 text-xs transition-all cursor-pointer btn-tactile"
            title={`Hisob: ${currentUser.name} (${currentUser.email})`}
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <span className="hidden sm:inline font-medium text-zinc-800 dark:text-[#e5e5e5] max-w-[90px] truncate">
              {currentUser.name.split(' ')[0]}
            </span>
          </button>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl btn-primary-nexus text-white text-xs font-bold cursor-pointer"
          >
            <span>Kirish / Ro‘yxatdan o‘tish</span>
          </button>
        )}
      </div>
    </header>
  );
};
