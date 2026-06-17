import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import QuizTimer from '../components/QuizTimer';
import QuizProgressBar from '../components/QuizProgressBar';
import QuizQuestionCard from '../components/QuizQuestionCard';
import QuizResults from '../components/QuizResults';
import { Sparkles, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';

const QuizPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Timer state
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  
  // Active question index in state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [completing, setCompleting] = useState(false);

  const fetchSession = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await client.get(`/quiz/${sessionId}/`);
      const data = res.data;
      setSession(data);
      setSeconds(data.elapsed_seconds || 0);
      
      if (data.status === 'in_progress') {
        // Find first unanswered question
        const unansweredIdx = data.questions.findIndex(q => q.user_answer === null);
        setCurrentIndex(unansweredIdx !== -1 ? unansweredIdx : 0);
        setTimerActive(true);
      } else {
        setTimerActive(false);
      }
      setError('');
    } catch (err) {
      console.error("Failed to load quiz session", err);
      setError("Failed to load quiz. The session may not exist, or you might not have access.");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession(true);
  }, [sessionId]);

  const handleAnswerSubmit = async (questionId, selectedOption) => {
    setSubmittingAnswer(true);
    try {
      const res = await client.post(`/quiz/${sessionId}/answer/`, {
        question_id: questionId,
        selected_option: selectedOption
      });
      
      // Update local question answer state immediately
      setSession(prev => {
        const updatedQuestions = prev.questions.map(q => {
          if (q.id === questionId) {
            return {
              ...q,
              user_answer: {
                selected_option: selectedOption,
                is_correct: res.data.is_correct,
                correct_option: res.data.correct_option,
                explanation_correct: res.data.explanation_correct,
                explanation_wrong: res.data.explanation_wrong
              }
            };
          }
          return q;
        });
        return { ...prev, questions: updatedQuestions };
      });
    } catch (err) {
      console.error("Failed to submit answer", err);
      alert(err.response?.data?.error || "Failed to submit answer. Please try again.");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleNext = async () => {
    const isLast = currentIndex === session.questions.length - 1;
    
    if (isLast) {
      // Complete the quiz
      setTimerActive(false);
      setCompleting(true);
      try {
        const res = await client.post(`/quiz/${sessionId}/complete/`, {
          elapsed_seconds: seconds
        });
        setSession(res.data);
      } catch (err) {
        console.error("Failed to complete quiz", err);
        alert("Could not submit quiz results. Please try again.");
        setTimerActive(true);
      } finally {
        setCompleting(false);
      }
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleRetake = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await client.post('/quiz/', {
        document_id: session.document.id,
        difficulty: session.difficulty,
        question_count: session.question_count
      });
      navigate(`/quiz/${res.data.id}`);
    } catch (err) {
      console.error("Failed to retake quiz", err);
      setError("Failed to generate a new quiz attempt. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center border border-brand-500/20 shadow-lg shadow-brand-500/10">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-200">Preparing your exam</h3>
            <p className="text-xs text-slate-400 max-w-[280px]">Our AI is scanning your document and generating customized multiple choice questions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-5 shadow-xl">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-450 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <RefreshCw className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-200">Something went wrong</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Library</span>
          </button>
        </div>
      </div>
    );
  }

  const isInProgress = session.status === 'in_progress';
  const currentQuestion = session.questions[currentIndex];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-950/40 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all mr-1"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/10 hidden sm:flex">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                {isInProgress ? 'Interactive MCQ Exam' : 'Exam Results'}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-450 font-bold uppercase tracking-wider line-clamp-1 max-w-[200px] sm:max-w-xs">
                {session.document.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <QuizTimer 
              isActive={timerActive} 
              seconds={seconds} 
              setSeconds={setSeconds} 
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col justify-start">
        {completing ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="w-10 h-10 text-brand-400 animate-spin mb-4" />
            <h4 className="font-bold text-slate-200">Submitting your exam...</h4>
            <p className="text-xs text-slate-500">Grading final selections and saving score history...</p>
          </div>
        ) : isInProgress ? (
          // Exam active view
          <div className="space-y-6 flex-1 flex flex-col justify-start">
            <QuizProgressBar 
              current={currentIndex + 1} 
              total={session.questions.length} 
            />
            {currentQuestion ? (
              <QuizQuestionCard
                question={currentQuestion}
                onAnswerSubmit={handleAnswerSubmit}
                isLast={currentIndex === session.questions.length - 1}
                onNext={handleNext}
                submittingAnswer={submittingAnswer}
              />
            ) : (
              <div className="text-center py-12 text-slate-400">
                No questions found. Please try re-generating.
              </div>
            )}
          </div>
        ) : (
          // Results view
          <QuizResults 
            session={session} 
            onRetake={handleRetake} 
          />
        )}
      </main>
    </div>
  );
};

export default QuizPage;
