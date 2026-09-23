import React, { useState, useEffect } from 'react';
import {
  Search,
  MessageSquare,
  Image as ImageIcon,
  Film,
  Sparkles,
  CreditCard,
  Bot
} from 'lucide-react';
import { useNexusStore } from '../lib/store';
import { CHAT_MODELS, IMAGE_MODELS, VIDEO_MODELS } from '../lib/models';
import { NavTab } from '../types/nexus';

export const CommandMenu: React.FC = () => {
  const {
    isCommandMenuOpen,
    setCommandMenuOpen,
    setCurrentTab,
    setImageParams,
    setVideoParams,
    setChatModelA
  } = useNexusStore();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandMenuOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandMenuOpen]);

  if (!isCommandMenuOpen) return null;

  const navigateTo = (tab: NavTab) => {
    setCurrentTab(tab);
    setCommandMenuOpen(false);
  };

  const actions = [
    { label: 'Chat (Suhbat)', tab: 'chat' as NavTab, icon: MessageSquare },
    { label: 'Rasm Studiyasi', tab: 'image' as NavTab, icon: ImageIcon },
    { label: 'Video Laboratoriya', tab: 'video' as NavTab, icon: Film },
    { label: 'Ish Oqimlari (Pipelines)', tab: 'pipeline' as NavTab, icon: Sparkles },
    { label: 'Kreditlar & Balans', tab: 'billing' as NavTab, icon: CreditCard },
  ];

  const filteredActions = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredModels = [
    ...CHAT_MODELS.map((m) => ({ ...m, type: 'chat' as const })),
    ...IMAGE_MODELS.map((m) => ({ ...m, type: 'image' as const })),
    ...VIDEO_MODELS.map((m) => ({ ...m, type: 'video' as const })),
  ].filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-zinc-900 dark:text-[#ececec]">
        <div className="flex items-center px-3 py-3 border-b border-zinc-200 dark:border-[#2e2e2e] gap-2.5">
          <Search className="w-4 h-4 text-zinc-400 dark:text-[#8e8e8e]" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Modullar yoki AI modellarni qidirish..."
            className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-[#ececec] placeholder-zinc-400 dark:placeholder-[#737373] focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] text-zinc-500 dark:text-[#8e8e8e] bg-zinc-100 dark:bg-[#1a1a1a] rounded border border-zinc-200 dark:border-[#333333]">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-1.5 space-y-2">
          <div>
            <div className="px-2 py-1 text-[10px] font-medium text-zinc-500 dark:text-[#737373] uppercase tracking-wider">
              Modullar
            </div>
            {filteredActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => navigateTo(item.tab)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs text-zinc-700 dark:text-[#d4d4d4] hover:bg-zinc-100 dark:hover:bg-[#2a2a2a] hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-zinc-500 dark:text-[#8e8e8e]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {filteredModels.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-medium text-zinc-500 dark:text-[#737373] uppercase tracking-wider">
                Sun'iy Intellekt Modellari
              </div>
              {filteredModels.slice(0, 8).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    if (m.type === 'chat') {
                      setChatModelA(m.id);
                      navigateTo('chat');
                    } else if (m.type === 'image') {
                      setImageParams({ modelId: m.id });
                      navigateTo('image');
                    } else {
                      setVideoParams({ modelId: m.id });
                      navigateTo('video');
                    }
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-xs text-zinc-700 dark:text-[#d4d4d4] hover:bg-zinc-100 dark:hover:bg-[#2a2a2a] hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-zinc-500 dark:text-[#8e8e8e]" />
                    <span>{m.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-[#8e8e8e]">{m.costCredits} kr</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
