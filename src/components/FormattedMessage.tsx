import React, { useState, useMemo } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import katex from 'katex';

interface FormattedMessageProps {
  content: string;
  msgId: string;
}

function renderKatexSafe(math: string, displayMode: boolean, key: string | number) {
  try {
    const html = katex.renderToString(math.trim(), {
      displayMode,
      throwOnError: false,
    });
    return (
      <span
        key={key}
        className={displayMode ? "block my-2.5 overflow-x-auto text-center py-1 bg-black/5 dark:bg-white/5 rounded-lg" : "inline-block px-1 align-baseline"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <code key={key} className="text-xs font-mono">{math}</code>;
  }
}

// Helper to format inline markdown (bold, italic, inline code, links, comments, LaTeX)
function formatInlineMarkdown(rawText: string): React.ReactNode {
  if (!rawText) return null;

  // 1. Sanitize unclosed markdown tokens (e.g. while streaming)
  let text = rawText;
  const doubleAsteriskMatches = text.match(/\*\*/g);
  if (doubleAsteriskMatches && doubleAsteriskMatches.length % 2 !== 0) {
    text += '**';
  }
  const backtickMatches = text.match(/`/g);
  if (backtickMatches && backtickMatches.length % 2 !== 0) {
    text += '`';
  }

  // 2. Tokenize by:
  // - Display Math: $$...$$
  // - Inline Math: $...$
  // - Inline code: `...`
  // - Links: [label](url)
  // - Bold italic: ***...***
  // - Bold: **...** or __...__
  // - Italic: *...* or _..._
  // - Slashes / annotations: // ...
  const tokenRegex = /(\$\$[^\$]+\$\$|\$[^\$\n\t ]+[^\$\n]*\$|`[^`]+`|\[[^\]]+\]\([^\)]+\)|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+\*(?!\*)|(?<!_)_[^_]+_(?!_)|(?:\/\/\s*[^\n]+))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, pIdx) => {
    if (!part) return null;

    // Display LaTeX Math: $$math$$
    if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
      return renderKatexSafe(part.slice(2, -2), true, pIdx);
    }

    // Inline LaTeX Math: $math$
    if (part.startsWith('$') && part.endsWith('$') && part.length >= 3) {
      return renderKatexSafe(part.slice(1, -1), false, pIdx);
    }

    // Inline Code
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={pIdx}
          className="nexus-inline-code px-1.5 py-0.5 rounded text-[12px] font-mono border"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Markdown Link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={pIdx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Bold Italic: ***text***
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return (
        <strong key={pIdx} className="font-bold italic text-zinc-900 dark:text-white">
          {part.slice(3, -3)}
        </strong>
      );
    }

    // Bold: **text** or __text__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return (
        <strong key={pIdx} className="font-semibold text-zinc-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic: *text* or _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <em key={pIdx} className="italic text-zinc-700 dark:text-[#d4d4d4]">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Inline comment / annotation: // comment
    if (part.trim().startsWith('//')) {
      return (
        <span
          key={pIdx}
          className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-800/40 px-1.5 py-0.5 rounded italic mx-1"
        >
          {part}
        </span>
      );
    }

    return part;
  });
}

// Helper to render markdown tables
function renderTable(tableLines: string[], key: string | number) {
  const rows = tableLines.map((l) =>
    l
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim())
  );

  if (rows.length < 2) return null;
  const headers = rows[0];
  const isSeparator = rows[1]?.every((c) => /^:?-+:?$/.test(c));
  const dataRows = isSeparator ? rows.slice(2) : rows.slice(1);

  return (
    <div key={key} className="nexus-table-wrapper my-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-[#333333]">
      <table className="nexus-table min-w-full text-xs text-left">
        <thead className="nexus-table-head bg-zinc-100 dark:bg-[#242424] text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-[#333333]">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="nexus-table-body divide-y divide-zinc-200 dark:divide-[#2a2a2a]">
          {dataRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-[#222222]/50">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3 py-2 text-zinc-800 dark:text-[#d4d4d4]">
                  {formatInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, msgId }) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Separate code blocks from regular markdown text
  const blocks = useMemo(() => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const result: { type: 'code' | 'markdown'; lang?: string; content: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: 'markdown',
          content: content.substring(lastIndex, match.index),
        });
      }
      result.push({
        type: 'code',
        lang: match[1] || 'code',
        content: match[2],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      result.push({
        type: 'markdown',
        content: content.substring(lastIndex),
      });
    }

    if (result.length === 0) {
      result.push({ type: 'markdown', content });
    }

    return result;
  }, [content]);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-zinc-800 dark:text-[#ececec]">
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          const codeId = `${msgId}-code-${bIdx}`;
          const isCopied = copiedCodeId === codeId;

          return (
            <div
              key={bIdx}
              className="nexus-code-block my-3 rounded-lg overflow-hidden border border-zinc-300 dark:border-[#333333] bg-zinc-900 dark:bg-[#111111]"
            >
              <div className="nexus-code-header flex items-center justify-between px-3.5 py-1.5 bg-zinc-800 dark:bg-[#1e1e1e] border-b border-zinc-700 dark:border-[#2e2e2e] text-xs font-mono text-zinc-300 dark:text-[#a3a3a3]">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-zinc-400 dark:text-[#8e8e8e]" />
                  <span>{block.lang || 'code'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(block.content, codeId)}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-[#8e8e8e] hover:text-white transition-colors"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Nusxalandi</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kodni nusxalash</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="nexus-code-pre p-4 overflow-x-auto text-xs font-mono text-zinc-100 dark:text-[#e5e5e5] leading-normal">
                <code>{block.content}</code>
              </pre>
            </div>
          );
        }

        // Markdown block: tables, headers, lists, quotes, paragraphs
        const lines = block.content.split('\n');
        const elements: React.ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];

          // Check if start of markdown table
          if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
              tableLines.push(lines[i]);
              i++;
            }
            elements.push(renderTable(tableLines, `tbl-${bIdx}-${i}`));
            continue;
          }

          // Single-line comments starting with //
          if (line.trim().startsWith('//')) {
            elements.push(
              <div
                key={`cm-${bIdx}-${i}`}
                className="font-mono text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/40 px-3 py-1.5 rounded-lg border-l-2 border-indigo-500/50 my-1.5 flex items-center gap-1.5"
              >
                <span className="text-indigo-500 dark:text-indigo-400 font-bold select-none">//</span>
                <span>{line.trim().replace(/^\/\/\s*/, '')}</span>
              </div>
            );
            i++;
            continue;
          }

          // Horizontal rule
          if (/^([-*_]){3,}$/.test(line.trim())) {
            elements.push(
              <hr key={`hr-${bIdx}-${i}`} className="my-3 border-t border-zinc-200 dark:border-[#333333]" />
            );
            i++;
            continue;
          }

          // Headers — checked deepest-first to avoid prefix collisions
          if (line.startsWith('##### ')) {
            elements.push(
              <p key={`h6-${bIdx}-${i}`} className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-[#8e8e8e] mt-2 mb-0.5">
                {formatInlineMarkdown(line.replace('##### ', ''))}
              </p>
            );
            i++;
            continue;
          }
          if (line.startsWith('#### ')) {
            elements.push(
              <p key={`h5-${bIdx}-${i}`} className="text-sm font-semibold text-zinc-700 dark:text-[#a3a3a3] mt-2 mb-0.5">
                {formatInlineMarkdown(line.replace('#### ', ''))}
              </p>
            );
            i++;
            continue;
          }
          if (line.startsWith('### ')) {
            elements.push(
              <h4 key={`h4-${bIdx}-${i}`} className="text-sm font-semibold text-zinc-900 dark:text-white mt-3 mb-1">
                {formatInlineMarkdown(line.replace('### ', ''))}
              </h4>
            );
            i++;
            continue;
          }
          if (line.startsWith('## ')) {
            elements.push(
              <h3 key={`h3-${bIdx}-${i}`} className="text-base font-semibold text-zinc-900 dark:text-white mt-4 mb-1.5 pb-1 border-b border-zinc-200 dark:border-[#2a2a2a]">
                {formatInlineMarkdown(line.replace('## ', ''))}
              </h3>
            );
            i++;
            continue;
          }
          if (line.startsWith('# ')) {
            elements.push(
              <h2 key={`h2-${bIdx}-${i}`} className="text-lg font-bold text-zinc-900 dark:text-white mt-4 mb-2 pb-1 border-b border-zinc-200 dark:border-[#333333]">
                {formatInlineMarkdown(line.replace('# ', ''))}
              </h2>
            );
            i++;
            continue;
          }

          // Blockquotes
          if (line.startsWith('> ')) {
            elements.push(
              <blockquote
                key={`bq-${bIdx}-${i}`}
                className="pl-3.5 my-2 border-l-2 border-zinc-300 dark:border-[#555555] italic text-zinc-600 dark:text-[#a3a3a3] text-sm"
              >
                {formatInlineMarkdown(line.replace('> ', ''))}
              </blockquote>
            );
            i++;
            continue;
          }

          // Bullet lists
          if (line.startsWith('- ') || line.startsWith('* ')) {
            const content = line.substring(2);
            elements.push(
              <li key={`li-${bIdx}-${i}`} className="ml-4 list-disc text-zinc-800 dark:text-[#d4d4d4] my-0.5">
                {formatInlineMarkdown(content)}
              </li>
            );
            i++;
            continue;
          }

          // Numbered lists (1. 2. 3.)
          const numMatch = line.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            elements.push(
              <div key={`num-${bIdx}-${i}`} className="flex items-start gap-2 ml-1 text-zinc-800 dark:text-[#d4d4d4] my-1">
                <span className="font-mono text-xs font-semibold text-zinc-500 dark:text-[#8e8e8e] shrink-0 mt-0.5">
                  {numMatch[1]}.
                </span>
                <span className="flex-1">{formatInlineMarkdown(numMatch[2])}</span>
              </div>
            );
            i++;
            continue;
          }

          // Empty line
          if (!line.trim()) {
            elements.push(<div key={`sp-${bIdx}-${i}`} className="h-2" />);
            i++;
            continue;
          }

          // Normal paragraph
          elements.push(
            <p key={`p-${bIdx}-${i}`} className="text-zinc-800 dark:text-[#d4d4d4] my-1 leading-relaxed">
              {formatInlineMarkdown(line)}
            </p>
          );
          i++;
        }

        return <div key={bIdx} className="space-y-1">{elements}</div>;
      })}
    </div>
  );
};
