import React from 'react';

const QuizProgressBar = ({ current, total }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span>Progress</span>
        <span>Question {current} of {total}</span>
      </div>
      <div className="w-full h-2.5 bg-slate-950/50 border border-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-550 to-brand-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(14,143,229,0.3)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default QuizProgressBar;
