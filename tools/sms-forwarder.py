#!/usr/bin/env python3
"""
RENAX AI — karta xabarnomalarini avtomatik uzatuvchi (userbot).

Nima qiladi:
  @CardXabarBot (yoki bank botining) sizga yuborgan SMS xabarini o'qiydi va
  saytingizdagi /api/payments/sms manziliga yuboradi. Server summani topib,
  mos buyurtmani avtomatik tasdiqlaydi.

NEGA KERAK:
  Telegram boti boshqa botning xabarini ko'ra olmaydi. Shuning uchun bu skript
  sizning Telegram AKKAUNTINGIZ nomidan ishlaydi (userbot).

O'RNATISH:
  pip install telethon requests
  # api_id va api_hash ni https://my.telegram.org dan oling

ISHGA TUSHIRISH:
  python3 sms-forwarder.py
  (birinchi marta telefon raqam va kod so'raydi, keyin sessiya saqlanadi)

Doimiy ishlashi uchun serverda screen/tmux yoki systemd xizmati sifatida qo'ying.
"""

import os
import requests
from telethon import TelegramClient, events

# ---------- SOZLAMALAR ----------
API_ID = int(os.getenv("TG_API_ID", "0"))            # my.telegram.org dan
API_HASH = os.getenv("TG_API_HASH", "")              # my.telegram.org dan
WEBHOOK = os.getenv("RENAX_WEBHOOK", "https://renaxai.uz/api/payments/sms")
SECRET = os.getenv("RENAX_SMS_SECRET", "")           # botda /admin -> "SMS kalit"

# Qaysi botlardan xabar kutamiz (username, @ siz)
MANBALAR = [s.strip().lstrip("@").lower() for s in
            os.getenv("SMS_SOURCES", "CardXabarBot").split(",") if s.strip()]
# --------------------------------

if not API_ID or not API_HASH or not SECRET:
    raise SystemExit("TG_API_ID, TG_API_HASH va RENAX_SMS_SECRET ni to'ldiring.")

client = TelegramClient("renax_sms_session", API_ID, API_HASH)


@client.on(events.NewMessage(incoming=True))
async def handler(event):
    try:
        sender = await event.get_sender()
        uname = (getattr(sender, "username", "") or "").lower()
        if uname not in MANBALAR:
            return

        text = event.raw_text or ""
        if not text.strip():
            return

        r = requests.post(WEBHOOK, json={"secret": SECRET, "text": text}, timeout=15)
        print(f"[{uname}] -> {r.status_code} {r.text[:200]}")
    except Exception as e:
        print("Xato:", e)


print("Ishga tushdi. Kuzatilayotgan botlar:", ", ".join(MANBALAR))
client.start()
client.run_until_disconnected()
