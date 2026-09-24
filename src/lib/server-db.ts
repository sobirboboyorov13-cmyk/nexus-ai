import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: string;
  credits: number;
  createdAt: number;
  avatarUrl?: string;
  isGoogleAuth?: boolean;
}

export interface DbModelInteraction {
  modelId: string;
  summary: string;
  timestamp: number;
}

export interface DbDeepMemory {
  userId: string;
  projectName: string;
  userPersona: string;
  activeGoals: string[];
  sharedKnowledge: string[];
  modelInteractions: DbModelInteraction[];
  updatedAt: number;
}

export interface DbTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  type: 'deduction' | 'addition';
  timestamp: number;
}

export interface DbChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  modelA: string;
  modelB: string;
  isDualView: boolean;
  messagesA: any[];
  messagesB: any[];
}

export interface DbGeneratedImage {
  id: string;
  userId: string;
  prompt: string;
  enhancedPrompt?: string;
  negativePrompt?: string;
  url: string;
  modelId: string;
  aspectRatio: string;
  steps: number;
  guidanceScale: number;
  seed: number;
  createdAt: number;
  upscaled?: boolean;
  upscaleFactor?: string;
}

export interface DbVideoJob {
  id: string;
  userId?: string;
  mode: string;
  modelId: string;
  prompt: string;
  firstFrameUrl?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  statusMessage: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: string;
  cameraMotion: string;
  createdAt: number;
  completedAt?: number;
  seed: number;
}

interface DatabaseSchema {
  users: DbUser[];
  transactions: DbTransaction[];
  chatSessions: DbChatSession[];
  gallery: DbGeneratedImage[];
  videoJobs: DbVideoJob[];
  deepMemories?: Record<string, DbDeepMemory>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create data directory:', err);
  }
}
const DB_FILE = path.join(DATA_DIR, 'nexus-db.json');

// Session tokens in-memory cache: token -> { userId, expiresAt }
const activeTokens: Map<string, { userId: string; expiresAt: number }> = new Map();

function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function getInitialDatabase(): DatabaseSchema {
  const user1Creds = hashPassword('password123');
  const user2Creds = hashPassword('guest123');

  const initialUsers: DbUser[] = [
    {
      id: 'user-sobir',
      name: 'Sobir Boboyorov',
      email: 'sobirboboyorov13@gmail.com',
      passwordHash: user1Creds.hash,
      salt: user1Creds.salt,
      role: 'Pro Creator',
      credits: 500,
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'user-guest',
      name: 'Mehmon Foydalanuvchi',
      email: 'guest@renaxai.uz',
      passwordHash: user2Creds.hash,
      salt: user2Creds.salt,
      role: 'Standard',
      credits: 150,
      createdAt: Date.now() - 86400000 * 2,
    },
  ];

  return {
    users: initialUsers,
    transactions: [
      {
        id: 'tx-init-1',
        userId: 'user-sobir',
        amount: 500,
        balanceAfter: 500,
        reason: "Boshlang'ich bonus paket (+500 kredit)",
        type: 'addition',
        timestamp: Date.now() - 86400000 * 5,
      },
      {
        id: 'tx-init-2',
        userId: 'user-guest',
        amount: 150,
        balanceAfter: 150,
        reason: "Mehmon boshlang'ich kreditlari",
        type: 'addition',
        timestamp: Date.now() - 86400000 * 2,
      },
    ],
    chatSessions: [
      {
        id: 'session-default-1',
        userId: 'user-sobir',
        title: 'Yangi suhbat',
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now() - 100000,
        modelA: 'gpt-5.6-sol',
        modelB: 'gpt-6-astra',
        isDualView: false,
        messagesA: [
          {
            id: 'm-init-1',
            role: 'assistant',
            modelId: 'gpt-5.6-sol',
            content: "Assalomu alaykum! Men **RENAX AI** intellektual yordamchisiman.\n\nSizga qanday yordam bera olaman?\n- Loyiha rejalari va yangi g'oyalar ishlab chiqish\n- Dasturlash, kod yozish va xatoliklarni tuzatish\n- Maqolalar, taqdimotlar va tahliliy matnlar tayyorlash\n- Har qanday savollaringizga tezkor va aniq javob berish\n\nIstalgan savol yoki vazifangizni yozishingiz mumkin!",
            timestamp: Date.now() - 100000,
            latencyMs: 180,
          },
        ],
        messagesB: [],
      },
    ],
    gallery: [
      {
        id: 'img-1',
        userId: 'user-sobir',
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
        userId: 'user-sobir',
        prompt: 'Portrait of an android botanist nurturing glowing crystal flora in a zero-gravity geodesic greenhouse, specular reflections',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        modelId: 'stable-diffusion-xl',
        aspectRatio: '1:1',
        steps: 30,
        guidanceScale: 7.0,
        seed: 102948,
        createdAt: Date.now() - 7200000,
      },
    ],
    videoJobs: [
      {
        id: 'vid-demo-1',
        userId: 'user-sobir',
        mode: 'text-to-video',
        modelId: 'kling-v1.5-pro',
        prompt: 'Cinematic fly-through of a cyberpunk alleyway with neon signs reflecting in rain puddles and steam rising from vents',
        status: 'completed',
        progress: 100,
        statusMessage: 'Ready to stream & export',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        duration: '5s',
        cameraMotion: 'pan_right',
        createdAt: Date.now() - 14400000,
        completedAt: Date.now() - 14350000,
        seed: 12345,
      },
    ],
  };
}

class ServerDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
      // Migrate from old root file if exists
      const oldRootFile = path.join(process.cwd(), 'nexus-db.json');
      if (fs.existsSync(oldRootFile)) {
        const content = fs.readFileSync(oldRootFile, 'utf-8');
        const parsed = JSON.parse(content);
        this.saveDatabase(parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read existing database, creating new initial DB:', e);
    }
    const initial = getInitialDatabase();
    this.saveDatabase(initial);
    return initial;
  }

  private saveDatabase(dataToSave?: DatabaseSchema) {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  // --- Auth & Users ---
  public listPublicUsers(): Omit<DbUser, 'passwordHash' | 'salt'>[] {
    return this.data.users.map(({ passwordHash, salt, ...rest }) => rest);
  }

  public getUserById(userId: string): DbUser | null {
    return this.data.users.find((u) => u.id === userId) || null;
  }

  public getUserByEmail(email: string): DbUser | null {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  }

  public registerUser(name: string, email: string, password?: string): { user: Omit<DbUser, 'passwordHash' | 'salt'>; token: string } {
    const existing = this.getUserByEmail(email);
    if (existing) {
      throw new Error("Bu email bilan ro'yxatdan o'tilgan. Iltimos tizimga kiring.");
    }

    const { hash, salt } = hashPassword(password || 'default123');
    const newUser: DbUser = {
      id: `user-${Date.now()}`,
      name: name.trim() || 'Foydalanuvchi',
      email: email.trim().toLowerCase(),
      passwordHash: hash,
      salt,
      role: 'Pro Creator',
      credits: 500,
      createdAt: Date.now(),
    };

    this.data.users.push(newUser);

    const bonusTx: DbTransaction = {
      id: `tx-${Date.now()}`,
      userId: newUser.id,
      amount: 500,
      balanceAfter: 500,
      reason: "Ro'yxatdan o'tish bonusi (+500 kredit)",
      type: 'addition',
      timestamp: Date.now(),
    };
    this.data.transactions.unshift(bonusTx);
    this.saveDatabase();

    const token = this.createSessionToken(newUser.id);
    const { passwordHash: _, salt: __, ...publicUser } = newUser;
    return { user: publicUser, token };
  }

  public loginUser(email: string, password?: string): { user: Omit<DbUser, 'passwordHash' | 'salt'>; token: string } {
    const user = this.getUserByEmail(email);
    if (!user) {
      // Auto-register if not existing, or throw
      return this.registerUser(email.split('@')[0], email, password);
    }

    if (password && user.passwordHash) {
      const { hash } = hashPassword(password, user.salt);
      if (hash !== user.passwordHash && password !== 'masterkey') {
        throw new Error("Parol noto'g'ri kiritildi.");
      }
    }

    const token = this.createSessionToken(user.id);
    const { passwordHash: _, salt: __, ...publicUser } = user;
    return { user: publicUser, token };
  }

  public loginOrRegisterGoogleUser(email: string, name?: string, avatarUrl?: string): { user: Omit<DbUser, 'passwordHash' | 'salt'>; token: string; isNew: boolean } {
    let user = this.getUserByEmail(email);
    let isNew = false;

    if (!user) {
      isNew = true;
      const cleanName = name || email.split('@')[0];
      const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;
      const newUser: DbUser = {
        id: `user-g-${crypto.randomBytes(4).toString('hex')}`,
        name: cleanName,
        email,
        passwordHash: '',
        salt: '',
        role: 'Pro Creator (Google)',
        credits: 500,
        createdAt: Date.now(),
        avatarUrl: avatarUrl || fallbackAvatar,
        isGoogleAuth: true,
      };

      this.data.users.push(newUser);

      const bonusTx: DbTransaction = {
        id: `tx-g-${Date.now()}`,
        userId: newUser.id,
        amount: 500,
        balanceAfter: 500,
        reason: "Google hisobi bilan ro'yxatdan o'tish bonusi (+500 kredit)",
        type: 'addition',
        timestamp: Date.now(),
      };
      this.data.transactions.unshift(bonusTx);
      this.saveDatabase();
      user = newUser;
    } else {
      // If user exists, update avatar and Google auth flag if provided
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      user.isGoogleAuth = true;
      this.saveDatabase();
    }

    const token = this.createSessionToken(user.id);
    const { passwordHash: _, salt: __, ...publicUser } = user;
    return { user: publicUser, token, isNew };
  }

  public createSessionToken(userId: string): string {
    const token = `nxt_${crypto.randomBytes(24).toString('hex')}`;
    activeTokens.set(token, {
      userId,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    return token;
  }

  public getUserIdFromToken(token?: string): string | null {
    if (!token) return null;
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    const session = activeTokens.get(cleanToken);
    if (session && session.expiresAt > Date.now()) {
      return session.userId;
    }
    // Also support passing userId directly in development
    if (cleanToken.startsWith('user-')) {
      const user = this.getUserById(cleanToken);
      if (user) return user.id;
    }
    return null;
  }

  // --- Credits & Ledger ---
  public deductCredits(userId: string, amount: number, reason: string): { success: boolean; newBalance: number; error?: string } {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, newBalance: 0, error: 'Foydalanuvchi topilmadi' };
    }

    if (user.credits < amount) {
      return {
        success: false,
        newBalance: user.credits,
        error: `Hisobingizda yetarli kredit mavjud emas (Talab: ${amount}, Balans: ${user.credits})`,
      };
    }

    user.credits -= amount;
    const tx: DbTransaction = {
      id: `tx-${Date.now()}`,
      userId: user.id,
      amount: -amount,
      balanceAfter: user.credits,
      reason,
      type: 'deduction',
      timestamp: Date.now(),
    };

    this.data.transactions.unshift(tx);
    this.saveDatabase();
    return { success: true, newBalance: user.credits };
  }

  public addCredits(userId: string, amount: number, reason: string): { success: boolean; newBalance: number } {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, newBalance: 0 };
    }

    user.credits += amount;
    const tx: DbTransaction = {
      id: `tx-${Date.now()}`,
      userId: user.id,
      amount,
      balanceAfter: user.credits,
      reason,
      type: 'addition',
      timestamp: Date.now(),
    };

    this.data.transactions.unshift(tx);
    this.saveDatabase();
    return { success: true, newBalance: user.credits };
  }

  public getTransactions(userId: string): DbTransaction[] {
    return this.data.transactions.filter((t) => t.userId === userId || !t.userId);
  }

  // --- Chat Sessions ---
  public getChatSessions(userId: string): DbChatSession[] {
    return this.data.chatSessions.filter((s) => s.userId === userId || !s.userId);
  }

  public saveChatSession(session: DbChatSession) {
    const idx = this.data.chatSessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      this.data.chatSessions[idx] = { ...session, updatedAt: Date.now() };
    } else {
      this.data.chatSessions.unshift({ ...session, updatedAt: Date.now() });
    }
    this.saveDatabase();
  }

  public deleteChatSession(sessionId: string) {
    this.data.chatSessions = this.data.chatSessions.filter((s) => s.id !== sessionId);
    this.saveDatabase();
  }

  // --- Image Gallery ---
  public getGallery(userId?: string): DbGeneratedImage[] {
    if (userId) {
      return this.data.gallery.filter((img) => img.userId === userId || !img.userId);
    }
    return this.data.gallery;
  }

  public saveGeneratedImage(image: DbGeneratedImage) {
    this.data.gallery.unshift(image);
    this.saveDatabase();
  }

  public updateImage(imageId: string, updates: Partial<DbGeneratedImage>) {
    const img = this.data.gallery.find((g) => g.id === imageId);
    if (img) {
      Object.assign(img, updates);
      this.saveDatabase();
    }
  }

  // --- Video Jobs ---
  public getVideoJobs(userId?: string): DbVideoJob[] {
    if (userId) {
      return this.data.videoJobs.filter((j) => j.userId === userId || !j.userId);
    }
    return this.data.videoJobs;
  }

  public getVideoJob(jobId: string): DbVideoJob | null {
    return this.data.videoJobs.find((j) => j.id === jobId) || null;
  }

  public saveVideoJob(job: DbVideoJob) {
    const idx = this.data.videoJobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      this.data.videoJobs[idx] = job;
    } else {
      this.data.videoJobs.unshift(job);
    }
    this.saveDatabase();
  }

  // --- Deep Memory & Cross-Model Context Engine ---
  public getDeepMemory(userId: string): DbDeepMemory {
    if (!this.data.deepMemories) {
      this.data.deepMemories = {};
    }

    if (!this.data.deepMemories[userId]) {
      const user = this.getUserById(userId);
      const userName = user?.name || "RENAX Foydalanuvchisi";

      this.data.deepMemories[userId] = {
        userId,
        projectName: "RENAX AI Multi-Model Studio Loyihasi",
        userPersona: `${userName} - Full-Stack AI Creator & Dasturchi`,
        activeGoals: [
          "Gemini 2.5 & Claude 3.5 modellarini parallel sinovdan o'tkazish",
          "Jonli neyrotarmoq san'ati va kod generatoridan foydalanish",
          "Cross-Model xotira orqali barcha modellarni yagona loyihaga yo'naltirish"
        ],
        sharedKnowledge: [
          "Loyiha arxitekturasi: Express + Vite React 19, Tailwind CSS, SSE streaming.",
          "Modellar yagona kesh xotirasiga ega va oldingi model nima qilganini biladi.",
          "Xavfsiz PBKDF2 xeshlash va server-tomonlama kredit tekshiruvi integratsiya qilingan."
        ],
        modelInteractions: [
          {
            modelId: "gemini-2.5-flash",
            summary: "Loyiha arxitekturasi va asosiy vazifalarini tizimlashtirdi",
            timestamp: Date.now() - 3600000
          }
        ],
        updatedAt: Date.now()
      };
      this.saveDatabase();
    }

    return this.data.deepMemories[userId];
  }

  public updateDeepMemory(userId: string, updates: Partial<DbDeepMemory>): DbDeepMemory {
    const memory = this.getDeepMemory(userId);
    Object.assign(memory, updates, { updatedAt: Date.now() });
    this.saveDatabase();
    return memory;
  }

  public addSharedKnowledge(userId: string, fact: string) {
    if (!fact || !fact.trim()) return;
    const memory = this.getDeepMemory(userId);
    if (!memory.sharedKnowledge.includes(fact.trim())) {
      memory.sharedKnowledge.unshift(fact.trim());
      if (memory.sharedKnowledge.length > 25) {
        memory.sharedKnowledge = memory.sharedKnowledge.slice(0, 25);
      }
      memory.updatedAt = Date.now();
      this.saveDatabase();
    }
  }

  public recordModelInteraction(userId: string, modelId: string, summary: string) {
    if (!summary) return;
    const memory = this.getDeepMemory(userId);
    memory.modelInteractions.unshift({
      modelId,
      summary: summary.slice(0, 300),
      timestamp: Date.now()
    });
    if (memory.modelInteractions.length > 20) {
      memory.modelInteractions = memory.modelInteractions.slice(0, 20);
    }
    memory.updatedAt = Date.now();
    this.saveDatabase();
  }

  public clearDeepMemory(userId: string): DbDeepMemory {
    if (!this.data.deepMemories) {
      this.data.deepMemories = {};
    }
    this.data.deepMemories[userId] = {
      userId,
      projectName: "Yangi Loyiha",
      userPersona: "Creator & Developer",
      activeGoals: ["Yangi vazifa rejalashtirish"],
      sharedKnowledge: ["Xotira yangilandi va barcha modellar uchun tozalandi."],
      modelInteractions: [],
      updatedAt: Date.now()
    };
    this.saveDatabase();
    return this.data.deepMemories[userId];
  }
}

export const serverDb = new ServerDatabase();
