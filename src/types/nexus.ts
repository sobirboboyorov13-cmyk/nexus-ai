export type NavTab = 'chat' | 'image' | 'video' | 'pipeline' | 'billing';

export type ModelCategory = 'text' | 'image' | 'video';

export interface AIModel {
  id: string;
  name: string;
  provider: 'OpenRouter' | 'Replicate' | 'fal.ai' | 'Google' | 'Anthropic' | 'OpenAI' | 'Kling' | 'Luma' | 'OpenAI / Sol' | 'OpenAI / Astra' | 'Google DeepMind' | 'DeepSeek AI' | 'Google AI Ultra' | string;
  category: ModelCategory;
  badge?: string;
  costCredits: number;
  avgLatency: string;
  description: string;
  contextOrResolution?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  modelId: string;
  content: string;
  timestamp: number;
  tokensUsed?: number;
  latencyMs?: number;
  isStreaming?: boolean;
  attachment?: {
    name: string;
    type: string;
    base64: string;
  };
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:5';

export interface ImageStudioParams {
  modelId: string;
  prompt: string;
  negativePrompt: string;
  aspectRatio: AspectRatio;
  steps: number;
  guidanceScale: number;
  seed: number;
  isMagicPromptActive?: boolean;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  negativePrompt?: string;
  url: string;
  modelId: string;
  aspectRatio: AspectRatio;
  steps: number;
  guidanceScale: number;
  seed: number;
  createdAt: number;
  upscaled?: boolean;
  upscaleFactor?: '2x' | '4x';
}

export type VideoMode = 'text-to-video' | 'image-to-video';
export type CameraMotion = 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 'zoom_in' | 'zoom_out' | 'static' | 'dynamic_cinematic';

export interface VideoLabParams {
  mode: VideoMode;
  modelId: string;
  prompt: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  duration: '5s' | '10s';
  cameraMotion: CameraMotion;
  seed: number;
}

export interface VideoJob {
  id: string;
  mode: VideoMode;
  modelId: string;
  prompt: string;
  firstFrameUrl?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0 to 100
  statusMessage: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: '5s' | '10s';
  cameraMotion: CameraMotion;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

export interface PipelineScene {
  id: string;
  sceneNumber: number;
  title: string;
  narrative: string;
  visualPrompt: string;
  cameraMovement: CameraMotion;
  keyframeUrl?: string;
  videoUrl?: string;
  status: 'pending' | 'scripting' | 'generating_keyframe' | 'animating_video' | 'completed';
  progress: number;
}

export interface PipelineWorkflow {
  id: string;
  concept: string;
  status: 'idle' | 'generating_script' | 'rendering_keyframes' | 'rendering_videos' | 'completed';
  scenes: PipelineScene[];
  createdAt: number;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  type: 'deduction' | 'addition';
  timestamp: number;
}

export interface Workspace {
  id: string;
  name: string;
  role: string;
  plan: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  credits: number;
  createdAt: number;
  isGoogleAuth?: boolean;
}

export interface ModelInteractionEntry {
  modelId: string;
  summary: string;
  timestamp: number;
}

export interface DeepMemoryContext {
  userId: string;
  projectName: string;
  userPersona: string;
  activeGoals: string[];
  sharedKnowledge: string[];
  modelInteractions: ModelInteractionEntry[];
  updatedAt: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  modelA: string;
  modelB: string;
  isDualView: boolean;
  messagesA: ChatMessage[];
  messagesB: ChatMessage[];
}

export type AppTheme = 'dark' | 'light';

