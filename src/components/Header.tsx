import React from 'react';
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
  Brain
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
    theme,
    toggleTheme,
    currentUser,
    setAuthModalOpen,
    setGoogleWelcomeOpen,
    setMemoryDrawerOpen,
  } = useNexusStore();

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
        return 'Credits & Plans';
      default:
        return 'Nexus AI';
    }
  };

  return (
    <header
      id="nexus-header"
      className="h-14 bg-white dark:bg-[#171717] border-b border-zinc-200 dark:border-[#262626] px-3 sm:px-4 flex items-center justify-between shrink-0 select-none text-zinc-900 dark:text-[#ececec] transition-colors"
    >
      {/* Left: Sidebar Toggle Button & Model/Module Selector */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Reopen / Toggle Sidebar Button */}
        <button
          id="sidebar-toggle-header-btn"
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="p-1.5 rounded-lg text-zinc-500 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-[#ececec] hover:bg-zinc-100 dark:hover:bg-[#262626] transition-colors flex items-center justify-center cursor-pointer"
          title={isSidebarCollapsed ? "Sidebar ochish (Expand sidebar)" : "Sidebar yopish (Collapse sidebar)"}
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-5 h-5 text-zinc-800 dark:text-white" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        {currentTab === 'chat' ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] shadow-2xs hover:border-zinc-300 dark:hover:border-[#404040] transition-colors">
            <ModelIcon modelId={chatModelA} className="w-4 h-4 shrink-0" />
            <div className="relative flex items-center">
              <select
                value={chatModelA}
                onChange={(e) => setChatModelA(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-zinc-800 dark:text-[#f4f4f4] pr-6 appearance-none cursor-pointer focus:outline-none transition-colors"
                title="AI Modelini tanlang"
              >
                {CHAT_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-white dark:bg-[#212121] text-zinc-900 dark:text-[#ececec]">
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 dark:text-[#8e8e8e] absolute right-0 pointer-events-none" />
            </div>
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
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#212121] hover:bg-zinc-200 dark:hover:bg-[#2a2a2a] border border-zinc-200 dark:border-[#2f2f2f] text-xs text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-[#ececec] transition-colors cursor-pointer"
          title="Qidiruv yoki buyruqlar (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Qidiruv</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-white dark:bg-[#171717] border border-zinc-200 dark:border-[#333333] text-[10px] font-mono text-zinc-500 dark:text-[#a3a3a3]">
            <Command className="w-2.5 h-2.5 inline" /> K
          </kbd>
        </button>

        {/* Deep Memory Drawer Toggle */}
        <button
          onClick={() => setMemoryDrawerOpen(true)}
          className="p-2 rounded-lg bg-zinc-100 dark:bg-[#212121] hover:bg-zinc-200 dark:hover:bg-[#2a2a2a] border border-zinc-200 dark:border-[#2f2f2f] text-zinc-600 dark:text-[#8e8e8e] hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
          title="Chuqur Xotira (Shared Deep Memory across all models)"
        >
          <Brain className="w-3.5 h-3.5" />
        </button>

        {/* Day / Light Mode Toggle Button */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-zinc-100 dark:bg-[#212121] hover:bg-zinc-200 dark:hover:bg-[#2a2a2a] border border-zinc-200 dark:border-[#2f2f2f] text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
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
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#212121] hover:bg-zinc-200 dark:hover:bg-[#2a2a2a] border border-zinc-200 dark:border-[#2f2f2f] text-xs text-zinc-800 dark:text-[#ececec] transition-colors cursor-pointer"
          title="Hisob balansi (Credits)"
        >
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-mono text-xs font-semibold">{creditBalance}</span>
        </button>

        {/* Google 1-Click Login Hook for Guests */}
        {currentUser.id === 'guest-user' && (
          <button
            onClick={() => setGoogleWelcomeOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
            title="Google orqali kiring va 500 bepul kredit oling!"
          >
            <svg className="w-3.5 h-3.5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.02h3.88c2.28-2.09 3.66-5.18 3.66-9.12z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.02c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.11-6.7-4.96H1.28v3.12C3.26 21.36 7.35 24 12 24z"/>
              <path fill="#FBBC05" d="M5.3 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l4.02-3.12z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.28 6.61l4.02 3.12c.94-2.85 3.58-4.98 6.7-4.98z"/>
            </svg>
            <span className="hidden sm:inline">Google</span>
            <span className="text-[10px] bg-amber-400/20 text-amber-600 dark:text-amber-300 font-bold px-1 rounded border border-amber-400/30">+500</span>
          </button>
        )}

        {/* User Account Button */}
        <button
          onClick={() => setAuthModalOpen(true)}
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#212121] hover:bg-zinc-200 dark:hover:bg-[#2a2a2a] border border-zinc-200 dark:border-[#2f2f2f] text-xs transition-colors cursor-pointer"
          title={`Hisob: ${currentUser.name} (${currentUser.email})`}
        >
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-[#3b3b3b] text-zinc-800 dark:text-white flex items-center justify-center text-[10px] font-bold">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <span className="hidden sm:inline font-medium text-zinc-800 dark:text-[#e5e5e5] max-w-[90px] truncate">
            {currentUser.name.split(' ')[0]}
          </span>
        </button>
      </div>
    </header>
  );
};
