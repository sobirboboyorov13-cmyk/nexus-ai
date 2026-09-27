import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatModule } from './components/ChatModule';
import { ImageStudio } from './components/ImageStudio';
import { VideoLab } from './components/VideoLab';
import { PipelineCanvas } from './components/PipelineCanvas';
import { BillingView } from './components/BillingView';
import { CommandMenu } from './components/CommandMenu';
import { BillingModal } from './components/BillingModal';
import { AuthModal } from './components/AuthModal';
import { DeepMemoryDrawer } from './components/DeepMemoryDrawer';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { BottomNav } from './components/BottomNav';
import { useNexusStore } from './lib/store';

export default function App() {
  const { currentTab, theme, currentUser, fetchSubscription } = useNexusStore();

  // Saytda ekanligimizni serverga bildirib turamiz (admin monitoringi uchun)
  useEffect(() => {
    const ping = () => {
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser?.id || '' },
        body: JSON.stringify({ page: currentTab }),
      }).catch(() => {});
    };
    ping();
    const t = setInterval(ping, 30000);
    return () => clearInterval(t);
  }, [currentUser?.id, currentTab]);

  // Obuna holatini kuzatib turamiz — botdan to'lov tasdiqlansa sayt o'zi yangilanadi
  useEffect(() => {
    if (!currentUser?.isLoggedIn || currentUser.id === 'user-guest') return;
    fetchSubscription();
    const t = setInterval(fetchSubscription, 20000);
    const onFocus = () => fetchSubscription();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [currentUser?.id, currentUser?.isLoggedIn, fetchSubscription]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const renderActiveModule = () => {
    switch (currentTab) {
      case 'chat':
        return <ChatModule />;
      case 'image':
        return <ImageStudio />;
      case 'video':
        return <VideoLab />;
      case 'pipeline':
        return <PipelineCanvas />;
      case 'billing':
        return <BillingView />;
      default:
        return <ChatModule />;
    }
  };

  return (
    <div
      id="nexus-app-root"
      className="__font_inter_1lcav5y renax-app-bg antialiased flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-zinc-50 dark:bg-[#171717] text-zinc-900 dark:text-[#ececec] font-sans"
    >
      {/* Collapsible Command Hub Sidebar */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full min-h-0 overflow-hidden">
        {/* Top Bar with Workspace, Sidebar Toggle, Theme Switcher & User Profile */}
        <Header />

        {/* Dynamic Generative Viewport */}
        <main className="flex-1 min-h-0 relative bg-white dark:bg-[#171717] pb-16 md:pb-0 flex flex-col overflow-hidden">
          {renderActiveModule()}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav />

      {/* Global Overlays & Modals */}
      <CommandMenu />
      <BillingModal />
      <AuthModal />
      <DeepMemoryDrawer />
      <ApiKeyModal />
      <AdminPanelModal />
    </div>
  );
}
