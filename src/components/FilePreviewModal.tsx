import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, Image as ImageIcon } from 'lucide-react';

export interface FilePreviewData {
  name: string;
  type: string;
  base64: string;
  size?: number;
}

interface FilePreviewModalProps {
  file: FilePreviewData | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!file) return null;

  const isImage = file.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(file.name || '');

  // Decode text for documents / code
  let textContent = '';
  if (!isImage && file.base64) {
    try {
      const cleanB64 = file.base64.replace(/^data:[^;]+;base64,/, '');
      textContent = decodeURIComponent(escape(atob(cleanB64)));
    } catch (e) {
      try {
        const cleanB64 = file.base64.replace(/^data:[^;]+;base64,/, '');
        textContent = atob(cleanB64);
      } catch (err) {
        textContent = "[Binar fayl yoki kodni o'qib bo'lmadi]";
      }
    }
  }

  const imageUrl = isImage
    ? (file.base64.startsWith('data:') ? file.base64 : `data:${file.type || 'image/jpeg'};base64,${file.base64}`)
    : '';

  const handleDownload = () => {
    try {
      const cleanB64 = file.base64.replace(/^data:[^;]+;base64,/, '');
      const byteCharacters = atob(cleanB64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name || 'nexus-fayl';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-[#1c1c1f] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-zinc-900 dark:text-[#ececec]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-[#2a2a2a] bg-zinc-50 dark:bg-[#141416] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
              {isImage ? (
                <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              ) : (
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold truncate max-w-sm">{file.name}</h3>
              <p className="text-[10px] text-zinc-500 dark:text-[#8e8e8e] uppercase tracking-wider font-mono">
                {file.type || 'Fayl'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {!isImage && textContent && (
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-[#d4d4d4] hover:bg-zinc-200 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                title="Matnni nusxalash"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Nusxalandi' : 'Nusxalash'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer shadow-xs"
              title="Yuklab olish"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Yuklab olish</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-0 bg-zinc-100/50 dark:bg-[#121214]">
          {isImage ? (
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <img
                src={imageUrl}
                alt={file.name}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg border border-zinc-200 dark:border-white/10"
              />
            </div>
          ) : (
            <div className="w-full h-full max-h-[70vh] overflow-auto rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#2a2a2a] p-4 text-xs font-mono leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap selection:bg-purple-500 selection:text-white">
              {textContent || "Fayl matni bo'sh yoki o'qib bo'lmaydi."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
