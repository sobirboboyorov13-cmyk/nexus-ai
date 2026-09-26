import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  NavTab,
  ImageStudioParams,
  GeneratedImage,
  VideoLabParams,
  VideoJob,
  PipelineWorkflow,
  PipelineScene,
  ChatMessage,
  CreditTransaction,
  Workspace,
  UserProfile,
  ChatSession,
  AppTheme,
  DeepMemoryContext
} from '../types/nexus';

interface NexusState {
  // Theme (Day light mode / Dark mode)
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;

  // Authentication & Users
  currentUser: UserProfile;
  registeredUsers: UserProfile[];
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  isGoogleWelcomeOpen: boolean;
  setGoogleWelcomeOpen: (open: boolean) => void;
  loginUser: (email: string, password?: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (email: string, name?: string, avatarUrl?: string) => Promise<{ success: boolean; error?: string }>;
  switchUser: (userId: string) => void;
  logoutUser: () => void;
  fetchServerUsers: () => Promise<void>;
  refreshUserAndCredits: () => Promise<void>;

  // Cross-Model Deep Memory & Project Context
  isMemoryDrawerOpen: boolean;
  setMemoryDrawerOpen: (open: boolean) => void;
  deepMemory: DeepMemoryContext | null;
  fetchDeepMemory: () => Promise<void>;
  updateDeepMemory: (updates: Partial<DeepMemoryContext>) => Promise<void>;
  clearDeepMemory: () => Promise<void>;

  // Navigation & Sidebar
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  setActiveWorkspace: (ws: Workspace) => void;
  isCommandMenuOpen: boolean;
  setCommandMenuOpen: (open: boolean) => void;
  isBillingModalOpen: boolean;
  setBillingModalOpen: (open: boolean) => void;

  // Credits & Billing
  creditBalance: number;
  transactions: CreditTransaction[];
  deductCredits: (amount: number, reason: string) => boolean;
  refundCredits: (amount: number, reason: string) => void;
  addCredits: (amount: number, reason: string) => Promise<void>;

  // Chat Sessions, Search & Multi-Chat History
  chatSessions: ChatSession[];
  activeSessionId: string;
  searchChatQuery: string;
  setSearchChatQuery: (query: string) => void;
  createNewChat: () => void;
  switchChatSession: (sessionId: string) => void;
  deleteChatSession: (sessionId: string) => void;
  renameChatSession: (sessionId: string, newTitle: string) => void;

  // Active Chat State
  chatModelA: string;
  chatModelB: string;
  setChatModelA: (modelId: string) => void;
  setChatModelB: (modelId: string) => void;
  isDualView: boolean;
  setDualView: (enabled: boolean) => void;
  messagesA: ChatMessage[];
  messagesB: ChatMessage[];
  addChatMessage: (pane: 'A' | 'B', message: ChatMessage) => void;
  updateChatMessage: (pane: 'A' | 'B', id: string, content: string, latencyMs?: number) => void;
  clearChat: () => void;

  // Image Studio State
  imageParams: ImageStudioParams;
  setImageParams: (params: Partial<ImageStudioParams>) => void;
  gallery: GeneratedImage[];
  addImageToGallery: (image: GeneratedImage) => void;
  selectedImageForInpaint: GeneratedImage | null;
  setSelectedImageForInpaint: (image: GeneratedImage | null) => void;
  upscaleImage: (id: string, factor: '2x' | '4x') => void;
  sendToVideoLab: (imageUrl: string, prompt?: string) => void;

  // Video Lab State
  videoParams: VideoLabParams;
  setVideoParams: (params: Partial<VideoLabParams>) => void;
  videoJobs: VideoJob[];
  addVideoJob: (job: VideoJob) => void;
  updateVideoJob: (id: string, updates: Partial<VideoJob>) => void;

  // Pipeline State
  activePipeline: PipelineWorkflow | null;
  setActivePipeline: (pipeline: PipelineWorkflow | null) => void;
  updatePipelineScene: (sceneId: string, updates: Partial<PipelineScene>) => void;

  // Custom API & Provider Config (Base URL, Model Name, Keys)
  customBaseUrl: string;
  setCustomBaseUrl: (url: string) => void;
  customModelName: string;
  setCustomModelName: (model: string) => void;
  openAiApiKey: string;
  setOpenAiApiKey: (key: string) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  openRouterApiKey: string;
  setOpenRouterApiKey: (key: string) => void;
  isApiKeyModalOpen: boolean;
  setApiKeyModalOpen: (open: boolean) => void;
}

const INITIAL_ANONYMOUS_USER: UserProfile = {
  id: 'user-guest',
  name: 'Mehmon Foydalanuvchi',
  email: '',
  role: 'Mehmon',
  credits: 50,
  createdAt: Date.now(),
  isLoggedIn: false,
};

const INITIAL_IMAGE_PARAMS: ImageStudioParams = {
  modelId: 'dall-e-3',
  prompt: 'Cinematic wide shot of a futuristic cybernetic metropolis in twilight, iridescent holographic signs, volumetric rain reflections, 8k octane render',
  negativePrompt: 'blurry, low quality, distorted anatomy, watermark, text, out of frame',
  aspectRatio: '16:9',
  steps: 28,
  guidanceScale: 7.5,
  seed: 482910,
};

const INITIAL_VIDEO_PARAMS: VideoLabParams = {
  mode: 'text-to-video',
  modelId: 'kling-v1.5-pro',
  prompt: 'Hyper-realistic drone shot sweeping past a glowing neo-tokyo skyscraper, neon lights refracting through gentle misty rain, cinematic depth of field',
  firstFrameUrl: undefined,
  lastFrameUrl: undefined,
  duration: '5s',
  cameraMotion: 'pan_right',
  seed: 38291,
};

const INITIAL_GALLERY: GeneratedImage[] = [
  {
    id: 'img-1',
    prompt: 'Bioluminescent deep sea leviathan swimming past ancient submerged gothic ruins, ethereal blue-teal caustics, cinematic lighting',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    modelId: 'flux-dev',
    aspectRatio: '16:9',
    steps: 32,
    guidanceScale: 8.0,
    seed: 948271,
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'img-2',
    prompt: 'Portrait of an android botanist nurturing glowing crystal flora in a zero-gravity geodesic greenhouse, specular reflections',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    modelId: 'stable-diffusion-xl',
    aspectRatio: '1:1',
    steps: 30,
    guidanceScale: 7.0,
    seed: 102948,
    createdAt: Date.now() - 7200000,
  }
];

const INITIAL_VIDEO_JOBS: VideoJob[] = [
  {
    id: 'vid-demo-1',
    mode: 'text-to-video',
    modelId: 'kling-v1.5-pro',
    prompt: 'Cinematic fly-through of a cyberpunk alleyway with neon signs reflecting in rain puddles and steam rising from vents',
    status: 'completed',
    progress: 100,
    statusMessage: 'Ready to stream & export',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    duration: '5s',
    cameraMotion: 'pan_right',
    createdAt: Date.now() - 14400000,
    completedAt: Date.now() - 14350000,
  }
];

const INITIAL_CHAT_SESSION: ChatSession = {
  id: 'session-default-1',
  userId: 'user-sobir',
  title: 'Yangi suhbat',
  createdAt: Date.now() - 3600000,
  updatedAt: Date.now() - 100000,
  modelA: 'gpt-5.6-sol',
  modelB: 'gpt-6-astra',
  isDualView: false,
  messagesA: [],
  messagesB: [],
};

export const useNexusStore = create<NexusState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'dark',
      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
          }
        }
        set({ theme });
      },
      toggleTheme: () => {
        const nextTheme: AppTheme = get().theme === 'dark' ? 'light' : 'dark';
        if (typeof document !== 'undefined') {
          if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
          }
        }
        set({ theme: nextTheme });
      },

      // Auth & Multi-User Platform
      currentUser: INITIAL_ANONYMOUS_USER,
      registeredUsers: [],
      isAuthModalOpen: true,
      setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
      isGoogleWelcomeOpen: false,
      setGoogleWelcomeOpen: (open) => set({ isGoogleWelcomeOpen: open }),

      fetchServerUsers: async () => {
        try {
          const res = await fetch('/api/auth/users');
          if (res.ok) {
            const users = await res.json();
            if (Array.isArray(users) && users.length > 0) {
              set({ registeredUsers: users });
            }
          }
        } catch (e) {
          console.warn("Could not fetch server users:", e);
        }
      },

      refreshUserAndCredits: async () => {
        try {
          const userId = get().currentUser.id;
          const [resCredits, resGallery, resVideos] = await Promise.allSettled([
            fetch('/api/credits/balance', { headers: { 'x-user-id': userId } }),
            fetch('/api/gallery', { headers: { 'x-user-id': userId } }),
            fetch('/api/video/jobs', { headers: { 'x-user-id': userId } })
          ]);

          if (resCredits.status === 'fulfilled' && resCredits.value.ok) {
            const data = await resCredits.value.json();
            set({
              creditBalance: data.creditBalance,
              transactions: data.transactions,
            });
          }

          if (resGallery.status === 'fulfilled' && resGallery.value.ok) {
            const serverGallery = await resGallery.value.json();
            if (Array.isArray(serverGallery)) {
              set({ gallery: serverGallery });
            }
          }

          if (resVideos.status === 'fulfilled' && resVideos.value.ok) {
            const serverVideos = await resVideos.value.json();
            if (Array.isArray(serverVideos)) {
              set({ videoJobs: serverVideos });
            }
          }
        } catch (e) {
          // silent fallback
        }
      },

      loginUser: async (email, password, name) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.error || 'Kirishda xatolik yuz berdi' };
          }

          const user: UserProfile = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            credits: data.user.credits,
            createdAt: data.user.createdAt,
            isLoggedIn: true,
          };

          const updatedUsers = get().registeredUsers.some(u => u.id === user.id)
            ? get().registeredUsers.map(u => u.id === user.id ? user : u)
            : [...get().registeredUsers, user];

          set({
            currentUser: user,
            creditBalance: user.credits,
            registeredUsers: updatedUsers,
            isAuthModalOpen: false,
          });

          // Switch to user's chat sessions
          const userSessions = get().chatSessions.filter((s) => s.userId === user.id);
          if (userSessions.length > 0) {
            get().switchChatSession(userSessions[0].id);
          } else {
            get().createNewChat();
          }

          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      },

      registerUser: async (name, email, password) => {
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.error || "Ro'yxatdan o'tishda xatolik" };
          }

          const user: UserProfile = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            credits: data.user.credits,
            createdAt: data.user.createdAt,
            isLoggedIn: true,
          };

          set({
            currentUser: user,
            creditBalance: user.credits,
            registeredUsers: [...get().registeredUsers, user],
            isAuthModalOpen: false,
          });

          get().createNewChat();
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      },

      loginWithGoogle: async (email: string, name?: string, avatarUrl?: string) => {
        try {
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, avatarUrl }),
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.error || 'Google bilan kirishda xatolik yuz berdi' };
          }

          const user: UserProfile = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            credits: data.user.credits,
            createdAt: data.user.createdAt,
            avatar: data.user.avatarUrl,
            isGoogleAuth: true,
            isLoggedIn: true,
          };

          const updatedUsers = get().registeredUsers.some(u => u.id === user.id)
            ? get().registeredUsers.map(u => u.id === user.id ? user : u)
            : [...get().registeredUsers, user];

          set({
            currentUser: user,
            creditBalance: user.credits,
            registeredUsers: updatedUsers,
            isGoogleWelcomeOpen: false,
            isAuthModalOpen: false,
          });

          get().fetchDeepMemory();
          const userSessions = get().chatSessions.filter((s) => s.userId === user.id);
          if (userSessions.length > 0) {
            get().switchChatSession(userSessions[0].id);
          } else {
            get().createNewChat();
          }

          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      },

      switchUser: (userId) => {
        const user = get().registeredUsers.find((u) => u.id === userId);
        if (user) {
          const userSessions = get().chatSessions.filter((s) => s.userId === user.id);
          if (userSessions.length > 0) {
            const first = userSessions[0];
            set({
              currentUser: user,
              creditBalance: user.credits,
              activeSessionId: first.id,
              messagesA: first.messagesA,
              messagesB: first.messagesB,
              chatModelA: first.modelA,
              chatModelB: first.modelB,
              isDualView: first.isDualView,
            });
          } else {
            const newSession: ChatSession = {
              id: `session-${Date.now()}`,
              userId: user.id,
              title: 'Yangi suhbat',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              modelA: 'gpt-5.6-sol',
              modelB: 'gemini-2-5-flash',
              isDualView: false,
              messagesA: [],
              messagesB: [],
            };
            set({
              currentUser: user,
              creditBalance: user.credits,
              chatSessions: [newSession, ...get().chatSessions],
              activeSessionId: newSession.id,
              messagesA: [],
              messagesB: [],
            });
          }
          get().refreshUserAndCredits();
        }
      },

      logoutUser: () => {
        set({
          currentUser: INITIAL_ANONYMOUS_USER,
          creditBalance: 0,
          messagesA: [],
          messagesB: [],
          isAuthModalOpen: true,
        });
      },

      // Navigation & Sidebar
      currentTab: 'chat',
      setCurrentTab: (tab) => set({ currentTab: tab }),
      isSidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
      isMobileSidebarOpen: false,
      setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
      workspaces: [
        { id: 'ws-prod', name: 'Production AI Workspace', role: 'Owner', plan: 'Scale Tier' },
        { id: 'ws-proto', name: 'Prototyping Sandbox', role: 'Admin', plan: 'Pro' },
      ],
      activeWorkspace: { id: 'ws-prod', name: 'Production AI Workspace', role: 'Owner', plan: 'Scale Tier' },
      setActiveWorkspace: (ws) => set({ activeWorkspace: ws }),
      isCommandMenuOpen: false,
      setCommandMenuOpen: (open) => set({ isCommandMenuOpen: open }),
      isBillingModalOpen: false,
      setBillingModalOpen: (open) => set({ isBillingModalOpen: open }),

      // Credits & Billing
      creditBalance: 50,
      transactions: [
        {
          id: 'tx-init',
          amount: 50,
          balanceAfter: 50,
          reason: "Boshlang'ich bonus paket (+50 kredit)",
          type: 'addition',
          timestamp: Date.now() - 86400000,
        },
      ],
      deductCredits: (amount, reason) => {
        let current = get().creditBalance;
        if (current < amount) {
          if (get().currentUser?.id === 'user-guest' || !get().currentUser?.isLoggedIn) {
            current = 100;
          } else {
            return false;
          }
        }
        const newBalance = current - amount;
        const newTx: CreditTransaction = {
          id: `tx-${Date.now()}`,
          amount: -amount,
          balanceAfter: newBalance,
          reason,
          type: 'deduction',
          timestamp: Date.now(),
        };
        const currentU = get().currentUser;
        const updatedUsers = get().registeredUsers.map((u) =>
          u.id === currentU.id ? { ...u, credits: newBalance } : u
        );
        set({
          creditBalance: newBalance,
          transactions: [newTx, ...get().transactions],
          registeredUsers: updatedUsers,
          currentUser: { ...currentU, credits: newBalance },
        });
        return true;
      },

      refundCredits: (amount, reason) => {
        const newBalance = get().creditBalance + amount;
        const newTx: CreditTransaction = {
          id: `tx-ref-${Date.now()}`,
          amount,
          balanceAfter: newBalance,
          reason: `Qaytarildi: ${reason}`,
          type: 'addition',
          timestamp: Date.now(),
        };
        const currentU = get().currentUser;
        const updatedUsers = get().registeredUsers.map((u) =>
          u.id === currentU.id ? { ...u, credits: newBalance } : u
        );
        set({
          creditBalance: newBalance,
          transactions: [newTx, ...get().transactions],
          registeredUsers: updatedUsers,
          currentUser: { ...currentU, credits: newBalance },
        });
      },

      addCredits: async (amount, reason) => {
        try {
          const res = await fetch('/api/credits/topup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': get().currentUser.id,
            },
            body: JSON.stringify({ amount, reason }),
          });
          if (res.ok) {
            const data = await res.json();
            const currentU = get().currentUser;
            const updatedUsers = get().registeredUsers.map((u) =>
              u.id === currentU.id ? { ...u, credits: data.newBalance } : u
            );
            set({
              creditBalance: data.newBalance,
              transactions: data.transactions,
              registeredUsers: updatedUsers,
              currentUser: { ...currentU, credits: data.newBalance },
            });
            return;
          }
        } catch (e) {
          console.warn("Credit topup fallback:", e);
        }

        // Local fallback if offline
        const newBalance = get().creditBalance + amount;
        const newTx: CreditTransaction = {
          id: `tx-${Date.now()}`,
          amount,
          balanceAfter: newBalance,
          reason,
          type: 'addition',
          timestamp: Date.now(),
        };
        const currentU = get().currentUser;
        const updatedUsers = get().registeredUsers.map((u) =>
          u.id === currentU.id ? { ...u, credits: newBalance } : u
        );
        set({
          creditBalance: newBalance,
          transactions: [newTx, ...get().transactions],
          registeredUsers: updatedUsers,
          currentUser: { ...currentU, credits: newBalance },
        });
      },

      // Cross-Model Deep Memory & Project Context
      isMemoryDrawerOpen: false,
      setMemoryDrawerOpen: (open) => set({ isMemoryDrawerOpen: open }),
      deepMemory: null,
      fetchDeepMemory: async () => {
        try {
          const res = await fetch('/api/memory', {
            headers: { 'x-user-id': get().currentUser.id }
          });
          if (res.ok) {
            const data = await res.json();
            set({ deepMemory: data });
          }
        } catch (e) {
          console.warn("Could not fetch deep memory:", e);
        }
      },
      updateDeepMemory: async (updates) => {
        try {
          const res = await fetch('/api/memory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': get().currentUser.id
            },
            body: JSON.stringify(updates)
          });
          if (res.ok) {
            const data = await res.json();
            set({ deepMemory: data });
          }
        } catch (e) {
          console.warn("Could not update deep memory:", e);
        }
      },
      clearDeepMemory: async () => {
        try {
          const res = await fetch('/api/memory', {
            method: 'DELETE',
            headers: { 'x-user-id': get().currentUser.id }
          });
          if (res.ok) {
            const data = await res.json();
            set({ deepMemory: data });
          }
        } catch (e) {
          console.warn("Could not clear deep memory:", e);
        }
      },

      // Chat Sessions & Search Management
      searchChatQuery: '',
      setSearchChatQuery: (query) => set({ searchChatQuery: query }),
      chatSessions: [INITIAL_CHAT_SESSION],
      activeSessionId: INITIAL_CHAT_SESSION.id,
      createNewChat: () => {
        const currentU = get().currentUser;
        const newSession: ChatSession = {
          id: `session-${Date.now()}`,
          userId: currentU.id,
          title: 'Yangi suhbat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          modelA: get().chatModelA,
          modelB: get().chatModelB,
          isDualView: get().isDualView,
          messagesA: [],
          messagesB: [],
        };
        set({
          chatSessions: [newSession, ...get().chatSessions],
          activeSessionId: newSession.id,
          messagesA: [],
          messagesB: [],
          currentTab: 'chat',
        });

        // Sync with backend
        fetch('/api/chat/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentU.id
          },
          body: JSON.stringify(newSession)
        }).catch(() => {});
      },

      switchChatSession: (sessionId) => {
        const target = get().chatSessions.find((s) => s.id === sessionId);
        if (target) {
          set({
            activeSessionId: target.id,
            messagesA: target.messagesA,
            messagesB: target.messagesB,
            chatModelA: target.modelA || get().chatModelA,
            chatModelB: target.modelB || get().chatModelB,
            isDualView: target.isDualView ?? false,
            currentTab: 'chat',
          });
        }
      },

      deleteChatSession: (sessionId) => {
        const filtered = get().chatSessions.filter((s) => s.id !== sessionId);
        if (get().activeSessionId === sessionId) {
          if (filtered.length > 0) {
            const next = filtered[0];
            set({
              chatSessions: filtered,
              activeSessionId: next.id,
              messagesA: next.messagesA,
              messagesB: next.messagesB,
            });
          } else {
            get().createNewChat();
          }
        } else {
          set({ chatSessions: filtered });
        }

        fetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' }).catch(() => {});
      },

      renameChatSession: (sessionId, newTitle) => {
        set({
          chatSessions: get().chatSessions.map((s) =>
            s.id === sessionId ? { ...s, title: newTitle, updatedAt: Date.now() } : s
          ),
        });
      },

      // Active Chat State (Primary Models: GPT-5.6 Sol & GPT-6 Astra)
      chatModelA: 'gpt-5.6-sol',
      chatModelB: 'gpt-6-astra',
      setChatModelA: (modelId) => {
        set({ chatModelA: modelId });
        const activeId = get().activeSessionId;
        set({
          chatSessions: get().chatSessions.map((s) =>
            s.id === activeId ? { ...s, modelA: modelId, updatedAt: Date.now() } : s
          ),
        });
      },
      setChatModelB: (modelId) => {
        set({ chatModelB: modelId });
        const activeId = get().activeSessionId;
        set({
          chatSessions: get().chatSessions.map((s) =>
            s.id === activeId ? { ...s, modelB: modelId, updatedAt: Date.now() } : s
          ),
        });
      },
      isDualView: false,
      setDualView: (enabled) => {
        set({ isDualView: enabled });
        const activeId = get().activeSessionId;
        set({
          chatSessions: get().chatSessions.map((s) =>
            s.id === activeId ? { ...s, isDualView: enabled, updatedAt: Date.now() } : s
          ),
        });
      },
      messagesA: INITIAL_CHAT_SESSION.messagesA,
      messagesB: INITIAL_CHAT_SESSION.messagesB,
      addChatMessage: (pane, message) => {
        const activeId = get().activeSessionId;
        let newMsgsA = get().messagesA;
        let newMsgsB = get().messagesB;

        if (pane === 'A') {
          newMsgsA = [...newMsgsA, message];
          set({ messagesA: newMsgsA });
        } else {
          newMsgsB = [...newMsgsB, message];
          set({ messagesB: newMsgsB });
        }

        // Auto-title if it's the first user message
        const currentSession = get().chatSessions.find((s) => s.id === activeId);
        let title = currentSession?.title || 'Yangi suhbat';
        if (message.role === 'user' && (title === 'Yangi suhbat' || !title)) {
          title = message.content.slice(0, 32).trim() + (message.content.length > 32 ? '...' : '');
        }

        const updatedSessions = get().chatSessions.map((s) =>
          s.id === activeId
            ? {
                ...s,
                title,
                messagesA: newMsgsA,
                messagesB: newMsgsB,
                updatedAt: Date.now(),
              }
            : s
        );

        set({ chatSessions: updatedSessions });

        // Sync active session with server
        const activeSession = updatedSessions.find(s => s.id === activeId);
        if (activeSession) {
          fetch('/api/chat/sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': get().currentUser.id,
            },
            body: JSON.stringify(activeSession)
          }).catch(() => {});
        }
      },

      updateChatMessage: (pane, id, content, latencyMs) => {
        const activeId = get().activeSessionId;
        let updatedA = get().messagesA;
        let updatedB = get().messagesB;

        if (pane === 'A') {
          updatedA = updatedA.map((m) =>
            m.id === id ? { ...m, content, isStreaming: latencyMs === undefined, latencyMs: latencyMs ?? m.latencyMs } : m
          );
          set({ messagesA: updatedA });
        } else {
          updatedB = updatedB.map((m) =>
            m.id === id ? { ...m, content, isStreaming: latencyMs === undefined, latencyMs: latencyMs ?? m.latencyMs } : m
          );
          set({ messagesB: updatedB });
        }

        // Performance optimization: Only update chatSessions and persist to localStorage
        // when streaming completes (latencyMs !== undefined). Doing this on every micro-chunk
        // freezes the UI thread with repetitive JSON.stringify and synchronous localStorage writes.
        if (latencyMs !== undefined) {
          const updatedSessions = get().chatSessions.map((s) =>
            s.id === activeId
              ? {
                  ...s,
                  messagesA: updatedA,
                  messagesB: updatedB,
                  updatedAt: Date.now(),
                }
              : s
          );

          set({ chatSessions: updatedSessions });

          const activeSession = updatedSessions.find(s => s.id === activeId);
          if (activeSession) {
            fetch('/api/chat/sessions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': get().currentUser.id,
              },
              body: JSON.stringify(activeSession)
            }).catch(() => {});
          }
        }
      },

      clearChat: () => {
        const activeId = get().activeSessionId;
        set({ messagesA: [], messagesB: [] });
        set({
          chatSessions: get().chatSessions.map((s) =>
            s.id === activeId ? { ...s, messagesA: [], messagesB: [], updatedAt: Date.now() } : s
          ),
        });
      },

      // Image Studio
      imageParams: INITIAL_IMAGE_PARAMS,
      setImageParams: (params) =>
        set({ imageParams: { ...get().imageParams, ...params } }),
      gallery: INITIAL_GALLERY,
      addImageToGallery: (image) =>
        set({ gallery: [image, ...get().gallery] }),
      selectedImageForInpaint: null,
      setSelectedImageForInpaint: (image) => set({ selectedImageForInpaint: image }),
      upscaleImage: (id, factor) => {
        set({
          gallery: get().gallery.map((img) =>
            img.id === id ? { ...img, upscaled: true, upscaleFactor: factor } : img
          ),
        });
      },
      sendToVideoLab: (imageUrl, prompt) => {
        set({
          currentTab: 'video',
          videoParams: {
            ...get().videoParams,
            mode: 'image-to-video',
            firstFrameUrl: imageUrl,
            prompt: prompt || get().videoParams.prompt,
          },
        });
      },

      // Video Lab
      videoParams: INITIAL_VIDEO_PARAMS,
      setVideoParams: (params) =>
        set({ videoParams: { ...get().videoParams, ...params } }),
      videoJobs: INITIAL_VIDEO_JOBS,
      addVideoJob: (job) =>
        set({ videoJobs: [job, ...get().videoJobs] }),
      updateVideoJob: (id, updates) =>
        set({
          videoJobs: get().videoJobs.map((j) =>
            j.id === id ? { ...j, ...updates } : j
          ),
        }),

      // Pipeline
      activePipeline: null,
      setActivePipeline: (pipeline) => set({ activePipeline: pipeline }),
      updatePipelineScene: (sceneId, updates) => {
        const currentPipeline = get().activePipeline;
        if (!currentPipeline) return;
        set({
          activePipeline: {
            ...currentPipeline,
            scenes: currentPipeline.scenes.map((s) =>
              s.id === sceneId ? { ...s, ...updates } : s
            ),
          },
        });
      },

      // Custom API & Provider Config (User Configurable)
      customBaseUrl: '',
      setCustomBaseUrl: (url) => set({ customBaseUrl: url }),
      customModelName: '',
      setCustomModelName: (model) => set({ customModelName: model }),
      openAiApiKey: '',
      setOpenAiApiKey: (key) => set({ openAiApiKey: key }),
      geminiApiKey: '',
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      openRouterApiKey: '',
      setOpenRouterApiKey: (key) => set({ openRouterApiKey: key }),
      isApiKeyModalOpen: false,
      setApiKeyModalOpen: (open) => set({ isApiKeyModalOpen: open }),
    }),
    {
      name: 'renax-ai-user-store-v5',
      partialize: (state) => ({
        theme: state.theme,
        currentUser: state.currentUser,
        registeredUsers: state.registeredUsers,
        chatSessions: (state.chatSessions || []).map((session) => ({
          ...session,
          messagesA: (session.messagesA || []).map((m) =>
            m.attachment?.base64 && m.attachment.base64.length > 2000
              ? { ...m, attachment: { ...m.attachment, base64: '' } }
              : m
          ),
          messagesB: (session.messagesB || []).map((m) =>
            m.attachment?.base64 && m.attachment.base64.length > 2000
              ? { ...m, attachment: { ...m.attachment, base64: '' } }
              : m
          ),
        })),
        activeSessionId: state.activeSessionId,
        creditBalance: state.creditBalance,
        transactions: state.transactions,
        gallery: (state.gallery || []).slice(0, 30).map((img) => ({
          ...img,
          referenceMediaUrl: img.referenceMediaUrl?.startsWith('data:') ? undefined : img.referenceMediaUrl,
          referenceMedia: img.referenceMedia ? { ...img.referenceMedia, url: '' } : undefined,
        })),
        videoJobs: (state.videoJobs || []).slice(0, 20).map((job) => ({
          ...job,
          referenceVideoUrl: job.referenceVideoUrl?.startsWith('data:') ? undefined : job.referenceVideoUrl,
          firstFrameUrl: job.firstFrameUrl?.startsWith('data:') ? undefined : job.firstFrameUrl,
        })),
        chatModelA: state.chatModelA,
        chatModelB: state.chatModelB,
        isDualView: state.isDualView,
        geminiApiKey: state.geminiApiKey,
        openRouterApiKey: state.openRouterApiKey,
        openAiApiKey: state.openAiApiKey,
        customBaseUrl: state.customBaseUrl,
        customModelName: state.customModelName,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If user is not logged in or has empty id, require registration / login
          if (!state.currentUser?.isLoggedIn || !state.currentUser?.id) {
            state.currentUser = INITIAL_ANONYMOUS_USER;
            state.isAuthModalOpen = true;
          }
          const active = state.chatSessions?.find((s) => s.id === state.activeSessionId && s.userId === state.currentUser?.id);
          if (active) {
            state.messagesA = active.messagesA || [];
            state.messagesB = active.messagesB || [];
            state.chatModelA = active.modelA || state.chatModelA;
            state.chatModelB = active.modelB || state.chatModelB;
            state.isDualView = active.isDualView ?? state.isDualView;
          } else {
            state.messagesA = [];
            state.messagesB = [];
          }
        }
      },
    }
  )
);
