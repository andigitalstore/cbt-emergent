import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Home, Trophy, Clock, AlertTriangle } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';

const ExamResultPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    fetchResult();
    // Hide animation after 3 seconds
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [sessionId]);

  const fetchResult = async () => {
    try {
      const response = await api.get(`/student/session/${sessionId}`);
      setSession(response.data);
      // Clear localStorage
      localStorage.removeItem(`answers_${sessionId}`);
      localStorage.removeItem('exam_session');
    } catch (error) {
      toast.error('Gagal memuat hasil ujian');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '-';
    const diff = new Date(endDate) - new Date(startDate);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes} menit ${seconds} detik`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return { title: 'Luar Biasa!', message: 'Nilai Anda sangat memuaskan', icon: Trophy, color: 'text-green-600' };
    if (score >= 60) return { title: 'Bagus!', message: 'Nilai Anda di atas rata-rata', icon: CheckCircle, color: 'text-blue-600' };
    if (score >= 40) return { title: 'Cukup Baik', message: 'Terus tingkatkan belajar Anda', icon: CheckCircle, color: 'text-orange-600' };
    return { title: 'Perlu Peningkatan', message: 'Jangan menyerah, belajar lebih giat lagi', icon: AlertCircle, color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Hasil Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-4">Session ujian tidak ditemukan</p>
            <Button onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scoreInfo = getScoreMessage(session.final_score || 0);
  const ScoreIcon = scoreInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-orange-50 p-4 md:p-8">
      {/* Finish Animation Overlay */}
      {showAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="text-center animate-in zoom-in duration-500">
            <div className="mb-6">
              <CheckCircle className="h-24 w-24 md:h-32 md:w-32 text-green-500 mx-auto animate-bounce" />
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4 animate-in slide-in-from-bottom duration-700">
              Ujian Selesai!
            </h1>
            <p className="text-lg md:text-xl text-white/90 animate-in slide-in-from-bottom duration-700 delay-150">
              Menghitung nilai Anda...
            </p>
          </div>
        </div>
      )}

      {/* Result Content */}
      <div className="max-w-4xl mx-auto space-y-6" data-testid="exam-result-page">
        {/* Score Card */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mb-4">
              <ScoreIcon className={`h-16 w-16 md:h-20 md:w-20 mx-auto ${scoreInfo.color}`} />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-heading">{scoreInfo.title}</CardTitle>
            <p className="text-muted-foreground">{scoreInfo.message}</p>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className={`text-6xl md:text-8xl font-bold ${getScoreColor(session.final_score || 0)}`}>
                {session.final_score?.toFixed(2) || 0}
              </div>
              <p className="text-lg text-muted-foreground mt-2">Nilai Akhir</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    session.final_score >= 80 ? 'bg-green-500' :
                    session.final_score >= 60 ? 'bg-blue-500' :
                    session.final_score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${session.final_score || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="text-center">
              {session.status === 'force_submitted' ? (
                <Badge variant="destructive" className="px-4 py-2">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Force Submit - {session.violations_count} Pelanggaran
                </Badge>
              ) : (
                <Badge className="px-4 py-2 bg-green-100 text-green-700 border-green-200">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Ujian Diselesaikan
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Ujian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Nama</span>
                <span className="font-medium">{session.student_name}</span>
              </div>
              <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Kelas</span>
                <span className="font-medium">{session.student_class}</span>
              </div>
              <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Token</span>
                <span className="font-mono font-medium">{session.token}</span>
              </div>
              <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Pelanggaran</span>
                <span className={`font-medium ${session.violations_count > 0 ? 'text-destructive' : ''}`}>
                  {session.violations_count}x
                </span>
              </div>
              <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Waktu Mulai</span>
                <span className="font-medium text-sm">{formatDate(session.started_at)}</span>
              </div>
              <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Waktu Selesai</span>
                <span className="font-medium text-sm">{formatDate(session.submitted_at)}</span>
              </div>
              <div className="flex justify-between p-3 bg-muted/50 rounded-lg md:col-span-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Durasi Pengerjaan
                </span>
                <span className="font-medium">{formatDuration(session.started_at, session.submitted_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button
            className="flex-1 rounded-full"
            size="lg"
            onClick={() => navigate('/')}
            data-testid="back-home-btn"
          >
            <Home className="h-5 w-5 mr-2" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExamResultPage;
