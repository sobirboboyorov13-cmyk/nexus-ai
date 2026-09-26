import React from 'react';

export interface ModelBrandInfo {
  id: string;
  name: string;
  company: string;
  badgeLabel: string;
  accentColor: string;
  gradient: string;
  borderColor: string;
  bgGlow: string;
  textColor: string;
}

export const getModelBrandMeta = (modelId: string): ModelBrandInfo => {
  const m = modelId.toLowerCase();

  if (m.includes('gemini')) {
    return {
      id: modelId,
      name: 'Gemini 2.5 Flash',
      company: 'Google DeepMind',
      badgeLabel: '1M+ Kontekst & Aurora',
      accentColor: '#9B72CF',
      gradient: 'from-blue-500 via-purple-500 to-pink-500',
      borderColor: 'border-purple-500/30 dark:border-purple-500/40',
      bgGlow: 'bg-purple-500/10 text-purple-600 dark:text-purple-300',
      textColor: 'text-purple-600 dark:text-purple-300',
    };
  }

  if (m.includes('claude')) {
    return {
      id: modelId,
      name: 'Claude Sonnet 4.6',
      company: 'Anthropic',
      badgeLabel: 'Frontier Kod & Tahlil',
      accentColor: '#D97706',
      gradient: 'from-amber-500 to-orange-600',
      borderColor: 'border-amber-500/30 dark:border-amber-500/40',
      bgGlow: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
      textColor: 'text-amber-600 dark:text-amber-300',
    };
  }

  if (m.includes('terra')) {
    return {
      id: modelId,
      name: 'GPT-5.6 Terra',
      company: 'OpenAI / Terra',
      badgeLabel: 'High-Throughput Intelligence',
      accentColor: '#10B981',
      gradient: 'from-emerald-400 to-teal-600',
      borderColor: 'border-emerald-500/40 dark:border-emerald-500/50',
      bgGlow: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
      textColor: 'text-emerald-600 dark:text-emerald-300',
    };
  }

  if (m.includes('glm')) {
    return {
      id: modelId,
      name: 'GLM 5.3 Flash',
      company: 'Zhipu AI / GLM',
      badgeLabel: 'Bilingual & Realtime Chat',
      accentColor: '#F43F5E',
      gradient: 'from-rose-500 to-orange-500',
      borderColor: 'border-rose-500/30 dark:border-rose-500/40',
      bgGlow: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
      textColor: 'text-rose-600 dark:text-rose-300',
    };
  }

  if (m.includes('gpt-image')) {
    return {
      id: modelId,
      name: 'GPT Image 2',
      company: 'OpenAI',
      badgeLabel: 'Next-Gen Neural Synthesis',
      accentColor: '#8B5CF6',
      gradient: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500/30 dark:border-purple-500/40',
      bgGlow: 'bg-purple-500/10 text-purple-600 dark:text-purple-300',
      textColor: 'text-purple-600 dark:text-purple-300',
    };
  }

  if (m.includes('gpt-5.6') || m.includes('sol')) {
    return {
      id: modelId,
      name: 'GPT-5.6 Sol',
      company: 'OpenAI / Sol',
      badgeLabel: 'Ultra Frontier Reasoning',
      accentColor: '#F59E0B',
      gradient: 'from-amber-400 via-yellow-500 to-emerald-500',
      borderColor: 'border-amber-500/40 dark:border-amber-500/50',
      bgGlow: 'bg-amber-500/15 text-amber-500 dark:text-amber-300',
      textColor: 'text-amber-500 dark:text-amber-300',
    };
  }

  if (m.includes('gpt-6') || m.includes('astra')) {
    return {
      id: modelId,
      name: 'GPT-6 Astra',
      company: 'OpenAI / Astra',
      badgeLabel: 'Next-Gen Autonomous Agent',
      accentColor: '#06B6D4',
      gradient: 'from-cyan-400 via-teal-500 to-indigo-600',
      borderColor: 'border-cyan-500/40 dark:border-cyan-500/50',
      bgGlow: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300',
      textColor: 'text-cyan-600 dark:text-cyan-300',
    };
  }

  if (m.includes('gpt') || m.includes('openai')) {
    return {
      id: modelId,
      name: m.includes('openai') ? 'GPT-4o (Direct)' : 'GPT-4o (Omni)',
      company: 'OpenAI',
      badgeLabel: 'Multimodal Flagship',
      accentColor: '#10A37F',
      gradient: 'from-emerald-500 to-teal-600',
      borderColor: 'border-emerald-500/30 dark:border-emerald-500/40',
      bgGlow: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
      textColor: 'text-emerald-600 dark:text-emerald-300',
    };
  }

  if (m.includes('deepseek')) {
    return {
      id: modelId,
      name: 'DeepSeek R1',
      company: 'DeepSeek AI',
      badgeLabel: 'Mantiqiy Zanjir (Reasoning)',
      accentColor: '#0EA5E9',
      gradient: 'from-cyan-500 to-blue-600',
      borderColor: 'border-cyan-500/30 dark:border-cyan-500/40',
      bgGlow: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300',
      textColor: 'text-cyan-600 dark:text-cyan-300',
    };
  }

  return {
    id: modelId,
    name: modelId,
    company: 'Nexus AI',
    badgeLabel: 'Multi-Model',
    accentColor: '#6366F1',
    gradient: 'from-indigo-500 to-purple-600',
    borderColor: 'border-indigo-500/30',
    bgGlow: 'bg-indigo-500/10 text-indigo-400',
    textColor: 'text-indigo-400',
  };
};

