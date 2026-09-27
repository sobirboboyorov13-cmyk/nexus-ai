# Karta to'lovini avtomatik tasdiqlash — 3 ta yo'l

Telegram boti **boshqa botning xabarini o'qiy olmaydi**. Shuning uchun
@CardXabarBot dan kelgan SMS ni serverga yetkazish uchun quyidagi
uchta yo'ldan birini tanlang. Serverdagi mantiq uchalasi uchun ham bir xil.

## Qanday moslashtiriladi

Har bir buyurtmaga **noyob summa** beriladi: masalan Bronza 49 000 emas,
`49 037` so'm. Kartaga aynan shu summa tushganda server buyurtmani
adashmasdan topadi. Shuning uchun mijozga "aynan shu summani o'tkazing"
deb ko'rsatiladi.

---

## 1-yo'l: Guruh (eng oson, userbot kerak emas)

Agar @CardXabarBot xabarnomalarni **guruhga** yubora olsa:

1. Telegram'da yopiq guruh oching
2. @CardXabarBot ni va o'z botingizni (@renaxaiuz_bot) guruhga qo'shing
3. Botingizni **admin** qiling (xabarlarni ko'rishi uchun)
4. Tayyor — guruhga tushgan har bir xabar avtomatik tekshiriladi

## 2-yo'l: Forward (qo'lda, lekin darhol ishlaydi)

@CardXabarBot dan kelgan xabarni o'z botingizga **forward** qiling.
Bot uni o'qiydi va mos buyurtmani tasdiqlaydi. Admin uchun ishlaydi.

## 3-yo'l: Userbot (to'liq avtomatik)

`sms-forwarder.py` skripti sizning Telegram akkauntingiz nomidan
@CardXabarBot xabarlarini o'qiydi va serverga yuboradi.

```bash
pip install telethon requests

export TG_API_ID=123456          # my.telegram.org dan
export TG_API_HASH=xxxxxxxx      # my.telegram.org dan
export RENAX_WEBHOOK=https://renaxai.uz/api/payments/sms
export RENAX_SMS_SECRET=...      # botda /admin -> "🔑 SMS kalit"
export SMS_SOURCES=CardXabarBot  # vergul bilan bir nechta bot

python3 sms-forwarder.py
```

Serverda doimiy ishlashi uchun:
```bash
sudo tee /etc/systemd/system/renax-sms.service > /dev/null <<'SERVICE'
[Unit]
Description=RENAX SMS forwarder
After=network.target

[Service]
WorkingDirectory=/opt/renax/tools
ExecStart=/usr/bin/python3 /opt/renax/tools/sms-forwarder.py
EnvironmentFile=/opt/renax/tools/.env
Restart=always

[Install]
WantedBy=multi-user.target
SERVICE
sudo systemctl enable --now renax-sms
```

## 4-yo'l: Telefondagi SMS ilovasi

Agar bank SMS sifatida yuborsa, Android'dagi "SMS Forwarder" turidagi ilova
orqali to'g'ridan-to'g'ri webhook'ga yuborish mumkin:

- Manzil: `https renaxai.uz/api/payments/sms`
- Usul: POST, JSON
- Tanasi: `{"secret":"SIZNING_KALIT","text":"%message%"}`

---

## Xavfsizlik

- `secret` ni hech kimga bermang. Botda `/admin → ♻️ Kalitni yangilash` orqali
  istalgan vaqtda almashtirasiz.
- Avto-tasdiqni `/admin → 🤖 Avto-tasdiq` orqali o'chirib qo'yish mumkin.
- Summa mos kelmasa yoki bir nechta buyurtma bo'lsa, bot avtomatik
  tasdiqlamaydi — sizga tugmalar bilan xabar yuboradi.
