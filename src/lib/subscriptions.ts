import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import { serverDb, PLAN_CONFIG, PlanId, DbOrder, normalizePhone } from './server-db';

// ==========================================
// Sozlamalar (.env)
// ==========================================
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const BOT_USERNAME = (process.env.TELEGRAM_BOT_USERNAME || '@renaxplatformbot').replace(/^@/, '');
const SITE_URL = process.env.SITE_URL || 'https://renaxai.uz';
const cfgOf = () => serverDb.getSettings();
const admins = () => cfgOf().adminChatIds;

// Payme
const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID || '';
const PAYME_KEY = process.env.PAYME_KEY || '';
// Click
const CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID || '';
const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID || '';
const CLICK_SECRET = process.env.CLICK_SECRET_KEY || '';

const PLAN_ORDER: PlanId[] = ['bronze', 'silver', 'vip'];
const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');

// ==========================================
// Telegram yordamchilari
// ==========================================
const tg = async (method: string, body: Record<string, any>) => {
  if (!BOT_TOKEN) return null;
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch {
    return null;
  }
};

export const sendTg = (chatId: string | number, text: string, extra: Record<string, any> = {}) =>
  tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });

const planKeyboard = () => ({
  inline_keyboard: [
    ...PLAN_ORDER.map(p => [{
      text: `${PLAN_CONFIG[p].name} — ${fmt(PLAN_CONFIG[p].price)} so'm/oy`,
      callback_data: `plan_${p}`,
    }]),
    [{ text: '📊 Mening obunam', callback_data: 'my_sub' }],
  ],
});

const planCard = (p: PlanId) => {
  const c = PLAN_CONFIG[p];
  const img = c.unlimitedImages ? 'cheksiz' : `${c.imgDay} ta/kun`;
  return `<b>${c.name}</b> — ${fmt(c.price)} so'm / oy\n` +
    `• ${fmt(c.msgMonth)} ta xabar/oy (kuniga ${c.msgDay} tagacha)\n` +
    `• Rasm: ${img}\n` +
    `• Modellar: ${c.tier === 0 ? 'oddiy' : c.tier === 1 ? 'oddiy + kuchli' : 'barchasi'}`;
};

// ==========================================
// To'lov havolalari
// ==========================================
export const paymeLink = (order: DbOrder) => {
  if (!PAYME_MERCHANT_ID) return null;
  const raw = `m=${PAYME_MERCHANT_ID};ac.order_id=${order.id};a=${order.amount * 100};c=${SITE_URL}`;
  return `https://checkout.paycom.uz/${Buffer.from(raw).toString('base64')}`;
};

export const clickLink = (order: DbOrder) => {
  if (!CLICK_MERCHANT_ID || !CLICK_SERVICE_ID) return null;
  return `https://my.click.uz/services/pay?service_id=${CLICK_SERVICE_ID}` +
    `&merchant_id=${CLICK_MERCHANT_ID}&amount=${order.amount}&transaction_param=${order.id}`;
};

const paymentMessage = (order: DbOrder) => {
  const c = PLAN_CONFIG[order.plan];
  const pay = paymeLink(order), clk = clickLink(order);
  const rows: any[] = [];
  if (pay) rows.push([{ text: '💳 Payme orqali to‘lash', url: pay }]);
  if (clk) rows.push([{ text: '💳 Click orqali to‘lash', url: clk }]);

  let text = `🧾 <b>Buyurtma:</b> ${c.name}\n💰 <b>Summa:</b> ${fmt(order.amount)} so'm\n🆔 <code>${order.id}</code>\n\n`;

  if (rows.length) {
    text += `Quyidagi tugma orqali to‘lang. To‘lov tasdiqlangach obuna <b>avtomatik</b> yoqiladi.`;
  } else if (cfgOf().cardNumber) {
    text += `💳 <b>Karta:</b> <code>${cfgOf().cardNumber}</code>\n` +
      `👤 <b>Egasi:</b> ${cfgOf().cardOwner || '—'}\n\n` +
      `⚠️ <b>Aynan shu summani o‘tkazing:</b> <code>${fmt(order.amount)}</code> so'm\n` +
      `<i>Summa har bir buyurtmada biroz farq qiladi — shu orqali to‘lovingiz avtomatik topiladi.</i>\n\n` +
      `Pul tushishi bilan obuna <b>o‘zi yoqiladi</b> (odatda 10-30 soniya).`;
    rows.push([{ text: '✅ To‘ladim, tekshiring', callback_data: `paid_${order.id}` }]);
  } else {
    text += `⚠️ To‘lov tizimi hali sozlanmagan. Administrator bilan bog‘laning.`;
  }
  rows.push([{ text: '❌ Bekor qilish', callback_data: `cancel_${order.id}` }]);
  return { text, reply_markup: { inline_keyboard: rows } };
};

