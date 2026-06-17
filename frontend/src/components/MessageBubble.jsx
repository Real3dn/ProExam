import React from 'react';
import { User, Sparkles, Terminal } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isAI = message.sender === 'ai';

  // Helper to parse basic markdown to React elements safely
  const parseMarkdown = (text) => {
    if (!text) return '';
    
    // Split text into paragraphs
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((para, pIdx) => {
      // Inline markdown processing (bold, code, links)
      let tokens = [para];
      
      // Bold regex: \*\*(.*?)\*\*
      const boldRegex = /\*\*(.*?)\*\*/g;
      // Inline code regex: `(.*?)`
      const codeRegex = /`(.*?)`/g;

      // Simple tokenizer helper
      const parseInline = (textStr) => {
        let parts = [{ type: 'text', content: textStr }];
        
        // Match bold
        let match;
        while ((match = boldRegex.exec(textStr)) !== null) {
          const matchedText = match[0];
          const innerText = match[1];
          // Replace in parts
          parts = parts.flatMap(part => {
            if (part.type !== 'text') return part;
            const index = part.content.indexOf(matchedText);
            if (index === -1) return part;
            
            return [
              { type: 'text', content: part.content.substring(0, index) },
              { type: 'bold', content: innerText },
              { type: 'text', content: part.content.substring(index + matchedText.length) }
            ].filter(p => p.content !== '');
          });
        }
        
        // Reset regex index
        boldRegex.lastIndex = 0;

        // Match code
        while ((match = codeRegex.exec(textStr)) !== null) {
          const matchedText = match[0];
          const innerText = match[1];
          
          parts = parts.flatMap(part => {
            if (part.type !== 'text') return part;
            const index = part.content.indexOf(matchedText);
            if (index === -1) return part;
            
            return [
              { type: 'text', content: part.content.substring(0, index) },
              { type: 'code', content: innerText },
              { type: 'text', content: part.content.substring(index + matchedText.length) }
            ].filter(p => p.content !== '');
          });
        }
        
        codeRegex.lastIndex = 0;
        return parts;
      };

      const inlineTokens = parseInline(para);

      return (
        <p key={pIdx} className="mb-2 leading-relaxed text-sm last:mb-0">
          {inlineTokens.map((token, tIdx) => {
            if (token.type === 'bold') {
              return <strong key={tIdx} className="font-bold text-slate-100">{token.content}</strong>;
            }
            if (token.type === 'code') {
              return (
                <code key={tIdx} className="bg-slate-950 px-1.5 py-0.5 rounded text-xs text-brand-300 font-mono border border-slate-800">
                  {token.content}
                </code>
              );
            }
            return token.content;
          })}
        </p>
      );
    });
  };

  return (
    <div className={`flex gap-4 w-full ${isAI ? 'justify-start' : 'justify-end'}`}>
      {isAI && (
        <div className="w-9 h-9 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-xl flex items-center justify-center shrink-0 border border-brand-500/20 shadow-md shadow-brand-500/10">
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>
      )}

      <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 border text-slate-200 transition-all ${
        isAI 
          ? 'bg-slate-900/60 border-slate-800 rounded-tl-sm' 
          : 'bg-brand-600 border-brand-500 text-white rounded-tr-sm shadow-lg shadow-brand-600/15'
      }`}>
        {!isAI && <div className="text-[10px] text-brand-200 font-semibold mb-1 uppercase tracking-wider">You</div>}
        {isAI && <div className="text-[10px] text-brand-400 font-semibold mb-1 uppercase tracking-wider">Assistant</div>}
        
        <div className="whitespace-pre-wrap">
          {isAI ? parseMarkdown(message.content) : message.content}
        </div>
      </div>

      {!isAI && (
        <div className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center shrink-0 text-slate-350 shadow-md">
          <User className="w-4.5 h-4.5" />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
