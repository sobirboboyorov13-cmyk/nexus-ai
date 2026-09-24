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
  const { currentUser, addCredits, refreshUserAndCredits } = useNexusStore();
  const [activePlan, setActivePlan] = useState<'bronze' | 'silver' | 'gold'>(selectedPlanId);
  const [usernameInput, setUsernameInput] = useState(currentUser.name || 'foydalanuvchi');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  React.useEffect(() => {
    setActivePlan(selectedPlanId);
    setUsernameInput(currentUser.name || 'foydalanuvchi');
    setPaymentSuccess(false);
  }, [selectedPlanId, currentUser, isOpen]);

  if (!isOpen) return null;

  const plan = PLANS.find((p) => p.id === activePlan) || PLANS[1];

  const handleOpenTelegram = () => {
    const botUser = 'renaxai_bot';
    const tgUrl = `https://t.me/${botUser}?start=plan_${plan.id}_${encodeURIComponent(usernameInput.trim() || 'user')}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  const handleInstantActivation = async () => {
    await addCredits(plan.credits, `Obuna faollashtirildi: ${plan.name} tarifi (+${plan.credits} kredit)`);
    setPaymentSuccess(true);
    await refreshUserAndCredits();
    setTimeout(() => {
      setPaymentSuccess(false);
      onClose();
    }, 2000);
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

            {/* Username / Account */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">
                Foydalanuvchi hisob nomi (Username)
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Telegram yoki RENAX username..."
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-[#171717] border border-zinc-200 dark:border-[#333333] text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">
                To‘lov usulini tanlang:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleOpenTelegram}
                  className="p-3 rounded-xl border border-sky-500/40 bg-sky-50 dark:bg-sky-950/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 flex items-center justify-center gap-2 text-sky-700 dark:text-sky-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Bot className="w-4 h-4" />
                  <span>Telegram Bot (@renaxai_bot)</span>
                </button>

                <button
                  onClick={handleOpenTelegram}
                  className="p-3 rounded-xl border border-zinc-300 dark:border-[#383838] bg-zinc-50 dark:bg-[#242424] hover:bg-zinc-100 dark:hover:bg-[#2c2c2c] flex items-center justify-center gap-2 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span>Click / Payme</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleOpenTelegram}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram botni ochish</span>
              </button>

              <button
                onClick={handleInstantActivation}
                className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                title="Sinov maqsadida darhol kreditlarni kiritish"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Tezkor sinov (Test)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-[#8e8e8e] justify-center pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Xavfsiz to‘lov va 100% kafolatlangan ulanish.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
