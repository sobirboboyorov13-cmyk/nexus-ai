import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Wand2,
  ChevronDown,
  ChevronUp,
  Film,
  Image as ImageIcon,
  Download,
  LayoutGrid,
  Radio,
  Upload,
  Video,
  X,
  FileCheck
} from 'lucide-react';
import { useNexusStore } from '../lib/store';
import { IMAGE_MODELS } from '../lib/models';
import { AspectRatio, GeneratedImage } from '../types/nexus';
import { InpaintingModal } from './InpaintingModal';

export const ImageStudio: React.FC = () => {
  const {
    imageParams,
    setImageParams,
    gallery,
    addImageToGallery,
    upscaleImage,
    sendToVideoLab,
    deductCredits,
    currentUser,
    refreshUserAndCredits,
    geminiApiKey,
    setCurrentTab,
    setApiKeyModalOpen,
  } = useNexusStore();

  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const [selectedImageForModal, setSelectedImageForModal] = useState<GeneratedImage | null>(null);
  
  // Faqat joriy foydalanuvchiga tegishli rasmlar
  const currentUserId = currentUser.id || 'user-guest';
  const userGallery = gallery.filter((img) => {
    const uId = (img as any).userId;
    if (currentUserId === 'user-guest' || !currentUserId) {
      return !uId || uId === 'user-guest' || uId === '';
    }
    return uId === currentUserId || !uId || uId === 'user-guest';
  });
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const activeImage = previewImage || userGallery[0] || null;
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const selectedModel = IMAGE_MODELS.find((m) => m.id === imageParams.modelId) || IMAGE_MODELS[0];

  const aspectRatios: { id: AspectRatio; label: string }[] = [
    { id: '1:1', label: '1:1 Square' },
    { id: '16:9', label: '16:9 Landscape' },
    { id: '9:16', label: '9:16 Portrait' },
    { id: '4:5', label: '4:5 Social' },
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
        headers: { 'Content-Type': 'application/json' },
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

    const ok = deductCredits(selectedModel.costCredits, `Image: ${selectedModel.name}`);
    if (!ok) {
      alert("Hisobingizda yetarli kredit mavjud emas!");
      return;
    }

    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          ...(geminiApiKey ? { 'x-gemini-key': geminiApiKey } : {}),
        },
        body: JSON.stringify(imageParams),
      });

      if (!res.ok) {
        throw new Error(`Generation failed: ${res.statusText}`);
      }

      const newImage: GeneratedImage = {
        ...(await res.json()),
        userId: currentUser.id,
      };
      addImageToGallery(newImage);
      setPreviewImage(newImage);
      refreshUserAndCredits();
    } catch (err: any) {
      alert(`Rasm yaratishda xatolik: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpscale = async (img: GeneratedImage, factor: '2x' | '4x') => {
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
    <div id="nexus-image-studio" className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-zinc-50 dark:bg-[#171717] text-zinc-900 dark:text-[#ececec] transition-colors">
      {/* Left Column: Minimal Controls */}
      <div className="w-full md:w-80 flex flex-col border-r border-zinc-200 dark:border-[#262626] bg-white dark:bg-[#171717] p-4 overflow-y-auto shrink-0 space-y-4">
        {/* Section Kicker */}
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-1">
            GOOGLE FLOW · IMAGEN
          </div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">G‘oyangizni rasmga aylantiring</h2>
          <p className="text-[11px] text-zinc-500 dark:text-[#8e8e8e]">
            Google Flow va Imagen yordamida fotorealistik tasvirlar yarating.
          </p>
        </div>

        {/* Google Flow Connection Card */}
        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#2c2c2c] border border-zinc-200 dark:border-[#383838] flex items-center justify-center font-bold text-sm shadow-2xs">
              <span className="text-blue-500 font-black">G</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Google Flow</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {geminiApiKey ? "Google AI ulandi" : "Flow Bridge ulangan"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setApiKeyModalOpen(true)}
            className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
          >
            {geminiApiKey ? "Sozlash" : "Ulash"}
          </button>
        </div>

        {/* Model Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">AI Modeli</label>
          <div className="relative">
            <select
              value={imageParams.modelId}
              onChange={(e) => setImageParams({ modelId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-zinc-100 dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] rounded-lg text-zinc-900 dark:text-[#ececec] focus:outline-none focus:border-zinc-400 dark:focus:border-[#444444] cursor-pointer"
            >
              {IMAGE_MODELS.map((model) => (
                <option key={model.id} value={model.id} className="bg-white dark:bg-[#212121] text-zinc-900 dark:text-white">
                  {model.name} ({model.costCredits} kredit)
                </option>
              ))}
            </select>
          </div>
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
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                  {imageParams.referenceMedia.type === 'video' ? 'Video asosida' : 'Rasm asosida'}
                </span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => mediaInputRef.current?.click()}
              className="border border-dashed border-zinc-300 dark:border-[#333333] hover:border-purple-500 dark:hover:border-purple-400 rounded-lg p-3.5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-zinc-50 dark:bg-[#212121]/50 text-center group"
            >
              <div className="w-8 h-8 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 disabled:opacity-40 transition-all cursor-pointer btn-tactile"
              title="Sun'iy intellekt yordamida tavsifni boyitish"
            >
              <Wand2 className="w-3 h-3 text-purple-500" />
              <span>{isEnhancingPrompt ? 'Boyitilmoqda...' : 'Sehrli prompt'}</span>
            </button>
          </div>
          <textarea
            value={imageParams.prompt}
            onChange={(e) => setImageParams({ prompt: e.target.value })}
            rows={4}
            placeholder="Yaratmoqchi bo'lgan rasmingizni batafsil tasvirlang..."
            className="w-full bg-zinc-100 dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] rounded-xl p-3 text-xs text-zinc-900 dark:text-[#ececec] placeholder-zinc-400 dark:placeholder-[#737373] focus:outline-none focus:border-purple-500/50 resize-none transition-colors"
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
              className="w-full accent-purple-600 dark:accent-purple-400 cursor-pointer"
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
              className="w-full accent-purple-600 dark:accent-purple-400 cursor-pointer"
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

        {/* Premium Tactile Generate Button */}
        <button
          onClick={handleGenerateImage}
          disabled={isGenerating || !imageParams.prompt.trim()}
          className="w-full py-3 btn-primary-nexus text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 mt-auto cursor-pointer shadow-md"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Rasm yaratish ({selectedModel.costCredits} kredit)</span>
            </>
          )}
        </button>
      </div>

      {/* Right Column: Clean Preview & Gallery */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-4">
        {/* Main Preview */}
        {activeImage ? (
          <div className="relative flex-1 bg-zinc-100 dark:bg-[#111111] rounded-2xl border border-zinc-200 dark:border-[#262626] flex items-center justify-center overflow-hidden min-h-[300px] shadow-sm">
            <img
              src={activeImage.url}
              alt={activeImage.prompt}
              className="w-full h-full object-contain max-h-[500px]"
            />

            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 flex items-center justify-between text-white">
              <span className="text-xs text-zinc-300 truncate max-w-md font-medium">
                {activeImage.prompt}
              </span>

              <div className="flex items-center gap-2 shrink-0">
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
                  <span>Animatsiya qilish</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-[#737373]">
            <ImageIcon className="w-10 h-10 mb-2 stroke-1" />
            <p className="text-xs">Rasm tanlanmagan yoki hali yaratilmagan</p>
          </div>
        )}

        {/* Gallery Strip */}
        <div className="space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-[#8e8e8e]">
            <span className="font-semibold">Mening rasmlarim ({userGallery.length})</span>
            <button
              onClick={() => setCurrentTab('pipeline')}
              className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Mening Doskamda ko‘rish →</span>
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 max-h-24">
            {userGallery.map((item) => (
              <button
                key={item.id}
                onClick={() => setPreviewImage(item)}
                className={`w-20 h-20 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                  activeImage?.id === item.id
                    ? 'border-purple-500 ring-2 ring-purple-500/30'
                    : 'border-zinc-200 dark:border-[#2f2f2f] opacity-80 hover:opacity-100 hover:border-zinc-400 dark:hover:border-[#555555]'
                }`}
              >
                <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedImageForModal && (
        <InpaintingModal
          image={selectedImageForModal}
          onClose={() => setSelectedImageForModal(null)}
        />
      )}
    </div>
  );
};
