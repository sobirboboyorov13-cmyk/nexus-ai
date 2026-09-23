import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  ChevronDown,
  ChevronUp,
  Film,
  Image as ImageIcon,
  Download
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
  } = useNexusStore();

  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const [selectedImageForModal, setSelectedImageForModal] = useState<GeneratedImage | null>(null);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(gallery[0] || null);

  const selectedModel = IMAGE_MODELS.find((m) => m.id === imageParams.modelId) || IMAGE_MODELS[0];

  const aspectRatios: { id: AspectRatio; label: string }[] = [
    { id: '1:1', label: '1:1 Square' },
    { id: '16:9', label: '16:9 Landscape' },
    { id: '9:16', label: '9:16 Portrait' },
    { id: '4:5', label: '4:5 Social' },
  ];

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
    if (!imageParams.prompt.trim() || isGenerating) return;

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

      const newImage: GeneratedImage = await res.json();
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

        {/* Prompt Input & Magic Prompt */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">Tavsif (Prompt)</label>
            <button
              onClick={handleMagicPrompt}
              disabled={isEnhancingPrompt || !imageParams.prompt.trim()}
              className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-40 transition-colors cursor-pointer font-medium"
              title="Sun'iy intellekt yordamida tavsifni boyitish"
            >
              <Wand2 className="w-3 h-3" />
              <span>{isEnhancingPrompt ? 'Boyitilmoqda...' : 'Sehrli prompt'}</span>
            </button>
          </div>
          <textarea
            value={imageParams.prompt}
            onChange={(e) => setImageParams({ prompt: e.target.value })}
            rows={4}
            placeholder="Yaratmoqchi bo'lgan rasmingizni batafsil tasvirlang..."
            className="w-full bg-zinc-100 dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] rounded-lg p-2.5 text-xs text-zinc-900 dark:text-[#ececec] placeholder-zinc-400 dark:placeholder-[#737373] focus:outline-none focus:border-zinc-400 dark:focus:border-[#444444] resize-none"
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
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-left transition-colors cursor-pointer ${
                  imageParams.aspectRatio === ar.id
                    ? 'bg-zinc-900 dark:bg-[#2a2a2a] border-zinc-900 dark:border-[#404040] text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-[#1f1f1f] border-zinc-200 dark:border-[#2a2a2a] text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-[#ececec] hover:bg-zinc-200 dark:hover:bg-[#262626]'
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
              className="w-full accent-zinc-900 dark:accent-white cursor-pointer"
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
              className="w-full accent-zinc-900 dark:accent-white cursor-pointer"
            />
          </div>
        </div>

        {/* Negative Prompt Accordion */}
        <div className="border border-zinc-200 dark:border-[#262626] rounded-lg overflow-hidden bg-zinc-50 dark:bg-[#1a1a1a]">
          <button
            onClick={() => setShowNegativePrompt(!showNegativePrompt)}
            className="w-full flex items-center justify-between p-2 text-xs font-medium text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-[#ececec] cursor-pointer"
          >
            <span>Istisno elementlar (Negative Prompt)</span>
            {showNegativePrompt ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showNegativePrompt && (
            <div className="p-2 pt-0">
              <textarea
                value={imageParams.negativePrompt}
                onChange={(e) => setImageParams({ negativePrompt: e.target.value })}
                rows={2}
                placeholder="Rasmda bo'lmasligi kerak bo'lgan narsalar..."
                className="w-full bg-zinc-100 dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] rounded-md p-2 text-xs text-zinc-900 dark:text-[#ececec] placeholder-zinc-400 dark:placeholder-[#737373] focus:outline-none resize-none"
              />
            </div>
          )}
        </div>

        {/* Clean Generate Button */}
        <button
          onClick={handleGenerateImage}
          disabled={isGenerating || !imageParams.prompt.trim()}
          className="w-full py-2.5 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-[#e5e5e5] disabled:bg-zinc-300 dark:disabled:bg-[#333333] disabled:text-zinc-500 dark:disabled:text-[#737373] text-white dark:text-black font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 mt-auto cursor-pointer shadow-xs"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-zinc-400 border-t-white dark:border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
              <span>Rasm yaratish ({selectedModel.costCredits} kredit)</span>
            </>
          )}
        </button>
      </div>

      {/* Right Column: Clean Preview & Gallery */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-4">
        {/* Main Preview */}
        {previewImage ? (
          <div className="relative flex-1 bg-zinc-100 dark:bg-[#111111] rounded-xl border border-zinc-200 dark:border-[#262626] flex items-center justify-center overflow-hidden min-h-[300px] shadow-sm">
            <img
              src={previewImage.url}
              alt={previewImage.prompt}
              className="w-full h-full object-contain max-h-[500px]"
            />

            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3.5 flex items-center justify-between text-white">
              <span className="text-xs text-zinc-300 truncate max-w-md font-medium">
                {previewImage.prompt}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={previewImage.url}
                  download={`nexus-art-${previewImage.id}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 text-xs text-white transition-colors flex items-center gap-1 backdrop-blur-xs cursor-pointer"
                  title="Rasmni yuklab olish"
                >
                  <Download className="w-3 h-3" />
                  <span>Yuklab olish</span>
                </a>
                <button
                  onClick={() => setSelectedImageForModal(previewImage)}
                  className="px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 text-xs text-white transition-colors backdrop-blur-xs cursor-pointer"
                  title="Rasmni tahrirlash (Inpaint)"
                >
                  Tahrirlash
                </button>
                <button
                  onClick={() => handleUpscale(previewImage, '2x')}
                  className="px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 text-xs text-white transition-colors backdrop-blur-xs cursor-pointer"
                  title="2x sifatini oshirish"
                >
                  2x
                </button>
                <button
                  onClick={() => handleUpscale(previewImage, '4x')}
                  className="px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 text-xs text-white transition-colors backdrop-blur-xs cursor-pointer"
                  title="4x sifatini oshirish"
                >
                  4x
                </button>
                <button
                  onClick={() => sendToVideoLab(previewImage.url, previewImage.prompt)}
                  className="px-2.5 py-1 rounded-md bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
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
            <span className="font-semibold">So'nggi yaratilgan rasmlar ({gallery.length})</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 max-h-24">
            {gallery.map((item) => (
              <button
                key={item.id}
                onClick={() => setPreviewImage(item)}
                className={`w-20 h-20 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                  previewImage?.id === item.id
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
