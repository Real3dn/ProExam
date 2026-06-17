import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { FileText, Calendar, MessageSquare, Trash2, Loader2, Sparkles } from 'lucide-react';

const DocumentCard = ({ doc, onDeleteSuccess }) => {
  const [deleting, setDeleting] = useState(false);
  const [chatStarting, setChatStarting] = useState(false);
  const navigate = useNavigate();

  const getFormatIcon = (type) => {
    switch (type) {
      case 'PDF':
        return <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl"><FileText className="w-6 h-6" /></div>;
      case 'DOCX':
        return <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl"><FileText className="w-6 h-6" /></div>;
      default:
        return <div className="p-3 bg-slate-500/10 border border-slate-500/20 text-slate-400 rounded-xl"><FileText className="w-6 h-6" /></div>;
    }
  };

  const handleStartChat = async () => {
    setChatStarting(true);
    try {
      // Create a new chat session for this document
      const res = await client.post('/chats/', { document_id: doc.id });
      const sessionId = res.data.id;
      navigate(`/chat/${sessionId}`);
    } catch (err) {
      console.error("Failed to start chat session", err);
      alert("Could not start chat session. Please try again.");
    } finally {
      setChatStarting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${doc.title}"?`)) return;
    
    setDeleting(true);
    try {
      await client.delete(`/documents/${doc.id}/`);
      if (onDeleteSuccess) {
        onDeleteSuccess(doc.id);
      }
    } catch (err) {
      console.error("Failed to delete document", err);
      alert("Failed to delete document. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/60 hover:bg-slate-900/60 transition-all duration-200 flex flex-col justify-between shadow-lg h-full group">
      <div>
        <div className="flex justify-between items-start gap-4 mb-4">
          {getFormatIcon(doc.file_type)}
          
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20 disabled:opacity-50"
            title="Delete document"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4.5 h-4.5" />}
          </button>
        </div>

        <h3 className="font-semibold text-slate-200 line-clamp-1 group-hover:text-slate-100 transition-colors" title={doc.title}>
          {doc.title}
        </h3>
        
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>Uploaded {formatDate(doc.created_at)}</span>
        </div>
      </div>

      <button
        onClick={handleStartChat}
        disabled={chatStarting}
        className="w-full mt-6 bg-slate-800/80 hover:bg-brand-600 border border-slate-700 hover:border-brand-500 text-slate-350 hover:text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
      >
        {chatStarting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <MessageSquare className="w-4 h-4 text-brand-400 group-hover:text-white transition-colors" />
            <span>AI Chat</span>
          </>
        )}
      </button>
    </div>
  );
};

export default DocumentCard;
