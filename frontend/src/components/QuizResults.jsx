import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, CheckCircle2, XCircle, RotateCcw, 
  BookOpen, ChevronDown, ChevronUp, Clock, HelpCircle 
} from 'lucide-react';

const QuizResults = ({ session, onRetake }) => {
  const navigate = useNavigate();
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const { score_correct, score_total, elapsed_seconds, questions, difficulty } = session;
  const percentage = score_total > 0 ? Math.round((score_correct / score_total) * 100) : 0;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    if (mins === 0) {
      return `${remainingSecs} second${remainingSecs !== 1 ? 's' : ''}`;
    }
    return `${mins} minute${mins !== 1 ? 's' : ''} ${remainingSecs} second${remainingSecs !== 1 ? 's' : ''}`;
  };

  const getFeedbackMessage = (pct) => {
    if (pct >= 80) return {
      title: "Excellent Work!",
      desc: "You have shown superb mastery over the document's content.",
      color: "text-emerald-400 bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]",
      gauge: "text-emerald-500"
    };
    if (pct >= 50) return {
      title: "Good Job!",
      desc: "You have a solid grasp of the core concepts, but there is room for improvement.",
      color: "text-amber-400 bg-amber-500/5 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]",
      gauge: "text-amber-500"
    };
    return {
      title: "Keep Studying!",
      desc: "Go back and review the document content, then give it another try.",
      color: "text-rose-400 bg-rose-500/5 border-rose-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]",
      gauge: "text-rose-500"
    };
  };

  const feedback = getFeedbackMessage(percentage);

  const toggleExpand = (idx) => {
    setExpandedQuestion(expandedQuestion === idx ? null : idx);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Score Card */}
      <div className={`border rounded-3xl p-6 md:p-8 relative overflow-hidden backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-8 ${feedback.color}`}>
        {/* Glow effects */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-brand-500" />
        
        <div className="text-center md:text-left space-y-3 md:max-w-md">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-full text-slate-400">
              {difficulty} difficulty
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">{feedback.title}</h2>
          <p className="text-sm text-slate-350 leading-relaxed font-medium">
            {feedback.desc}
          </p>
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-slate-400 font-bold mt-2">
            <Clock className="w-4 h-4 text-brand-400" />
            <span>Time spent: {formatTime(elapsed_seconds)}</span>
          </div>
        </div>

        {/* Circular Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-36 h-36 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="72"
              cy="72"
              r="60"
              className="stroke-slate-800"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Foreground circle */}
            <circle
              cx="72"
              cy="72"
              r="60"
              className={`stroke-current ${feedback.gauge}`}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 60}
              strokeDashoffset={2 * Math.PI * 60 * (1 - percentage / 100)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-100">{percentage}%</span>
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">{score_correct}/{score_total} Correct</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onRetake}
          className="flex-1 py-3.5 bg-gradient-to-r from-brand-650 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/10 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          <RotateCcw className="w-4.5 h-4.5" />
          <span>Retake Quiz (New Questions)</span>
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-3.5 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          <BookOpen className="w-4.5 h-4.5 text-brand-400" />
          <span>Back to Library</span>
        </button>
      </div>

      {/* Quiz Review */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-5 h-5 text-brand-400" />
          <h3 className="text-lg font-bold text-slate-200">Exam Review</h3>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => {
            const isCorrect = q.user_answer?.is_correct;
            const isExpanded = expandedQuestion === idx;

            return (
              <div 
                key={q.id}
                className="bg-slate-900/20 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm transition-all"
              >
                {/* Accordion Trigger */}
                <button
                  onClick={() => toggleExpand(idx)}
                  className="w-full p-4.5 flex justify-between items-center gap-4 text-left cursor-pointer hover:bg-slate-900/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-xs font-bold text-slate-500 shrink-0">
                      Q{idx + 1}
                    </span>
                    <div className="shrink-0">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                    <span className="font-semibold text-sm md:text-base text-slate-350 line-clamp-1 min-w-0 pr-2">
                      {q.question_text}
                    </span>
                  </div>
                  <div className="shrink-0 text-slate-500">
                    {isExpanded ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="px-4.5 pb-6 pt-2 border-t border-slate-800/40 bg-slate-950/15 space-y-4">
                    <p className="text-sm font-semibold text-slate-200 leading-relaxed">
                      {q.question_text}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm font-medium">
                      <div className={`p-3 border rounded-xl flex items-center justify-between ${
                        q.user_answer?.correct_option === 'A'
                          ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-450'
                          : q.user_answer?.selected_option === 'A' && !isCorrect
                            ? 'border-rose-500/40 bg-rose-500/5 text-rose-450'
                            : 'border-slate-800/50 bg-slate-900/10 text-slate-400'
                      }`}>
                        <span>A. {q.option_a}</span>
                        {q.user_answer?.correct_option === 'A' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        {q.user_answer?.selected_option === 'A' && !isCorrect && <XCircle className="w-4 h-4 text-rose-450 shrink-0" />}
                      </div>

                      <div className={`p-3 border rounded-xl flex items-center justify-between ${
                        q.user_answer?.correct_option === 'B'
                          ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-450'
                          : q.user_answer?.selected_option === 'B' && !isCorrect
                            ? 'border-rose-500/40 bg-rose-500/5 text-rose-450'
                            : 'border-slate-800/50 bg-slate-900/10 text-slate-400'
                      }`}>
                        <span>B. {q.option_b}</span>
                        {q.user_answer?.correct_option === 'B' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        {q.user_answer?.selected_option === 'B' && !isCorrect && <XCircle className="w-4 h-4 text-rose-450 shrink-0" />}
                      </div>

                      <div className={`p-3 border rounded-xl flex items-center justify-between ${
                        q.user_answer?.correct_option === 'C'
                          ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-450'
                          : q.user_answer?.selected_option === 'C' && !isCorrect
                            ? 'border-rose-500/40 bg-rose-500/5 text-rose-450'
                            : 'border-slate-800/50 bg-slate-900/10 text-slate-400'
                      }`}>
                        <span>C. {q.option_c}</span>
                        {q.user_answer?.correct_option === 'C' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        {q.user_answer?.selected_option === 'C' && !isCorrect && <XCircle className="w-4 h-4 text-rose-450 shrink-0" />}
                      </div>

                      <div className={`p-3 border rounded-xl flex items-center justify-between ${
                        q.user_answer?.correct_option === 'D'
                          ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-450'
                          : q.user_answer?.selected_option === 'D' && !isCorrect
                            ? 'border-rose-500/40 bg-rose-500/5 text-rose-450'
                            : 'border-slate-800/50 bg-slate-900/10 text-slate-400'
                      }`}>
                        <span>D. {q.option_d}</span>
                        {q.user_answer?.correct_option === 'D' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        {q.user_answer?.selected_option === 'D' && !isCorrect && <XCircle className="w-4 h-4 text-rose-450 shrink-0" />}
                      </div>
                    </div>

                    {/* Explanations */}
                    <div className="mt-3 p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2 text-xs md:text-sm">
                      <div className="text-slate-450 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                        <span>Correct Answer (Option {q.user_answer?.correct_option}):</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-medium">
                        {q.user_answer?.explanation_correct}
                      </p>

                      {!isCorrect && q.user_answer?.selected_option && (
                        <div className="pt-2 border-t border-slate-800/50 mt-2">
                          <div className="text-slate-450 font-bold flex items-center gap-1.5 mb-1">
                            <XCircle className="w-4.5 h-4.5 text-rose-500" />
                            <span>Your Choice (Option {q.user_answer?.selected_option}):</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed font-medium">
                            {q.user_answer?.explanation_wrong}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