// ==========================================
// Bot suhbat holati (xotirada)
// ==========================================
type Pending = { step: 'username'; plan: PlanId };
const pending = new Map<string, Pending>();
// Admin panelida matn kutish holati
type AdminWait = 'card' | 'owner' | 'addAdmin';
const adminWait = new Map<string, AdminWait>();

// Saytdagi sessiyalarni bog'lash uchun (server.ts dan uzatiladi)
type SessionBinder = (sessionId: string, user: any, token: string, isNew: boolean) => boolean;

// ==========================================
// Asosiy o'rnatuvchi
// ==========================================
export function setupSubscriptions(app: Express, deps: { bindSession: SessionBinder }) {
  const { bindSession } = deps;

  const getUserId = (req: Request): string => {
    const h = (req.headers['x-user-id'] as string)?.trim();
    return h && h !== 'undefined' && h !== 'null' ? h : '';
  };

  // ---------- Tariflar ----------
  app.get('/api/subscription/plans', (_req, res) => {
    res.json({
      plans: PLAN_ORDER.map(p => PLAN_CONFIG[p]),
      free: PLAN_CONFIG.free,
      botUrl: `https://t.me/${BOT_USERNAME}`,
    });
  });

  app.get('/api/subscription/me', (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.json({ planId: 'free', plan: PLAN_CONFIG.free, left: { month: 0, day: 0, images: 0 }, guest: true });
    res.json(serverDb.getSubscriptionState(userId));
  });

  /** Sayt "sotib olish" tugmasi bosilganda — botga o'tish havolasi */
  app.post('/api/subscription/checkout', (req, res) => {
    const userId = getUserId(req);
    const { plan } = req.body || {};
    if (!PLAN_CONFIG[plan as PlanId] || plan === 'free') {
      return res.status(400).json({ error: "Noto'g'ri tarif" });
    }
    const user = userId ? serverDb.getUserById(userId) : null;
    const uname = user?.username || '';
    const payload = `plan_${plan}${uname ? `_${uname}` : ''}`;
    res.json({ url: `https://t.me/${BOT_USERNAME}?start=${payload}`, botUsername: `@${BOT_USERNAME}` });
  });

  /** Admin: qo'lda obuna berish */
  app.post('/api/admin/subscription/grant', (req, res) => {
    try {
      const adminId = getUserId(req);
      const admin = serverDb.getUserById(adminId);
      if (!admin || admin.role !== 'Admin') return res.status(403).json({ error: 'Ruxsat yo‘q' });
      const { targetUserId, plan, months } = req.body || {};
      const user = serverDb.activateSubscription(targetUserId, plan, months || 1, 'admin');
      res.json({ success: true, user });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ==========================================
  // PAYME MERCHANT API (JSON-RPC)
  // ==========================================
  app.post('/api/payments/payme', (req, res) => {
    const err = (code: number, message: string, data?: any) =>
      res.json({ error: { code, message: { uz: message, ru: message, en: message }, data }, id: req.body?.id });

    if (PAYME_KEY) {
      const auth = (req.headers.authorization || '').replace('Basic ', '');
      const decoded = Buffer.from(auth, 'base64').toString();
      if (decoded !== `Paycom:${PAYME_KEY}`) return err(-32504, 'Ruxsat yo‘q');
    }

    const { method, params, id } = req.body || {};
    const orderId = params?.account?.order_id;
    const order = orderId ? serverDb.getOrder(orderId) : null;

    switch (method) {
      case 'CheckPerformTransaction':
        if (!order) return err(-31050, 'Buyurtma topilmadi');
        if (order.status === 'paid') return err(-31051, 'Buyurtma allaqachon to‘langan');
        if (params.amount !== order.amount * 100) return err(-31001, 'Summa noto‘g‘ri');
        return res.json({ result: { allow: true }, id });

      case 'CreateTransaction': {
        if (!order) return err(-31050, 'Buyurtma topilmadi');
        if (params.amount !== order.amount * 100) return err(-31001, 'Summa noto‘g‘ri');
        order.providerTxId = params.id;
        order.provider = 'payme';
        return res.json({ result: { create_time: Date.now(), transaction: order.id, state: 1 }, id });
      }

      case 'PerformTransaction': {
        const o = serverDb.listOrders().find(x => x.providerTxId === params.id);
        if (!o) return err(-31003, 'Tranzaksiya topilmadi');
        const { user } = serverDb.markOrderPaid(o.id, params.id);
        if (o.chatId) {
          sendTg(o.chatId, `✅ <b>To‘lov qabul qilindi!</b>\n\n${PLAN_CONFIG[o.plan].name} obunangiz faollashtirildi.\n🌐 Saytga qayting — hammasi tayyor.`);
        }
        return res.json({ result: { transaction: o.id, perform_time: Date.now(), state: 2 }, id });
      }

      case 'CancelTransaction': {
        const o = serverDb.listOrders().find(x => x.providerTxId === params.id);
        if (!o) return err(-31003, 'Tranzaksiya topilmadi');
        serverDb.cancelOrder(o.id);
        return res.json({ result: { transaction: o.id, cancel_time: Date.now(), state: -1 }, id });
      }

      case 'CheckTransaction': {
        const o = serverDb.listOrders().find(x => x.providerTxId === params.id);
        if (!o) return err(-31003, 'Tranzaksiya topilmadi');
        return res.json({
          result: {
            create_time: o.createdAt,
            perform_time: o.paidAt || 0,
            cancel_time: 0,
            transaction: o.id,
            state: o.status === 'paid' ? 2 : o.status === 'cancelled' ? -1 : 1,
            reason: null,
          }, id,
        });
      }

      default:
        return err(-32601, 'Metod topilmadi');
    }
  });

  // ==========================================
  // CLICK (Prepare / Complete)
  // ==========================================
  const clickSign = (b: any, prepareId?: string) => {
    const base = `${b.click_trans_id}${b.service_id}${CLICK_SECRET}${b.merchant_trans_id}` +
      (prepareId !== undefined ? prepareId : '') + `${b.amount}${b.action}${b.sign_time}`;
    return crypto.createHash('md5').update(base).digest('hex');
  };

  app.post('/api/payments/click/prepare', (req, res) => {
    const b = req.body || {};
    const order = serverDb.getOrder(b.merchant_trans_id);
    if (!order) return res.json({ error: -5, error_note: 'Buyurtma topilmadi' });
    if (CLICK_SECRET && b.sign_string !== clickSign(b)) return res.json({ error: -1, error_note: 'Imzo noto‘g‘ri' });
    if (Number(b.amount) !== order.amount) return res.json({ error: -2, error_note: 'Summa noto‘g‘ri' });
    if (order.status === 'paid') return res.json({ error: -4, error_note: 'Allaqachon to‘langan' });
    res.json({
      click_trans_id: b.click_trans_id, merchant_trans_id: order.id,
      merchant_prepare_id: order.id, error: 0, error_note: 'Success',
    });
  });

  app.post('/api/payments/click/complete', (req, res) => {
    const b = req.body || {};
    const order = serverDb.getOrder(b.merchant_trans_id);
    if (!order) return res.json({ error: -5, error_note: 'Buyurtma topilmadi' });
    if (CLICK_SECRET && b.sign_string !== clickSign(b, b.merchant_prepare_id)) {
      return res.json({ error: -1, error_note: 'Imzo noto‘g‘ri' });
    }
    if (Number(b.error) < 0) { serverDb.cancelOrder(order.id); return res.json({ error: -9, error_note: 'Bekor qilindi' }); }
    serverDb.markOrderPaid(order.id, String(b.click_trans_id));
    if (order.chatId) {
      sendTg(order.chatId, `✅ <b>To‘lov qabul qilindi!</b>\n\n${PLAN_CONFIG[order.plan].name} obunangiz faollashtirildi.\n🌐 Saytga qayting.`);
    }
    res.json({
      click_trans_id: b.click_trans_id, merchant_trans_id: order.id,
      merchant_confirm_id: order.id, error: 0, error_note: 'Success',
    });
  });

  // ==========================================
  // TO'LOVNI TASDIQLASH (umumiy)
  // ==========================================
  async function confirmOrder(orderId: string, manba: string) {
    const order = serverDb.getOrder(orderId);
    if (!order) return { ok: false, error: 'Buyurtma topilmadi' };
    if (order.status === 'paid') return { ok: true, already: true, order };
    const { user } = serverDb.markOrderPaid(orderId, manba);
    if (order.chatId) {
      await sendTg(order.chatId,
        `✅ <b>To‘lov qabul qilindi!</b>\n\n` +
        `<b>${PLAN_CONFIG[order.plan].name}</b> obunangiz faollashtirildi.\n` +
        `Muddati: <b>${new Date(user.planExpiresAt!).toLocaleDateString('uz-UZ')}</b>\n\n` +
        `🌐 Saytga qayting — obuna o‘zi ko‘rinadi.`);
    }
    for (const a of admins()) {
      await sendTg(a, `💰 To‘lov tasdiqlandi (${manba})\n${PLAN_CONFIG[order.plan].name} · ${fmt(order.amount)} so'm · @${order.username || order.userId}`);
    }
    return { ok: true, order };
  }

  /** Kartaga tushgan pul haqidagi xabarni qayta ishlash (SMS / bot / guruh) */
  async function handlePaymentNotice(text: string, manba: string) {
    if (!cfgOf().autoConfirm) return { ok: false, error: 'Avto-tasdiq o‘chirilgan' };
    const r = serverDb.matchOrderBySmsText(text);
    if (r.order) {
      await confirmOrder(r.order.id, manba);
      return { ok: true, orderId: r.order.id, amount: r.amount };
    }
    // Moslik topilmadi yoki bir nechta — adminga yuboramiz
    for (const a of admins()) {
      await sendTg(a,
        `⚠️ <b>To‘lov keldi, lekin avtomatik topilmadi</b>\n\n` +
        `Summa: <b>${r.amount ? fmt(r.amount) : '—'}</b>\n<code>${text.slice(0, 300)}</code>\n\n` +
        `Kutilayotgan buyurtmalar:`,
        r.candidates.length ? {
          reply_markup: {
            inline_keyboard: r.candidates.slice(0, 8).map(o => ([{
              text: `${PLAN_CONFIG[o.plan].name} · ${fmt(o.amount)} · @${o.username || '—'}`,
              callback_data: `ok_${o.id}`,
            }])),
          },
        } : {});
    }
    return { ok: false, error: 'Moslik topilmadi', amount: r.amount };
  }

  /**
   * Karta xabarnomasi uchun webhook.
   * Manbalar: telefondagi SMS-forwarder ilova, Telethon userbot yoki boshqa xizmat.
   * POST /api/payments/sms  { "secret": "...", "text": "..." }
   */
  app.post('/api/payments/sms', async (req, res) => {
    const { secret, text } = req.body || {};
    if (!secret || secret !== cfgOf().smsSecret) {
      return res.status(403).json({ error: 'Maxfiy kalit noto‘g‘ri' });
    }
    if (!text) return res.status(400).json({ error: 'text bo‘sh' });
    const r = await handlePaymentNotice(String(text), 'sms');
    res.json(r);
  });

  /** Maxfiy kalitni admin ko'rishi uchun */
  app.get('/api/payments/sms-secret', (req, res) => {
    const userId = getUserId(req);
    const u = userId ? serverDb.getUserById(userId) : null;
    if (!u || u.role !== 'Admin') return res.status(403).json({ error: 'Ruxsat yo‘q' });
    res.json({ secret: cfgOf().smsSecret });
  });

  // ==========================================
  // TELEGRAM BOT
  // ==========================================
  if (!BOT_TOKEN) {
    console.warn('[BOT] TELEGRAM_BOT_TOKEN yo‘q — bot ishga tushmadi');
    return;
  }

  const adminKeyboard = () => ({
    inline_keyboard: [
      [{ text: '💳 Kartani o‘zgartirish', callback_data: 'adm_card' }],
      [{ text: '👤 Karta egasi', callback_data: 'adm_owner' }],
      [{ text: '📋 Kutilayotgan to‘lovlar', callback_data: 'adm_orders' }, { text: '📊 Statistika', callback_data: 'adm_stats' }],
      [{ text: '🤖 Avto-tasdiq', callback_data: 'adm_auto' }, { text: '🔑 SMS kalit', callback_data: 'adm_secret' }],
      [{ text: '➕ Admin qo‘shish', callback_data: 'adm_addadmin' }, { text: '♻️ Kalitni yangilash', callback_data: 'adm_newsecret' }],
    ],
  });

  const adminText = () => {
    const st = cfgOf();
    return `⚙️ <b>Admin panel</b>\n\n` +
      `💳 Karta: <code>${st.cardNumber || 'kiritilmagan'}</code>\n` +
      `👤 Egasi: ${st.cardOwner || '—'}\n` +
      `🤖 Avto-tasdiq: <b>${st.autoConfirm ? 'yoqilgan' : "o'chirilgan"}</b>\n` +
      `👮 Adminlar: ${st.adminChatIds.join(', ') || '—'}\n` +
      `📋 Kutilayotgan to‘lov: ${serverDb.listOrders('pending').length} ta`;
  };

  const askContact = (chatId: number | string) =>
    sendTg(chatId,
      `👋 <b>RENAX AI</b> ga xush kelibsiz!\n\n` +
      `Ro‘yxatdan o‘tish uchun telefon raqamingizni ulashing. ` +
      `Raqam Telegram tomonidan tasdiqlanadi — SMS kutish shart emas.\n\n` +
      `🎁 Har bir yangi raqamga bir martalik bepul sinov paketi beriladi.`,
      {
        reply_markup: {
          keyboard: [[{ text: '📱 Raqamimni ulashish', request_contact: true }]],
          resize_keyboard: true, one_time_keyboard: true,
        },
      });

  const showMenu = (chatId: number | string, uname?: string) =>
    sendTg(chatId,
      `🚀 <b>RENAX AI — obunalar</b>\n\n` +
      PLAN_ORDER.map(p => planCard(p)).join('\n\n') +
      (uname ? `\n\n👤 Hisobingiz: <b>@${uname}</b>` : '') +
      `\n\nKerakli tarifni tanlang:`,
      { reply_markup: planKeyboard() });

  const startOrder = async (chatId: number | string, userId: string, plan: PlanId, uname?: string) => {
    const order = serverDb.createOrder({ userId, username: uname, plan, provider: 'manual', chatId });
    const m = paymentMessage(order);
    await sendTg(chatId, m.text, { reply_markup: m.reply_markup });
    return order;
  };

  let offset = 0;
  const poll = async () => {
    try {
      const r = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset + 1}&timeout=25&allowed_updates=["message","callback_query","channel_post"]`,
        { signal: AbortSignal.timeout(30000) }
      );
      const j: any = await r.json();
      if (j?.ok && Array.isArray(j.result)) {
        for (const upd of j.result) {
          offset = Math.max(offset, upd.update_id);
          try { await handleUpdate(upd); } catch (e) { console.warn('[BOT] update xatosi:', e); }
        }
      }
    } catch { /* tarmoq xatosi */ }
    setTimeout(poll, 1200);
  };

  async function handleUpdate(upd: any) {
    // ---------- Tugma bosilishi ----------
    if (upd.callback_query) {
      const cq = upd.callback_query;
      const chatId = cq.message?.chat?.id;
      const data: string = cq.data || '';
      const tgId = cq.from?.id;
      await tg('answerCallbackQuery', { callback_query_id: cq.id });

      const dbUser = serverDb.getUserByTelegramId(tgId);

      if (data === 'my_sub') {
        if (!dbUser) return void askContact(chatId);
        const st = serverDb.getSubscriptionState(dbUser.id);
        return void sendTg(chatId,
          `📊 <b>Sizning obunangiz</b>\n\n` +
          `Tarif: <b>${st.plan.name}</b>\n` +
          (st.expiresAt ? `Tugash sanasi: <b>${new Date(st.expiresAt).toLocaleDateString('uz-UZ')}</b> (${st.daysLeft} kun)\n` : '') +
          `\nQolgan xabar (oylik): <b>${st.left?.month ?? 0}</b>\n` +
          `Bugungi xabar: <b>${st.left?.day ?? 0}</b>\n` +
          `Bugungi rasm: <b>${st.plan.unlimitedImages ? 'cheksiz' : st.left?.images ?? 0}</b>`,
          { reply_markup: planKeyboard() });
      }

      if (data.startsWith('plan_')) {
        const plan = data.slice(5) as PlanId;
        if (!PLAN_CONFIG[plan]) return;
        if (!dbUser) { pending.set(String(chatId), { step: 'username', plan }); return void askContact(chatId); }
        if (!dbUser.username) {
          pending.set(String(chatId), { step: 'username', plan });
          return void sendTg(chatId,
            `🔗 Obunani saytdagi hisobingizga ulash kerak.\n\n` +
            `Saytdagi <b>username</b>ingizni yozing (masalan: <code>azizbek</code>).\n` +
            `Hisobingiz yo‘q bo‘lsa, avval ${SITE_URL} da ro‘yxatdan o‘ting.`);
        }
        return void startOrder(chatId, dbUser.id, plan, dbUser.username);
      }

      if (data.startsWith('paid_')) {
        const order = serverDb.getOrder(data.slice(5));
        if (!order) return void sendTg(chatId, '❌ Buyurtma topilmadi.');
        if (order.status === 'paid') return void sendTg(chatId, '✅ Bu buyurtma allaqachon tasdiqlangan.');
        await sendTg(chatId, `⏳ Rahmat! To‘lovingiz tekshirilmoqda. Tasdiqlangach xabar beramiz (odatda bir necha daqiqa).`);
        for (const admin of admins()) {
          await sendTg(admin,
            `🔔 <b>Yangi to‘lov</b>\n\n` +
            `Tarif: <b>${PLAN_CONFIG[order.plan].name}</b>\nSumma: <b>${fmt(order.amount)} so'm</b>\n` +
            `Foydalanuvchi: <b>@${order.username || '—'}</b>\nBuyurtma: <code>${order.id}</code>`,
            {
              reply_markup: {
                inline_keyboard: [[
                  { text: '✅ Tasdiqlash', callback_data: `ok_${order.id}` },
                  { text: '❌ Rad etish', callback_data: `no_${order.id}` },
                ]],
              },
            });
        }
        return;
      }

      if (data.startsWith('ok_') || data.startsWith('no_')) {
        if (!serverDb.isAdminChat(chatId)) return void sendTg(chatId, '⛔ Bu amal faqat administrator uchun.');
        const orderId = data.slice(3);
        const order = serverDb.getOrder(orderId);
        if (!order) return void sendTg(chatId, '❌ Buyurtma topilmadi.');
        if (data.startsWith('no_')) {
          serverDb.cancelOrder(orderId);
          if (order.chatId) await sendTg(order.chatId, '❌ To‘lovingiz tasdiqlanmadi. Iltimos, administrator bilan bog‘laning.');
          return void sendTg(chatId, 'Rad etildi.');
        }
        await confirmOrder(orderId, 'admin');
        return void sendTg(chatId, `✅ ${order.username || order.userId} uchun ${PLAN_CONFIG[order.plan].name} yoqildi.`);
      }


      // ---------- ADMIN PANELI ----------
      if (data.startsWith('adm_')) {
        if (!serverDb.isAdminChat(chatId)) return void sendTg(chatId, '⛔ Faqat administrator uchun.');
        const st = cfgOf();
        const act = data.slice(4);

        if (act === 'card') { adminWait.set(String(chatId), 'card'); return void sendTg(chatId, `💳 Yangi karta raqamini yuboring:\n<i>Hozirgi: ${st.cardNumber || 'kiritilmagan'}</i>`); }
        if (act === 'owner') { adminWait.set(String(chatId), 'owner'); return void sendTg(chatId, `👤 Karta egasining ismini yuboring:\n<i>Hozirgi: ${st.cardOwner || 'kiritilmagan'}</i>`); }
        if (act === 'addadmin') { adminWait.set(String(chatId), 'addAdmin'); return void sendTg(chatId, `➕ Yangi admin chat ID sini yuboring (raqam):\n<i>Hozirgi adminlar: ${st.adminChatIds.join(', ') || '—'}</i>`); }

        if (act === 'auto') {
          const yangi = !st.autoConfirm;
          serverDb.updateSettings({ autoConfirm: yangi });
          return void sendTg(chatId, `🤖 Avtomatik tasdiqlash: <b>${yangi ? 'YOQILDI' : "O'CHIRILDI"}</b>`, { reply_markup: adminKeyboard() });
        }

        if (act === 'secret') {
          return void sendTg(chatId,
            `🔑 <b>SMS webhook kaliti</b>\n<code>${st.smsSecret}</code>\n\n` +
            `Manzil:\n<code>${SITE_URL}/api/payments/sms</code>\n\n` +
            `Telefondagi SMS-forwarder ilovasi yoki userbot shu manzilga\n` +
            `<code>{"secret":"...","text":"SMS matni"}</code> yuborsa, to'lov o'zi tasdiqlanadi.`);
        }

        if (act === 'newsecret') {
          const yangi = crypto.randomBytes(12).toString('hex');
          serverDb.updateSettings({ smsSecret: yangi });
          return void sendTg(chatId, `🔑 Yangi kalit:\n<code>${yangi}</code>`, { reply_markup: adminKeyboard() });
        }

        if (act === 'orders') {
          const kutilmoqda = serverDb.listOrders('pending').slice(0, 10);
          if (!kutilmoqda.length) return void sendTg(chatId, '📋 Kutilayotgan to‘lov yo‘q.', { reply_markup: adminKeyboard() });
          return void sendTg(chatId, `📋 <b>Kutilayotgan to‘lovlar</b>\n\nTasdiqlash uchun tugmani bosing:`, {
            reply_markup: {
              inline_keyboard: kutilmoqda.map(o => ([
                { text: `✅ ${PLAN_CONFIG[o.plan].name} · ${fmt(o.amount)} · @${o.username || '—'}`, callback_data: `ok_${o.id}` },
                { text: '❌', callback_data: `no_${o.id}` },
              ])),
            },
          });
        }

        if (act === 'stats') {
          const barcha = serverDb.listOrders();
          const tolangan = barcha.filter(o => o.status === 'paid');
          const oy = tolangan.filter(o => Date.now() - (o.paidAt || 0) < 30 * 86400000);
          const summa = oy.reduce((a, o) => a + o.amount, 0);
          return void sendTg(chatId,
            `📊 <b>Statistika</b>\n\n` +
            `Jami to‘lovlar: <b>${tolangan.length}</b>\n` +
            `Oxirgi 30 kun: <b>${oy.length}</b> ta\n` +
            `Tushum (30 kun): <b>${fmt(summa)} so'm</b>\n` +
            `Kutilmoqda: <b>${serverDb.listOrders('pending').length}</b>`,
            { reply_markup: adminKeyboard() });
        }

        if (act === 'menu') return void sendTg(chatId, adminText(), { reply_markup: adminKeyboard() });
        return;
      }
      if (data.startsWith('cancel_')) {
        serverDb.cancelOrder(data.slice(7));
        return void sendTg(chatId, 'Buyurtma bekor qilindi.', { reply_markup: planKeyboard() });
      }
      return;
    }

    // ---------- Xabar ----------
    const msg = upd.message || upd.channel_post;
    if (!msg) return;
    const chatId = msg.chat.id;
    const from = msg.from || {};

    // Guruh/kanalga tushgan xabar — karta xabarnomasi bo'lishi mumkin
    if (msg.chat.type !== 'private') {
      const t = msg.text || msg.caption || '';
      if (t && /(UZS|so['\u2018\u2019]?m|сум|hisob|karta|p2p|\+\d)/i.test(t)) {
        await handlePaymentNotice(t, `guruh:${chatId}`);
      }
      return;
    }

    // 1) Kontakt (telefon raqam)
    if (msg.contact) {
      // MUHIM: odam boshqa odamning kontaktini yuborishi mumkin — tekshiramiz
      if (String(msg.contact.user_id) !== String(from.id)) {
        return void sendTg(chatId, '⚠️ Bu sizning raqamingiz emas. Iltimos, <b>o‘z</b> raqamingizni ulashing.',
          { reply_markup: { keyboard: [[{ text: '📱 Raqamimni ulashish', request_contact: true }]], resize_keyboard: true } });
      }
      const phone = normalizePhone(msg.contact.phone_number);
      if (!phone) return void sendTg(chatId, '⚠️ Raqamni o‘qib bo‘lmadi. Qaytadan urinib ko‘ring.');

      const res = serverDb.loginOrRegisterTelegramUser({
        telegramId: from.id,
        firstName: from.first_name,
        lastName: from.last_name,
        username: from.username,
      });
      // Raqamni biriktiramiz va bepul paketni bir marta beramiz
      const u = serverDb.getUserById(res.user.id)!;
      const phoneOwner = serverDb.getUserByPhone(phone);
      if (phoneOwner && phoneOwner.id !== u.id) {
        return void sendTg(chatId, '⚠️ Bu raqam boshqa hisobga biriktirilgan. Administrator bilan bog‘laning.');
      }
      u.phone = phone;
      u.phoneVerified = true;
      u.telegramChatId = chatId;
      const yangi = !serverDb.hasPhoneClaimedFreeCredits(phone);
      if (yangi) (serverDb as any).markPhoneAsClaimed?.(phone);

      await sendTg(chatId,
        `✅ Raqam tasdiqlandi: <b>${phone}</b>\n` +
        (yangi ? `🎁 Bepul sinov paketi berildi.\n` : `ℹ️ Bu raqam ilgari bepul paketni olgan.\n`),
        { reply_markup: { remove_keyboard: true } });

      const p = pending.get(String(chatId));
      if (p) {
        pending.delete(String(chatId));
        if (!u.username) {
          pending.set(String(chatId), { step: 'username', plan: p.plan });
          return void sendTg(chatId, `🔗 Saytdagi <b>username</b>ingizni yozing:`);
        }
        return void startOrder(chatId, u.id, p.plan, u.username);
      }
      return void showMenu(chatId, u.username);
    }

    const text = (msg.text || '').trim();
    if (!text) return;

    // 2) /start [payload]
    if (text.startsWith('/start')) {
      const payload = text.replace(/^\/start(@\w+)?\s*/, '').trim();
      const dbUser = serverDb.getUserByTelegramId(from.id);

      // saytdagi kirish sessiyasi: /start auth_<id>
      const authMatch = payload.match(/^auth_([A-Za-z0-9_\-]+)$/);
      if (authMatch) {
        if (!dbUser || !dbUser.phoneVerified) {
          pending.set(String(chatId), { step: 'username', plan: 'bronze' });
          (pending as any).authSession = authMatch[1];
          return void askContact(chatId);
        }
        const r = serverDb.loginOrRegisterTelegramUser({
          telegramId: from.id, firstName: from.first_name, lastName: from.last_name, username: from.username,
        });
        const bound = bindSession(authMatch[1], r.user, r.token, r.isNew);
        return void sendTg(chatId, bound
          ? `✅ Saytga kirdingiz! Brauzerga qayting.`
          : `⚠️ Sessiya topilmadi yoki eskirgan. Saytda qaytadan urinib ko‘ring.`);
      }

      // tarif tanlangan holda kelgan: /start plan_silver_azizbek
      const planMatch = payload.match(/^plan_(bronze|silver|vip)(?:_([A-Za-z0-9_]+))?$/);
      if (planMatch) {
        const plan = planMatch[1] as PlanId;
        const uname = planMatch[2];
        if (!dbUser) { pending.set(String(chatId), { step: 'username', plan }); return void askContact(chatId); }
        if (uname && !dbUser.username) {
          const site = serverDb.getUserByUsername(uname);
          if (site) { dbUser.username = site.username; }
        }
        if (!dbUser.username) {
          pending.set(String(chatId), { step: 'username', plan });
          return void sendTg(chatId, `🔗 Saytdagi <b>username</b>ingizni yozing:`);
        }
        return void startOrder(chatId, dbUser.id, plan, dbUser.username);
      }

      if (!dbUser || !dbUser.phoneVerified) return void askContact(chatId);
      return void showMenu(chatId, dbUser.username);
    }

    // ---------- ADMIN ----------
    if (text === '/admin') {
      const st = cfgOf();
      // Birinchi ishga tushirish: adminlar ro'yxati bo'sh bo'lsa, birinchi murojaat qilgan odam admin bo'ladi
      if (!st.adminChatIds.length) {
        serverDb.updateSettings({ adminChatIds: [String(chatId)] });
        await sendTg(chatId, `✅ Siz administrator sifatida qo‘shildingiz (chat ID: <code>${chatId}</code>).`);
      } else if (!serverDb.isAdminChat(chatId)) {
        return void sendTg(chatId, `⛔ Bu bo‘lim faqat administrator uchun.\nSizning chat ID: <code>${chatId}</code>`);
      }
      return void sendTg(chatId, adminText(), { reply_markup: adminKeyboard() });
    }

    if (text === '/id') {
      return void sendTg(chatId, `🆔 Sizning chat ID: <code>${chatId}</code>`);
    }

    // Admin matn kiritishini kutmoqdami?
    const kutmoqda = adminWait.get(String(chatId));
    if (kutmoqda && serverDb.isAdminChat(chatId)) {
      adminWait.delete(String(chatId));
      if (kutmoqda === 'card') {
        serverDb.updateSettings({ cardNumber: text });
        return void sendTg(chatId, `✅ Karta yangilandi: <code>${text}</code>`, { reply_markup: adminKeyboard() });
      }
      if (kutmoqda === 'owner') {
        serverDb.updateSettings({ cardOwner: text });
        return void sendTg(chatId, `✅ Karta egasi: <b>${text}</b>`, { reply_markup: adminKeyboard() });
      }
      if (kutmoqda === 'addAdmin') {
        const id = text.replace(/\D/g, '');
        if (!id) return void sendTg(chatId, '❌ Faqat raqam yuboring.');
        const st = cfgOf();
        serverDb.updateSettings({ adminChatIds: Array.from(new Set([...st.adminChatIds, id])) });
        return void sendTg(chatId, `✅ Admin qo‘shildi: <code>${id}</code>`, { reply_markup: adminKeyboard() });
      }
    }

    if (text === '/obuna' || text === '/tariflar') {
      const dbUser = serverDb.getUserByTelegramId(from.id);
      return void showMenu(chatId, dbUser?.username);
    }

    // 3) Username kutilmoqda
    const p = pending.get(String(chatId));
    if (p?.step === 'username') {
      const uname = text.replace(/^@/, '').toLowerCase();
      const site = serverDb.getUserByUsername(uname);
      if (!site) {
        return void sendTg(chatId,
          `❌ <b>@${uname}</b> topilmadi.\n\n` +
          `Username saytdagi hisobingiznikiga to‘g‘ri kelishi kerak. ` +
          `Hisobingiz yo‘q bo‘lsa, ${SITE_URL} da ro‘yxatdan o‘ting va qaytadan yozing.`);
      }
      pending.delete(String(chatId));
      // Telegram hisobini saytdagi hisobga bog'laymiz
      site.telegramId = String(from.id);
      site.telegramChatId = chatId;
      await sendTg(chatId, `✅ Hisob topildi: <b>${site.name}</b> (@${site.username})`);
      return void startOrder(chatId, site.id, p.plan, site.username);
    }

    // Admin @CardXabarBot xabarini shu botga forward qilsa — avtomatik tekshiramiz
    if (serverDb.isAdminChat(chatId) && (msg.forward_from || msg.forward_origin || msg.forward_sender_name)) {
      const r = await handlePaymentNotice(text, 'forward');
      return void sendTg(chatId, r.ok ? '✅ To‘lov topildi va tasdiqlandi.' : `⚠️ ${r.error}`);
    }

    const dbUser = serverDb.getUserByTelegramId(from.id);
    if (!dbUser || !dbUser.phoneVerified) return void askContact(chatId);
    return void showMenu(chatId, dbUser.username);
  }

  poll();
  console.log(`[BOT] @${BOT_USERNAME} ishga tushdi`);

  // ---------- Obuna tugashi haqida eslatma (kuniga bir marta) ----------
  setInterval(() => {
    for (const u of serverDb.listExpiringSoon(48)) {
      if (!u.telegramChatId) continue;
      sendTg(u.telegramChatId,
        `⏰ <b>${PLAN_CONFIG[(u.plan || 'free') as PlanId].name}</b> obunangiz ` +
        `${new Date(u.planExpiresAt!).toLocaleDateString('uz-UZ')} da tugaydi.\n\nUzaytirish uchun tarifni tanlang:`,
        { reply_markup: planKeyboard() });
    }
  }, 12 * 60 * 60 * 1000).unref?.();
}
