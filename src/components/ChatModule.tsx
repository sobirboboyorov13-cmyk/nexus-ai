import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowUp,
  Columns2,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Plus,
  RotateCcw,
  Brain,
  Zap,
  Layers,
  Cpu,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  X as XIcon,
  Image as ImageIcon,
  FileText,
  Square,
  Mic,
  MicOff,
  Download,
  Eye,
  Loader2,
  FileAudio
} from 'lucide-react';
import { useNexusStore } from '../lib/store';
import { CHAT_MODELS } from '../lib/models';
import { ChatMessage } from '../types/nexus';
import { FormattedMessage } from './FormattedMessage';
import { ModelIcon, ModelBadge, getModelBrandMeta } from './ModelBadge';
import { FilePreviewModal, FilePreviewData } from './FilePreviewModal';

export const ChatModule: React.FC = () => {
  const {
    chatModelA,
    setChatModelA,
    chatModelB,
    setChatModelB,
    isDualView,
    setDualView,
    messagesA,
    messagesB,
    addChatMessage,
    updateChatMessage,
    clearChat,
    createNewChat,
    deductCredits,
    setBillingModalOpen,
    currentUser,
    refreshUserAndCredits,
    setMemoryDrawerOpen,
    deepMemory,
    fetchDeepMemory,
    geminiApiKey,
    openRouterApiKey,
    openAiApiKey,
    customBaseUrl,
    customModelName,
  } = useNexusStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'like' | 'dislike' | undefined>>({});
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; base64: string } | null>(null);
  const [previewFile, setPreviewFile] = useState<FilePreviewData | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeRequestIdRef = useRef<number>(0);
  const activeReadersRef = useRef<ReadableStreamDefaultReader<Uint8Array>[]>([]);

  const handleStopGeneration = () => {
    activeRequestIdRef.current += 1;
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) { }
      abortControllerRef.current = null;
    }
    activeReadersRef.current.forEach((reader) => {
      try {
        reader.cancel();
      } catch (e) { }
    });
    activeReadersRef.current = [];
    setIsGenerating(false);
  };

  const handleTranscribeAudio = async (base64Audio?: string, mimeType?: string) => {
    const targetBase64 = base64Audio || attachedFile?.base64;
    const targetMime = mimeType || attachedFile?.type || 'audio/webm';
    if (!targetBase64) return;

    setIsTranscribing(true);
    try {
      const customHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
      };
      if (geminiApiKey?.trim()) customHeaders['x-gemini-key'] = geminiApiKey.trim();
      if (openAiApiKey?.trim()) customHeaders['x-openai-key'] = openAiApiKey.trim();

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: customHeaders,
        body: JSON.stringify({
          audioBase64: targetBase64,
          mimeType: targetMime,
        }),
      });

      const data = await res.json();
      if (data.success && data.text) {
        setInputPrompt((prev) => (prev ? `${prev} ${data.text}` : data.text));
      } else if (data.text) {
        setInputPrompt((prev) => (prev ? `${prev} ${data.text}` : data.text));
      } else {
        alert(data.message || data.error || "Audioni matnga aylantirib bo'lmadi.");
      }
    } catch (err: any) {
      console.error("Transcribe error:", err);
      alert("Audio transkripsiya qilishda xatolik yuz berdi: " + err.message);
    } finally {
      setIsTranscribing(false);
    }
  };

  const startMediaRecorderFallback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string)?.split(',')[1] || '';
          if (base64) {
            await handleTranscribeAudio(base64, 'audio/webm');
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch (micErr: any) {
      alert("Mikrofonni yoqishda xatolik: " + (micErr.message || "Ruxsat berilmadi"));
      setIsListening(false);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (e) { }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'uz-UZ';
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setInputPrompt((prev) => {
              const trimmed = prev.trim();
              return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
          if (event.error === 'network' || event.error === 'not-allowed') {
            startMediaRecorderFallback();
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (err) {
        console.warn("SpeechRecognition start failed, fallback to MediaRecorder:", err);
      }
    }

    startMediaRecorderFallback();
  };

  const handleExportChat = () => {
    const session = useNexusStore.getState().chatSessions.find(s => s.id === useNexusStore.getState().activeSessionId);
    const title = session?.title || 'Nexus Suhbat';
    const dateStr = new Date().toLocaleString('uz-UZ');

    let md = `# ${title}\n*Sana va vaqt: ${dateStr}*\n\n---\n\n`;

    if (isDualView) {
      md += `## Solishtirish rejimi: ${chatModelA} vs ${chatModelB}\n\n`;
      md += `### ${chatModelA} Javoblari:\n\n`;
      messagesA.forEach((m) => {
        md += `**${m.role === 'user' ? 'Foydalanuvchi' : chatModelA}:**\n${m.content}\n\n`;
      });
      md += `\n---\n### ${chatModelB} Javoblari:\n\n`;
      messagesB.forEach((m) => {
        md += `**${m.role === 'user' ? 'Foydalanuvchi' : chatModelB}:**\n${m.content}\n\n`;
      });
    } else {
      md += `## Tanlangan Model: ${chatModelA}\n\n`;
      messagesA.forEach((m) => {
        md += `**${m.role === 'user' ? 'Foydalanuvchi' : chatModelA}:**\n${m.content}\n\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-chat-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFeedback = (id: string, type: 'like' | 'dislike') => {
    setMessageFeedback((prev) => ({
      ...prev,
      [id]: prev[id] === type ? undefined : type,
    }));
  };

  const scrollRefA = useRef<HTMLDivElement>(null);
  const scrollRefB = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      if (scrollRefA.current) {
        scrollRefA.current.scrollTop = scrollRefA.current.scrollHeight;
      }
      if (scrollRefB.current) {
        scrollRefB.current.scrollTop = scrollRefB.current.scrollHeight;
      }
    });
    return () => cancelAnimationFrame(frameId);
  }, [messagesA, messagesB]);

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const compressImageIfNeeded = (file: File): Promise<{ name: string; type: string; base64: string }> => {
    return new Promise((resolve) => {
      const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
      if (!isImg) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = (e.target?.result as string)?.split(',')[1] || '';
          resolve({ name: file.name, type: file.type || 'application/octet-stream', base64 });
        };
        reader.onerror = () => resolve({ name: file.name, type: file.type || '', base64: '' });
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const base64 = dataUrl.split(',')[1] || '';
          resolve({ name: file.name, type: 'image/jpeg', base64 });
        };
        img.onerror = () => {
          const base64 = (e.target?.result as string)?.split(',')[1] || '';
          resolve({ name: file.name, type: file.type || 'image/jpeg', base64 });
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve({ name: file.name, type: file.type || 'image/jpeg', base64: '' });
      reader.readAsDataURL(file);
    });
  };

  const executeChatRequest = async (
    modelId: string,
    prompt: string,
    pane: 'A' | 'B',
    assistantMsgId: string,
    attachment: { name: string; type: string; base64: string } | null | undefined,
    requestId: number,
    signal: AbortSignal
  ) => {
    const startTime = Date.now();
    let accumulatedText = '';
    let currentReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    try {
      if (activeRequestIdRef.current !== requestId) return;

      const activeMsgs = pane === 'A' ? messagesA : messagesB;
      const history = activeMsgs.map(m => ({ role: m.role, content: m.content }));

      const customHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
      };
      if (geminiApiKey?.trim()) customHeaders['x-gemini-key'] = geminiApiKey.trim();
      if (openRouterApiKey?.trim()) customHeaders['x-openrouter-key'] = openRouterApiKey.trim();
      if (openAiApiKey?.trim()) customHeaders['x-openai-key'] = openAiApiKey.trim();
      if (customBaseUrl?.trim()) customHeaders['x-custom-base-url'] = customBaseUrl.trim();
      if (customModelName?.trim()) customHeaders['x-custom-model-name'] = customModelName.trim();

      // Try streaming endpoint first
      const res = await fetch('/api/generate/chat/stream', {
        method: 'POST',
        headers: customHeaders,
        signal,
        body: JSON.stringify({
          modelId,
          prompt,
          history,
          dualComparison: isDualView,
          attachment: attachment || undefined
        }),
      });

      if (activeRequestIdRef.current !== requestId) return;

      if (!res.ok) {
        // Fallback to regular chat endpoint
        const fallbackRes = await fetch('/api/generate/chat', {
          method: 'POST',
          headers: customHeaders,
          signal,
          body: JSON.stringify({
            modelId,
            prompt,
            history,
            dualComparison: isDualView,
            attachment: attachment || undefined
          }),
        });

        if (activeRequestIdRef.current !== requestId) return;

        if (!fallbackRes.ok) {
          const errData = await fallbackRes.json().catch(() => ({}));
          throw new Error(errData.error || fallbackRes.statusText);
        }

        const data = await fallbackRes.json();
        if (activeRequestIdRef.current === requestId) {
          updateChatMessage(pane, assistantMsgId, data.content, Date.now() - startTime);
          refreshUserAndCredits();
        }
        return;
      }

      // Read SSE stream with line buffering
      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Stream reader mavjud emas");
      }
      currentReader = reader;
      activeReadersRef.current.push(reader);

      const decoder = new TextDecoder();
      let lastUpdateTime = 0;
      let buffer = '';
      let isDone = false;

      while (true) {
        if (activeRequestIdRef.current !== requestId) {
          try { await reader.cancel(); } catch (e) { }
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        if (activeRequestIdRef.current !== requestId) {
          try { await reader.cancel(); } catch (e) { }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep partial line in buffer

        let hasNewChunks = false;
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataContent = trimmed.slice(6).trim();
            if (dataContent === '[DONE]') {
              isDone = true;
              break;
            }
            try {
              const parsed = JSON.parse(dataContent);
              if (parsed.chunk) {
                accumulatedText += parsed.chunk;
                hasNewChunks = true;
              }
            } catch (e) {
              // Ignore partial chunk parsing errors
            }
          }
        }

        // Throttle UI re-renders to at most once per ~25ms or when done
        const now = Date.now();
        if (hasNewChunks && (now - lastUpdateTime > 25 || isDone)) {
          if (activeRequestIdRef.current === requestId) {
            lastUpdateTime = now;
            updateChatMessage(pane, assistantMsgId, accumulatedText);
          }
        }

        if (isDone) break;
      }

      if (activeRequestIdRef.current !== requestId) return;

      if (buffer.trim().startsWith('data: ')) {
        const dataContent = buffer.trim().slice(6).trim();
        if (dataContent && dataContent !== '[DONE]') {
          try {
            const parsed = JSON.parse(dataContent);
            if (parsed.chunk) {
              accumulatedText += parsed.chunk;
            }
          } catch (e) { }
        }
      }

      if (activeRequestIdRef.current === requestId) {
        const latency = Date.now() - startTime;
        const finalText = accumulatedText.trim() || "Modeldan javob kutilmaganda to'xtadi. Iltimos qaytadan urinib ko'ring.";
        updateChatMessage(pane, assistantMsgId, finalText, latency);
        refreshUserAndCredits();
      }
    } catch (err: any) {
      if (activeRequestIdRef.current !== requestId) return;
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        const finalText = accumulatedText.trim()
          ? `${accumulatedText.trim()}\n\n*(To'xtatildi)*`
          : "Generatsiya to'xtatildi.";
        updateChatMessage(pane, assistantMsgId, finalText, Date.now() - startTime);
        return;
      }
      updateChatMessage(
        pane,
        assistantMsgId,
        `Xatolik yuz berdi (${modelId}): ${err.message}`,
        Date.now() - startTime
      );
    } finally {
      if (currentReader) {
        activeReadersRef.current = activeReadersRef.current.filter(r => r !== currentReader);
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent | React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = inputPrompt.trim();
    if ((!trimmed && !attachedFile) || isGenerating) return;

    // Halt any previous active reader / stream first
    handleStopGeneration();

    const currentRequestId = ++activeRequestIdRef.current;
    const currentAbortController = new AbortController();
    abortControllerRef.current = currentAbortController;

    try {
      const cost = isDualView ? 2 : 1;
      const ok = deductCredits(cost, `Chat: ${chatModelA}${isDualView ? ` vs ${chatModelB}` : ''}`);
      if (!ok) {
        setBillingModalOpen(true);
        return;
      }

      setIsGenerating(true);
      setInputPrompt('');

      const currentAttachment = attachedFile;
      setAttachedFile(null);

      const userMsgId = `user-${Date.now()}`;
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        modelId: 'user',
        content: trimmed,
        timestamp: Date.now(),
        attachment: currentAttachment || undefined,
      };

      addChatMessage('A', userMsg);
      if (isDualView) {
        addChatMessage('B', userMsg);
      }

      const assistantIdA = `asst-a-${Date.now()}`;
      addChatMessage('A', {
        id: assistantIdA,
        role: 'assistant',
        modelId: chatModelA,
        content: 'Fikrlanmoqda...',
        timestamp: Date.now(),
        isStreaming: true,
      });

      const promptForModel = trimmed || (currentAttachment ? (currentAttachment.type?.startsWith('image/') ? 'Ushbu rasmni batafsil tahlil qilib bering.' : 'Ushbu fayl mazmunini to‘liq tahlil qilib bering.') : 'Salom');

      const promises = [
        executeChatRequest(chatModelA, promptForModel, 'A', assistantIdA, currentAttachment, currentRequestId, currentAbortController.signal)
      ];

      if (isDualView) {
        const assistantIdB = `asst-b-${Date.now()}`;
        addChatMessage('B', {
          id: assistantIdB,
          role: 'assistant',
          modelId: chatModelB,
          content: 'Tahlil qilinmoqda...',
          timestamp: Date.now(),
          isStreaming: true,
        });
        promises.push(
          executeChatRequest(chatModelB, promptForModel, 'B', assistantIdB, currentAttachment, currentRequestId, currentAbortController.signal)
        );
      }

      await Promise.all(promises);
    } catch (err: any) {
      console.error("Chat generation error:", err);
    } finally {
      if (activeRequestIdRef.current === currentRequestId) {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleRegenerate = async (pane: 'A' | 'B', msgIdx: number) => {
    if (isGenerating) return;
    const messages = pane === 'A' ? messagesA : messagesB;
    // Find preceding user message
    let lastUserPrompt = '';
    for (let i = msgIdx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserPrompt = messages[i].content;
        break;
      }
    }

    if (!lastUserPrompt) return;

    handleStopGeneration();
    const currentRequestId = ++activeRequestIdRef.current;
    const currentAbortController = new AbortController();
    abortControllerRef.current = currentAbortController;

    const modelId = pane === 'A' ? chatModelA : chatModelB;
    const assistantId = messages[msgIdx].id;

    updateChatMessage(pane, assistantId, 'Qayta generatsiya qilinmoqda...');
    setIsGenerating(true);
    await executeChatRequest(modelId, lastUserPrompt, pane, assistantId, null, currentRequestId, currentAbortController.signal);
    if (activeRequestIdRef.current === currentRequestId) {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const renderMessagePane = (
    pane: 'A' | 'B',
    modelId: string,
    setModelId: (m: string) => void,
    messages: ChatMessage[],
    scrollRef: React.RefObject<HTMLDivElement | null>
  ) => {
    const currentModelObj = CHAT_MODELS.find((m) => m.id === modelId) || CHAT_MODELS[0];

    return (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#171717] overflow-hidden">
        {/* Model Bar (especially when Dual-View is active) */}
        {isDualView && (
          <div className="h-10 px-3 sm:px-4 border-b border-zinc-200 dark:border-[#262626] flex items-center justify-between bg-zinc-50 dark:bg-[#171717] text-xs shrink-0">
            <div className="flex items-center gap-2">
              <ModelIcon modelId={modelId} className="w-4 h-4 shrink-0" />
              <div className="relative flex items-center">
                <select
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-zinc-900 dark:text-[#f4f4f4] pr-5 appearance-none cursor-pointer focus:outline-none hover:text-purple-600 dark:hover:text-white transition-colors"
                >
                  {CHAT_MODELS.map((m) => (
                    <option key={m.id} value={m.id} className="bg-white dark:bg-[#212121] text-zinc-900 dark:text-[#ececec]">
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-zinc-400 dark:text-[#8e8e8e] absolute right-0 pointer-events-none" />
              </div>
            </div>
            <ModelBadge modelId={modelId} size="sm" showDetails={false} />
          </div>
        )}

        {/* Message Thread Scroll Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="relative h-full flex flex-col items-center justify-center text-center p-6 overflow-hidden">
              {/* Floating Aurora Glow Orbs */}
              <div className="gemini-aurora-bg w-80 h-80 bg-blue-500/10 dark:bg-blue-500/15 top-10 -left-10" />
              <div className="gemini-aurora-bg w-96 h-96 bg-purple-600/15 dark:bg-purple-600/20 -top-20 right-0" />
              <div className="gemini-aurora-bg w-72 h-72 bg-pink-500/10 dark:bg-pink-500/15 bottom-10 left-1/4" />

              <div className="relative z-10 max-w-2xl w-full flex flex-col items-center">
                {/* Gemini 4-point Sparkle Icon */}
                <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-purple-500/20 dark:border-white/15 flex items-center justify-center shadow-xl mb-4 gemini-badge-glow">
                  <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-300 animate-[spin_10s_linear_infinite]" />
                </div>

                {/* Gemini Iridescent Header */}
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:gemini-gradient-text mb-2">
                  Bugun nimani yaratamiz?
                </h1>

                <p className="text-xs sm:text-sm text-zinc-600 dark:text-white/70 max-w-lg leading-relaxed mb-6">
                  GPT-5.6 Sol bilan fikrlaringizni reja, matn va kodga aylantiring.
                </p>

                {/* 4 Interactive Suggestions Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                  <button
                    type="button"
                    onClick={() => setInputPrompt("YouTube uchun kreativ video ssenariy yoz")}
                    className="gemini-card-hook p-3.5 rounded-2xl cursor-pointer group text-left shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-red-500/15 dark:bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors">
                        YouTube Video Ssenariysi
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-white/50 group-hover:text-zinc-700 dark:group-hover:text-white/70 transition-colors leading-snug">
                      YouTube uchun kreativ video ssenariy yoz
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputPrompt("Zamonaviy landing sahifa rejasini tuz")}
                    className="gemini-card-hook p-3.5 rounded-2xl cursor-pointer group text-left shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                        <Brain className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                        Landing Sahifa Rejasi
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-white/50 group-hover:text-zinc-700 dark:group-hover:text-white/70 transition-colors leading-snug">
                      Zamonaviy landing sahifa rejasini tuz
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputPrompt("Ingliz tilini o‘rganish rejasini yarat")}
                    className="gemini-card-hook p-3.5 rounded-2xl cursor-pointer group text-left shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-pink-500/15 dark:bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors">
                        Til O‘rganish Rejasi
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-white/50 group-hover:text-zinc-700 dark:group-hover:text-white/70 transition-colors leading-snug">
                      Ingliz tilini o‘rganish rejasini yarat
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputPrompt("TypeScript va React'da toza arxitektura va kod tahlilini qilib ber.")}
                    className="gemini-card-hook p-3.5 rounded-2xl cursor-pointer group text-left shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                        Kod Tahlili & Arxitektura
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-white/50 group-hover:text-zinc-700 dark:group-hover:text-white/70 transition-colors leading-snug">
                      Toza kod, xavfsizlik va optimizatsiya yechimlari
                    </p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, msgIdx) => {
                const isUser = msg.role === 'user';
                const isCopied = copiedMsgId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[85%] ${isUser
                          ? 'nexus-user-bubble bg-zinc-200 dark:bg-[#2a2a2a] text-zinc-900 dark:text-[#f4f4f4] px-4 py-2.5 rounded-2xl text-sm border border-zinc-300 dark:border-transparent'
                          : 'nexus-assistant-bubble text-zinc-800 dark:text-[#ececec] text-sm leading-relaxed w-full'
                        }`}
                    >
                      {isUser ? (
                        <div className="space-y-2">
                          {msg.attachment && (msg.attachment.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(msg.attachment.name || '')) && (
                            <div
                              className="relative group cursor-pointer inline-block overflow-hidden rounded-xl mb-1.5 border border-zinc-300 dark:border-[#444444] shadow-sm"
                              onClick={() => setPreviewFile(msg.attachment!)}
                              title="Kattalashtirish va ko'rish"
                            >
                              <img
                                src={
                                  msg.attachment.base64.startsWith('data:')
                                    ? msg.attachment.base64
                                    : `data:${msg.attachment.type || 'image/jpeg'};base64,${msg.attachment.base64}`
                                }
                                alt={msg.attachment.name}
                                className="max-w-[280px] max-h-[280px] object-cover transition-transform group-hover:scale-105 duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium backdrop-blur-[2px]">
                                <Eye className="w-4 h-4" />
                                <span>Ko'rish</span>
                              </div>
                            </div>
                          )}
                          {msg.attachment && !(msg.attachment.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(msg.attachment.name || '')) && (
                            <button
                              type="button"
                              onClick={() => setPreviewFile(msg.attachment!)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-300/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 hover:bg-zinc-400/50 dark:hover:bg-zinc-700/80 transition-all text-xs font-mono mb-1.5 cursor-pointer border border-zinc-400/30 dark:border-zinc-700 group shadow-xs"
                              title="Faylni ochish va o'qish"
                            >
                              <FileText className="w-4 h-4 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="truncate max-w-[200px]">{msg.attachment.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                Ko'rish
                              </span>
                            </button>
                          )}
                          {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Assistant Response Header with Model Icon & Name */}
                          <div className="flex items-center gap-2 pb-1 text-xs text-zinc-500 dark:text-[#a3a3a3]">
                            <ModelIcon modelId={msg.modelId} className="w-4 h-4 shrink-0" />
                            <span className="font-semibold text-zinc-900 dark:text-white/90">
                              {getModelBrandMeta(msg.modelId).name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#262626] text-zinc-600 dark:text-[#8e8e8e] border border-zinc-200 dark:border-[#333333]">
                              {getModelBrandMeta(msg.modelId).company}
                            </span>
                          </div>

                          {/* Assistant Response rendered with LaTeX KaTeX and Markdown */}
                          <FormattedMessage content={msg.content} msgId={msg.id} />

                          {/* Streaming indicator */}
                          {msg.isStreaming && (
                            <div className="flex items-center gap-2 pt-1 text-xs text-[#8e8e8e]">
                              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                              <span className="italic">Javob yozilmoqda...</span>
                            </div>
                          )}

                          {/* Message actions footer (when completed) */}
                          {!msg.isStreaming && msg.content !== 'Fikrlanmoqda...' && msg.content !== 'Tahlil qilinmoqda...' && (
                            <div className="flex items-center justify-between pt-2 border-t border-[#262626]/50 text-[11px] text-[#737373]">
                              <div className="flex items-center gap-2 font-mono">
                                {msg.latencyMs && (
                                  <span>{(msg.latencyMs / 1000).toFixed(2)}s javob vaqti</span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {/* Like Button */}
                                <button
                                  type="button"
                                  onClick={() => toggleFeedback(msg.id, 'like')}
                                  className={`p-1.5 rounded hover:bg-[#262626] transition-colors flex items-center gap-1 ${messageFeedback[msg.id] === 'like'
                                      ? 'text-emerald-400 bg-emerald-500/15'
                                      : 'hover:text-[#ececec]'
                                    }`}
                                  title="Javob ma'qul keldi (Like)"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </button>

                                {/* Dislike Button */}
                                <button
                                  type="button"
                                  onClick={() => toggleFeedback(msg.id, 'dislike')}
                                  className={`p-1.5 rounded hover:bg-[#262626] transition-colors flex items-center gap-1 ${messageFeedback[msg.id] === 'dislike'
                                      ? 'text-rose-400 bg-rose-500/15'
                                      : 'hover:text-[#ececec]'
                                    }`}
                                  title="Javob ma'qul kelmadi (Dislike)"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                </button>

                                {/* Copy Button */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(msg.content, msg.id)}
                                  className="p-1.5 rounded hover:bg-[#262626] hover:text-[#ececec] transition-colors flex items-center gap-1"
                                  title="Javobni nusxalash"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      <span className="text-[10px] text-emerald-400">Nusxalandi</span>
                                    </>
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {/* Regenerate Button */}
                                <button
                                  type="button"
                                  onClick={() => handleRegenerate(pane, msgIdx)}
                                  disabled={isGenerating}
                                  className="p-1.5 rounded hover:bg-[#262626] hover:text-[#ececec] transition-colors"
                                  title="Qayta generatsiya qilish"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="nexus-chat-module" className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#171717]">
      {/* Top minimal control bar */}
      <div className="min-h-10 py-1 px-2 sm:px-4 border-b border-zinc-200 dark:border-[#262626] flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar text-xs text-zinc-600 dark:text-[#8e8e8e] bg-zinc-50 dark:bg-[#171717] shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Active Model Custom Brand Badge */}
          <ModelBadge modelId={chatModelA} size="sm" showDetails={true} />

          <button
            onClick={() => setDualView(!isDualView)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer btn-tactile ${
              isDualView
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-xs'
                : 'text-zinc-600 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-white bg-zinc-100/80 dark:bg-[#202022] hover:bg-zinc-200/80 dark:hover:bg-[#28282b] border border-zinc-200/90 dark:border-white/10'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isDualView ? 'Yagona oyna' : 'Ikkita modelni solishtirish'}</span>
            <span className="sm:hidden">{isDualView ? '1x' : '2x'}</span>
          </button>

          {/* Deep Memory & Cross-Model Context Badge */}
          <button
            type="button"
            onClick={() => setMemoryDrawerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-500/15 via-blue-500/15 to-pink-500/15 border border-purple-500/30 hover:border-purple-500/60 text-purple-700 dark:text-purple-300 transition-all shadow-xs cursor-pointer btn-tactile"
            title="Barcha modellararo bo'lishilgan chuqur xotira va bilimlarni ko'rish"
          >
            <Brain className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            <span className="hidden sm:inline">Chuqur Xotira</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleExportChat}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs text-zinc-600 hover:text-zinc-900 dark:text-[#8e8e8e] dark:hover:text-[#ececec] hover:bg-zinc-200/80 dark:hover:bg-[#242426] transition-all cursor-pointer btn-tactile"
            title="Suhbatni Markdown fayl sifatida yuklab olish"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eksport</span>
          </button>

          <button
            onClick={createNewChat}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs text-zinc-600 hover:text-zinc-900 dark:text-[#8e8e8e] dark:hover:text-[#ececec] hover:bg-zinc-200/80 dark:hover:bg-[#242426] transition-all cursor-pointer btn-tactile"
            title="Yangi chat yaratish"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Yangi chat</span>
          </button>

          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs text-zinc-600 hover:text-rose-600 dark:text-[#8e8e8e] dark:hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer btn-tactile"
            title="Suhbatni tozalash"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tozalash</span>
          </button>
        </div>
      </div>

      {/* Main Panes View Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-[#262626]">
        {renderMessagePane('A', chatModelA, setChatModelA, messagesA, scrollRefA)}

        {isDualView && (
          renderMessagePane('B', chatModelB, setChatModelB, messagesB, scrollRefB)
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-2 sm:p-4 max-w-3xl w-full mx-auto">
        <div className="flex flex-col gap-2">

          {/* File attachment preview */}
          {attachedFile && (
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-[#1e1e1e] border border-zinc-300 dark:border-[#2f2f2f] rounded-xl text-xs text-zinc-800 dark:text-[#a3a3a3] shadow-xs">
              {attachedFile.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(attachedFile.name) ? (
                <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              ) : attachedFile.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|webm|aac|flac)$/i.test(attachedFile.name) ? (
                <FileAudio className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              )}
              <span className="flex-1 truncate font-mono text-[11px]">{attachedFile.name}</span>

              {/* If audio, provide one-click AI Transcribe button */}
              {(attachedFile.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|webm|aac|flac)$/i.test(attachedFile.name)) && (
                <button
                  type="button"
                  disabled={isTranscribing}
                  onClick={() => handleTranscribeAudio()}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Audioni matnga aylantirish (Speech to Text)"
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Matnga o'girilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Matnga o'girish (AI)</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setPreviewFile(attachedFile)}
                className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-[#2a2a2a] hover:bg-purple-600 hover:text-white text-zinc-700 dark:text-zinc-300 text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                title="Faylni ko'rib chiqish"
              >
                <Eye className="w-3 h-3" />
                <span>Ko'rish</span>
              </button>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-[#333333] text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                title="O'chirish"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Main input box */}
          <div className="nexus-chat-input-box gemini-input-glow relative flex flex-col bg-white dark:bg-[#212121] border border-zinc-200 dark:border-[#2f2f2f] rounded-2xl transition-all shadow-sm overflow-visible">
            <textarea
              id="chat-input-textarea"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit();
                }
              }}
              placeholder="Savolingiz yoki xabaringizni yozing..."
              rows={1}
              className="flex-1 bg-transparent px-4 pt-3 pb-1 text-sm text-zinc-900 dark:text-[#f4f4f4] placeholder-zinc-400 dark:placeholder-[#737373] focus:outline-none resize-none max-h-36"
            />

            {/* Bottom row: attach + model selector + send */}
            <div className="flex items-center justify-between px-2 pb-2 pt-1">
              <div className="flex items-center gap-1">
                {/* File attach button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#737373] dark:hover:text-[#ececec] dark:hover:bg-[#2a2a2a] transition-all cursor-pointer btn-tactile"
                  title="Fayl biriktirish (rasm, audio, PDF, video)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*,.mp3,.wav,.m4a,.ogg,.webm,.flac,.aac,.pdf,.txt,.md,.csv"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const processed = await compressImageIfNeeded(file);
                      setAttachedFile(processed);
                    } catch (err) {
                      console.error("File processing error:", err);
                    }
                    e.target.value = '';
                  }}
                />

                {/* Voice Input (Speech-to-Text) button */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2 rounded-xl transition-all cursor-pointer btn-tactile ${isListening
                      ? 'text-red-500 bg-red-500/15 animate-pulse ring-2 ring-red-500/40'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#737373] dark:hover:text-[#ececec] dark:hover:bg-[#2a2a2a]'
                    }`}
                  title={isListening ? "Ovozli eshitishni to'xtatish" : "Ovoz orqali kiritish (Mikrofon / Transkripsiya)"}
                >
                  {isListening ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Bottom model selector (Elevated Card Modal with latency, cost, and badges) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl text-xs text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#a3a3a3] dark:hover:text-[#ececec] dark:hover:bg-[#2a2a2a] border border-zinc-200/80 dark:border-white/10 transition-all cursor-pointer btn-tactile shadow-2xs"
                  >
                    <ModelIcon modelId={chatModelA} className="w-3.5 h-3.5 shrink-0" />
                    <span className="max-w-[90px] sm:max-w-[130px] truncate font-semibold text-[11px] text-zinc-900 dark:text-white">
                      {CHAT_MODELS.find(m => m.id === chatModelA)?.name || chatModelA}
                    </span>
                    <span className="hidden sm:inline text-[9px] font-mono text-zinc-400">
                      ⚡ {CHAT_MODELS.find(m => m.id === chatModelA)?.avgLatency || '1.2s'}
                    </span>
                    {showModelDropdown ? <ChevronUp className="w-3 h-3 text-zinc-400 shrink-0" /> : <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />}
                  </button>

                  {showModelDropdown && (
                    <>
                      {/* Transparent backdrop to click outside and close */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowModelDropdown(false)}
                      />
                      <div
                        onClick={(e) => e.stopPropagation()}
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        className="fixed sm:absolute bottom-20 sm:bottom-full mb-2 left-2 right-2 sm:left-0 sm:right-auto z-50 w-auto sm:w-88 bg-white dark:bg-[#1c1c1f] border border-zinc-200 dark:border-[#333336] rounded-2xl shadow-2xl max-h-[60vh] sm:max-h-[380px] overflow-hidden flex flex-col pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
                      >
                        <div className="p-3 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-[#18181b]">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white">
                            Sun'iy Intellekt Modellar
                          </span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Tezkor almashish
                          </span>
                        </div>

                        <div className="p-1.5 space-y-1 overflow-y-auto overscroll-contain max-h-[320px]">
                          {CHAT_MODELS.map((m) => {
                            const isSelected = chatModelA === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setChatModelA(m.id);
                                  setShowModelDropdown(false);
                                }}
                                className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer btn-tactile ${
                                  isSelected
                                    ? 'bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/30 text-zinc-950 dark:text-white shadow-2xs'
                                    : 'hover:bg-zinc-100 dark:hover:bg-[#252528] border border-transparent text-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                <div className="w-7 h-7 rounded-lg bg-zinc-200/70 dark:bg-[#2a2a2e] flex items-center justify-center shrink-0 mt-0.5 border border-zinc-300/40 dark:border-white/10">
                                  <ModelIcon modelId={m.id} className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                      {m.name}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                                        ⚡ {m.avgLatency}
                                      </span>
                                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-zinc-200/80 dark:bg-[#333336] text-zinc-700 dark:text-zinc-300">
                                        {m.costCredits} kr
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                    {m.description}
                                  </p>

                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-500/10 px-1.5 py-0.2 rounded">
                                      {m.badge}
                                    </span>
                                    <span className="text-[9px] text-zinc-400">
                                      {m.contextOrResolution}
                                    </span>
                                  </div>
                                </div>

                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 self-center" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Send / Stop button */}
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="w-8.5 h-8.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md hover:scale-105 active:scale-95"
                  title="Generatsiyani to'xtatish"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  id="chat-send-btn"
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!inputPrompt.trim() && !attachedFile}
                  className="nexus-chat-send-btn w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white disabled:from-zinc-200 disabled:to-zinc-200 dark:disabled:from-[#333333] dark:disabled:to-[#333333] disabled:text-zinc-400 dark:disabled:text-[#737373] flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs chat-send-glow active:scale-90"
                  title="Yuborish"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom hint row */}
          <div className="flex items-center justify-between text-[11px] text-[#737373] px-1">
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
              <span>Namunalar:</span>
              <button
                type="button"
                onClick={() => setInputPrompt("Yangi loyiha yoki startapni ishga tushirish uchun bosqichma-bosqich reja tuzib ber.")}
                className="px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200/80 dark:bg-[#202022] dark:hover:bg-[#28282b] border border-zinc-200/80 dark:border-white/10 text-xs text-zinc-700 dark:text-zinc-300 btn-tactile transition-all cursor-pointer"
              >
                Loyiha rejasi
              </button>
              <button
                type="button"
                onClick={() => setInputPrompt("TypeScriptda foydalanuvchi ma'lumotlarini tekshiruvchi va xatoliklarni qayta ishlovchi toza funksiya yozib ber.")}
                className="px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200/80 dark:bg-[#202022] dark:hover:bg-[#28282b] border border-zinc-200/80 dark:border-white/10 text-xs text-zinc-700 dark:text-zinc-300 btn-tactile transition-all cursor-pointer"
              >
                Dasturlash kodi
              </button>
            </div>
            <span className="shrink-0">{isDualView ? '2 kredit' : '1 kredit'}</span>
          </div>

        </div>
      </div>

      {/* File Preview & Inspection Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};
