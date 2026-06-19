import React from 'react';
import { Copy } from 'lucide-react';

/**
 * Utilitário para parsear e renderizar Markdown básico e blocos de código
 */
export const renderMarkdown = (content: string) => {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
      const language = match?.[1] || 'code';
      const code = match?.[2] || part.slice(3, -3).replace(/^\n/, '');

      return (
        <div key={index} className="relative group my-3 rounded-xl bg-[#1e1e1e] text-gray-300 font-mono text-[13px] border border-white/10 shadow-lg flex flex-col">
          <div className="flex justify-between items-center px-4 py-2 bg-black/40 text-[10px] font-semibold tracking-wider text-gray-400 border-b border-white/5 uppercase">
            <span>{language}</span>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="flex items-center gap-1.5 hover:text-white transition-colors sticky top-0 right-0 z-10"
              title="Copy code"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <div className="p-4 overflow-x-auto no-scrollbar flex-1">
            <pre className="!m-0"><code>{code}</code></pre>
          </div>
        </div>
      );
    }

    const inlineParts = part.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return (
      <span key={index}>
        {inlineParts.map((ip, i) => {
          if (ip.startsWith('`') && ip.endsWith('`')) {
            return <code key={i} className="bg-black/20 text-[#e0a87a] px-1.5 py-0.5 rounded-md text-[0.9em] mx-0.5">{ip.slice(1, -1)}</code>;
          }
          if (ip.startsWith('**') && ip.endsWith('**')) {
            return <strong key={i} className="font-bold">{ip.slice(2, -2)}</strong>;
          }
          return <span key={i} className="whitespace-pre-wrap">{ip}</span>;
        })}
      </span>
    );
  });
};
