import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { toast } from 'sonner';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalExams: 0,
    activeExams: 0,
    totalSessions: 0,
    quotaQuestions: 20,
    quotaStudents: 10,
    tier: 'free'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [questionsRes, examsRes, quotaRes] = await Promise.all([
        api.get('/questions/list'),
        api.get('/exams/list'),
        api.get('/questions/check-quota')
      ]);

      // Get total sessions from all exams
      let totalSessions = 0;
      for (const exam of examsRes.data) {
        const sessionsRes = await api.get(`/results/exam/${exam.exam_id}`);
        totalSessions += sessionsRes.data.length;
      }

      setStats({
        totalQuestions: questionsRes.data.length,
        totalExams: examsRes.data.length,
        activeExams: examsRes.data.filter(e => e.status === 'active').length,
        totalSessions: totalSessions,
        quotaQuestions: quotaRes.data.quota,
        quotaStudents: quotaRes.data.quota, // Using same for now
        tier: quotaRes.data.quota > 100 ? 'pro' : 'free'
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Buat Soal',
      description: 'Tambah soal ke bank soal',
      icon: Plus,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      action: () => navigate('/teacher/questions/create'),
      testId: 'create-question-card'
    },
    {
      title: 'Buat Ujian',
      description: 'Setup ujian baru',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: () => navigate('/teacher/exams/create'),
      testId: 'create-exam-card'
    },
    {
      title: 'Bank Soal',
      description: `${stats.totalQuestions} soal tersimpan`,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => navigate('/teacher/questions'),
      testId: 'questions-bank-card'
    },
    {
      title: 'Daftar Ujian',
      description: `${stats.totalExams} ujian`,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: () => navigate('/teacher/exams'),
      testId: 'exams-list-card'
    }
  ];

  return (
    <div className="min-h-screen bg-background p-8" data-testid="teacher-dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-heading font-bold">Dashboard Guru</h1>
            <p className="text-muted-foreground mt-1">Selamat datang, {user?.first_name}!</p>
          </div>
          <Button onClick={logout} variant="destructive" data-testid="logout-btn">
            Logout
          </Button>
        </div>

        {/* Quota Alert */}
        {stats.tier === 'free' && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-amber-900">Paket Free</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Anda menggunakan paket free dengan quota {stats.quotaQuestions} soal dan {stats.quotaStudents} siswa.
                    Upgrade ke Pro untuk unlimited!
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/teacher/subscription')}
                  data-testid="upgrade-btn"
                >
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card data-testid="stat-questions">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Bank Soal</p>
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <p className="text-3xl font-bold">{stats.totalQuestions}</p>
              <p className="text-xs text-muted-foreground mt-1">
                dari {stats.quotaQuestions === 999999 ? '∞' : stats.quotaQuestions} quota
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-exams">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Ujian</p>
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold">{stats.totalExams}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeExams} aktif
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-sessions">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Siswa</p>
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold">{stats.totalSessions}</p>
              <p className="text-xs text-muted-foreground mt-1">
                mengikuti ujian
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-tier">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-3xl font-bold uppercase">{stats.tier}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.tier === 'pro' ? 'Unlimited access' : 'Limited quota'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-heading font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {quickActions.map((action) => (
              <Card
                key={action.title}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={action.action}
                data-testid={action.testId}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${action.bgColor}`}>
                          <action.icon className={`h-6 w-6 ${action.color}`} />
                        </div>
                        <h3 className="text-lg font-semibold">{action.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Tips & Panduan</CardTitle>
            <CardDescription>Cara menggunakan CBT Pro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">Buat Bank Soal</p>
                <p className="text-sm text-muted-foreground">Tambahkan soal-soal ujian ke bank soal Anda</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">Setup Ujian</p>
                <p className="text-sm text-muted-foreground">Buat ujian, pilih soal, set durasi dan token</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">Bagikan Token</p>
                <p className="text-sm text-muted-foreground">Berikan token ujian kepada siswa untuk memulai</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">4</span>
              </div>
              <div>
                <p className="font-medium">Monitor & Export</p>
                <p className="text-sm text-muted-foreground">Pantau real-time dan export hasil ke CSV</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;