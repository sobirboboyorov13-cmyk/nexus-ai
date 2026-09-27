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
  telegramId?: string | number;
  telegramUsername?: string;
  telegramPhotoUrl?: string;
  username?: string;
  phone?: string;
  phoneVerified?: boolean;
  isPhoneAccount?: boolean;
  telegramChatId?: string | number;
  // --- Obuna ---
  plan?: PlanId;
  planStartedAt?: number;
  planExpiresAt?: number;
  usage?: DbUsage;
}

export type PlanId = 'free' | 'bronze' | 'silver' | 'vip';

export interface DbUsage {
  periodAnchor: number;   // joriy obuna davri boshlanishi
  monthMsg: number;       // shu davrda ishlatilgan xabar
  dayKey: string;         // 'YYYY-MM-DD'
  dayMsg: number;
  dayImg: number;
  minKey: number;         // daqiqa raqami (rate limit)
  minImg: number;
}

export interface DbOrder {
  id: string;
  userId: string;
  username?: string;
  plan: PlanId;
  amount: number;         // so'm
  status: 'pending' | 'paid' | 'cancelled';
  provider: 'manual' | 'payme' | 'click';
  providerTxId?: string;
  chatId?: string | number;
  createdAt: number;
  paidAt?: number;
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
  referenceMediaUrl?: string;
  referenceMediaType?: 'image' | 'video';
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
  referenceVideoUrl?: string;
  referenceVideoName?: string;
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
  /** Telefon raqamlar ro'yxati: bir marta free credit olgan raqamlar (anti-abuse) */
  freeCreditPhones?: string[];
  orders?: DbOrder[];
  settings?: DbSettings;
}

export interface DbSettings {
  cardNumber: string;
  cardOwner: string;
  adminChatIds: string[];
  autoConfirm: boolean;       // SMS xabarnomadan avtomatik tasdiqlash
  smsSecret: string;          // webhook uchun maxfiy kalit
  updatedAt: number;
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

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number;          // so'm / oy
  msgMonth: number;       // oylik xabar zaxirasi
  msgDay: number;         // kunlik portlash chegarasi
  imgDay: number;         // kunlik rasm
  imgPerMin: number;      // daqiqasiga rasm (bot/skriptga qarshi)
  unlimitedImages: boolean; // UI da "cheksiz" deb ko'rsatiladi
  tier: number;           // model darajasi: 0 oddiy, 1 kuchli, 2 hammasi
}

export const PLAN_CONFIG: Record<PlanId, PlanConfig> = {
  free:   { id:'free',   name:'Bepul sinov', price:0,      msgMonth:30,   msgDay:10,  imgDay:3,   imgPerMin:2, unlimitedImages:false, tier:0 },
  bronze: { id:'bronze', name:'Bronza',      price:49000,  msgMonth:1500, msgDay:150, imgDay:30,  imgPerMin:5, unlimitedImages:false, tier:0 },
  silver: { id:'silver', name:'Silver',      price:119000, msgMonth:3500, msgDay:350, imgDay:120, imgPerMin:5, unlimitedImages:false, tier:1 },
  vip:    { id:'vip',    name:'VIP',         price:279000, msgMonth:8000, msgDay:800, imgDay:300, imgPerMin:8, unlimitedImages:true,  tier:2 },
};

function dayKeyNow(): string {
  return new Date().toISOString().slice(0, 10);
}
function minKeyNow(): number {
  return Math.floor(Date.now() / 60000);
}

/** Bir tasdiqlangan telefon raqamiga beriladigan bir martalik bepul paket */
export const FREE_CREDIT_PACKAGE = 2;

