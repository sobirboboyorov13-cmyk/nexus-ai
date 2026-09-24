import React, { useState } from 'react';
import { X, Send, CreditCard, Sparkles, CheckCircle2, Bot, ShieldCheck } from 'lucide-react';
import { useNexusStore } from '../lib/store';

export interface PlanItem {
  id: 'bronze' | 'silver' | 'gold';
  name: string;
  price: string;
  priceNum: number;
  period: string;
  credits: number;
  popular?: boolean;
  features: string[];
}

export const PLANS: PlanItem[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    price: '59 000',
    priceNum: 59000,
    period: 'so‘m / oy',
    credits: 500,
    features: [
      'Oyiga 300 ta AI xabar (500 kredit)',
      'GPT-5.6 Sol va GPT-6 Luna',
      'Oyiga 15 ta AI rasm (Google Flow)',
      '1 ta shaxsiy foydalanuvchi',
      'Standart turbo oqim tezligi'
    ]
  },
  {
    id: 'silver',
    name: 'Silver',
    price: '99 000',
    priceNum: 99000,
    period: 'so‘m / oy',
    credits: 1500,
    popular: true,
    features: [
      'Oyiga 1 000 ta AI xabar (1500 kredit)',
      'Barcha ChatGPT: GPT-5.6 Sol + GPT-6 Astra',
      'Claude Sonnet 4.6 (Vibi integratsiyasi)',
      'Oyiga 60 ta AI rasm (Google Flow · Imagen)',
      'Tezkor navbat va ustuvor server oqimi'
    ]
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '250 000',
    priceNum: 250000,
    period: 'so‘m / oy',
    credits: 5000,
    features: [
      'Cheksiz AI chat (5000 premium kredit)',
      'Barcha modellar: GPT, Claude Opus, Gemini 2.5, DeepSeek R1',
      'Oyiga 200 ta AI rasm & Video Lab (Veo 2)',
      'Eng yuqori GPU quvvati va 0ms kechikish',
      '24/7 VIP Telegram shaxsiy texnik yordam'
    ]
  }
];

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlanId: 'bronze' | 'silver' | 'gold';
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, selectedPlanId }) => {
  const { currentUser, refreshUserAndCredits } = useNexusStore();
  const [activePlan, setActivePlan] = useState<'bronze' | 'silver' | 'gold'>(selectedPlanId);
  const [usernameInput, setUsernameInput] = useState(currentUser.name || currentUser.email || 'foydalanuvchi');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherStatus, setVoucherStatus] = useState<{ loading: boolean; error?: string; success?: string }>({ loading: false });

  React.useEffect(() => {
    setActivePlan(selectedPlanId);
    setUsernameInput(currentUser.name || currentUser.email || 'foydalanuvchi');
    setPaymentSuccess(false);
    setVoucherCode('');
    setVoucherStatus({ loading: false });
  }, [selectedPlanId, currentUser, isOpen]);

  if (!isOpen) return null;

  const plan = PLANS.find((p) => p.id === activePlan) || PLANS[1];

  const handleOpenTelegram = () => {
    const botUser = 'renaxai_bot';
    const tgUrl = `https://t.me/${botUser}?start=pay_${plan.id}_${encodeURIComponent(currentUser.id || currentUser.email || usernameInput)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  const handleVerifyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherStatus({ loading: false, error: 'Iltimos, to‘lov cheki yoki faollashtirish kodini kiriting' });
      return;
    }

    setVoucherStatus({ loading: true });
    try {
      const res = await fetch('/api/credits/redeem-voucher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          code: voucherCode.trim(),
          planId: plan.id,
          userId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setVoucherStatus({ loading: false, error: data.error || 'To‘lov tasdiqlanmadi. Kod noto‘g‘ri yoki allaqachon ishlatilgan.' });
        return;
      }

      setVoucherStatus({ loading: false, success: `To‘lov muvaffaqiyatli tasdiqlandi! +${data.creditsAdded || plan.credits} kredit berildi.` });
      setPaymentSuccess(true);
      await refreshUserAndCredits();
      setTimeout(() => {
        setPaymentSuccess(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      setVoucherStatus({ loading: false, error: 'Server bilan bog‘lanishda xatolik yuz berdi.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1e1e1e] border border-zinc-200 dark:border-[#2f2f2f] rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col space-y-5 text-zinc-900 dark:text-[#ececec] relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <Send className="w-5 h-5 ml-0.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Telegram orqali to‘lov</h3>
            <p className="text-xs text-zinc-500 dark:text-[#8e8e8e]">
              Bot to‘lovni tekshiradi va tarifni hisobingizga avtomatik biriktiradi.
            </p>
          </div>
        </div>

        {paymentSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
            <h4 className="text-base font-bold text-zinc-900 dark:text-white">Tarif faollashtirildi!</h4>
            <p className="text-xs text-zinc-500 dark:text-[#8e8e8e]">
              +{plan.credits} kredit hisobingizga muvaffaqiyatli qo‘shildi.
            </p>
          </div>
        ) : (
          <>
            {/* Selected Plan Summary Card */}
            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-[#262626] border border-zinc-200 dark:border-[#383838] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{plan.name} tarifi</span>
                  {plan.popular && (
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full">
                      ENG MASHHUR
                    </span>
                  )}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">
                  +{plan.credits} AI kredit
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-zinc-900 dark:text-white font-mono">{plan.price} so‘m</div>
                <div className="text-[10px] text-zinc-500 dark:text-[#8e8e8e]">oylik obuna</div>
              </div>
            </div>

            {/* User Account Info */}
            <div className="space-y-1.5 bg-zinc-50 dark:bg-[#171717] p-3 rounded-xl border border-zinc-200 dark:border-[#333333]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-[#a3a3a3]">Foydalanuvchi hisobi:</span>
                <span className="font-semibold text-zinc-900 dark:text-white truncate max-w-[200px]">{currentUser.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-[#a3a3a3]">Email / ID:</span>
                <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">{currentUser.email || currentUser.id}</span>
              </div>
            </div>

            {/* Official Payment via Telegram Bot */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">
                1-usul: Rasmiy to‘lov (Telegram Bot orqali)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleOpenTelegram}
                  className="p-3 rounded-xl border border-sky-500/40 bg-sky-50 dark:bg-sky-950/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 flex items-center justify-center gap-2 text-sky-700 dark:text-sky-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Bot className="w-4 h-4" />
                  <span>@renaxai_bot</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenTelegram}
                  className="p-3 rounded-xl border border-zinc-300 dark:border-[#383838] bg-zinc-50 dark:bg-[#242424] hover:bg-zinc-100 dark:hover:bg-[#2c2c2c] flex items-center justify-center gap-2 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span>Click / Payme</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-[#8e8e8e]">
                Botga o‘tganingizda to‘lov rekvizitlari va chek yuborish ko‘rsatiladi. To‘lov tekshirilib tasdiqlangach hisobingizga avtomatik o‘tkaziladi.
              </p>
            </div>

            {/* Voucher / Activation Code Section */}
            <div className="space-y-2 pt-1 border-t border-zinc-200 dark:border-[#2f2f2f]">
              <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">
                2-usul: To‘lov tasdiqlash kodi yoki Chek vaucheri
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Masalan: RENAX-XXXX-XXXX"
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-[#171717] border border-zinc-200 dark:border-[#333333] text-zinc-900 dark:text-white uppercase font-mono tracking-wider focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleVerifyVoucher}
                  disabled={voucherStatus.loading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
                >
                  {voucherStatus.loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Tasdiqlash</span>
                  )}
                </button>
              </div>

              {voucherStatus.error && (
                <div className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">
                  {voucherStatus.error}
                </div>
              )}
            </div>

            {/* Telegram Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenTelegram}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram botga o‘tish va to‘lov qilish</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-[#8e8e8e] justify-center pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>To‘lov tasdiqlangandan so‘ng 100% kafolatlangan kredit beriladi.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
