import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Wand2,
  ChevronDown,
  ChevronUp,
  Film,
  Image as ImageIcon,
  Download,
  LayoutGrid,
  Upload,
  Video,
  X,
  Trash2,
  Eye,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useNexusStore } from '../lib/store';
import { IMAGE_MODELS } from '../lib/models';
import { AspectRatio, GeneratedImage } from '../types/nexus';
import { InpaintingModal } from './InpaintingModal';

const PROMPT_SUGGESTIONS = [
  "Quyosh botayotgan zamonaviy Toshkent City ko'chalari, daraxtlar va yorug'liklar",
  "Kiberpunk neon shahrida tezlikda ketayotgan qizil superkar, fotorealistik 8k",
  "O'zbek milliy me'morchiligi uslubidagi kosmik stansiya, moviy gumbazlar",
  "Tog'lar tepasida quyosh nurlarida uchib yurgan quyosh energiyali transport",
];

export const ImageStudio: React.FC = () => {
  const {
    imageParams,
    setImageParams,
    gallery,
    addImageToGallery,
    upscaleImage,
    sendToVideoLab,
    deductCredits,
    requireAuth,
    refundCredits,
    currentUser,
    refreshUserAndCredits,
    geminiApiKey,
    openAiApiKey,
    customBaseUrl,
    setCurrentTab,
    setApiKeyModalOpen,
  } = useNexusStore();

  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState(0);
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const [selectedImageForModal, setSelectedImageForModal] = useState<GeneratedImage | null>(null);
  const [mobileTab, setMobileTab] = useState<'controls' | 'preview'>('controls');
  const [viewMode, setViewMode] = useState<'preview' | 'grid'>('preview');

  // Load user's real images from database on mount & on user change
  useEffect(() => {
    refreshUserAndCredits();
  }, [currentUser?.id]);

  // Generation live timer
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setGenerationTime(0);
      interval = setInterval(() => {
        setGenerationTime((t) => +(t + 0.1).toFixed(1));
      }, 100);
    } else {
      setGenerationTime(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Filter gallery for current user
  const currentUserId = currentUser.id || 'user-guest';
  const userGallery = gallery.filter((img) => {
    const uId = (img as any).userId;
    if (currentUserId === 'user-guest' || !currentUserId) {
      return !uId || uId === 'user-guest' || uId === '';
    }
    return uId === currentUserId || !uId || uId === 'user-guest';
  });
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const activeImage = previewImage || (userGallery.length > 0 ? userGallery[0] : null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const selectedModel = IMAGE_MODELS.find((m) => m.id === imageParams.modelId) || IMAGE_MODELS[0];

  const aspectRatios: { id: AspectRatio; label: string }[] = [
    { id: '1:1', label: '1:1 · Kvadrat' },
    { id: '16:9', label: '16:9 · Keng' },
    { id: '9:16', label: '9:16 · Tik (Story)' },
    { id: '4:5', label: '4:5 · Instagram' },
    { id: '4:3', label: '4:3 · Klassik' },
    { id: '3:4', label: '3:4 · Portret' },
    { id: '3:2', label: '3:2 · Foto' },
    { id: '2:3', label: '2:3 · Poster' },
    { id: '21:9', label: '21:9 · Kinolent' },
  ];

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith('video');
    const reader = new FileReader();
    reader.onload = () => {
      setImageParams({
        referenceMedia: {
          type: isVid ? 'video' : 'image',
          name: file.name,
          url: reader.result as string,
          size: file.size,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClearMedia = () => {
    setImageParams({ referenceMedia: undefined });
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const handleMagicPrompt = async () => {
    if (!imageParams.prompt.trim() || isEnhancingPrompt) return;
    setIsEnhancingPrompt(true);

    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(openAiApiKey ? { 'x-openai-key': openAiApiKey } : {}),
          ...(customBaseUrl ? { 'x-custom-base-url': customBaseUrl } : {}),
        },
        body: JSON.stringify({ prompt: imageParams.prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.enhancedPrompt) {
          setImageParams({ prompt: data.enhancedPrompt });
        }
      }
    } catch (e) {
      console.error("Failed to enhance prompt:", e);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleGenerateImage = async () => {
    if ((!imageParams.prompt.trim() && !imageParams.referenceMedia) || isGenerating) return;
    if (!requireAuth()) return;

    const cost = selectedModel.costCredits;
    const ok = deductCredits(cost, `Image: ${selectedModel.name}`);
    if (!ok) {
      alert("Hisobingizda yetarli kredit mavjud emas!");
      return;
    }

    setIsGenerating(true);
    setMobileTab('preview');
    setViewMode('preview');

    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          ...(geminiApiKey ? { 'x-gemini-key': geminiApiKey } : {}),
          ...(openAiApiKey ? { 'x-openai-key': openAiApiKey } : {}),
          ...(customBaseUrl ? { 'x-custom-base-url': customBaseUrl } : {}),
        },
        body: JSON.stringify(imageParams),
      });

      if (!res.ok) {
        let errMessage = `Server xatosi (${res.status})`;
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch {}
        throw new Error(errMessage);
      }

      const generatedData = await res.json();
      const newImage: GeneratedImage = {
        ...generatedData,
        userId: currentUser.id,
      };
      addImageToGallery(newImage);
      setPreviewImage(newImage);
      refreshUserAndCredits();
    } catch (err: any) {
      refundCredits(cost, `Qaytarildi (Rasm xatosi): ${selectedModel.name}`);
      alert(`Rasm yaratishda xatolik: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteImage = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Ushbu rasmni o'chirmoqchimisiz?")) return;
    try {
      await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser.id }
      });
      refreshUserAndCredits();
      if (previewImage?.id === id) {
        setPreviewImage(null);
      }
    } catch (err) {
      console.warn("Delete image error:", err);
    }
  };

  const handleUpscale = async (img: GeneratedImage, factor: '2x' | '4x') => {
    if (!requireAuth()) return;
    const cost = factor === '2x' ? 2 : 4;
    const ok = deductCredits(cost, `Upscale ${factor}`);
    if (!ok) {
      alert("Hisobingizda yetarli kredit mavjud emas!");
      return;
    }

    try {
      const res = await fetch('/api/generate/upscale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ id: img.id, factor }),
      });

      if (res.ok) {
        upscaleImage(img.id, factor);
        refreshUserAndCredits();
      }
    } catch (e) {
      upscaleImage(img.id, factor);
    }
  };

  return (
    <div id="nexus-image-studio" className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-zinc-50 dark:bg-[#171717] text-zinc-900 dark:text-[#ececec] transition-colors relative">
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex items-center justify-around border-b border-zinc-200 dark:border-[#262626] bg-white dark:bg-[#171717] px-2 py-2 shrink-0 z-10 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab('controls')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors text-center ${
            mobileTab === 'controls'
              ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-extrabold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          ⚙️ Sozlamalar & Prompt
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors text-center relative ${
            mobileTab === 'preview'
              ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-extrabold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          🖼 Natija & Galereya ({userGallery.length})
          {isGenerating && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute top-2 right-4" />
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Column: Controls (Smooth iOS Touch Momentum Scrolling) */}
        <div className={`w-full flex-1 min-h-0 md:h-full md:w-84 md:flex-none flex-col border-r border-zinc-200 dark:border-[#262626] bg-white dark:bg-[#171717] p-4 overflow-y-auto ios-scroll space-y-4 pb-36 md:pb-6 ${
          mobileTab === 'controls' ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Section Kicker */}
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5">
              <span>SUNBURST 2.5 · GPT IMAGE 2 · FLUX</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">G‘oyangizni rasmga aylantiring</h2>
            <p className="text-[11px] text-zinc-500 dark:text-[#8e8e8e]">
              GPT Image 2.5 Sunburst, GPT Image 2 va neyron tarmoqlar yordamida fotorealistik tasvirlar yarating.
            </p>
          </div>

        {/* Dynamic Engine Connection Card */}
        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-sm shadow-2xs ${
              selectedModel.id.includes('sunburst')
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                : selectedModel.id.includes('gpt')
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-white dark:bg-[#2c2c2c] border-zinc-200 dark:border-[#383838] text-blue-500'
            }`}>
              {selectedModel.id.includes('sunburst') ? '☀️' : selectedModel.id.includes('gpt') ? '⚡' : 'G'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  {selectedModel.id.includes('sunburst') ? 'Sunburst 2.5 Engine' : selectedModel.id.includes('gpt') ? 'OpenAI GPT Image' : 'Google Flow & Imagen'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {selectedModel.id.includes('sunburst')
                  ? 'Ultra Realism · HDR quyosh nurlari'
                  : selectedModel.id.includes('gpt')
                  ? 'Next-Gen fotorealizm faol'
                  : (geminiApiKey ? "Google AI ulandi" : "Flow Bridge ulangan")}
              </span>
            </div>
          </div>
          <button
            onClick={() => setApiKeyModalOpen(true)}
            className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
          >
            Sozlash
          </button>
        </div>

        {/* Model Selection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">AI Modeli</label>
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
              {selectedModel.badge}
            </span>
          </div>
          <div className="relative">
            <select
              value={imageParams.modelId}
              onChange={(e) => setImageParams({ modelId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-zinc-100 dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] rounded-lg text-zinc-900 dark:text-[#ececec] focus:outline-none focus:border-zinc-400 dark:focus:border-[#444444] cursor-pointer"
            >
              {IMAGE_MODELS.map((model) => (
                <option key={model.id} value={model.id} className="bg-white dark:bg-[#212121] text-zinc-900 dark:text-white">
                  {model.name} ({model.costCredits} kredit) · {model.avgLatency}
                </option>
              ))}
            </select>
          </div>
          {selectedModel.description && (
            <p className="text-[10px] text-zinc-500 dark:text-[#737373] leading-relaxed px-0.5">
              {selectedModel.description}
            </p>
          )}
        </div>

        {/* Reference Media Upload (Image or Video) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">
              Namuna media (Rasm yoki Video)
            </label>
            {imageParams.referenceMedia && (
              <button
                type="button"
                onClick={handleClearMedia}
                className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 flex items-center gap-0.5 cursor-pointer font-medium"
              >
                <X className="w-3 h-3" /> Tozalash
              </button>
            )}
          </div>

          {imageParams.referenceMedia ? (
            <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-[#2f2f2f] bg-zinc-100 dark:bg-[#1a1a1a] p-2 space-y-2 shadow-xs">
              <div className="relative aspect-video max-h-40 rounded-md overflow-hidden bg-black/40 flex items-center justify-center">
                {imageParams.referenceMedia.type === 'video' ? (
                  <video
                    src={imageParams.referenceMedia.url}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={imageParams.referenceMedia.url}
                    alt="Reference"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-[#a3a3a3] px-1">
                <span className="flex items-center gap-1 truncate max-w-[190px]">
                  {imageParams.referenceMedia.type === 'video' ? (
                    <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}
                  <span className="truncate">{imageParams.referenceMedia.name}</span>
                </span>
                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
                  {imageParams.referenceMedia.type === 'video' ? 'Video asosida' : 'Rasm asosida'}
                </span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => mediaInputRef.current?.click()}
              className="border border-dashed border-zinc-300 dark:border-[#333333] hover:border-violet-500 dark:hover:border-violet-400 rounded-lg p-3.5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-zinc-50 dark:bg-[#212121]/50 text-center group"
            >
              <div className="w-8 h-8 rounded-full bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-zinc-700 dark:text-[#ececec]">
                Rasm yoki video yuklang (ixtiyoriy)
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-[#737373]">
                PNG, JPG, WebP, MP4, MOV (Reference uchun)
              </span>
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Prompt Input & Magic Prompt */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">Tavsif (Prompt)</label>
            <button
              onClick={handleMagicPrompt}
              disabled={isEnhancingPrompt || !imageParams.prompt.trim()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-violet-600 dark:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 disabled:opacity-40 transition-all cursor-pointer btn-tactile"
              title="Sun'iy intellekt yordamida tavsifni boyitish"
            >
              <Wand2 className="w-3 h-3 text-violet-500" />
              <span>{isEnhancingPrompt ? 'Boyitilmoqda...' : 'Sehrli prompt'}</span>
            </button>
          </div>
          <textarea
            value={imageParams.prompt}
            onChange={(e) => setImageParams({ prompt: e.target.value })}
            rows={4}
            placeholder="Yaratmoqchi bo'lgan rasmingizni batafsil tasvirlang..."
            className="w-full bg-zinc-100 dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] rounded-xl p-3 text-xs text-zinc-900 dark:text-[#ececec] placeholder-zinc-400 dark:placeholder-[#737373] focus:outline-none focus:border-violet-500/50 resize-none transition-colors"
          />
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">Tomonlar nisbati (O'lcham)</label>
          <div className="grid grid-cols-2 gap-1.5">
            {aspectRatios.map((ar) => (
              <button
                key={ar.id}
                onClick={() => setImageParams({ aspectRatio: ar.id })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer btn-tactile ${
                  imageParams.aspectRatio === ar.id
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-xs'
                    : 'bg-zinc-100/80 dark:bg-[#1f1f21] border-zinc-200/90 dark:border-white/10 text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-[#27272a]'
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders: Steps & CFG */}
        <div className="space-y-3 pt-1 border-t border-zinc-200 dark:border-[#262626]">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-[#a3a3a3]">
              <span>Generatsiya qadamlari (Steps)</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-white">{imageParams.steps}</span>
            </div>
            <input
              type="range"
              min={15}
              max={50}
              value={imageParams.steps}
              onChange={(e) => setImageParams({ steps: Number(e.target.value) })}
              className="w-full accent-violet-600 dark:accent-violet-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-[#a3a3a3]">
              <span>Tavsifga muvofiqlik (CFG Scale)</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-white">{imageParams.guidanceScale.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={1.0}
              max={15.0}
              step={0.5}
              value={imageParams.guidanceScale}
              onChange={(e) => setImageParams({ guidanceScale: Number(e.target.value) })}
              className="w-full accent-violet-600 dark:accent-violet-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Negative Prompt Accordion */}
        <div className="border border-zinc-200 dark:border-[#262626] rounded-xl overflow-hidden bg-zinc-50 dark:bg-[#1a1a1a]">
          <button
            onClick={() => setShowNegativePrompt(!showNegativePrompt)}
            className="w-full flex items-center justify-between p-2.5 text-xs font-medium text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-[#ececec] cursor-pointer"
          >
            <span>Istisno elementlar (Negative Prompt)</span>
            {showNegativePrompt ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showNegativePrompt && (
            <div className="p-2.5 pt-0">
              <textarea
                value={imageParams.negativePrompt}
                onChange={(e) => setImageParams({ negativePrompt: e.target.value })}
                rows={2}
                placeholder="Rasmda bo'lmasligi kerak bo'lgan narsalar..."
                className="w-full bg-zinc-100 dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] rounded-lg p-2 text-xs text-zinc-900 dark:text-[#ececec] placeholder-zinc-400 dark:placeholder-[#737373] focus:outline-none resize-none"
              />
            </div>
          )}
        </div>

          {/* Desktop Generate Button */}
          <div className="hidden md:block pt-2 mt-auto">
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating || !imageParams.prompt.trim()}
              className="w-full py-3 btn-primary-nexus text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Yaratilmoqda ({generationTime}s)...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Rasm yaratish ({selectedModel.costCredits} kredit)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Active Preview & Completed Works Gallery */}
        <div className={`flex-1 flex-col p-3 sm:p-5 overflow-y-auto ios-scroll min-h-0 space-y-4 pb-36 md:pb-6 ${
          mobileTab === 'preview' ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Subheader: View Mode Switcher & Refresh */}
          <div className="flex items-center justify-between bg-white dark:bg-[#1a1a1a] p-2.5 rounded-xl border border-zinc-200 dark:border-[#262626] shrink-0 shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#252525]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Asosiy ko'rinish</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#252525]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Barcha ishlarim ({userGallery.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refreshUserAndCredits()}
                title="Galereyani yangilash"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#252525] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* VIEW MODE: MAIN PREVIEW */}
          {viewMode === 'preview' && (
            <>
              {/* Generation Live Progress Skeleton */}
              {isGenerating ? (
                <div className="relative flex-1 bg-zinc-900 rounded-2xl border border-violet-500/30 flex flex-col items-center justify-center p-6 min-h-[320px] shadow-lg overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-900/20 via-transparent to-amber-500/10 animate-pulse pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col items-center text-center max-w-md space-y-4">
                    <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-amber-400 animate-spin flex items-center justify-center shadow-lg">
                      <Sparkles className="w-7 h-7 text-amber-300 animate-pulse" />
                    </div>

                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold mb-2">
                        <span>{selectedModel.name}</span>
                        <span>·</span>
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span className="font-mono">{generationTime}s</span>
                      </div>
                      <h3 className="text-base font-bold text-white">Yangi tasvir render qilinmoqda...</h3>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 italic px-4">
                        "{imageParams.prompt}"
                      </p>
                    </div>

                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-violet-500 to-amber-400 h-full rounded-full animate-pulse w-3/4" />
                    </div>
                    <span className="text-[11px] text-zinc-400">Neyron optika va yorug'lik effektlari qo'llanilmoqda...</span>
                  </div>
                </div>
              ) : activeImage ? (
                /* Active Rendered Image */
                <div className="relative flex-1 bg-zinc-100 dark:bg-[#111111] rounded-2xl border border-zinc-200 dark:border-[#262626] flex items-center justify-center overflow-hidden min-h-[300px] sm:min-h-[420px] shadow-sm group">
                  <img
                    src={activeImage.url}
                    alt={activeImage.prompt}
                    className="w-full h-full object-contain max-h-[580px]"
                  />

                  {/* Top Floating Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-white/10">
                      {activeImage.modelId || 'Sunburst 2.5'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-medium text-white/80 border border-white/10">
                      {activeImage.aspectRatio || '16:9'}
                    </span>
                  </div>

                  {/* Bottom Overlay Controls */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
                    <div className="max-w-xl">
                      <p className="text-xs sm:text-sm text-zinc-200 font-medium line-clamp-2 leading-relaxed">
                        {activeImage.prompt}
                      </p>
                      {activeImage.enhancedPrompt && activeImage.enhancedPrompt !== activeImage.prompt && (
                        <p className="text-[10px] text-violet-300/90 truncate mt-0.5">
                          ✨ Boyitilgan: {activeImage.enhancedPrompt}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
                      <a
                        href={activeImage.url}
                        download={`nexus-art-${activeImage.id}.jpg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold text-white transition-all flex items-center gap-1.5 backdrop-blur-md border border-white/20 cursor-pointer btn-tactile"
                        title="Rasmni yuklab olish"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Yuklab olish</span>
                      </a>
                      <button
                        onClick={() => setSelectedImageForModal(activeImage)}
                        className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold text-white transition-all backdrop-blur-md border border-white/20 cursor-pointer btn-tactile"
                        title="Rasmni tahrirlash (Inpaint)"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => handleUpscale(activeImage, '2x')}
                        className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold text-white transition-all backdrop-blur-md border border-white/20 cursor-pointer btn-tactile"
                        title="2x sifatini oshirish"
                      >
                        2x
                      </button>
                      <button
                        onClick={() => handleUpscale(activeImage, '4x')}
                        className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold text-white transition-all backdrop-blur-md border border-white/20 cursor-pointer btn-tactile"
                        title="4x sifatini oshirish"
                      >
                        4x
                      </button>
                      <button
                        onClick={() => sendToVideoLab(activeImage.url, activeImage.prompt)}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs btn-tactile"
                        title="Ushbu rasmdan video yaratish"
                      >
                        <Film className="w-3 h-3" />
                        <span>Animatsiya</span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteImage(activeImage.id, e)}
                        className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 transition-all cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty State with Suggestions */
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-100/50 dark:bg-[#1a1a1a]/50 rounded-2xl border border-dashed border-zinc-300 dark:border-[#333333] text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <div className="max-w-sm">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Hozircha rasmlar yo'q</h3>
                    <p className="text-xs text-zinc-500 dark:text-[#8e8e8e] mt-1">
                      Chap tomonda tavsif yozing yoki quyidagi namuna mavzulardan birini tanlab yarating:
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                    {PROMPT_SUGGESTIONS.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => setImageParams({ prompt: sug })}
                        className="text-[11px] px-3 py-1.5 rounded-xl bg-white dark:bg-[#242424] border border-zinc-200 dark:border-[#333333] hover:border-violet-500 text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition-all cursor-pointer shadow-2xs text-left"
                      >
                        ✨ {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Works Strip Below Preview */}
              {userGallery.length > 0 && (
                <div className="space-y-2 shrink-0 pt-2 border-t border-zinc-200 dark:border-[#262626]">
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-[#8e8e8e]">
                    <span className="font-bold flex items-center gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Mening ishlarim ({userGallery.length})</span>
                    </span>
                    <button
                      onClick={() => setViewMode('grid')}
                      className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Barchasini to'liq ko'rish</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto ios-scroll pb-2">
                    {userGallery.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setPreviewImage(item)}
                        className={`group relative w-22 h-22 sm:w-24 sm:h-24 rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer shadow-2xs ${
                          activeImage?.id === item.id
                            ? 'border-violet-500 ring-2 ring-violet-500/40 scale-102'
                            : 'border-zinc-200 dark:border-[#2f2f2f] opacity-80 hover:opacity-100 hover:border-zinc-400 dark:hover:border-[#555555]'
                        }`}
                      >
                        <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => handleDeleteImage(item.id, e)}
                            className="p-1 rounded-md bg-red-600 text-white hover:bg-red-700"
                            title="O'chirish"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* VIEW MODE: FULL GRID GALLERY OF COMPLETED WORKS */}
          {viewMode === 'grid' && (
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Barcha yaratilgan ishlar</h3>
                  <p className="text-xs text-zinc-500 dark:text-[#8e8e8e]">
                    Hisobingizda jami {userGallery.length} ta tasvir saqlangan.
                  </p>
                </div>
              </div>

              {userGallery.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 dark:text-[#737373]">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Hozircha rasmlar yaratilmagan</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {userGallery.map((item) => (
                    <div
                      key={item.id}
                      className="group relative bg-white dark:bg-[#1f1f1f] rounded-2xl overflow-hidden border border-zinc-200 dark:border-[#2b2b2b] shadow-xs hover:shadow-md transition-all flex flex-col"
                    >
                      <div
                        onClick={() => {
                          setPreviewImage(item);
                          setViewMode('preview');
                        }}
                        className="relative aspect-video w-full overflow-hidden bg-black/10 cursor-pointer"
                      >
                        <img
                          src={item.url}
                          alt={item.prompt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-bold text-amber-300">
                            {item.modelId || 'Sunburst 2.5'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        <p className="text-xs text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-relaxed">
                          {item.prompt}
                        </p>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-[#2b2b2b] text-[11px]">
                          <span className="text-zinc-400 text-[10px]">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setPreviewImage(item);
                                setViewMode('preview');
                              }}
                              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#2c2c2c] text-zinc-600 dark:text-zinc-300"
                              title="Katta ko'rinish"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={item.url}
                              download={`nexus-${item.id}.jpg`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#2c2c2c] text-zinc-600 dark:text-zinc-300"
                              title="Yuklab olish"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={(e) => handleDeleteImage(item.id, e)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                              title="O'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE STICKY GENERATE BAR (ALWAYS VISIBLE ABOVE BOTTOM NAV) */}
      {mobileTab === 'controls' && (
        <div className="md:hidden fixed renax-above-nav inset-x-0 p-3 bg-white/95 dark:bg-[#171717]/95 backdrop-blur-md border-t border-zinc-200 dark:border-[#262626] z-30 shadow-lg">
          <button
            onClick={handleGenerateImage}
            disabled={isGenerating || !imageParams.prompt.trim()}
            className="w-full py-3 btn-primary-nexus text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Yaratilmoqda ({generationTime}s)...</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Rasm yaratish ({selectedModel.costCredits} kredit)</span>
              </>
            )}
          </button>
        </div>
      )}

      {selectedImageForModal && (
        <InpaintingModal
          image={selectedImageForModal}
          onClose={() => setSelectedImageForModal(null)}
        />
      )}
    </div>
  );
};
