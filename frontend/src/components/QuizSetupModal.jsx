import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

const QuizSetupModal = ({ isOpen, onClose, documentId, documentTitle }) => {
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const difficulties = [
    {
      id: 'easy',
      name: 'Easy',
      desc: 'Direct fact recall and definitions from the text.',
      color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:border-emerald-500/60'
    },
    {
      id: 'medium',
      name: 'Medium',
      desc: 'Understanding of relationships, causes, and reasoning.',
      color: 'border-amber-500/30 text-amber-400 bg-amber-500/5 hover:border-amber-500/60'
    },
    {
      id: 'hard',
      name: 'Hard',
      desc: 'Critical thinking, synthesis, and deep text comprehension.',
      color: 'border-rose-500/30 text-rose-400 bg-rose-500/5 hover:border-rose-500/60'
    }
  ];

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await client.post('/quiz/', {
        document_id: documentId,
        difficulty,
        question_count: count
      });
      const sessionId = res.data.id;
      navigate(`/quiz/${sessionId}`);
      onClose();
    } catch (err) {
      console.error("Failed to start quiz", err);
      setError(err.response?.data?.error || err.response?.data?.detail || "Could not generate exam. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={loading ? null : onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl z-10 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

        {/* Header */}
        <div className="flex justify-between items-start mb-6 relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xl font-bold text-slate-100">MCQ Quiz Setup</h3>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">
              For: <span className="font-semibold text-slate-300">{documentTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Difficulty Selection */}
        <div className="space-y-3 mb-6 relative">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Difficulty</label>
          <div className="grid grid-cols-1 gap-2">
            {difficulties.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                disabled={loading}
                className={`p-3.5 border text-left rounded-2xl transition-all duration-200 flex flex-col gap-0.5 active:scale-[0.99] cursor-pointer disabled:pointer-events-none ${
                  difficulty === d.id
                    ? d.id === 'easy'
                      ? 'border-emerald-500 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                      : d.id === 'medium'
                        ? 'border-amber-500 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                        : 'border-rose-500 bg-rose-500/15 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/50'
                }`}
              >
                <span className={`font-bold text-sm ${difficulty === d.id ? '' : 'text-slate-300'}`}>
                  {d.name}
                </span>
                <span className="text-xs text-slate-400 font-medium leading-relaxed">
                  {d.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Question Count Slider */}
        <div className="space-y-4 mb-8 relative">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Number of Questions</label>
            <span className="text-sm font-bold bg-brand-500/15 text-brand-400 border border-brand-500/20 px-3 py-1 rounded-full">
              {count} Questions
            </span>
          </div>
          <div className="px-1">
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              disabled={loading}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-bold px-1 mt-1.5">
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
              <span>25</span>
              <span>30</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>AI is generating exam...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4.5 h-4.5" />
              <span>Start MCQ Exam</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuizSetupModal;
