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
  Eye
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
    addCredits,
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Brauzeringiz ovoz orqali kiritishni (Speech Recognition) to'liq qo'llab-quvvatlamaydi. Chrome yoki Edge brauzeridan foydalanish tavsiya etiladi.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'uz-UZ';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        if (transcript) {
          setInputPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Voice recognition start error:", err);
      setIsListening(false);
    }
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
    attachment?: { name: string; type: string; base64: string } | null
  ) => {
    const startTime = Date.now();
    let accumulatedText = '';
    try {
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
        signal: abortControllerRef.current?.signal,
        body: JSON.stringify({
          modelId,
          prompt,
          history,
          dualComparison: isDualView,
          attachment: attachment || undefined
        }),
      });

      if (!res.ok) {
        // Fallback to regular chat endpoint
        const fallbackRes = await fetch('/api/generate/chat', {
          method: 'POST',
          headers: customHeaders,
          signal: abortControllerRef.current?.signal,
          body: JSON.stringify({
            modelId,
            prompt,
            history,
            dualComparison: isDualView,
            attachment: attachment || undefined
          }),
        });

        if (!fallbackRes.ok) {
          const errData = await fallbackRes.json().catch(() => ({}));
          throw new Error(errData.error || fallbackRes.statusText);
        }

        const data = await fallbackRes.json();
        updateChatMessage(pane, assistantMsgId, data.content, Date.now() - startTime);
        refreshUserAndCredits();
        return;
      }

      // Read SSE stream with line buffering
      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Stream reader mavjud emas");
      }

      const decoder = new TextDecoder();
      let lastUpdateTime = 0;
      let buffer = '';
      let isDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

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
          lastUpdateTime = now;
          updateChatMessage(pane, assistantMsgId, accumulatedText);
        }

        if (isDone) break;
      }

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

      const latency = Date.now() - startTime;
      const finalText = accumulatedText.trim() || "Modeldan javob kutilmaganda to'xtadi. Iltimos qaytadan urinib ko'ring.";
      updateChatMessage(pane, assistantMsgId, finalText, latency);
      refreshUserAndCredits();
    } catch (err: any) {
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
    }
  };

  const handleSubmit = async (e?: React.FormEvent | React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = inputPrompt.trim();
    if ((!trimmed && !attachedFile) || isGenerating) return;

    try {
      const cost = isDualView ? 2 : 1;
      let ok = deductCredits(cost, `Chat: ${chatModelA}${isDualView ? ` vs ${chatModelB}` : ''}`);
      if (!ok) {
        // Auto-replenish bonus credits so user is never blocked or alerted
        await addCredits(200, "Bonus kreditlar");
        ok = deductCredits(cost, `Chat: ${chatModelA}${isDualView ? ` vs ${chatModelB}` : ''}`);
      }

      setIsGenerating(true);
      abortControllerRef.current = new AbortController();
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

      const promises = [executeChatRequest(chatModelA, promptForModel, 'A', assistantIdA, currentAttachment)];

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
        promises.push(executeChatRequest(chatModelB, promptForModel, 'B', assistantIdB, currentAttachment));
      }

      await Promise.all(promises);
    } catch (err: any) {
      console.error("Chat generation error:", err);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
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

    const modelId = pane === 'A' ? chatModelA : chatModelB;
    const assistantId = messages[msgIdx].id;

    updateChatMessage(pane, assistantId, 'Qayta generatsiya qilinmoqda...');
    setIsGenerating(true);
    await executeChatRequest(modelId, lastUserPrompt, pane, assistantId);
    setIsGenerating(false);
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
                  Salom, {currentUser.name ? currentUser.name.split(' ')[0] : 'Yaratuvchi'}!
                </h1>

                <p className="text-xs sm:text-sm text-zinc-600 dark:text-white/70 max-w-lg leading-relaxed mb-6">
                  GPT-5.6 Sol va boshqa modellar yagona platformada birlashdi. Barcha so'rovlar to'g'ridan-to'g'ri haqiqiy sun'iy intellekt modellariga uzatiladi.
                </p>

                {/* 4 Interactive Gemini Hook Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                  <button
                    type="button"
                    onClick={() => setInputPrompt("TypeScript va Express'da arxitekturani tahlil qil va refactoring rejasini tuzib ber.")}
                    className="gemini-card-hook p-3.5 rounded-2xl cursor-pointer group text-left shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/15 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                        Kod Tahlili & Arxitektura
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-white/50 group-hover:text-zinc-700 dark:group-hover:text-white/70 transition-colors leading-snug">
                      Toza kod, xavfsizlik va optimizatsiya yechimlari
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputPrompt("Bizning faol loyihamiz va chuqur xotiradagi barcha ma'lumotlarni tahlil qil va keyingi qadamlar bo'yicha tavsiyalar ber.")}
                    className="gemini-card-hook p-3.5 rounded-2xl cursor-pointer group text-left shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                        <Brain className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                        Loyiha Xotirasini Tekshirish
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-white/50 group-hover:text-zinc-700 dark:group-hover:text-white/70 transition-colors leading-snug">
                      Barcha modellar biladigan bilimlar va rejalar
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputPrompt("Futuristik kiberpank shahar uzra uchayotgan neon nurli skayrayder, 8k oktan render, kinematik yorug'lik.")}
                    className="gemini-card-hook p-3.5 rounded-2xl cursor-pointer group text-left shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-pink-500/15 dark:bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors">
                        Kreativ Neyro-Prompt
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-white/50 group-hover:text-zinc-700 dark:group-hover:text-white/70 transition-colors leading-snug">
                      FLUX va Imagen 3 uchun fotorealistik tasvir prompti
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputPrompt("Yangi AI startapini 30 kun ichida foydalanuvchilarga taqdim etish uchun bosqichma-bosqich MVP rejasi va marketing strategiyasini ishlab chiq.")}
                    className="gemini-card-hook p-3.5 rounded-2xl cursor-pointer group text-left shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                        Startap & MVP Strategiyasi
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-white/50 group-hover:text-zinc-700 dark:group-hover:text-white/70 transition-colors leading-snug">
                      30 kunlik tezkor ishga tushirish yo'riqnomasi
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
      <div className="h-10 px-4 border-b border-zinc-200 dark:border-[#262626] flex items-center justify-between text-xs text-zinc-600 dark:text-[#8e8e8e] bg-zinc-50 dark:bg-[#171717] shrink-0">
        <div className="flex items-center gap-2">
          {/* Active Model Custom Brand Badge */}
          <ModelBadge modelId={chatModelA} size="sm" showDetails={true} />

          <button
            onClick={() => setDualView(!isDualView)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${isDualView
                ? 'bg-zinc-200 dark:bg-[#2a2a2a] text-zinc-900 dark:text-[#ececec]'
                : 'text-zinc-600 dark:text-[#8e8e8e] hover:text-zinc-900 dark:hover:text-[#ececec] hover:bg-zinc-200 dark:hover:bg-[#212121]'
              }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>{isDualView ? 'Yagona oyna' : 'Ikkita modelni solishtirish'}</span>
          </button>

          {/* Deep Memory & Cross-Model Context Badge */}
          <button
            type="button"
            onClick={() => setMemoryDrawerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/15 via-blue-500/15 to-pink-500/15 border border-purple-500/30 hover:border-purple-500/60 text-purple-700 dark:text-purple-200 transition-all shadow-sm hover:shadow-purple-500/20 cursor-pointer"
            title="Barcha modellararo bo'lishilgan chuqur xotira va bilimlarni ko'rish"
          >
            <Brain className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            <span>Chuqur Xotira</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportChat}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-zinc-600 hover:text-zinc-900 dark:text-[#8e8e8e] dark:hover:text-[#ececec] hover:bg-zinc-200 dark:hover:bg-[#212121] transition-colors cursor-pointer"
            title="Suhbatni Markdown fayl sifatida yuklab olish"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Eksport</span>
          </button>

          <button
            onClick={createNewChat}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-zinc-600 hover:text-zinc-900 dark:text-[#8e8e8e] dark:hover:text-[#ececec] hover:bg-zinc-200 dark:hover:bg-[#212121] transition-colors cursor-pointer"
            title="Yangi chat yaratish"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yangi chat</span>
          </button>

          <button
            onClick={clearChat}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-zinc-600 hover:text-zinc-900 dark:text-[#8e8e8e] dark:hover:text-[#ececec] hover:bg-zinc-200 dark:hover:bg-[#212121] transition-colors cursor-pointer"
            title="Suhbatni tozalash"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Tozalash</span>
          </button>
        </div>
      </div>

      {/* Main Panes View Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 divide-x divide-zinc-200 dark:divide-[#262626]">
        {renderMessagePane('A', chatModelA, setChatModelA, messagesA, scrollRefA)}

        {isDualView && (
          renderMessagePane('B', chatModelB, setChatModelB, messagesB, scrollRefB)
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-4 max-w-3xl w-full mx-auto">
        <div className="flex flex-col gap-2">

          {/* File attachment preview */}
          {attachedFile && (
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-[#1e1e1e] border border-zinc-300 dark:border-[#2f2f2f] rounded-xl text-xs text-zinc-800 dark:text-[#a3a3a3] shadow-xs">
              {attachedFile.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(attachedFile.name) ? (
                <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              )}
              <span className="flex-1 truncate font-mono text-[11px]">{attachedFile.name}</span>
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
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#737373] dark:hover:text-[#ececec] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                  title="Fayl biriktirish (rasm, PDF, video)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf,.txt,.md,.csv"
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
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isListening
                      ? 'text-red-500 bg-red-500/15 animate-pulse'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#737373] dark:hover:text-[#ececec] dark:hover:bg-[#2a2a2a]'
                    }`}
                  title={isListening ? "Ovozli eshitishni to'xtatish" : "Ovoz orqali kiritish (Mikrofon)"}
                >
                  {isListening ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Bottom model selector (Claude-style with scrolling and click-outside) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#a3a3a3] dark:hover:text-[#ececec] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                  >
                    <ModelIcon modelId={chatModelA} className="w-3.5 h-3.5" />
                    <span className="max-w-[120px] truncate font-medium">
                      {CHAT_MODELS.find(m => m.id === chatModelA)?.name || chatModelA}
                    </span>
                    {showModelDropdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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
                        className="absolute bottom-full mb-2 left-0 z-50 w-72 bg-white dark:bg-[#1e1e1e] border border-zinc-200 dark:border-[#333333] rounded-2xl shadow-2xl max-h-72 overflow-y-auto overscroll-contain p-1 divide-y divide-zinc-100 dark:divide-[#2a2a2a]/60 pointer-events-auto"
                      >
                        <div className="p-1.5 text-[10px] text-zinc-400 dark:text-[#737373] px-3 pt-2 pb-1 font-medium uppercase tracking-wider">
                          Model tanlash
                        </div>
                        <div className="space-y-0.5">
                          {CHAT_MODELS.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => { setChatModelA(m.id); setShowModelDropdown(false); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-xl transition-colors hover:bg-zinc-100 dark:hover:bg-[#2a2a2a] cursor-pointer ${chatModelA === m.id ? 'bg-zinc-100 dark:bg-[#242424] text-zinc-900 dark:text-white font-semibold' : 'text-zinc-700 dark:text-[#a3a3a3]'
                                }`}
                            >
                              <ModelIcon modelId={m.id} className="w-4 h-4 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="truncate">{m.name}</div>
                                <div className="text-[10px] text-zinc-400 dark:text-[#737373] truncate">{m.badge}</div>
                              </div>
                              {chatModelA === m.id && (
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              )}
                            </button>
                          ))}
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
                  className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
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
                  className="nexus-chat-send-btn w-8 h-8 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black disabled:bg-zinc-200 dark:disabled:bg-[#333333] disabled:text-zinc-400 dark:disabled:text-[#737373] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
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
                className="hover:text-[#a3a3a3] transition-colors"
              >
                Loyiha rejasi
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setInputPrompt("TypeScriptda foydalanuvchi ma'lumotlarini tekshiruvchi va xatoliklarni qayta ishlovchi toza funksiya yozib ber.")}
                className="hover:text-[#a3a3a3] transition-colors"
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
