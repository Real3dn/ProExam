import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import MessageBubble from '../components/MessageBubble';
import { Sparkles, ArrowLeft, Send, Loader2, FileText, Bot } from 'lucide-react';

const ChatPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchSessionDetails = async () => {
    try {
      const res = await client.get(`/chats/${sessionId}/`);
      setSession(res.data);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to load chat session", err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userText = input;
    setInput('');
    setSending(true);

    // Optimistically add user message to list
    const tempUserMsg = { id: Date.now(), sender: 'user', content: userText, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await client.post(`/chats/${sessionId}/messages/`, { content: userText });
      // Replace or append messages
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        res.data.user_message,
        res.data.ai_message
      ]);
    } catch (err) {
      console.error("Failed to send message", err);
      alert("Error sending message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Loading conversation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-slate-950/40 backdrop-blur-md border-b border-slate-800 h-16 flex items-center px-6 justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl transition-all border border-slate-850"
            title="Back to library"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-slate-200 line-clamp-1 max-w-[320px] md:max-w-[500px]" title={session?.document?.title}>
                {session?.document?.title}
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Active Session</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-brand-400 text-xs font-semibold px-3 py-1.5 bg-brand-500/15 border border-brand-500/20 rounded-xl">
          <Bot className="w-4 h-4" />
          <span>Grounded Gemini Assistant</span>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-slate-950/20">
          {/* Scrollable messages container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
                <div className="w-14 h-14 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/15 mb-5">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-250 text-base">Conversation Started</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Ask me anything about the document content. I will only formulate answers using details parsed directly from <strong>{session?.document?.title}</strong>.
                </p>
              </div>
            ) : (
              messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
            )}

            {sending && (
              <div className="flex gap-4 w-full justify-start animate-pulse">
                <div className="w-9 h-9 bg-brand-900/40 rounded-xl flex items-center justify-center shrink-0 border border-brand-800/40">
                  <Sparkles className="w-4.5 h-4.5 text-brand-400" />
                </div>
                <div className="bg-slate-900/40 border border-slate-850 rounded-2xl rounded-tl-sm px-5 py-3.5 max-w-[75%] text-slate-400 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                  <span>AI is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Container */}
          <div className="p-6 bg-slate-950/40 border-t border-slate-850 shrink-0">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask a question about ${session?.document?.title || 'this document'}...`}
                disabled={sending}
                className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl py-3.5 px-4 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-slate-100 placeholder-slate-500 text-sm transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="bg-brand-600 hover:bg-brand-500 text-white p-3.5 rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-brand-600/15 shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-[10px] text-center text-slate-600 mt-2.5">
              Strictly grounded: AI can only answer questions using the document context.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
