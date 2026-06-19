import React from 'react';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { ChatSession } from '../hooks/useAppLogic';

interface ChatSectionProps {
  tc: any;
  chatMessages: ChatSession['messages'];
  isAiLoading: boolean;
  currentSessionId: string | null;
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  handleChatScroll: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  tc,
  chatMessages,
  isAiLoading,
  currentSessionId,
  setChatSessions,
  setCurrentSessionId,
  chatContainerRef,
  handleChatScroll,
  messagesEndRef
}) => {
  return (
    <div
      ref={chatContainerRef}
      onScroll={handleChatScroll}
      className="w-full max-w-3xl flex-1 overflow-y-auto mt-4 mb-4 px-2 space-y-6 flex flex-col no-scrollbar"
    >
      {chatMessages.length === 0 ? (
        <div className="m-auto text-center opacity-50 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <p className="text-sm">Como posso ajudar hoje?</p>
        </div>
      ) : (
        <div className="flex justify-center mb-2">
          <button
            type="button"
            onClick={() => {
              setChatSessions(prev => prev.filter(s => s.id !== currentSessionId));
              setCurrentSessionId(null);
            }}
            className="text-[10px] font-bold tracking-wider opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Apagar chat atual
          </button>
        </div>
      )}

      {chatMessages.map((msg, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-[#8c6239] text-white rounded-br-none' : `${tc.menuBg} ${tc.menuBorder} border rounded-bl-none`}`}>
            {msg.attachments && msg.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {msg.attachments.map((att, i) => (
                  <img key={i} src={att} alt="attachment" className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                ))}
              </div>
            )}
            <div className="whitespace-pre-wrap text-[0.9rem] leading-relaxed">{msg.content}</div>
          </div>
        </motion.div>
      ))}

      {isAiLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
          <div className={`rounded-2xl p-4 ${tc.menuBg} ${tc.menuBorder} border rounded-bl-none flex items-center gap-2`}>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
