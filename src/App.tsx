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
import { GoogleWelcomeModal } from './components/GoogleWelcomeModal';
import { DeepMemoryDrawer } from './components/DeepMemoryDrawer';
import { ApiKeyModal } from './components/ApiKeyModal';
import { useNexusStore } from './lib/store';

export default function App() {
  const { currentTab, theme } = useNexusStore();

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
      className="__font_inter_1lcav5y antialiased flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-[#171717] text-zinc-900 dark:text-[#ececec] font-sans select-none"
    >
      {/* Collapsible Command Hub Sidebar */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Bar with Workspace, Sidebar Toggle, Theme Switcher & User Profile */}
        <Header />

        {/* Dynamic Generative Viewport */}
        <main className="flex-1 overflow-hidden relative bg-white dark:bg-[#171717]">
          {renderActiveModule()}
        </main>
      </div>

      {/* Global Overlays & Modals */}
      <CommandMenu />
      <BillingModal />
      <AuthModal />
      <GoogleWelcomeModal />
      <DeepMemoryDrawer />
      <ApiKeyModal />
    </div>
  );
}