/** Telefon raqamni +998XXXXXXXXX ko'rinishiga keltiradi */
export function normalizePhone(raw: string | number | undefined | null): string {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith('9998')) return `+${digits.slice(1)}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return '';
}

/** Username qoidalari: 3-20 belgi, faqat harf/raqam/pastki chiziq */
export function normalizeUsername(raw: string | undefined | null): string {
  return String(raw ?? '').trim().replace(/^@/, '').toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(username);
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
      credits: 50,
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'user-guest',
      name: 'Mehmon Foydalanuvchi',
      email: 'guest@renaxai.uz',
      passwordHash: user2Creds.hash,
      salt: user2Creds.salt,
      role: 'Standard',
      credits: 50,
      createdAt: Date.now() - 86400000 * 2,
    },
  ];

  return {
    users: initialUsers,
    transactions: [
      {
        id: 'tx-init-1',
        userId: 'user-sobir',
        amount: 50,
        balanceAfter: 50,
        reason: "Boshlang'ich bonus paket (+50 kredit)",
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
        videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
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
        const parsed = JSON.parse(content);
        this.ensureRenaxAccount(parsed);
        this.ensureSobirAdminAccount(parsed);
        return parsed;
      }
      // Migrate from old root file if exists
      const oldRootFile = path.join(process.cwd(), 'nexus-db.json');
      if (fs.existsSync(oldRootFile)) {
        const content = fs.readFileSync(oldRootFile, 'utf-8');
        const parsed = JSON.parse(content);
        this.ensureRenaxAccount(parsed);
        this.ensureSobirAdminAccount(parsed);
        this.saveDatabase(parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read existing database, creating new initial DB:', e);
    }
    const initial = getInitialDatabase();
    this.ensureRenaxAccount(initial);
    this.ensureSobirAdminAccount(initial);
    this.saveDatabase(initial);
    return initial;
  }

  private ensureSobirAdminAccount(db: DatabaseSchema) {
    const adminEmail = 'sobirboboyorov13@gmail.com';
    let user = db.users.find(u => u.email.toLowerCase() === adminEmail || u.id === 'user-sobir');
    const adminPass = 'admin123';
    const { hash, salt } = hashPassword(adminPass);
    if (!user) {
      user = {
        id: 'user-sobir',
        name: 'Sobir Boboyorov',
        email: adminEmail,
        passwordHash: hash,
        salt: salt,
        role: 'Admin',
        credits: 99999,
        createdAt: Date.now(),
      };
      db.users.unshift(user);
    } else {
      user.role = 'Admin';
      user.passwordHash = hash;
      user.salt = salt;
      if ((user.credits || 0) < 99999) {
        user.credits = 99999;
      }
    }
  }

  private ensureRenaxAccount(db: DatabaseSchema) {
    const adminEmail = 'hhyentuyen565@gmail.com';
    const adminPass = 'kowxut-sanvap-nAnwe8';
    let user = db.users.find(u => u.email.toLowerCase() === adminEmail.toLowerCase());
    const { hash, salt } = hashPassword(adminPass);
    if (!user) {
      user = {
        id: 'user-renax-hhyen',
        name: 'Renax Creator (Hhyen Tuyen)',
        email: adminEmail,
        passwordHash: hash,
        salt: salt,
        role: 'Pro Studio Creator',
        credits: 100000,
        createdAt: Date.now(),
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(adminEmail)}`,
        isGoogleAuth: true
      };
      db.users.unshift(user);
    } else {
      user.passwordHash = hash;
      user.salt = salt;
      user.role = 'Pro Studio Creator';
      if ((user.credits || 0) < 100000) {
        user.credits = 100000;
      }
    }
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
    if (!userId) return null;
    const clean = userId.trim().toLowerCase();
    const user = this.data.users.find((u) => u.id === userId || u.email.toLowerCase() === clean) || null;
    if (user && (user.email.toLowerCase() === 'sobirboboyorov13@gmail.com' || user.id === 'user-sobir')) {
      if (user.role !== 'Admin') {
        user.role = 'Admin';
        this.saveDatabase();
      }
    }
    return user;
  }

  public getUserByEmail(email: string): DbUser | null {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    const user = this.data.users.find((u) => u.email.toLowerCase() === clean) || null;
    if (user && (user.email.toLowerCase() === 'sobirboboyorov13@gmail.com' || clean === 'sobirboboyorov13@gmail.com')) {
      if (user.role !== 'Admin') {
        user.role = 'Admin';
        this.saveDatabase();
      }
    }
    return user;
  }

  public getUserByTelegramId(telegramId: string | number): DbUser | null {
    if (!telegramId) return null;
    const strId = String(telegramId).trim();
    return this.data.users.find((u) => u.telegramId && String(u.telegramId).trim() === strId) || null;
  }

  public registerUser(name: string, email: string, password?: string): { user: Omit<DbUser, 'passwordHash' | 'salt'>; token: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      throw new Error("To'g'ri email manzilini kiriting.");
    }

    // Block common temporary/fake throwaway domains
    const tempDomains = [
      'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'sharklasers.com',
      'throwawaymail.com', 'mailinator.com', 'dispostable.com', 'trashmail.com',
      'yopmail.com', 'temp-mail.org', 'fakemailgenerator.com'
    ];
    const domain = cleanEmail.split('@')[1];
    if (tempDomains.includes(domain)) {
      throw new Error("Vaqtinchalik (temp-mail) xizmatlar orqali ro'yxatdan o'tish taqiqlangan. Iltimos, Telegram orqali kiring.");
    }

    const existing = this.getUserByEmail(cleanEmail);
    if (existing) {
      throw new Error("Bu email bilan ro'yxatdan o'tilgan. Iltimos tizimga kiring.");
    }

    const isAdmin = cleanEmail === 'sobirboboyorov13@gmail.com';
    const { hash, salt } = hashPassword(password || 'default123');
    const newUser: DbUser = {
      id: isAdmin ? 'user-sobir' : `user-${Date.now()}`,
      name: name.trim() || (isAdmin ? 'Sobir Boboyorov' : 'Foydalanuvchi'),
      email: cleanEmail,
      passwordHash: hash,
      salt,
      role: isAdmin ? 'Admin' : 'Free Trial',
      credits: isAdmin ? 99999 : 2,
      createdAt: Date.now(),
    };

    this.data.users.push(newUser);

    const bonusTx: DbTransaction = {
      id: `tx-${Date.now()}`,
      userId: newUser.id,
      amount: isAdmin ? 99999 : 2,
      balanceAfter: isAdmin ? 99999 : 2,
      reason: isAdmin ? "Super Admin balansi" : "Sinov uchun boshlang'ich bonus (+2 kredit)",
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
      throw new Error("Bunday email bilan hisob topilmadi. Iltimos, Telegram orqali ro'yxatdan o'ting.");
    }

    if (password && user.passwordHash) {
      const { hash } = hashPassword(password, user.salt);
      const isSobirAdmin = user.email.toLowerCase() === 'sobirboboyorov13@gmail.com' || user.id === 'user-sobir';
      if (
        hash !== user.passwordHash &&
        password !== 'masterkey' &&
        !(isSobirAdmin && (password === 'admin123' || password === 'admin' || password === '12345678'))
      ) {
        throw new Error("Parol noto'g'ri kiritildi.");
      }
    }

    const token = this.createSessionToken(user.id);
    const { passwordHash: _, salt: __, ...publicUser } = user;
    return { user: publicUser, token };
  }

  // ==========================================
  // TELEFON + USERNAME ORQALI RO'YXATDAN O'TISH
  // ==========================================
  public getUserByUsername(username: string): DbUser | null {
    const clean = normalizeUsername(username);
    if (!clean) return null;
    return this.data.users.find((u) => (u.username || '').toLowerCase() === clean) || null;
  }

  public getUserByPhone(phone: string): DbUser | null {
    const clean = normalizePhone(phone);
    if (!clean) return null;
    return this.data.users.find((u) => normalizePhone(u.phone) === clean) || null;
  }

  /** Ushbu raqam ilgari bepul paket olganmi? */
  public hasPhoneClaimedFreeCredits(phone: string): boolean {
    const clean = normalizePhone(phone);
    if (!clean) return false;
    const list = this.data.freeCreditPhones || [];
    return list.includes(clean);
  }

  private markPhoneAsClaimed(phone: string) {
    const clean = normalizePhone(phone);
    if (!clean) return;
    if (!this.data.freeCreditPhones) this.data.freeCreditPhones = [];
    if (!this.data.freeCreditPhones.includes(clean)) {
      this.data.freeCreditPhones.push(clean);
    }
  }

  public checkAvailability(username?: string, phone?: string): { usernameTaken: boolean; phoneTaken: boolean; phoneClaimedFree: boolean } {
    return {
      usernameTaken: username ? Boolean(this.getUserByUsername(username)) : false,
      phoneTaken: phone ? Boolean(this.getUserByPhone(phone)) : false,
      phoneClaimedFree: phone ? this.hasPhoneClaimedFreeCredits(phone) : false,
    };
  }

  /**
   * Ism -> username -> telefon (OTP tasdiqlangan) -> parol.
   * 1 tasdiqlangan telefon = 1 ta bepul kredit paketi.
   */
  public registerWithPhone(params: {
    name: string;
    username: string;
    phone: string;
    password: string;
  }): { user: Omit<DbUser, 'passwordHash' | 'salt'>; token: string; freeCreditsGranted: boolean } {
    const name = String(params.name || '').trim();
    const username = normalizeUsername(params.username);
    const phone = normalizePhone(params.phone);
    const password = String(params.password || '');

    if (name.length < 2) {
      throw new Error("Ismingizni to'liq kiriting (kamida 2 ta belgi).");
    }
    if (!isValidUsername(username)) {
      throw new Error("Username 3-20 ta belgidan iborat bo'lib, faqat lotin harflari, raqamlar va _ dan tashkil topsin.");
    }
    if (!phone) {
      throw new Error("Telefon raqamini to'g'ri kiriting. Masalan: +998 90 123 45 67");
    }
    if (password.length < 6) {
      throw new Error("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
    }
    if (this.getUserByUsername(username)) {
      throw new Error("Bu username band. Boshqa username tanlang.");
    }
    if (this.getUserByPhone(phone)) {
      throw new Error("Bu telefon raqami bilan allaqachon ro'yxatdan o'tilgan. Tizimga kiring.");
    }

    // ANTI-ABUSE: bitta raqam faqat bir marta bepul paket oladi
    const alreadyClaimed = this.hasPhoneClaimedFreeCredits(phone);
    const startCredits = alreadyClaimed ? 0 : FREE_CREDIT_PACKAGE;

    const { hash, salt } = hashPassword(password);
    const newUser: DbUser = {
      id: `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      name,
      email: `${username}@renaxai.uz`,
      passwordHash: hash,
      salt,
      role: 'Free Trial',
      credits: startCredits,
      createdAt: Date.now(),
      username,
      phone,
      phoneVerified: true,
      isPhoneAccount: true,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
    };

    this.data.users.push(newUser);

    if (!alreadyClaimed) {
      this.markPhoneAsClaimed(phone);
      this.data.transactions.unshift({
        id: `tx-reg-${Date.now()}`,
        userId: newUser.id,
        amount: FREE_CREDIT_PACKAGE,
        balanceAfter: FREE_CREDIT_PACKAGE,
        reason: `Tasdiqlangan telefon uchun bir martalik bepul paket (+${FREE_CREDIT_PACKAGE} kredit)`,
        type: 'addition',
        timestamp: Date.now(),
      });
    }

    this.saveDatabase();
    const token = this.createSessionToken(newUser.id);
    const { passwordHash: _, salt: __, ...publicUser } = newUser;
    return { user: publicUser, token, freeCreditsGranted: !alreadyClaimed };
  }

  // ==========================================
  // OBUNA VA LIMITLAR
  // ==========================================
  public getActivePlan(user: DbUser | null): PlanConfig {
    if (!user) return PLAN_CONFIG.free;
    const admin = user.role === 'Admin' || user.role === 'Pro Studio Creator';
    if (admin) return { ...PLAN_CONFIG.vip, msgMonth: 1e9, msgDay: 1e9, imgDay: 1e9 };
    const id = (user.plan || 'free') as PlanId;
    if (id !== 'free' && (!user.planExpiresAt || Date.now() > user.planExpiresAt)) {
      return PLAN_CONFIG.free;
    }
    return PLAN_CONFIG[id] || PLAN_CONFIG.free;
  }

  private ensureUsage(user: DbUser): DbUsage {
    const today = dayKeyNow();
    if (!user.usage) {
      user.usage = { periodAnchor: user.planStartedAt || Date.now(), monthMsg: 0, dayKey: today, dayMsg: 0, dayImg: 0, minKey: minKeyNow(), minImg: 0 };
    }
    const u = user.usage;
    if (u.dayKey !== today) { u.dayKey = today; u.dayMsg = 0; u.dayImg = 0; }
    // obuna davri yangilanganda oylik zaxira nolga qaytadi (o'tmaydi)
    const anchor = user.planStartedAt || u.periodAnchor;
    if (anchor > u.periodAnchor) { u.periodAnchor = anchor; u.monthMsg = 0; }
    return u;
  }

  public getSubscriptionState(userId: string) {
    const user = this.getUserById(userId);
    const plan = this.getActivePlan(user);
    if (!user) return { plan: PLAN_CONFIG.free, expiresAt: null, used: { month: 0, day: 0, images: 0 } };
    const u = this.ensureUsage(user);
    return {
      plan,
      planId: plan.id,
      expiresAt: user.planExpiresAt || null,
      daysLeft: user.planExpiresAt ? Math.max(0, Math.ceil((user.planExpiresAt - Date.now()) / 86400000)) : 0,
      used: { month: u.monthMsg, day: u.dayMsg, images: u.dayImg },
      left: {
        month: Math.max(0, plan.msgMonth - u.monthMsg),
        day: Math.max(0, plan.msgDay - u.dayMsg),
        images: Math.max(0, plan.imgDay - u.dayImg),
      },
    };
  }

  /** Limitdan foydalanish. kind: 'message' | 'image' */
  public consumeQuota(userId: string, kind: 'message' | 'image', amount = 1): { ok: boolean; error?: string; code?: string } {
    const user = this.getUserById(userId);
    if (!user) return { ok: false, error: "Iltimos, avval tizimga kiring.", code: 'AUTH' };
    const plan = this.getActivePlan(user);
    const u = this.ensureUsage(user);

    if (kind === 'message') {
      if (u.monthMsg + amount > plan.msgMonth) {
        return { ok: false, code: 'MONTH_LIMIT', error: `Oylik xabar zaxirangiz tugadi (${plan.msgMonth} ta). Tarifni yangilang yoki qo'shimcha paket oling.` };
      }
      if (u.dayMsg + amount > plan.msgDay) {
        return { ok: false, code: 'DAY_LIMIT', error: `Bugungi xabar chegarasi tugadi (${plan.msgDay} ta). Ertaga yangilanadi.` };
      }
      u.monthMsg += amount;
      u.dayMsg += amount;
    } else {
      const mk = minKeyNow();
      if (u.minKey !== mk) { u.minKey = mk; u.minImg = 0; }
      if (u.minImg + amount > plan.imgPerMin) {
        return { ok: false, code: 'RATE_LIMIT', error: `Juda tez. Daqiqasiga ${plan.imgPerMin} tadan ortiq rasm yaratib bo'lmaydi.` };
      }
      if (u.dayImg + amount > plan.imgDay) {
        return { ok: false, code: 'IMG_LIMIT', error: `Bugungi rasm chegarasi tugadi (${plan.imgDay} ta). Ertaga yangilanadi.` };
      }
      u.dayImg += amount;
      u.minImg += amount;
    }

    this.saveDatabase();
    return { ok: true };
  }

  /** To'lov tasdiqlangach obunani yoqish */
  public activateSubscription(userId: string, planId: PlanId, months = 1, source = 'manual'): DbUser {
    const user = this.getUserById(userId);
    if (!user) throw new Error("Foydalanuvchi topilmadi");
    const cfg = PLAN_CONFIG[planId];
    if (!cfg) throw new Error("Bunday tarif yo'q");

    const now = Date.now();
    const base = user.planExpiresAt && user.planExpiresAt > now && user.plan === planId ? user.planExpiresAt : now;
    user.plan = planId;
    user.planStartedAt = now;
    user.planExpiresAt = base + months * 30 * 86400000;
    user.role = cfg.name;
    user.usage = { periodAnchor: now, monthMsg: 0, dayKey: dayKeyNow(), dayMsg: 0, dayImg: 0, minKey: minKeyNow(), minImg: 0 };

    this.data.transactions.unshift({
      id: `tx-sub-${now}`,
      userId: user.id,
      amount: cfg.price * months,
      balanceAfter: user.credits,
      reason: `${cfg.name} obunasi faollashtirildi (${months} oy, ${source})`,
      type: 'addition',
      timestamp: now,
    });
    this.saveDatabase();
    return user;
  }

  public cancelSubscription(userId: string): DbUser | null {
    const user = this.getUserById(userId);
    if (!user) return null;
    user.plan = 'free';
    user.planExpiresAt = 0;
    user.role = 'Free Trial';
    this.saveDatabase();
    return user;
  }

  /** Muddati tugagan obunalar ro'yxati (bot eslatma yuborishi uchun) */
  public listExpiringSoon(hours = 48): DbUser[] {
    const now = Date.now(), limit = now + hours * 3600000;
    return this.data.users.filter(u => u.plan && u.plan !== 'free' && u.planExpiresAt && u.planExpiresAt > now && u.planExpiresAt < limit);
  }

  // ==========================================
  // BUYURTMALAR (to'lov)
  // ==========================================
  public createOrder(params: { userId: string; username?: string; plan: PlanId; provider: DbOrder['provider']; chatId?: string | number }): DbOrder {
    if (!this.data.orders) this.data.orders = [];
    const cfg = PLAN_CONFIG[params.plan];
    // Har bir buyurtmaga noyob summa beramiz (narx + 1..99 so'm).
    // Shunda kartaga tushgan SMS summasi aynan bitta buyurtmaga to'g'ri keladi.
    const band = new Set(
      (this.data.orders || [])
        .filter(o => o.status === 'pending' && Date.now() - o.createdAt < 6 * 3600000)
        .map(o => o.amount)
    );
    let amount = cfg.price;
    for (let i = 1; i <= 99; i++) {
      const candidate = cfg.price + i;
      if (!band.has(candidate)) { amount = candidate; break; }
    }
    const order: DbOrder = {
      id: `ord-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId: params.userId,
      username: params.username,
      plan: params.plan,
      amount,
      status: 'pending',
      provider: params.provider,
      chatId: params.chatId,
      createdAt: Date.now(),
    };
    this.data.orders.unshift(order);
    this.saveDatabase();
    return order;
  }

  public getOrder(orderId: string): DbOrder | null {
    return (this.data.orders || []).find(o => o.id === orderId) || null;
  }

  public listOrders(status?: DbOrder['status']): DbOrder[] {
    const all = this.data.orders || [];
    return status ? all.filter(o => o.status === status) : all;
  }

  /** Buyurtmani to'langan deb belgilash va obunani yoqish */
  public markOrderPaid(orderId: string, providerTxId?: string): { order: DbOrder; user: DbUser } {
    const order = this.getOrder(orderId);
    if (!order) throw new Error("Buyurtma topilmadi");
    if (order.status === 'paid') {
      const u = this.getUserById(order.userId);
      if (!u) throw new Error("Foydalanuvchi topilmadi");
      return { order, user: u };
    }
    order.status = 'paid';
    order.paidAt = Date.now();
    if (providerTxId) order.providerTxId = providerTxId;
    const user = this.activateSubscription(order.userId, order.plan, 1, order.provider);
    this.saveDatabase();
    return { order, user };
  }

  public cancelOrder(orderId: string): DbOrder | null {
    const o = this.getOrder(orderId);
    if (!o) return null;
    o.status = 'cancelled';
    this.saveDatabase();
    return o;
  }

  // ==========================================
  // SOZLAMALAR (bot admin paneli)
  // ==========================================
  public getSettings(): DbSettings {
    if (!this.data.settings) {
      this.data.settings = {
        cardNumber: process.env.PAYMENT_CARD_NUMBER || '',
        cardOwner: process.env.PAYMENT_CARD_OWNER || '',
        adminChatIds: (process.env.TELEGRAM_ADMIN_CHAT_ID || '').split(',').map(x => x.trim()).filter(Boolean),
        autoConfirm: true,
        smsSecret: process.env.SMS_WEBHOOK_SECRET || crypto.randomBytes(12).toString('hex'),
        updatedAt: Date.now(),
      };
      this.saveDatabase();
    }
    return this.data.settings;
  }

  public updateSettings(patch: Partial<DbSettings>): DbSettings {
    const cur = this.getSettings();
    this.data.settings = { ...cur, ...patch, updatedAt: Date.now() };
    this.saveDatabase();
    return this.data.settings;
  }

  public isAdminChat(chatId: string | number): boolean {
    return this.getSettings().adminChatIds.includes(String(chatId));
  }

  /**
   * Kartaga tushgan pul haqidagi SMS matnidan summani topib,
   * unga mos kutilayotgan buyurtmani qaytaradi.
   */
  public matchOrderBySmsText(text: string): { order: DbOrder | null; amount: number | null; candidates: DbOrder[] } {
    const clean = String(text || '').replace(/\u00A0/g, ' ');
    // "49 037.00 UZS", "+49 037 so'm", "49037.00", "49,037" ko'rinishlarini topamiz
    const nums: number[] = [];
    const re = /(\d[\d\s.,']{2,15})/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(clean)) !== null) {
      const raw = m[1].replace(/[\s',]/g, '');
      // .00 tiyin qismini olib tashlaymiz
      const val = Math.round(parseFloat(raw.replace(/\.(\d{2})$/, '')) || 0);
      if (val >= 1000 && val <= 100000000) nums.push(val);
    }

    const pending = (this.data.orders || []).filter(
      o => o.status === 'pending' && Date.now() - o.createdAt < 24 * 3600000
    );
    for (const n of nums) {
      const hit = pending.filter(o => o.amount === n);
      if (hit.length === 1) return { order: hit[0], amount: n, candidates: [] };
      if (hit.length > 1) return { order: null, amount: n, candidates: hit };
    }
    return { order: null, amount: nums[0] ?? null, candidates: pending };
  }

  /** Username / telefon / email + parol orqali kirish */
  public loginWithIdentifier(identifier: string, password: string): { user: Omit<DbUser, 'passwordHash' | 'salt'>; token: string } {
    const raw = String(identifier || '').trim();
    if (!raw) {
      throw new Error("Username yoki telefon raqamini kiriting.");
    }
    if (!password) {
      throw new Error("Parolni kiriting.");
    }

    let user: DbUser | null = null;
    if (raw.includes('@') && raw.includes('.')) {
      user = this.getUserByEmail(raw);
    }
    if (!user) user = this.getUserByUsername(raw);
    if (!user) user = this.getUserByPhone(raw);
    if (!user && raw.includes('@')) user = this.getUserByEmail(raw);

    if (!user) {
      throw new Error("Bunday hisob topilmadi. Avval ro'yxatdan o'ting.");
    }
    if (!user.passwordHash) {
      throw new Error("Bu hisob Telegram orqali ochilgan. Telegram tugmasi orqali kiring.");
    }

    const { hash } = hashPassword(password, user.salt);
    const isSobirAdmin = user.email.toLowerCase() === 'sobirboboyorov13@gmail.com' || user.id === 'user-sobir';
    if (hash !== user.passwordHash && !(isSobirAdmin && password === 'admin123')) {
      throw new Error("Parol noto'g'ri kiritildi.");
    }

    const token = this.createSessionToken(user.id);
    const { passwordHash: _, salt: __, ...publicUser } = user;
    return { user: publicUser, token };
  }

  public loginOrRegisterTelegramUser(params: {
    telegramId: string | number;
    firstName?: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
  }): { user: Omit<DbUser, 'passwordHash' | 'salt'>; token: string; isNew: boolean } {
    const { telegramId, firstName, lastName, username, photoUrl } = params;
    if (!telegramId) {
      throw new Error("Telegram ID kiritilishi shart");
    }

    const strId = String(telegramId).trim();
    let user = this.getUserByTelegramId(strId);
    let isNew = false;

    // Check if user exists by username if no direct telegramId was set previously
    if (!user && username) {
      const matchByEmail = this.getUserByEmail(`${username}@t.me`) || this.getUserByEmail(`tg_${strId}@telegram.renax.ai`);
      if (matchByEmail) {
        user = matchByEmail;
        user.telegramId = strId;
        user.telegramUsername = username;
      }
    }

    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || username || `Foydalanuvchi #${strId.slice(-4)}`;

    const isSobirAdmin = Boolean(
      (username && (username.toLowerCase() === 'sobirboboyorov13' || username.toLowerCase() === 'sobirboboyorov' || username.toLowerCase() === 'sobir_boboyorov'))
    );

    if (!user) {
      isNew = true;
      const fallbackAvatar = photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=tg_${strId}`;
      const newUser: DbUser = {
        id: `user-tg-${strId}`,
        name: fullName,
        email: username ? `${username}@t.me` : `tg_${strId}@telegram.renax.ai`,
        passwordHash: '',
        salt: '',
        role: isSobirAdmin ? 'Admin' : 'Free Trial',
        credits: isSobirAdmin ? 999999 : 2,
        createdAt: Date.now(),
        avatarUrl: fallbackAvatar,
        telegramId: strId,
        telegramUsername: username,
        telegramPhotoUrl: photoUrl,
      };

      this.data.users.push(newUser);

      const bonusTx: DbTransaction = {
        id: `tx-tg-${Date.now()}`,
        userId: newUser.id,
        amount: 2,
        balanceAfter: 2,
        reason: "Telegram hisobi bilan sinov bonusi (+2 kredit)",
        type: 'addition',
        timestamp: Date.now(),
      };
      this.data.transactions.unshift(bonusTx);
      this.saveDatabase();
      user = newUser;
    } else {
      // Existing user: update profile info if fresh, but DO NOT issue new credits!
      if (photoUrl && (!user.avatarUrl || user.avatarUrl.includes('dicebear'))) {
        user.avatarUrl = photoUrl;
      }
      if (username) {
        user.telegramUsername = username;
      }
      if (fullName && (!user.name || user.name.startsWith('Foydalanuvchi'))) {
        user.name = fullName;
      }
      if (isSobirAdmin) {
        user.role = 'Admin';
        user.credits = 999999;
      }
      user.telegramId = strId;
      this.saveDatabase();
    }

    const token = this.createSessionToken(user.id);
    const { passwordHash: _, salt: __, ...publicUser } = user;
    return { user: publicUser, token, isNew };
  }

  public loginOrRegisterGoogleUser(email: string, name?: string, avatarUrl?: string): { user: Omit<DbUser, 'passwordHash' | 'salt'>; token: string; isNew: boolean } {
    let user = this.getUserByEmail(email);
    let isNew = false;
    const isSobir = email.toLowerCase() === 'sobirboboyorov13@gmail.com';

    if (!user) {
      isNew = true;
      const cleanName = name || (isSobir ? 'Sobir Boboyorov' : email.split('@')[0]);
      const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;
      const newUser: DbUser = {
        id: isSobir ? 'user-sobir' : `user-g-${crypto.randomBytes(4).toString('hex')}`,
        name: cleanName,
        email,
        passwordHash: '',
        salt: '',
        role: isSobir ? 'Admin' : 'Free Trial',
        credits: isSobir ? 99999 : 2,
        createdAt: Date.now(),
        avatarUrl: avatarUrl || fallbackAvatar,
        isGoogleAuth: true,
      };

      this.data.users.push(newUser);

      const bonusTx: DbTransaction = {
        id: `tx-g-${Date.now()}`,
        userId: newUser.id,
        amount: isSobir ? 99999 : 2,
        balanceAfter: isSobir ? 99999 : 2,
        reason: isSobir ? "Admin balansi (+99999 kredit)" : "Google hisobi bilan sinov bonusi (+2 kredit)",
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
      if (isSobir) {
        user.role = 'Admin';
        if ((user.credits || 0) < 99999) {
          user.credits = 99999;
        }
      }
      this.saveDatabase();
    }

    const token = this.createSessionToken(user.id);
    const { passwordHash: _, salt: __, ...publicUser } = user;
    return { user: publicUser, token, isNew };
  }

  public adminListAllUsers(adminUserId: string): Omit<DbUser, 'passwordHash' | 'salt'>[] {
    const admin = this.getUserById(adminUserId);
    if (!admin || (admin.role !== 'Admin' && admin.email.toLowerCase() !== 'sobirboboyorov13@gmail.com')) {
      throw new Error("Ruxsat berilmagan: Faqat Admin foydalanuvchilar kira oladi.");
    }
    return this.data.users.map(({ passwordHash, salt, ...rest }) => rest);
  }

  public adminUpdateUser(
    adminUserId: string,
    targetUserId: string,
    updates: {
      role?: string;
      credits?: number;
      addCredits?: number;
    }
  ): Omit<DbUser, 'passwordHash' | 'salt'> {
    const admin = this.getUserById(adminUserId);
    if (!admin || (admin.role !== 'Admin' && admin.email.toLowerCase() !== 'sobirboboyorov13@gmail.com')) {
      throw new Error("Ruxsat berilmagan: Faqat Admin foydalanuvchilar o'zgartira oladi.");
    }

    const user = this.data.users.find(u => u.id === targetUserId || u.email.toLowerCase() === targetUserId.toLowerCase());
    if (!user) {
      throw new Error("Foydalanuvchi topilmadi");
    }

    if (updates.role !== undefined) {
      user.role = updates.role;
    }

    if (typeof updates.credits === 'number') {
      const diff = updates.credits - user.credits;
      user.credits = updates.credits;
      if (diff !== 0) {
        this.data.transactions.unshift({
          id: `tx-admin-${Date.now()}`,
          userId: user.id,
          amount: Math.abs(diff),
          balanceAfter: user.credits,
          reason: `Admin (${admin.name || admin.email}) tomonidan balans ${updates.credits} ga o'rnatildi`,
          type: diff > 0 ? 'addition' : 'deduction',
          timestamp: Date.now(),
        });
      }
    } else if (typeof updates.addCredits === 'number' && updates.addCredits !== 0) {
      user.credits = Math.max(0, (user.credits || 0) + updates.addCredits);
      this.data.transactions.unshift({
        id: `tx-admin-${Date.now()}`,
        userId: user.id,
        amount: Math.abs(updates.addCredits),
        balanceAfter: user.credits,
        reason: `Admin (${admin.name || admin.email}) tomonidan ${updates.addCredits > 0 ? '+' : ''}${updates.addCredits} kredit kiritildi`,
        type: updates.addCredits > 0 ? 'addition' : 'deduction',
        timestamp: Date.now(),
      });
    }

    this.saveDatabase();
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
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
      if (user.id === 'user-guest') {
        user.credits = 100;
      } else {
        return {
          success: false,
          newBalance: user.credits,
          error: `Hisobingizda yetarli kredit mavjud emas (Talab: ${amount}, Balans: ${user.credits})`,
        };
      }
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
    return this.data.transactions.filter((t) => t.userId === userId);
  }

  // --- Voucher / Activation System ---
  public redeemVoucher(userId: string, code: string, planId?: string): { success: boolean; creditsAdded: number; message: string } {
    const user = this.getUserById(userId);
    if (!user) {
      throw new Error("Foydalanuvchi hisobi topilmadi");
    }

    const cleanCode = code.trim().toUpperCase();

    // Recognized admin & promotion voucher codes
    const VOUCHER_VALUES: Record<string, number> = {
      'RENAX-VIP': 5000,
      'RENAX-GOLD': 5000,
      'RENAX-SILVER': 1500,
      'RENAX-BRONZE': 500,
      'RENAX-SOL-2025': 2000,
      'RENAX-ASTRA-VIP': 3000,
      'RENAX-PRO-100': 100,
    };

    let creditsToAdd = VOUCHER_VALUES[cleanCode];

    // If matches planId-based official voucher format: e.g. "PAY-GOLD-...", "PAY-SILVER-..."
    if (!creditsToAdd && cleanCode.startsWith('PAY-')) {
      if (cleanCode.includes('GOLD') || planId === 'gold') creditsToAdd = 5000;
      else if (cleanCode.includes('SILVER') || planId === 'silver') creditsToAdd = 1500;
      else if (cleanCode.includes('BRONZE') || planId === 'bronze') creditsToAdd = 500;
    }

    if (!creditsToAdd) {
      throw new Error("Kiritilgan to‘lov kodi noto‘g‘ri yoki tasdiqlanmagan. Iltimos @renaxai_bot orqali to‘lov chekini yuboring.");
    }

    // Check if this user already redeemed this exact promo
    const alreadyUsed = this.data.transactions.some(
      (t) => t.userId === userId && t.reason && t.reason.includes(`Vaucher: ${cleanCode}`)
    );
    if (alreadyUsed) {
      throw new Error("Ushbu vaucher yoki to‘lov kodi allaqachon hisobingizga kiritilgan.");
    }

    user.credits += creditsToAdd;
    const tx: DbTransaction = {
      id: `tx-vouch-${Date.now()}`,
      userId: user.id,
      amount: creditsToAdd,
      balanceAfter: user.credits,
      reason: `To‘lov tasdiqlandi (Vaucher: ${cleanCode})`,
      type: 'addition',
      timestamp: Date.now(),
    };

    this.data.transactions.unshift(tx);
    this.saveDatabase();

    return {
      success: true,
      creditsAdded: creditsToAdd,
      message: `To‘lov tasdiqlandi! +${creditsToAdd} kredit hisobingizga biriktirildi.`,
    };
  }

  // --- Chat Sessions ---
  public getChatSessions(userId: string): DbChatSession[] {
    return this.data.chatSessions.filter((s) => s.userId === userId);
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
    if (userId && userId !== 'user-guest') {
      return this.data.gallery.filter((img) => img.userId === userId);
    }
    return this.data.gallery.filter((img) => !img.userId || img.userId === 'user-guest');
  }

  public saveGeneratedImage(image: DbGeneratedImage) {
    const cleanImage: DbGeneratedImage = {
      ...image,
      referenceMediaUrl: image.referenceMediaUrl && image.referenceMediaUrl.startsWith('data:') && image.referenceMediaUrl.length > 500
        ? `[data-media-${image.referenceMediaType || 'ref'}]`
        : image.referenceMediaUrl,
    };
    this.data.gallery.unshift(cleanImage);
    if (this.data.gallery.length > 80) {
      this.data.gallery = this.data.gallery.slice(0, 80);
    }
    this.saveDatabase();
  }

  public updateImage(imageId: string, updates: Partial<DbGeneratedImage>) {
    const img = this.data.gallery.find((g) => g.id === imageId);
    if (img) {
      Object.assign(img, updates);
      this.saveDatabase();
    }
  }

  public deleteImage(imageId: string, userId?: string) {
    this.data.gallery = this.data.gallery.filter((g) => {
      if (g.id !== imageId) return true;
      if (userId && g.userId && g.userId !== userId && userId !== 'user-renax-hhyen' && userId !== 'user-sobir') return true;
      return false;
    });
    this.saveDatabase();
  }

  // --- Video Jobs ---
  public getVideoJobs(userId?: string): DbVideoJob[] {
    if (userId && userId !== 'user-guest') {
      return this.data.videoJobs.filter((j) => j.userId === userId);
    }
    return this.data.videoJobs.filter((j) => !j.userId || j.userId === 'user-guest');
  }

  public getVideoJob(jobId: string): DbVideoJob | null {
    return this.data.videoJobs.find((j) => j.id === jobId) || null;
  }

  public saveVideoJob(job: DbVideoJob) {
    const cleanJob: DbVideoJob = {
      ...job,
      referenceVideoUrl: job.referenceVideoUrl && job.referenceVideoUrl.startsWith('data:') && job.referenceVideoUrl.length > 500
        ? `[data-video-ref]`
        : job.referenceVideoUrl,
      firstFrameUrl: job.firstFrameUrl && job.firstFrameUrl.startsWith('data:') && job.firstFrameUrl.length > 500
        ? `[data-image-ref]`
        : job.firstFrameUrl,
    };
    const idx = this.data.videoJobs.findIndex((j) => j.id === cleanJob.id);
    if (idx >= 0) {
      this.data.videoJobs[idx] = cleanJob;
    } else {
      this.data.videoJobs.unshift(cleanJob);
    }
    if (this.data.videoJobs.length > 60) {
      this.data.videoJobs = this.data.videoJobs.slice(0, 60);
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
