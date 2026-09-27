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
    { id: 'billing', label: 'Tarif', icon: CreditCard },
  ];

  const itemCls = (active: boolean) =>
    `flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl transition-all cursor-pointer active:scale-95 ${
      active ? 'renax-tab-on' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
    }`;

  return (
    <nav
      id="nexus-mobile-bottom-nav"
      aria-label="Mobil navigatsiya paneli"
      className="md:hidden renax-bottom-nav fixed bottom-0 inset-x-0 z-40 flex items-center gap-1 px-2 pt-1.5 select-none"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id && !isMobileSidebarOpen;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setCurrentTab(item.id);
              if (isMobileSidebarOpen) setMobileSidebarOpen(false);
            }}
            className={itemCls(isActive)}
          >
            <span className={`grid place-items-center w-9 h-7 rounded-xl transition-all ${isActive ? 'renax-tab-pill' : ''}`}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <span className="text-[10px] font-semibold tracking-tight truncate max-w-full">{item.label}</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
        className={itemCls(isMobileSidebarOpen)}
        aria-label="Menyu"
      >
        <span className={`grid place-items-center w-9 h-7 rounded-xl transition-all ${isMobileSidebarOpen ? 'renax-tab-pill' : ''}`}>
          <Menu className="w-[18px] h-[18px]" />
        </span>
        <span className="text-[10px] font-semibold tracking-tight">Menyu</span>
      </button>
    </nav>
  );
};
