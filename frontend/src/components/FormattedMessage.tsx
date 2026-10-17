import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface FormattedMessageProps {
  content: string;
  className?: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, className = '' }) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Helper to parse inline styles (**bold**, `code`, *italic*)
  const parseInline = (text: string): React.ReactNode[] => {
    // Regex splits by code blocks `code`, bold **text**, italic *text*
    const tokens: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(text.substring(lastIndex, match.index));
      }

      const matchStr = match[0];
      if (matchStr.startsWith('`') && matchStr.endsWith('`')) {
        tokens.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 rounded bg-slate-200/80 text-indigo-900 font-mono text-xs font-medium"
          >
            {matchStr.slice(1, -1)}
          </code>
        );
      } else if (matchStr.startsWith('**') && matchStr.endsWith('**')) {
        tokens.push(
          <strong key={match.index} className="font-semibold text-slate-900">
            {matchStr.slice(2, -2)}
          </strong>
        );
      } else if (matchStr.startsWith('*') && matchStr.endsWith('*')) {
        tokens.push(
          <em key={match.index} className="italic text-slate-700">
            {matchStr.slice(1, -1)}
          </em>
        );
      }

      lastIndex = match.index + matchStr.length;
    }

    if (lastIndex < text.length) {
      tokens.push(text.substring(lastIndex));
    }

    return tokens.length > 0 ? tokens : [text];
  };

  // Split into blocks: code blocks vs text blocks
  const blocks: React.ReactNode[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeBlockLang = '';
  let codeBlockIndex = 0;

  let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        blocks.push(
          <ul key={`list-${blocks.length}`} className="my-2 space-y-1 pl-5 list-disc marker:text-slate-400">
            {currentList.items.map((it, i) => (
              <li key={i} className="text-slate-700 text-sm leading-relaxed">
                {it}
              </li>
            ))}
          </ul>
        );
      } else {
        blocks.push(
          <ol key={`list-${blocks.length}`} className="my-2.5 space-y-1.5 pl-5 list-decimal marker:text-indigo-600 marker:font-semibold">
            {currentList.items.map((it, i) => (
              <li key={i} className="text-slate-800 text-sm leading-relaxed">
                {it}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check code block fence
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        flushList();
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBuffer = [];
      } else {
        // End code block
        inCodeBlock = false;
        const fullCode = codeBuffer.join('\n');
        const idx = codeBlockIndex++;
        blocks.push(
          <div key={`code-${idx}`} className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs font-mono">
              <span>{codeBlockLang || 'terminal'}</span>
              <button
                type="button"
                onClick={() => handleCopyCode(fullCode, idx)}
                className="flex items-center gap-1 text-[11px] hover:text-slate-200 transition-colors cursor-pointer"
                title="Copy code snippet"
              >
                {copiedCodeIndex === idx ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
              {fullCode}
            </pre>
          </div>
        );
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Empty lines flush lists and insert subtle spacing
    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push(
        <h3 key={`h3-${i}`} className="text-base font-bold text-slate-900 mt-4 mb-2 first:mt-0 tracking-tight">
          {parseInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      flushList();
      blocks.push(
        <h4 key={`h4-${i}`} className="text-sm font-bold text-slate-800 mt-3 mb-1.5 tracking-tight flex items-center gap-1.5">
          {parseInline(trimmed.slice(5))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push(
        <h2 key={`h2-${i}`} className="text-lg font-bold text-slate-900 mt-4 mb-2 tracking-tight">
          {parseInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList();
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-3 border-indigo-400 bg-indigo-50/50 pl-3 py-1.5 my-2 text-xs text-slate-700 italic rounded-r-lg"
        >
          {parseInline(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Ordered list item (e.g. "1. ")
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(parseInline(olMatch[2]));
      continue;
    }

    // Unordered list item (e.g. "- ", "* ")
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(parseInline(trimmed.slice(2)));
      continue;
    }

    // Regular paragraph
    flushList();
    blocks.push(
      <p key={`p-${i}`} className="text-sm text-slate-800 leading-relaxed mb-2 last:mb-0">
        {parseInline(line)}
      </p>
    );
  }

  flushList();

  return <div className={`formatted-message space-y-1 text-sm ${className}`}>{blocks}</div>;
};
