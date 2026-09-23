import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  Layers,
  Compass,
  LayoutGrid,
  Image as ImageIcon,
  Film,
  Download,
  Plus,
  ArrowUpRight,
  Eye,
  Wand2,
  Maximize2
} from 'lucide-react';
import { useNexusStore } from '../lib/store';
import { PipelineWorkflow, PipelineScene, GeneratedImage, VideoJob } from '../types/nexus';

export const PipelineCanvas: React.FC = () => {
  const {
    activePipeline,
    setActivePipeline,
    deductCredits,
    currentUser,
    refreshUserAndCredits,
    gallery,
    videoJobs,
    sendToVideoLab,
    setCurrentTab,
  } = useNexusStore();

  const [activeBoardTab, setActiveBoardTab] = useState<'board' | 'pipeline'>('board');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'videos'>('all');

  const [concept, setConcept] = useState(
    'A cybernetic ronin exploring an ancient bioluminescent temple deep beneath the sea of New Kyoto'
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStage, setCurrentStage] = useState<'idle' | 'scripting' | 'keyframes' | 'video' | 'complete'>('idle');

  const presetConcepts = [
    'A cybernetic ronin exploring an ancient bioluminescent temple beneath the sea',
    'An orbital solar observatory solar-sail unfurling over Jupiter Great Red Spot',
    'A high-speed quantum hyperloop pod race through an emerald mountain chasm'
  ];

  const handleRunPipeline = async () => {
    if (!concept.trim() || isExecuting) return;

    const ok = deductCredits(35, 'Workflow Pipeline (3 Scenes)');
    if (!ok) {
      alert('Hisobingizda yetarli kredit mavjud emas (35 kredit zarur)!');
      return;
    }

    setIsExecuting(true);
    setCurrentStage('scripting');

    try {
      const res = await fetch('/api/pipeline/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ concept }),
      });

      if (!res.ok) {
        throw new Error('Pipeline generation failed');
      }

      const workflow: PipelineWorkflow = await res.json();
      refreshUserAndCredits();

      setCurrentStage('keyframes');
      await new Promise((r) => setTimeout(r, 1200));

      setCurrentStage('video');
      await new Promise((r) => setTimeout(r, 1500));

      setCurrentStage('complete');
      setActivePipeline(workflow);
    } catch (e: any) {
      alert(`Pipeline error: ${e.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAddMediaToPipeline = (item: { url: string; prompt: string; isVideo: boolean }) => {
    const newScene: PipelineScene = {
      id: `scene-custom-${Date.now()}`,
      sceneNumber: (activePipeline?.scenes.length || 0) + 1,
      title: item.isVideo ? 'Animatsion sahna' : 'Vizual kalit kadr',
      narrative: item.prompt.slice(0, 100) + '...',
      visualPrompt: item.prompt,
      cameraMovement: 'pan_right',
      keyframeUrl: item.isVideo ? '' : item.url,
      videoUrl: item.isVideo ? item.url : undefined,
      status: 'completed',
      progress: 100,
    };

    if (activePipeline) {
      setActivePipeline({
        ...activePipeline,
        scenes: [...activePipeline.scenes, newScene],
      });
    } else {
      setActivePipeline({
        id: `pipeline-custom-${Date.now()}`,
        concept: item.prompt,
        status: 'completed',
        scenes: [newScene],
        createdAt: Date.now(),
      });
    }

    setActiveBoardTab('pipeline');
  };

  return (
    <div id="nexus-pipeline-canvas" className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50 dark:bg-[#171717] text-zinc-900 dark:text-[#ececec] p-4 space-y-4 transition-colors">
      {/* Top Header with Tab Switcher */}
      <div className="bg-white dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] rounded-2xl p-4 shrink-0 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Ijodiy Doska & Quvur (Studio Board)</span>
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800/40">
              {gallery.length} ta rasm • {videoJobs.length} ta video
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-[#8e8e8e] mt-0.5">
            Barcha yaratilgan media fayllaringiz jonli doskada jamlangan va quvurga ulanadi
          </p>
        </div>

        {/* View Switcher: Doska vs Avtomat Quvur */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-[#18181a] border border-zinc-200 dark:border-[#2f2f2f] rounded-xl self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveBoardTab('board')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeBoardTab === 'board'
                ? 'bg-white dark:bg-[#282828] text-zinc-900 dark:text-white shadow-xs border border-zinc-200 dark:border-white/10'
                : 'text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-[#ececec]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-purple-500" />
            <span>Mening Doskam</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveBoardTab('pipeline')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeBoardTab === 'pipeline'
                ? 'bg-white dark:bg-[#282828] text-zinc-900 dark:text-white shadow-xs border border-zinc-200 dark:border-white/10'
                : 'text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-[#ececec]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Ssenariy Quvuri</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MENING DOSKAM (MEDIA ARTBOARD) */}
      {activeBoardTab === 'board' && (
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1c1c1c] border border-zinc-200 dark:border-[#262626] rounded-2xl p-4 overflow-hidden shadow-xs">
          {/* Filter Bar & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-[#282828] shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold'
                    : 'bg-zinc-100 dark:bg-[#242424] text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Barchasi ({gallery.length + videoJobs.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('images')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filterType === 'images'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold'
                    : 'bg-zinc-100 dark:bg-[#242424] text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <ImageIcon className="w-3 h-3 text-blue-500" />
                <span>Rasmlar ({gallery.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('videos')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filterType === 'videos'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold'
                    : 'bg-zinc-100 dark:bg-[#242424] text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Film className="w-3 h-3 text-amber-500" />
                <span>Videolar ({videoJobs.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentTab('image')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Rasm yaratish</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('video')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Video yaratish</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto pt-4">
            {gallery.length === 0 && videoJobs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400 dark:text-[#737373]">
                <LayoutGrid className="w-12 h-12 mb-3 stroke-1 text-purple-400/60 animate-pulse" />
                <h3 className="text-sm font-bold text-zinc-800 dark:text-[#ececec] mb-1">Doskangiz hozircha bo'sh</h3>
                <p className="text-xs max-w-sm mb-4">
                  "Tasvirlar" yoki "Video" studiyasida biror narsa generatsiya qiling — ular ushbu doskada avtomatik paydo bo'ladi.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentTab('image')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Rasm yaratish
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('video')}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Video yaratish
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Images */}
                {(filterType === 'all' || filterType === 'images') &&
                  gallery.map((img) => (
                    <div
                      key={img.id}
                      className="group bg-zinc-50 dark:bg-[#232326] border border-zinc-200 dark:border-[#2f2f32] rounded-2xl overflow-hidden flex flex-col shadow-2xs hover:shadow-md transition-all hover:border-purple-500/40"
                    >
                      <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                        <img
                          src={img.url}
                          alt={img.prompt}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1">
                          <ImageIcon className="w-2.5 h-2.5 text-blue-400" />
                          <span>{img.modelId || 'FLUX'}</span>
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a
                            href={img.url}
                            download={`nexus-image-${img.id}.jpg`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white/20 hover:bg-white text-white hover:text-black transition-colors backdrop-blur-xs cursor-pointer"
                            title="Yuklab olish"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => sendToVideoLab(img.url, img.prompt)}
                            className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-colors backdrop-blur-xs cursor-pointer"
                            title="Videoga aylantirish"
                          >
                            <Film className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 flex flex-col flex-1 gap-2">
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed font-medium">
                          {img.prompt}
                        </p>
                        <div className="mt-auto pt-2 border-t border-zinc-200/60 dark:border-[#2c2c2f] flex items-center justify-between text-[11px] text-zinc-500 dark:text-[#8e8e8e]">
                          <span className="font-mono text-[10px]">{img.aspectRatio || '16:9'}</span>
                          <button
                            type="button"
                            onClick={() => handleAddMediaToPipeline({ url: img.url, prompt: img.prompt, isVideo: false })}
                            className="text-purple-600 dark:text-purple-400 hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Quvurga qo'shish</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Videos */}
                {(filterType === 'all' || filterType === 'videos') &&
                  videoJobs.map((job) => (
                    <div
                      key={job.id}
                      className="group bg-zinc-50 dark:bg-[#232326] border border-zinc-200 dark:border-[#2f2f32] rounded-2xl overflow-hidden flex flex-col shadow-2xs hover:shadow-md transition-all hover:border-amber-500/40"
                    >
                      <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                        {job.videoUrl && job.status === 'completed' ? (
                          <video
                            src={job.videoUrl}
                            controls
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : job.thumbnailUrl ? (
                          <img
                            src={job.thumbnailUrl}
                            alt={job.prompt}
                            className="w-full h-full object-cover opacity-60"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-zinc-500 gap-1.5">
                            <Film className="w-6 h-6 animate-pulse text-amber-500" />
                            <span className="text-[10px]">{job.statusMessage || 'Render qilinmoqda...'}</span>
                          </div>
                        )}

                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1 pointer-events-none">
                          <Film className="w-2.5 h-2.5 text-amber-400" />
                          <span>{job.modelId || 'Kling'}</span>
                        </div>

                        {job.videoUrl && (
                          <div className="absolute top-2 right-2">
                            <a
                              href={job.videoUrl}
                              download={`nexus-video-${job.id}.mp4`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md bg-black/60 hover:bg-black text-white text-[10px] backdrop-blur-md flex items-center gap-1 cursor-pointer"
                              title="MP4 yuklab olish"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="p-3 flex flex-col flex-1 gap-2">
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed font-medium">
                          {job.prompt}
                        </p>
                        <div className="mt-auto pt-2 border-t border-zinc-200/60 dark:border-[#2c2c2f] flex items-center justify-between text-[11px] text-zinc-500 dark:text-[#8e8e8e]">
                          <span className="font-mono text-[10px]">{job.duration || '5s'}</span>
                          {job.videoUrl && (
                            <button
                              type="button"
                              onClick={() => handleAddMediaToPipeline({ url: job.videoUrl!, prompt: job.prompt, isVideo: true })}
                              className="text-amber-600 dark:text-amber-400 hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Quvurga qo'shish</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: AVTOMATIK SSENARIY QUVURI */}
      {activeBoardTab === 'pipeline' && (
        <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto">
          {/* Top Concept Input */}
          <div className="bg-white dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] rounded-2xl p-4 space-y-3 shrink-0 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Avtomatlashtirilgan Ijodiy Quvur (Storyboard)</h2>
                <p className="text-xs text-zinc-500 dark:text-[#8e8e8e]">G'oya &rarr; Ssenariy &rarr; Kalit kadrlar &rarr; Video</p>
              </div>

              <button
                type="button"
                onClick={handleRunPipeline}
                disabled={isExecuting || !concept.trim()}
                className="px-4 py-2 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-[#e5e5e5] disabled:bg-zinc-300 dark:disabled:bg-[#333333] disabled:text-zinc-500 dark:disabled:text-[#737373] text-white dark:text-black font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                {isExecuting ? (
                  <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-white dark:border-t-black rounded-full animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isExecuting ? 'Jarayonda...' : 'Quvurni ishga tushirish (35 kredit)'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Kino yoki video syujeti g'oyasini kiriting..."
                className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-[#171717] border border-zinc-200 dark:border-[#2f2f2f] rounded-xl text-xs text-zinc-900 dark:text-[#ececec] placeholder-zinc-400 dark:placeholder-[#737373] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 dark:text-[#737373]">
              <span className="font-semibold">Namunalar:</span>
              {presetConcepts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setConcept(p)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#171717] border border-zinc-200 dark:border-[#2f2f2f] hover:text-zinc-900 dark:hover:text-[#ececec] transition-colors truncate max-w-xs cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Pipeline Progression Bar */}
          <div className="grid grid-cols-4 gap-2 shrink-0 text-xs">
            {[
              { label: "1. G'oya (Concept)", active: currentStage !== 'idle' },
              { label: '2. Ssenariy (Script)', active: currentStage === 'scripting' || currentStage === 'keyframes' || currentStage === 'video' || currentStage === 'complete' },
              { label: '3. Kadrlash (Keyframes)', active: currentStage === 'keyframes' || currentStage === 'video' || currentStage === 'complete' },
              { label: '4. Video (Render)', active: currentStage === 'video' || currentStage === 'complete' },
            ].map((s, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-center font-semibold transition-colors ${
                  s.active
                    ? 'bg-purple-100 dark:bg-[#262626] border-purple-500 dark:border-[#444444] text-purple-900 dark:text-white'
                    : 'bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-[#262626] text-zinc-400 dark:text-[#737373]'
                }`}
              >
                {s.label}
              </div>
            ))}
          </div>

          {/* Generated Scenes */}
          <div className="flex-1 bg-white dark:bg-[#1c1c1c] border border-zinc-200 dark:border-[#262626] rounded-2xl p-4 overflow-y-auto space-y-4 shadow-xs">
            {activePipeline && activePipeline.scenes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activePipeline.scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className="bg-zinc-50 dark:bg-[#242424] border border-zinc-200 dark:border-[#2f2f2f] rounded-xl p-3.5 space-y-2.5 flex flex-col shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-900 dark:text-white">{scene.sceneNumber}-Sahna</span>
                      <span className="text-zinc-500 dark:text-[#8e8e8e] font-mono text-[11px]">{scene.cameraMovement}</span>
                    </div>

                    <p className="text-xs text-zinc-700 dark:text-[#d4d4d4] line-clamp-2 font-medium">
                      {scene.narrative}
                    </p>

                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-zinc-200 dark:border-[#2e2e2e]">
                      {scene.videoUrl ? (
                        <video
                          src={scene.videoUrl}
                          controls
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : scene.keyframeUrl ? (
                        <img
                          src={scene.keyframeUrl}
                          alt={scene.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                          Vizual kadr yuklanmoqda...
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-500 dark:text-[#737373] line-clamp-2 mt-auto">
                      {scene.visualPrompt}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400 dark:text-[#737373]">
                <Layers className="w-10 h-10 mb-2 stroke-1 text-purple-400" />
                <p className="text-xs max-w-sm">Hozircha faol ish oqimi yo'q. Sahnalarni generatsiya qilish uchun "Quvurni ishga tushirish" tugmasini bosing yoki "Mening Doskam" bo'limidan tayyor rasm/videolarni quvurga qo'shing.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
