import { AIModel } from '../types/nexus';

export const CHAT_MODELS: AIModel[] = [
  {
    id: 'gpt-6-astra',
    name: 'GPT-6 Astra',
    provider: 'OpenAI / Astra',
    category: 'text',
    badge: 'Next-Gen Autonomous Agent',
    costCredits: 2,
    avgLatency: '210ms',
    description: 'Yangi avlod ko\'p bosqichli tahlil, kodlash va avtonom mantiqiy xulosalar chiqarish modeli.',
    contextOrResolution: '512k context'
  },
  {
    id: 'deepseek-v4.1-flash',
    name: 'DeepSeek V4.1 Flash',
    provider: 'DeepSeek AI',
    category: 'text',
    badge: 'Ultra-Fast Frontier Reasoning',
    costCredits: 1,
    avgLatency: '150ms',
    description: 'DeepSeek V4.1 Flash — o\'ta yuqori tezlikdagi algoritmlar, dasturlash va mantiqiy xulosalar.',
    contextOrResolution: '128k context'
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic / Vibi',
    category: 'text',
    badge: 'Nuance & Refined Prose',
    costCredits: 2,
    avgLatency: '290ms',
    description: 'Murakkab tizimlar tahlili, kod arxitekturasi va silliq adabiy matnlar generatsiyasi.',
    contextOrResolution: '200k context'
  },
  {
    id: 'gpt-5.6-sol',
    name: 'GPT-5.6 Sol',
    provider: 'OpenAI / Sol',
    category: 'text',
    badge: 'Flagship Frontier Reasoning',
    costCredits: 2,
    avgLatency: '240ms',
    description: 'Yuqori aniqlikdagi mantiqiy fikrlash, arxitektura va kod yozish bo\'yicha yetakchi model.',
    contextOrResolution: '256k context'
  },
  {
    id: 'gpt-5.6-terra',
    name: 'GPT-5.6 Terra',
    provider: 'OpenAI / Terra',
    category: 'text',
    badge: 'High-Throughput Intelligence',
    costCredits: 2,
    avgLatency: '190ms',
    description: 'GPT-5.6 Terra — tezkor kod generatsiyasi, murakkab tizimlar va parallel vazifalar yechimi.',
    contextOrResolution: '256k context'
  },
  {
    id: 'glm-5.3-flash',
    name: 'GLM 5.3 Flash',
    provider: 'Zhipu AI / GLM',
    category: 'text',
    badge: 'Bilingual & Realtime Chat',
    costCredits: 1,
    avgLatency: '160ms',
    description: 'GLM 5.3 Flash — tezkor ko\'p tilli muloqot, tarjima va kontekstual mulohaza yuritish.',
    contextOrResolution: '128k context'
  },
  {
    id: 'gemini-2-5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google DeepMind',
    badge: '1M+ Long Context & Aurora',
    category: 'text',
    costCredits: 1,
    avgLatency: '180ms',
    description: 'Google DeepMind ning tezkor, ulkan kontekstli va multimodal tahlil modeli.',
    contextOrResolution: '1M+ context'
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek AI',
    category: 'text',
    badge: 'Reasoning CoT',
    costCredits: 1,
    avgLatency: '450ms',
    description: 'Mantiqiy zanjirli (Chain of Thought) matematik va dasturlash yechimlari.',
    contextOrResolution: '64k context'
  }
];

