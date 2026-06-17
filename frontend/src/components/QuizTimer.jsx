import React, { useEffect } from 'react';
import { Timer } from 'lucide-react';

const QuizTimer = ({ isActive, seconds, setSeconds }) => {
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, setSeconds]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-955 border border-slate-800 text-slate-350 rounded-xl text-xs sm:text-sm font-semibold shadow-inner">
      <Timer className="w-4 h-4 text-emerald-450 animate-pulse" />
      <span>{formatTime(seconds)}</span>
    </div>
  );
};

export default QuizTimer;
