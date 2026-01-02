import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock, AlertTriangle, CheckCircle, Circle, HelpCircle } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';

const ExamPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionStatus, setQuestionStatus] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [violations, setViolations] = useState(0);
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const timerRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    const sessionData = localStorage.getItem('exam_session');
    if (sessionData) {
      const data = JSON.parse(sessionData);
      setExamData(data);
      setTimeLeft(data.duration_minutes * 60);
      
      // Load saved answers from localStorage
      const savedAnswers = localStorage.getItem(`answers_${sessionId}`);
      if (savedAnswers) {
        const parsed = JSON.parse(savedAnswers);
        setAnswers(parsed.answers || {});
        setQuestionStatus(parsed.status || {});
      }
    } else {
      navigate('/');
    }
  }, [sessionId, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && examData) {
        handleViolation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [examData, violations]);

  // Request fullscreen on mount
  useEffect(() => {
    if (examData && !isFullscreen) {
      requestFullscreen();
    }
  }, [examData]);

  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
        toast.warning('Mohon aktifkan mode fullscreen untuk pengalaman terbaik');
      });
    }
  };

  const handleViolation = async () => {
    const newViolations = violations + 1;
    setViolations(newViolations);
    setShowViolationAlert(true);

    try {
      const response = await api.post('/student/report-violation', {
        session_id: sessionId
      });

      if (response.data.force_submitted) {
        toast.error('Ujian telah disubmit otomatis karena terlalu banyak pelanggaran!');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Error reporting violation:', error);
    }
  };

  const saveAnswer = useCallback(async (questionId, answer, status) => {
    const newAnswers = { ...answers, [questionId]: answer };
    const newStatus = { ...questionStatus, [questionId]: status };
    
    setAnswers(newAnswers);
    setQuestionStatus(newStatus);

    // Save to localStorage
    localStorage.setItem(`answers_${sessionId}`, JSON.stringify({
      answers: newAnswers,
      status: newStatus
    }));

    // Debounced save to backend
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.post('/student/save-answer', {
          session_id: sessionId,
          question_id: questionId,
          answer: answer,
          status: status
        });
      } catch (error) {
        console.error('Error saving answer:', error);
      }
    }, 1000);
  }, [sessionId, answers, questionStatus]);

  const handleAnswerChange = (questionId, value) => {
    saveAnswer(questionId, value, 'answered');
  };

  const markDoubtful = (questionId) => {
    const currentAnswer = answers[questionId] || '';
    const currentStatus = questionStatus[questionId];
    const newStatus = currentStatus === 'doubtful' ? 'answered' : 'doubtful';
    saveAnswer(questionId, currentAnswer, newStatus);
  };

  const handleAutoSubmit = async () => {
    try {
      await api.post('/student/submit-exam', {
        session_id: sessionId
      });
      toast.success('Waktu habis! Ujian telah disubmit otomatis.');
      navigate('/');
    } catch (error) {
      console.error('Error submitting exam:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await api.post('/student/submit-exam', {
        session_id: sessionId
      });
      localStorage.removeItem(`answers_${sessionId}`);
      toast.success(`Ujian berhasil disubmit! Nilai: ${response.data.final_score}`);
      navigate('/');
    } catch (error) {
      toast.error('Gagal submit ujian');
    }
  };

  if (!examData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat ujian...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatusColor = (qIndex) => {
    const questionId = examData.questions[qIndex].question_id;
    const status = questionStatus[questionId];
    const hasAnswer = answers[questionId];

    if (status === 'doubtful') return 'bg-amber-500 text-white';
    if (hasAnswer) return 'bg-emerald-500 text-white';
    return 'bg-slate-200 text-slate-600';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" data-testid="exam-container">
      {/* Fixed Timer Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-heading font-semibold text-xl" data-testid="exam-title">{examData.title}</h1>
            <p className="text-sm text-muted-foreground">
              Pertanyaan {currentQuestionIndex + 1} dari {examData.questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {violations > 0 && (
              <div className="flex items-center gap-2 text-destructive" data-testid="violations-count">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">{violations} Pelanggaran</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-lg font-semibold" data-testid="timer">
              <Clock className="h-5 w-5" />
              <span className={timeLeft < 300 ? 'text-destructive' : 'text-foreground'}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <Card className="p-6 mb-6" data-testid="question-card">
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-medium">
                    {currentQuestionIndex + 1}. {currentQuestion.question_text}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markDoubtful(currentQuestion.question_id)}
                    data-testid="mark-doubtful-btn"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    {questionStatus[currentQuestion.question_id] === 'doubtful' ? 'Hapus Ragu' : 'Ragu-ragu'}
                  </Button>
                </div>

                {currentQuestion.question_type === 'multiple_choice' && (
                  <RadioGroup
                    value={answers[currentQuestion.question_id] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.question_id, value)}
                    className="space-y-3 mt-4"
                  >
                    {currentQuestion.options.map((option, idx) => (
                      <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value={option} id={`option-${idx}`} data-testid={`option-${idx}`} />
                        <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.question_type === 'essay' && (
                  <Textarea
                    value={answers[currentQuestion.question_id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.question_id, e.target.value)}
                    placeholder="Tulis jawaban Anda di sini..."
                    rows={8}
                    className="mt-4"
                    data-testid="essay-textarea"
                  />
                )}

                {currentQuestion.question_type === 'sentence_order' && (
                  <Input
                    value={answers[currentQuestion.question_id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.question_id, e.target.value)}
                    placeholder="Masukkan urutan jawaban (misal: A-B-C-D)"
                    className="mt-4"
                    data-testid="sentence-order-input"
                  />
                )}
              </div>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                data-testid="prev-question-btn"
              >
                Sebelumnya
              </Button>
              
              {currentQuestionIndex === examData.questions.length - 1 ? (
                <Button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="rounded-full"
                  data-testid="submit-exam-btn"
                >
                  Submit Ujian
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(examData.questions.length - 1, prev + 1))}
                  data-testid="next-question-btn"
                >
                  Selanjutnya
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigation Sidebar */}
        <div className="w-80 border-l bg-muted/30 p-6 overflow-y-auto">
          <h3 className="font-heading font-semibold mb-4">Navigasi Soal</h3>
          <div className="grid grid-cols-5 gap-2">
            {examData.questions.map((q, idx) => (
              <Button
                key={q.question_id}
                variant="outline"
                className={`h-10 w-10 p-0 ${getQuestionStatusColor(idx)}`}
                onClick={() => setCurrentQuestionIndex(idx)}
                data-testid={`nav-question-${idx + 1}`}
              >
                {idx + 1}
              </Button>
            ))}
          </div>

          <div className="mt-6 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-emerald-500"></div>
              <span>Sudah dijawab</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-amber-500"></div>
              <span>Ragu-ragu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-slate-200"></div>
              <span>Belum dijawab</span>
            </div>
          </div>
        </div>
      </div>

      {/* Violation Alert */}
      <AlertDialog open={showViolationAlert} onOpenChange={setShowViolationAlert}>
        <AlertDialogContent data-testid="violation-alert">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Peringatan: Pelanggaran Terdeteksi!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda telah berpindah tab atau keluar dari aplikasi. Pelanggaran: {violations}/3
              {violations >= 3 && (
                <span className="block mt-2 text-destructive font-semibold">
                  Ujian akan disubmit otomatis dengan nilai 0!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction data-testid="acknowledge-violation-btn">Saya Mengerti</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Confirmation */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent data-testid="submit-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Submit Ujian</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengakhiri ujian? Jawaban yang sudah diisi akan disubmit dan tidak dapat diubah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitConfirm(false)} data-testid="cancel-submit-btn">
              Batal
            </Button>
            <AlertDialogAction onClick={handleSubmit} data-testid="confirm-submit-btn">
              Ya, Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExamPage;
