import React, { useState, useEffect } from 'react';
import { X, Brain, Sparkles, Plus, Trash2, Check, RefreshCw, Cpu, Layers } from 'lucide-react';
import { useNexusStore } from '../lib/store';

export const DeepMemoryDrawer: React.FC = () => {
  const {
    isMemoryDrawerOpen,
    setMemoryDrawerOpen,
    deepMemory,
    fetchDeepMemory,
    updateDeepMemory,
    clearDeepMemory,
    currentUser,
  } = useNexusStore();

  const [newFact, setNewFact] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    if (isMemoryDrawerOpen) {
      fetchDeepMemory();
    }
  }, [isMemoryDrawerOpen, fetchDeepMemory]);

  if (!isMemoryDrawerOpen) return null;

  const handleAddKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    setIsSaving(true);
    await updateDeepMemory({
      sharedKnowledge: [newFact.trim(), ...(deepMemory?.sharedKnowledge || [])]
    });
    setNewFact('');
    setIsSaving(false);
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 2000);
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    setIsSaving(true);
    await updateDeepMemory({
      activeGoals: [...(deepMemory?.activeGoals || []), newGoal.trim()]
    });
    setNewGoal('');
    setIsSaving(false);
  };

  const handleRemoveKnowledge = async (idxToRemove: number) => {
    if (!deepMemory) return;
    const filtered = deepMemory.sharedKnowledge.filter((_, idx) => idx !== idxToRemove);
    await updateDeepMemory({ sharedKnowledge: filtered });
  };

  const handleClear = async () => {
    if (window.confirm("Barcha modellararo saqlangan xotira va bilimlarni tozalashni xohlaysizmi?")) {
      await clearDeepMemory();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Slide-over Panel */}
      <div className="relative w-full max-w-md h-full bg-[#16161a] border-l border-white/10 shadow-2xl flex flex-col text-[#ececec] overflow-hidden">
        {/* Top Aurora Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white tracking-tight">Chuqur Xotira (Deep Context)</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Sinxron faol" />
              </div>
              <p className="text-[11px] text-white/50">Gemini, Claude va GPT-4o uchun yagona kesh</p>
            </div>
          </div>

          <button
            onClick={() => setMemoryDrawerOpen(false)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Active Workspace Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/30 via-indigo-950/20 to-blue-950/30 border border-purple-500/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-purple-400 font-mono">
                Faol Kontekst
              </span>
              <span className="text-[10px] text-white/40 font-mono">
                ID: {currentUser.id}
              </span>
            </div>
            <div className="text-xs font-semibold text-white">
              {deepMemory?.projectName || "NEXUS AI Multi-Model Workspace"}
            </div>
            <div className="text-[11px] text-white/60">
              {deepMemory?.userPersona || "Full-Stack AI Creator"}
            </div>
          </div>

          {/* Section 1: Active Goals */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Loyiha Maqsadlari ({deepMemory?.activeGoals?.length || 0})</span>
              </label>
            </div>

            <div className="space-y-1.5">
              {deepMemory?.activeGoals?.map((goal, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/80 flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span className="flex-1 leading-relaxed">{goal}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddGoal} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Yangi maqsad qo'shish..."
                className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Qo'shish"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Section 2: Shared Knowledge Nodes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Modellararo Bo'lishilgan Bilimlar</span>
              </label>
              {successNotice && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Saqlandi
                </span>
              )}
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {(!deepMemory?.sharedKnowledge || deepMemory.sharedKnowledge.length === 0) ? (
                <div className="p-3 text-center text-xs text-white/40">
                  Hozircha bilimlar xotirasi bo'sh
                </div>
              ) : (
                deepMemory.sharedKnowledge.map((item, idx) => (
                  <div
                    key={idx}
                    className="group p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/80 flex items-start justify-between gap-2 hover:border-white/20 transition-colors"
                  >
                    <span className="leading-relaxed flex-1">{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKnowledge(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-950/40 rounded transition-opacity shrink-0"
                      title="O'chirish"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Knowledge Input */}
            <form onSubmit={handleAddKnowledge} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                placeholder="Modellarga umumiy ko'rsatma yoki qoida yozing..."
                className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
              />
              <button
                type="submit"
                disabled={isSaving}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium text-xs transition-colors shrink-0"
              >
                Qo'shish
              </button>
            </form>
          </div>

          {/* Section 3: Model Interaction Timeline */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modellararo Harakatlar Jurnali (Cross-Talk)</span>
            </label>

            <div className="space-y-2">
              {(!deepMemory?.modelInteractions || deepMemory.modelInteractions.length === 0) ? (
                <div className="p-3 text-center text-xs text-white/40 bg-white/[0.02] rounded-xl border border-white/5">
                  Modellar hali o'zaro harakat amalga oshirmadi
                </div>
              ) : (
                deepMemory.modelInteractions.slice(0, 5).map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                        {entry.modelId}
                      </span>
                      <span className="text-white/40">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-white/70">{entry.summary}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-[#121215]">
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-800/40 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xotirani tozalash</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchDeepMemory();
              setSuccessNotice(true);
              setTimeout(() => setSuccessNotice(false), 1500);
            }}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yangilash</span>
          </button>
        </div>
      </div>
    </div>
  );
};
