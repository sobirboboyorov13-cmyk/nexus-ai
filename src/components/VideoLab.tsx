import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Upload,
  Video,
  X,
  Download,
  LayoutGrid
} from 'lucide-react';
import { useNexusStore } from '../lib/store';
import { VIDEO_MODELS } from '../lib/models';
import { CameraMotion, VideoJob } from '../types/nexus';

export const VideoLab: React.FC = () => {
  const {
    videoParams,
    setVideoParams,
    videoJobs,
    addVideoJob,
    updateVideoJob,
    deductCredits,
    refundCredits,
    currentUser,
    refreshUserAndCredits,
    geminiApiKey,
    setCurrentTab,
    setApiKeyModalOpen,
  } = useNexusStore();

  // Faqat joriy foydalanuvchiga tegishli videolar
  const currentUserId = currentUser.id || 'user-guest';
  const userVideoJobs = videoJobs.filter((j) => {
    const uId = (j as any).userId;
    if (currentUserId === 'user-guest' || !currentUserId) {
      return !uId || uId === 'user-guest' || uId === '';
    }
    return uId === currentUserId || !uId || uId === 'user-guest';
  });
  const [activeJobId, setActiveJobId] = useState<string>('');
  const activeJob = userVideoJobs.find((j) => j.id === activeJobId) || userVideoJobs[0] || null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileTab, setMobileTab] = useState<'controls' | 'preview'>('controls');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const selectedModel = VIDEO_MODELS.find((m) => m.id === videoParams.modelId) || VIDEO_MODELS[0];

  const cameraMotionPresets: { id: CameraMotion; label: string }[] = [
    { id: 'static', label: 'Static' },
    { id: 'pan_left', label: 'Pan Left' },
    { id: 'pan_right', label: 'Pan Right' },
    { id: 'tilt_up', label: 'Tilt Up' },
    { id: 'tilt_down', label: 'Tilt Down' },
    { id: 'zoom_in', label: 'Zoom In' },
  ];

  useEffect(() => {
    const pendingJobs = videoJobs.filter((j) => j.status === 'queued' || j.status === 'processing');
    if (pendingJobs.length === 0) return;

    const interval = setInterval(async () => {
      for (const job of pendingJobs) {
        try {
          const res = await fetch(`/api/video-status/${job.id}`);
          if (res.ok) {
            const updated = await res.json();
            updateVideoJob(job.id, {
              status: updated.status,
              progress: updated.progress,
              statusMessage: updated.statusMessage,
              videoUrl: updated.videoUrl,
              thumbnailUrl: updated.thumbnailUrl,
              completedAt: updated.completedAt,
            });
            if (updated.status === 'completed') {
              refreshUserAndCredits();
            }
          }
        } catch (e) {
          console.warn(`Polling error:`, e);
        }
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [videoJobs, updateVideoJob, refreshUserAndCredits]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setVideoParams({
          firstFrameUrl: reader.result as string,
          mode: 'image-to-video',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setVideoParams({
          referenceVideoUrl: reader.result as string,
          referenceVideoName: file.name,
          mode: 'video-to-video',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateVideoJob = async () => {
    if ((!videoParams.prompt.trim() && !videoParams.firstFrameUrl && !videoParams.referenceVideoUrl) || isSubmitting) return;

    const cost = selectedModel.costCredits;
    const ok = deductCredits(cost, `Video: ${selectedModel.name}`);
    if (!ok) {
      alert("Hisobingizda yetarli kredit mavjud emas!");
      return;
    }

    setIsSubmitting(true);
    setMobileTab('preview');

    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify(videoParams),
      });

      if (!res.ok) {
        let errMessage = `Server xatosi (${res.status})`;
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch {}
        throw new Error(errMessage);
      }

      const data = await res.json();
      const newJob: VideoJob = {
        ...data.job,
        userId: currentUser.id,
      };
      addVideoJob(newJob);
      setActiveJobId(newJob.id);
      refreshUserAndCredits();
    } catch (e: any) {
      refundCredits(cost, `Qaytarildi (Video xatosi): ${selectedModel.name}`);
      alert(`Video yaratishda xatolik: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="nexus-video-lab" className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50 dark:bg-[#171717] text-zinc-900 dark:text-[#ececec] transition-colors">
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex items-center justify-around border-b border-zinc-200 dark:border-[#262626] bg-white dark:bg-[#171717] px-2 py-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('controls')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors text-center ${
            mobileTab === 'controls'
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          ⚙️ Sozlamalar
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors text-center ${
            mobileTab === 'preview'
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          🎬 Video & Natija ({userVideoJobs.length})
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Column: Controls */}
        <div className={`w-full md:w-80 flex-col border-r border-zinc-200 dark:border-[#262626] bg-white dark:bg-[#171717] p-4 overflow-y-auto shrink-0 space-y-4 ${
          mobileTab === 'controls' ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Section Kicker */}
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-1">
              GOOGLE FLOW · VEO 2
            </div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">G‘oyangizni videoga aylantiring</h2>
            <p className="text-[11px] text-zinc-500 dark:text-[#8e8e8e]">
              Google Veo 2 va ilg‘or AI modellar bilan kinematografik video yarating.
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
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Google Flow (Veo)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {geminiApiKey ? "Google AI ulandi" : "Flow Video Bridge faol"}
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

        {/* Mode Selector */}
        <div className="grid grid-cols-3 p-1 bg-zinc-100/90 dark:bg-[#202022] border border-zinc-200/90 dark:border-white/10 rounded-xl gap-1">
          <button
            onClick={() => setVideoParams({ mode: 'text-to-video' })}
            className={`py-2 text-[11px] font-semibold rounded-lg transition-all cursor-pointer btn-tactile ${
              videoParams.mode === 'text-to-video'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-xs'
                : 'text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Matndan
          </button>
          <button
            onClick={() => setVideoParams({ mode: 'image-to-video' })}
            className={`py-2 text-[11px] font-semibold rounded-lg transition-all cursor-pointer btn-tactile ${
              videoParams.mode === 'image-to-video'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-xs'
                : 'text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Rasmdan
          </button>
          <button
            onClick={() => setVideoParams({ mode: 'video-to-video' })}
            className={`py-2 text-[11px] font-semibold rounded-lg transition-all cursor-pointer btn-tactile ${
              videoParams.mode === 'video-to-video'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-xs'
                : 'text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Videodan
          </button>
        </div>

        {/* First Frame Upload */}
        {videoParams.mode === 'image-to-video' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">Boshlang'ich kadr (Rasm)</label>
              {videoParams.firstFrameUrl && (
                <button
                  onClick={() => setVideoParams({ firstFrameUrl: undefined })}
                  className="text-[10px] text-red-500 hover:text-red-600 dark:text-[#8e8e8e] dark:hover:text-white flex items-center gap-0.5 cursor-pointer font-medium"
                >
                  <X className="w-3 h-3" /> Tozalash
                </button>
              )}
            </div>

            {videoParams.firstFrameUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-200 dark:border-[#2f2f2f] shadow-xs">
                <img
                  src={videoParams.firstFrameUrl}
                  alt="First frame"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-zinc-300 dark:border-[#333333] hover:border-zinc-400 dark:hover:border-[#555555] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-zinc-50 dark:bg-[#212121]/50 text-center"
              >
                <Upload className="w-5 h-5 text-zinc-400 dark:text-[#8e8e8e] mb-1.5" />
                <span className="text-xs font-medium text-zinc-700 dark:text-[#ececec]">Boshlang'ich rasmni yuklang</span>
                <span className="text-[10px] text-zinc-400 dark:text-[#737373]">PNG, JPG, WebP</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}

        {/* Reference Video Upload */}
        {videoParams.mode === 'video-to-video' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">Namuna video (Reference Video)</label>
              {videoParams.referenceVideoUrl && (
                <button
                  onClick={() => setVideoParams({ referenceVideoUrl: undefined, referenceVideoName: undefined })}
                  className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 flex items-center gap-0.5 cursor-pointer font-medium"
                >
                  <X className="w-3 h-3" /> Tozalash
                </button>
              )}
            </div>

            {videoParams.referenceVideoUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-200 dark:border-[#2f2f2f] shadow-xs bg-black">
                <video
                  src={videoParams.referenceVideoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div
                onClick={() => videoFileInputRef.current?.click()}
                className="border border-dashed border-zinc-300 dark:border-[#333333] hover:border-blue-500 dark:hover:border-blue-400 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-zinc-50 dark:bg-[#212121]/50 text-center group"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Video className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-zinc-700 dark:text-[#ececec]">Namuna videoni yuklang</span>
                <span className="text-[10px] text-zinc-400 dark:text-[#737373]">MP4, WebM, MOV (Video-to-Video)</span>
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}

        {/* Model Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">Video Modeli</label>
          <select
            value={videoParams.modelId}
            onChange={(e) => setVideoParams({ modelId: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-zinc-100 dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] rounded-lg text-zinc-900 dark:text-[#ececec] focus:outline-none cursor-pointer"
          >
            {VIDEO_MODELS.map((model) => (
              <option key={model.id} value={model.id} className="bg-white dark:bg-[#212121] text-zinc-900 dark:text-white">
                {model.name} ({model.costCredits} kredit)
              </option>
            ))}
          </select>
        </div>

        {/* Prompt */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">Harakat tavsifi (Motion Prompt)</label>
          <textarea
            value={videoParams.prompt}
            onChange={(e) => setVideoParams({ prompt: e.target.value })}
            rows={3}
            placeholder="Harakatlar, dinamika va kamera harakatini yozing..."
            className="w-full bg-zinc-100 dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] rounded-lg p-2.5 text-xs text-zinc-900 dark:text-[#ececec] placeholder-zinc-400 dark:placeholder-[#737373] focus:outline-none resize-none"
          />
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">Video davomiyligi</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['5s', '10s'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setVideoParams({ duration: d })}
                className={`py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer btn-tactile ${
                  videoParams.duration === d
                    ? 'bg-zinc-900 dark:bg-white border-transparent text-white dark:text-black shadow-xs'
                    : 'bg-zinc-100/80 dark:bg-[#1f1f21] border-zinc-200/90 dark:border-white/10 text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-[#27272a]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Camera Motion */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-[#a3a3a3]">Kamera yo'nalishi</label>
          <div className="grid grid-cols-3 gap-1.5">
            {cameraMotionPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setVideoParams({ cameraMotion: preset.id })}
                className={`py-2 px-1 rounded-xl border text-[11px] font-semibold transition-all text-center cursor-pointer btn-tactile ${
                  videoParams.cameraMotion === preset.id
                    ? 'bg-zinc-900 dark:bg-white border-transparent text-white dark:text-black shadow-xs'
                    : 'bg-zinc-100/80 dark:bg-[#1f1f21] border-zinc-200/90 dark:border-white/10 text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-[#27272a]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Premium Tactile Render Button */}
        <button
          onClick={handleCreateVideoJob}
          disabled={isSubmitting || !videoParams.prompt.trim()}
          className="w-full py-3 btn-primary-nexus text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 mt-auto cursor-pointer shadow-md"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Film className="w-4 h-4 text-amber-300" />
              <span>Video yaratish ({selectedModel.costCredits} kredit)</span>
            </>
          )}
        </button>
      </div>

        {/* Right Column: Video Viewport & History */}
        <div className={`flex-1 flex-col p-3 sm:p-4 overflow-y-auto min-h-0 space-y-4 ${
          mobileTab === 'preview' ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Main Video Viewport */}
          {activeJob && activeJob.status === 'completed' && activeJob.videoUrl ? (
            <div className="relative flex-1 bg-black rounded-2xl border border-zinc-200 dark:border-[#262626] flex items-center justify-center overflow-hidden min-h-[260px] sm:min-h-[300px] shadow-sm">
              <video
                src={activeJob.videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain max-h-[520px]"
              />
              <div className="absolute top-3.5 right-3.5 z-10">
                <a
                  href={activeJob.videoUrl}
                  download={`nexus-video-${activeJob.id}.mp4`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-semibold transition-all flex items-center gap-1.5 border border-white/20 backdrop-blur-md cursor-pointer btn-tactile shadow-md"
                  title="Videoni yuklab olish"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>MP4 yuklab olish</span>
                </a>
              </div>
            </div>
          ) : activeJob && (activeJob.status === 'queued' || activeJob.status === 'processing') ? (
            <div className="flex-1 bg-zinc-100 dark:bg-[#111111] rounded-xl border border-zinc-200 dark:border-[#262626] flex flex-col items-center justify-center p-8 text-center space-y-3 min-h-[260px] sm:min-h-[300px] shadow-sm">
              <div className="w-5 h-5 border-2 border-zinc-400 border-t-purple-600 dark:border-[#555555] dark:border-t-white rounded-full animate-spin" />
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-[#ececec]">{activeJob.statusMessage || 'Video render qilinmoqda...'}</p>
                <p className="text-xs text-zinc-500 dark:text-[#737373] mt-1">Jarayon: {activeJob.progress}%</p>
              </div>
              <div className="w-48 bg-zinc-200 dark:bg-[#212121] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-600 dark:bg-white h-full transition-all duration-300"
                  style={{ width: `${activeJob.progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-[#737373] min-h-[260px] sm:min-h-[300px]">
              <Video className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-xs">Faol video mavjud emas</p>
            </div>
          )}

          {/* Video History Queue */}
          <div className="space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-[#8e8e8e]">
              <span className="font-semibold">Mening videolarim ({userVideoJobs.length})</span>
              <button
                onClick={() => setCurrentTab('pipeline')}
                className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Mening Doskamda ko‘rish →</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 overflow-y-auto max-h-32">
              {userVideoJobs.map((job) => {
                const isSelected = activeJobId === job.id;
                return (
                  <button
                    key={job.id}
                    onClick={() => setActiveJobId(job.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-200 dark:bg-[#242424] border-purple-500 ring-1 ring-purple-500/30'
                        : 'bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-[#262626] hover:bg-zinc-100 dark:hover:bg-[#202020]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded bg-zinc-200 dark:bg-black shrink-0 overflow-hidden relative flex items-center justify-center">
                      {job.thumbnailUrl ? (
                        <img src={job.thumbnailUrl} alt="Thumb" className="w-full h-full object-cover" />
                      ) : (
                        <Film className="w-4 h-4 text-zinc-400 dark:text-[#737373]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-[#ececec] truncate">{job.modelId}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-[#737373] truncate">{job.status}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
