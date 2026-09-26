import React from 'react';
import { MessageSquare, Image as ImageIcon, Film, CreditCard, Menu } from 'lucide-react';
import { useNexusStore } from '../lib/store';
import { NavTab } from '../types/nexus';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, isMobileSidebarOpen, setMobileSidebarOpen } = useNexusStore();

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'image', label: 'Rasm', icon: ImageIcon },
    { id: 'video', label: 'Video', icon: Film },
    { id: 'billing', label: 'Tariflar', icon: CreditCard },
  ];

  return (
    <nav
      id="nexus-mobile-bottom-nav"
      aria-label="Mobil navigatsiya paneli"
      className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-xl border-t border-zinc-200/80 dark:border-white/10 z-40 flex items-center justify-around px-2 pb-safe select-none shadow-lg"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setCurrentTab(item.id);
              if (isMobileSidebarOpen) setMobileSidebarOpen(false);
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 transition-all cursor-pointer relative active:scale-95 ${
              isActive
                ? 'text-purple-600 dark:text-purple-400 font-bold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-purple-500/15 dark:bg-purple-500/20' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400 mt-0.5" />
            )}
          </button>
        );
      })}

      {/* 5th button: Open Drawer / Menu */}
      <button
        type="button"
        onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
        className={`flex-1 flex flex-col items-center justify-center py-1.5 transition-all cursor-pointer relative active:scale-95 ${
          isMobileSidebarOpen
            ? 'text-purple-600 dark:text-purple-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium'
        }`}
      >
        <div className={`p-1 rounded-xl transition-all ${isMobileSidebarOpen ? 'bg-purple-500/15 dark:bg-purple-500/20' : ''}`}>
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Menyu</span>
        {isMobileSidebarOpen && (
          <span className="w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400 mt-0.5" />
        )}
      </button>
    </nav>
  );
};
