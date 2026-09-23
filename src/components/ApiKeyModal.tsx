import React, { useState } from 'react';
import { Key, Globe, Cpu, ShieldCheck, X, Check, Lock, ExternalLink, Sparkles } from 'lucide-react';
import { useNexusStore } from '../lib/store';

export const ApiKeyModal: React.FC = () => {
  const {
    isApiKeyModalOpen,
    setApiKeyModalOpen,
    customBaseUrl,
    setCustomBaseUrl,
    customModelName,
    setCustomModelName,
    openAiApiKey,
    setOpenAiApiKey,
    geminiApiKey,
    setGeminiApiKey,
    openRouterApiKey,
    setOpenRouterApiKey,
  } = useNexusStore();

  const [baseUrlInput, setBaseUrlInput] = useState(customBaseUrl || '');
  const [modelNameInput, setModelNameInput] = useState(customModelName || '');
  const [openAiKeyInput, setOpenAiKeyInput] = useState(openAiApiKey || '');
  const [geminiKeyInput, setGeminiKeyInput] = useState(geminiApiKey || '');
  const [openRouterKeyInput, setOpenRouterKeyInput] = useState(openRouterApiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isApiKeyModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomBaseUrl(baseUrlInput.trim());
    setCustomModelName(modelNameInput.trim());
    setOpenAiApiKey(openAiKeyInput.trim());
    setGeminiApiKey(geminiKeyInput.trim());
    setOpenRouterApiKey(openRouterKeyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setApiKeyModalOpen(false);
    }, 900);
  };

  const handleClear = () => {
    setBaseUrlInput('');
    setModelNameInput('');
    setOpenAiKeyInput('');
    setGeminiKeyInput('');
    setOpenRouterKeyInput('');
    setCustomBaseUrl('');
    setCustomModelName('');
    setOpenAiApiKey('');
    setGeminiApiKey('');
    setOpenRouterApiKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#1e1e1e] border border-[#333333] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e2e2e] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">API va Model Sozlamalari</h3>
              <p className="text-xs text-[#8e8e8e]">O'z API manzilingiz, modelingiz va kalitingizni sozlang</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setApiKeyModalOpen(false)}
            className="p-1.5 rounded-lg text-[#8e8e8e] hover:text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Section 1: Custom API Endpoint (teamsoclo, gpt-5.6-sol, etc.) */}
          <div className="p-3.5 bg-[#171717] border border-[#2e2e2e] rounded-xl space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-[#262626]">
              <Globe className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="font-semibold text-white text-xs">1. Maxsus API Manzil & Model (GPT-5.6 Sol / OpenAI)</div>
            </div>

            {/* Base URL Input */}
            <div className="space-y-1">
              <label className="font-medium text-[#d4d4d4] flex items-center justify-between">
                <span>Base URL (API Manzil):</span>
                <span className="text-[10px] text-[#737373]">Masalan: https://gpt.teamsoclo.site/v1</span>
              </label>
              <input
                type="text"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="https://gpt.teamsoclo.site/v1"
                className="w-full bg-[#212121] border border-[#333333] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-[#555555] focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Model Name Input */}
            <div className="space-y-1">
              <label className="font-medium text-[#d4d4d4] flex items-center justify-between">
                <span>Model nomi:</span>
                <span className="text-[10px] text-[#737373]">Masalan: gpt-5.6-sol yoki gpt-4o</span>
              </label>
              <input
                type="text"
                value={modelNameInput}
                onChange={(e) => setModelNameInput(e.target.value)}
                placeholder="gpt-5.6-sol"
                className="w-full bg-[#212121] border border-[#333333] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-[#555555] focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* API Key Input */}
            <div className="space-y-1">
              <label className="font-medium text-[#d4d4d4] flex items-center justify-between">
                <span>API Kalit (API Key):</span>
                <span className="text-[10px] text-[#737373]">sk-... bilan boshlanuvchi maxsus kalit</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={openAiKeyInput}
                  onChange={(e) => setOpenAiKeyInput(e.target.value)}
                  placeholder="sk-UgxTpfof..."
                  className="w-full bg-[#212121] border border-[#333333] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-[#555555] focus:outline-none focus:border-amber-500 transition-colors pr-8"
                />
                {openAiKeyInput.length > 5 && (
                  <ShieldCheck className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Google Gemini (Cheksiz Flow / Imagen 3) */}
          <div className="p-3.5 bg-[#171717] border border-[#2e2e2e] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>2. Google Gemini API Key (Imagen 3 & 2.5 Flash)</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span>Bepul olish</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="relative">
              <input
                type="password"
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#212121] border border-[#333333] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-[#555555] focus:outline-none focus:border-blue-500 transition-colors pr-8"
              />
              {geminiKeyInput.length > 5 && (
                <ShieldCheck className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
          </div>

          {/* Section 3: OpenRouter Key (Claude, DeepSeek) */}
          <div className="p-3.5 bg-[#171717] border border-[#2e2e2e] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>3. OpenRouter API Key (Claude 3.5 & DeepSeek R1)</span>
              </label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <span>Kalit olish</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="relative">
              <input
                type="password"
                value={openRouterKeyInput}
                onChange={(e) => setOpenRouterKeyInput(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full bg-[#212121] border border-[#333333] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-[#555555] focus:outline-none focus:border-purple-500 transition-colors pr-8"
              />
              {openRouterKeyInput.length > 5 && (
                <ShieldCheck className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-[11px] text-[#737373]">
            <Lock className="w-3.5 h-3.5 shrink-0 text-[#8e8e8e]" />
            <span>Kalitlar va manzillar faqat brauzeringizda saqlanadi. Istalgan vaqt o'zgartirishingiz mumkin.</span>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-[#8e8e8e] hover:text-rose-400 transition-colors cursor-pointer"
            >
              Barchasini tozalash
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setApiKeyModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-[#a3a3a3] hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-[#e5e5e5] transition-colors shadow-sm cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Saqlandi!</span>
                  </>
                ) : (
                  <span>Saqlash</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
