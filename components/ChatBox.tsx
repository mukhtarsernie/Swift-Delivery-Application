import { useState, useEffect, useRef } from 'react';
import { playSound } from './useNotification';

interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  text: string;
  created_at: string;
}

const QUICK_REPLIES = [
  "I'm on my way",
  "I'm at the pickup location",
  "Almost there!",
  "I've arrived",
  "Where exactly are you?",
  "Please call me",
  "Be there in 5 mins",
  "Package received, thanks!",
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function shouldShowDate(msgs: Message[], idx: number): boolean {
  if (idx === 0) return true;
  return new Date(msgs[idx].created_at).toDateString() !== new Date(msgs[idx - 1].created_at).toDateString();
}

export default function ChatBox({ orderId, role }: { orderId: string; role?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > prevCountRef.current && prevCountRef.current > 0) {
      const last = messages[messages.length - 1];
      const isAdmin = role === 'admin';
      const fromOther = isAdmin ? last.sender_role === 'customer' : last.sender_role === 'admin';
      if (fromOther) playSound();
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent, msgText?: string) => {
    if (e) e.preventDefault();
    const message = (msgText || text).trim();
    if (!message || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
      if (res.ok) {
        setText('');
        setShowQuickReplies(false);
        await fetchMessages();
      }
    } finally {
      setSending(false);
    }
  };

  const isAdmin = role === 'admin';
  const headerName = isAdmin ? 'Customer' : 'Rider';
  const headerInitial = isAdmin ? 'C' : 'R';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[460px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center text-white font-bold text-sm shadow-inner">
            {headerInitial}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-purple-600 rounded-full animate-pulse-dot" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm">{headerName}</h3>
          <p className="text-purple-200 text-[11px]">Online now</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 bg-gradient-to-b from-purple-50/30 via-white to-white">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4 shadow-inner">
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 font-semibold text-sm">Start a conversation</p>
            <p className="text-gray-400 text-xs mt-1.5 leading-relaxed max-w-[220px]">
              Send a message to {isAdmin ? 'the customer' : 'your rider'} about this delivery
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isThem = msg.sender_role === (isAdmin ? 'customer' : 'admin');
          const showDate = shouldShowDate(messages, idx);
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="text-[11px] bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">
                    {formatDate(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${isThem ? 'justify-start' : 'justify-end'} mb-1.5 animate-fade-in`}>
                <div className={`flex items-end gap-2 max-w-[80%] ${isThem ? '' : 'flex-row-reverse'}`}>
                  {isThem && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mb-1 shadow-sm">
                      {headerInitial}
                    </div>
                  )}
                  <div className={`relative px-3.5 py-2.5 rounded-2xl text-sm leading-snug ${
                    isThem
                      ? 'bg-white border border-gray-100 text-gray-700 rounded-bl-md shadow-sm'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-md shadow-md shadow-purple-200/50'
                  }`}>
                    <p className="text-[13px]">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${isThem ? 'text-gray-400' : 'text-purple-200'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Quick Replies */}
      {showQuickReplies && (
        <div className="px-3 py-2 border-t border-gray-50 bg-gray-50/80 flex gap-2 overflow-x-auto shrink-0">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => sendMessage(undefined, reply)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 whitespace-nowrap hover:border-purple-300 hover:text-purple-600 transition-all shrink-0 shadow-sm"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={(e) => sendMessage(e)} className="border-t border-gray-100 p-3 flex items-end gap-2 bg-white shrink-0">
        <button
          type="button"
          onClick={() => setShowQuickReplies(!showQuickReplies)}
          className={`p-2 transition-all flex-shrink-0 rounded-full ${showQuickReplies ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-purple-500'}`}
          title="Quick replies"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
        <div className="flex-1 relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
            placeholder="Type a message..."
            className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all placeholder-gray-400"
          />
        </div>
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full hover:from-indigo-600 hover:to-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-md shadow-purple-300/40"
        >
          {sending ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