export const IMAGE_MODELS: AIModel[] = [
  {
    id: 'gpt-image-2',
    name: 'GPT Image 2 (Next-Gen Ultra)',
    provider: 'OpenAI',
    category: 'image',
    badge: 'Next-Gen Neural Synthesis',
    costCredits: 3,
    avgLatency: '1.2s',
    description: 'GPT Image 2 — yangi avlod fotorealistik badiiy kompozitsiya va yuqori aniqlikdagi tasvirlar.',
    contextOrResolution: 'Up to 2048x2048 HD'
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3 (OpenAI / GPT Image)',
    provider: 'OpenAI',
    category: 'image',
    badge: 'GPT Neural Art · Ultra HD',
    costCredits: 3,
    avgLatency: '1.9s',
    description: 'OpenAI GPT neyron yadrosi — yuqori darajadagi kompozitsiya, badiiy aniqlik va batafsil tushunish.',
    contextOrResolution: '1024x1024 / 1792x1024'
  },
  {
    id: 'gpt-4o-image',
    name: 'GPT-4o Vision & Image Synthesis',
    provider: 'OpenAI',
    category: 'image',
    badge: 'GPT-4o Multimodal',
    costCredits: 3,
    avgLatency: '1.7s',
    description: 'GPT-4o multimodal neyrotarmog\'i yordamida chuqur uslubiy va fotorealistik tasvirlar yaratish.',
    contextOrResolution: 'Up to 2048x2048'
  },
  {
    id: 'imagen-3',
    name: 'Google Imagen 3 (Ultra Flow)',
    provider: 'Google AI Ultra',
    category: 'image',
    badge: 'Cheksiz Flow · Ultra HD',
    costCredits: 2,
    avgLatency: '1.8s',
    description: 'Google DeepMind Imagen 3 — fotorealistik tasvirlar, tipografika va ajoyib kompozitsiya.',
    contextOrResolution: 'Up to 2048x2048'
  },
  {
    id: 'flux-schnell',
    name: 'FLUX.1 [schnell]',
    provider: 'fal.ai',
    category: 'image',
    badge: 'Ultra Fast (4-step)',
    costCredits: 3,
    avgLatency: '1.2s',
    description: 'State-of-the-art open-weights 12B diffusion model tuned for sub-second photoreal generation.',
    contextOrResolution: 'Up to 2048x2048'
  },
  {
    id: 'flux-dev',
    name: 'FLUX.1 [dev]',
    provider: 'fal.ai',
    category: 'image',
    badge: 'Supreme Detail & Typography',
    costCredits: 5,
    avgLatency: '4.8s',
    description: 'Distilled guidance with exceptional prompt adherence and legible in-image typography.',
    contextOrResolution: 'Up to 2048x2048'
  },
  {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion XL v1.0',
    provider: 'Replicate',
    category: 'image',
    badge: 'Community Ecosystem',
    costCredits: 2,
    avgLatency: '2.5s',
    description: 'Robust base model with rich style variety, custom LoRA compatibility, and prompt nuances.',
    contextOrResolution: '1024x1024 base'
  },
  {
    id: 'midjourney-v6',
    name: 'Midjourney Photoreal v6',
    provider: 'Replicate',
    category: 'image',
    badge: 'Cinematic Texture',
    costCredits: 6,
    avgLatency: '6.5s',
    description: 'Unmatched cinematic skin shaders, dramatic lighting, and editorial composition.',
    contextOrResolution: 'High Fidelity'
  }
];

export const VIDEO_MODELS: AIModel[] = [
  {
    id: 'google-veo-2',
    name: 'Google Veo 2 (Flow Video)',
    provider: 'Google DeepMind',
    category: 'video',
    badge: 'Ultra HD 4K · Cinematic Flow',
    costCredits: 25,
    avgLatency: '30s',
    description: 'Google DeepMind ning eng ilg\'or kinematografik video yaratish modeli — kamera harakati va yuqori realistik fizika.',
    contextOrResolution: '4K @ 24/60fps'
  },
  {
    id: 'kling-v1.5-pro',
    name: 'Kling v1.5 Pro',
    provider: 'Kling',
    category: 'video',
    badge: 'High-Motion Physics',
    costCredits: 20,
    avgLatency: '45s',
    description: 'Exceptional physical world simulation, accurate fluid dynamics, and complex multi-subject action.',
    contextOrResolution: '1080p @ 30fps'
  },
  {
    id: 'luma-dream-machine',
    name: 'Luma Dream Machine 1.5',
    provider: 'Luma',
    category: 'video',
    badge: 'Smooth Camera Presets',
    costCredits: 18,
    avgLatency: '35s',
    description: 'Fast, cinematic camera moves (pan, zoom, tilt) with consistent character geometry.',
    contextOrResolution: '720p/1080p'
  },
  {
    id: 'minimax-hailuo',
    name: 'Minimax Hailuo Video-01',
    provider: 'Replicate',
    category: 'video',
    badge: 'Photorealistic Faces',
    costCredits: 16,
    avgLatency: '38s',
    description: 'Natural facial emotions and micro-expressions with minimal temporal morphing artifacts.',
    contextOrResolution: '1080p 6s'
  }
];