export const ModelIcon: React.FC<{ modelId: string; className?: string }> = ({
  modelId,
  className = 'w-4 h-4',
}) => {
  const m = modelId.toLowerCase();

  // Google Gemini Logo
  if (m.includes('gemini')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z"
          fill="url(#gemini-icon-grad)"
        />
        <defs>
          <linearGradient id="gemini-icon-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4285F4" />
            <stop offset="0.35" stopColor="#9B72CF" />
            <stop offset="0.7" stopColor="#D96570" />
            <stop offset="1" stopColor="#13B5EA" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // Anthropic Claude Asterisk Logo
  if (m.includes('claude')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M13.8 2.5a1.8 1.8 0 0 0-3.6 0l.4 5.3-4.3-3.1a1.8 1.8 0 0 0-2.1 2.9l4.3 3.1-5.3-.4a1.8 1.8 0 0 0 0 3.6l5.3.4-4.3 3.1a1.8 1.8 0 0 0 2.1 2.9l4.3-3.1-.4 5.3a1.8 1.8 0 0 0 3.6 0l-.4-5.3 4.3 3.1a1.8 1.8 0 0 0 2.1-2.9l-4.3-3.1 5.3.4a1.8 1.8 0 0 0 0-3.6l-5.3-.4 4.3-3.1a1.8 1.8 0 0 0-2.1-2.9l-4.3 3.1.4-5.3Z"
          fill="#D97706"
        />
      </svg>
    );
  }

  // GPT-5.6 Sol Sun / Frontier Emblem Logo
  if (m.includes('gpt-5.6') || m.includes('sol')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="5" fill="url(#sol-sun-grad)" />
        <path d="M12 2V5M12 19V22M2 12H5M19 12H22M4.93 4.93L7.05 7.05M16.95 16.95L19.07 19.07M4.93 19.07L7.05 16.95M16.95 7.05L19.07 4.93" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="sol-sun-grad" x1="7" y1="7" x2="17" y2="17" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FBBF24" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // GPT-6 Astra Star/Nexus Emblem Logo
  if (m.includes('gpt-6') || m.includes('astra')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
          fill="url(#astra-grad)"
        />
        <circle cx="12" cy="12" r="3" fill="#ffffff" fillOpacity="0.8" />
        <defs>
          <linearGradient id="astra-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#06B6D4" />
            <stop offset="0.5" stopColor="#3B82F6" />
            <stop offset="1" stopColor="#6366F1" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // OpenAI GPT-4o Rosette Logo
  if (m.includes('gpt') || m.includes('openai')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M19.78 10.42a6.3 6.3 0 0 0-.47-4.47 6.43 6.43 0 0 0-5.3-3.23 6.43 6.43 0 0 0-4.66 1.48 6.33 6.33 0 0 0-3.68 1.7 6.3 6.3 0 0 0-1.63 3.8 6.43 6.43 0 0 0-2.02 4.47 6.43 6.43 0 0 0 1.25 4.8 6.33 6.33 0 0 0 .47 4.47 6.43 6.43 0 0 0 5.3 3.23 6.43 6.43 0 0 0 4.66-1.48 6.33 6.33 0 0 0 3.68-1.7 6.3 6.3 0 0 0 1.63-3.8 6.43 6.43 0 0 0 2.02-4.47 6.43 6.43 0 0 0-1.25-4.8Zm-7.78 11.23c-1.2 0-2.33-.36-3.27-1l2.87-1.66a.82.82 0 0 0 .42-.71v-4.04l2.45 1.41v3.42a4.8 4.8 0 0 1-2.47 2.58Zm-7.3-4.22a4.78 4.78 0 0 1-.36-3.56l2.87 1.65a.82.82 0 0 0 .82 0l3.5-2.02v2.83l-2.96 1.71a4.8 4.8 0 0 1-3.87-.61Zm-1.57-7.75a4.78 4.78 0 0 1 2.11-2.9l-.02 3.32a.82.82 0 0 0 .41.71l3.5 2.02-2.45 1.41-2.96-1.71a4.8 4.8 0 0 1-.59-2.85Zm10.87-.72-3.5-2.02 2.45-1.42 2.96 1.71a4.8 4.8 0 0 1 .59 2.85 4.78 4.78 0 0 1-2.11 2.9l.02-3.32a.82.82 0 0 0-.41-.7ZM16.3 12l-3.5 2.02-2.45-1.41 3.5-2.02 2.45 1.41Zm2.52-2.4a.82.82 0 0 0-.82 0l-3.5 2.02V8.79l2.96-1.71a4.8 4.8 0 0 1 3.87.61 4.78 4.78 0 0 1 .36 3.56l-2.87-1.65ZM11.18 8.76l-2.45-1.41V3.93a4.8 4.8 0 0 1 2.47-2.58 4.8 4.8 0 0 1 3.27 1l-2.87 1.66a.82.82 0 0 0-.42.71v4.04Z"
          fill="#10A37F"
        />
      </svg>
    );
  }

  // DeepSeek R1 Logo
  if (m.includes('deepseek')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
          d="M12 3C7.03 3 3 7.03 3 12c0 2.12.74 4.07 1.97 5.61L4.1 20.4a.8.8 0 0 0 1.05 1.05l2.79-.87A8.95 8.95 0 0 0 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9Zm3.5 11.5a3.5 3.5 0 0 1-7 0 1 1 0 1 1 2 0 1.5 1.5 0 0 0 3 0 1 1 0 1 1 2 0Zm-5.25-4a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm3.5 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z"
          fill="#0EA5E9"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
};

export const ModelBadge: React.FC<{
  modelId: string;
  showDetails?: boolean;
  size?: 'sm' | 'md';
}> = ({ modelId, showDetails = true, size = 'sm' }) => {
  const meta = getModelBrandMeta(modelId);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-medium transition-all ${
        meta.borderColor
      } ${meta.bgGlow} ${size === 'sm' ? 'text-[11px]' : 'text-xs'}`}
    >
      <ModelIcon modelId={modelId} className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span className="font-semibold">{meta.name}</span>
      {showDetails && (
        <span className="opacity-70 text-[10px] hidden sm:inline border-l border-current/20 pl-1.5 ml-0.5">
          {meta.company}
        </span>
      )}
    </div>
  );
};
