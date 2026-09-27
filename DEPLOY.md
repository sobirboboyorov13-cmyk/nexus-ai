# RENAX AI — GitHub va Render'ga joylash

Bosqichma-bosqich. Terminalga shu buyruqlarni ketma-ket yozasiz.

---

## 1. Tayyorgarlik: maxfiy ma'lumotlarni himoyalash

**Eng muhim qadam.** `.env` faylida API kalitlar va bot tokeni bor.
U GitHub'ga **hech qachon** tushmasligi kerak.

Tekshiring — `.gitignore` ichida shular borligiga ishonch hosil qiling:

```
.env
node_modules
dist
data
```

Agar `.env` ilgari GitHub'ga tushgan bo'lsa, barcha kalitlarni yangilang
(BotFather'da `/revoke`, API provayderda yangi key).

---

## 2. GitHub'ga yuklash

GitHub'da yangi **private** repository oching (masalan `renax-ai`),
keyin loyiha papkasida:

```bash
cd nexus-ai---multi-model-ai-studio

git init
git add .
git commit -m "RENAX AI: obuna tizimi, Telegram bot, yangi dizayn"

git branch -M main
git remote add origin https://github.com/FOYDALANUVCHI/renax-ai.git
git push -u origin main
```

`FOYDALANUVCHI` o'rniga o'z GitHub nomingizni yozing.

Agar repo allaqachon mavjud bo'lsa (`.git` papkasi bor):

```bash
git add .
git commit -m "Obuna tizimi va Telegram bot qo'shildi"
git push
```

Parol so'rasa — GitHub paroli emas, **Personal Access Token** kerak:
GitHub → Settings → Developer settings → Personal access tokens →
Tokens (classic) → Generate new token → `repo` ruxsatini belgilang.

---

## 3. Render'ga joylash

1. https://render.com → **New +** → **Web Service**
2. GitHub akkauntingizni ulang va `renax-ai` repozitoriysini tanlang
3. Sozlamalar:
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** **Starter** ($7/oy)

> ⚠️ **Free rejani tanlamang.** Free servis 15 daqiqa harakatsizlikdan keyin
> uxlaydi — Telegram bot o'chadi, to'lovlar tasdiqlanmaydi, mijozlar
> saytga kira olmaydi. Obuna soting — $7 arzimas summa.

4. **Environment** bo'limiga o'tib, kalitlarni qo'lda kiriting
   (`.env` faylidan ko'chiring):

```
SITE_URL=https://renax-ai.onrender.com
TELEGRAM_BOT_TOKEN=...
TELEGRAM_BOT_USERNAME=@renaxplatformbot
TELEGRAM_ADMIN_CHAT_ID=...
VIBI_SOL_KEY=...
VIBI_API_KEY=...
TEAMSOCLO_API_KEY=...
GEMINI_API_KEY=...
GOOGLE_IMAGE_API_KEY=...
PAYMENT_CARD_NUMBER=...
PAYMENT_CARD_OWNER=...
CHAT_HISTORY_LIMIT=14
CHAT_HISTORY_CHARS=24000
```

5. **Create Web Service** → 3-5 daqiqa kutasiz.

---

## 4. Disk ulash (juda muhim)

Render'da fayl tizimi har deploy'da **tozalanadi**. Baza `data/nexus-db.json`
faylida saqlanadi — disk ulanmasa, **barcha foydalanuvchi va obunalar yo'qoladi**.

Render → servis → **Disks** → **Add Disk**:
- Name: `renax-data`
- Mount Path: `/opt/render/project/src/data`
- Size: 1 GB

Keyin **Manual Deploy → Clear build cache & deploy**.

---

## 5. Domen ulash (renaxai.uz)

Render → **Settings** → **Custom Domain** → `renaxai.uz` qo'shing.
Render sizga CNAME ko'rsatadi. Domen panelingizda (masalan ahost.uz):

```
Type: CNAME   Name: @ (yoki www)   Value: renax-ai.onrender.com
```

DNS 10 daqiqadan bir necha soatgacha tarqaladi. Keyin `SITE_URL` ni
`https://renaxai.uz` ga o'zgartiring va qayta deploy qiling.

---

## 6. Botni sozlash

Sayt ishga tushgach:

1. Telegram'da botingizga `/start` yozing
2. `/admin` yozing — adminlar ro'yxati bo'sh bo'lsa, siz avtomatik admin bo'lasiz
3. **💳 Kartani o'zgartirish** → karta raqamingizni yuboring
4. **👤 Karta egasi** → ismingizni yuboring
5. **🔑 SMS kalit** → chiqqan kalitni `tools/sms-forwarder.py` uchun saqlang

`/id` buyrug'i chat ID ni ko'rsatadi.

---

## 7. Keyingi yangilanishlar

Kodda biror narsa o'zgartirsangiz:

```bash
git add .
git commit -m "nima o'zgardi"
git push
```

Render o'zi sezadi va qayta quradi. Qo'lda: **Manual Deploy → Deploy latest commit**.

---

## Tez-tez uchraydigan muammolar

**Bot javob bermayapti** → Render loglarida `[BOT] @... ishga tushdi` borligini
tekshiring. Bo'lmasa `TELEGRAM_BOT_TOKEN` noto'g'ri. Ikkita joyda bir vaqtda
(kompyuter + Render) ishlatmang — Telegram 409 xato beradi.

**Deploy'dan keyin foydalanuvchilar yo'qoldi** → Disk ulanmagan (4-bosqich).

**Sayt ochiladi, lekin eski dizayn** → `npm run build` ishlamagan.
Render loglarini tekshiring.

**Rasm ishlamayapti** → `GOOGLE_IMAGE_API_KEY` kvotasi tugagan bo'lishi mumkin.
