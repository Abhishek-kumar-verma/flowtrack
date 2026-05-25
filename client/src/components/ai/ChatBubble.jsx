import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function renderText(text) {
  if (!text) return null;
  // Basic markdown-like rendering
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold: **text**
    const boldReplaced = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      return (
        <div key={i} className="flex gap-2 mt-1">
          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-60" />
          <span dangerouslySetInnerHTML={{ __html: boldReplaced.replace(/^[-•]\s*/, '') }} />
        </div>
      );
    }
    if (line.trim() === '') return <div key={i} className="h-2" />;
    return <p key={i} className="mt-0.5" dangerouslySetInnerHTML={{ __html: boldReplaced }} />;
  });
}

export default function ChatBubble({ message, isUser, timestamp }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30'
            : 'bg-gray-700 border border-gray-600'
        }`}
      >
        {isUser ? (
          <User size={14} className="text-white" />
        ) : (
          <Bot size={14} className="text-indigo-400" />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-indigo-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/20'
              : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-bl-sm'
          }`}
        >
          {isUser ? (
            <p>{message}</p>
          ) : (
            <div className="space-y-0.5">{renderText(message)}</div>
          )}
        </div>
        {timestamp && (
          <span className="text-xs text-gray-600 px-1">{formatTime(timestamp)}</span>
        )}
      </div>
    </motion.div>
  );
}
