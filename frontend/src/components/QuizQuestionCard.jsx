import React, { useState } from 'react';
import { Check, X, ArrowRight, CheckCircle2, XCircle, Info } from 'lucide-react';

const QuizQuestionCard = ({ 
  question, 
  onAnswerSubmit, 
  isLast, 
  onNext, 
  submittingAnswer 
}) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const { id: questionId, question_text, option_a, option_b, option_c, option_d, user_answer } = question;
  
  const hasAnswered = !!user_answer;
  const isCorrect = user_answer?.is_correct;
  const correctOption = user_answer?.correct_option;
  const selectedInDb = user_answer?.selected_option;

  const options = [
    { key: 'A', text: option_a },
    { key: 'B', text: option_b },
    { key: 'C', text: option_c },
    { key: 'D', text: option_d }
  ];

  const handleOptionClick = (key) => {
    if (hasAnswered || submittingAnswer) return;
    setSelectedOption(key);
    onAnswerSubmit(questionId, key);
  };

  const getOptionStyle = (key) => {
    if (!hasAnswered) {
      return "border-slate-800 bg-slate-900/30 text-slate-300 hover:bg-slate-800/40 hover:border-slate-700 cursor-pointer active:scale-[0.99]";
    }

    // Question has been answered
    const isThisOptionCorrect = key === correctOption;
    const isThisOptionSelected = key === selectedInDb;

    if (isThisOptionCorrect) {
      return "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.08)] pointer-events-none";
    }

    if (isThisOptionSelected && !isCorrect) {
      return "border-rose-500 bg-rose-500/10 text-rose-400 font-semibold shadow-[0_0_15px_rgba(239,68,68,0.08)] pointer-events-none";
    }

    return "border-slate-900 bg-slate-950/20 text-slate-500 opacity-40 pointer-events-none";
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-550 to-brand-500" />
      
      {/* Question Text */}
      <h2 className="text-lg md:text-xl font-bold text-slate-100 leading-relaxed mb-6">
        {question_text}
      </h2>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-3.5 mb-8">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            disabled={hasAnswered || submittingAnswer}
            onClick={() => handleOptionClick(opt.key)}
            className={`w-full text-left p-4.5 border rounded-2xl flex items-center justify-between transition-all duration-200 ${getOptionStyle(opt.key)}`}
          >
            <div className="flex items-center gap-4">
              <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                hasAnswered
                  ? opt.key === correctOption
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : opt.key === selectedInDb
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      : 'bg-slate-800 border-slate-800 text-slate-500'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}>
                {opt.key}
              </span>
              <span className="text-sm md:text-base font-medium leading-relaxed pr-2">
                {opt.text}
              </span>
            </div>

            {hasAnswered && opt.key === correctOption && (
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            {hasAnswered && opt.key === selectedInDb && !isCorrect && (
              <X className="w-5 h-5 text-rose-400 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Explanations & Next Button */}
      {hasAnswered && (
        <div className="space-y-6 animate-fade-in">
          {/* Feedback Banner */}
          <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
            isCorrect 
              ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-300' 
              : 'bg-rose-500/5 border-rose-500/25 text-rose-300'
          }`}>
            <div className="shrink-0 mt-0.5">
              {isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-450" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-450" />
              )}
            </div>
            
            <div className="space-y-3 flex-1">
              <div>
                <h4 className="font-bold text-sm md:text-base mb-1">
                  {isCorrect ? 'Correct Answer!' : 'Incorrect'}
                </h4>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                  {isCorrect ? user_answer.explanation_correct : user_answer.explanation_wrong}
                </p>
              </div>

              {!isCorrect && (
                <div className="pt-3 border-t border-rose-500/10">
                  <div className="flex items-center gap-1.5 mb-1.5 text-emerald-400 font-bold text-xs">
                    <Info className="w-4 h-4" />
                    <span>Why Option {correctOption} is correct:</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                    {user_answer.explanation_correct}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={onNext}
              className="py-3 px-6 bg-gradient-to-r from-brand-650 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/10 flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>{isLast ? 'Finish & View Results' : 'Next Question'}</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizQuestionCard;
