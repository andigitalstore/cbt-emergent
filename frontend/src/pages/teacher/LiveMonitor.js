import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Loader2, Eye, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const LiveMonitor = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchData();
  }, [examId]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchSessions();
      }, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, examId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examRes, sessionsRes] = await Promise.all([
        api.get(`/exams/${examId}`),
        api.get(`/exams/${examId}/live-monitor`)
      ]);
      setExam(examRes.data);
      setSessions(sessionsRes.data);
    } catch (error) {
      toast.error('Gagal memuat data monitoring');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await api.get(`/exams/${examId}/live-monitor`);
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusBadge = (status, violationsCount) => {
    if (status === 'in_progress') {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <Clock className="h-3 w-3 mr-1" />
          Sedang Ujian
        </Badge>
      );
    } else if (status === 'submitted') {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Selesai
        </Badge>
      );
    } else if (status === 'force_submitted') {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Force Submit
        </Badge>
      );
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getProgressPercentage = (session) => {
    if (!exam) return 0;
    const totalQuestions = exam.question_ids?.length || 0;
    const answeredQuestions = Object.keys(session.answers || {}).length;
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  };

  const stats = {
    total: sessions.length,
    inProgress: sessions.filter(s => s.status === 'in_progress').length,
    submitted: sessions.filter(s => s.status === 'submitted').length,
    forceSubmitted: sessions.filter(s => s.status === 'force_submitted').length,
    avgScore: sessions.filter(s => s.final_score !== null).length > 0
      ? (sessions.reduce((sum, s) => sum + (s.final_score || 0), 0) / sessions.filter(s => s.final_score !== null).length).toFixed(2)
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" data-testid="live-monitor-page">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold">{exam?.title}</h2>
            <p className="text-muted-foreground text-sm md:text-base">Live Monitoring - Auto-refresh {autoRefresh ? 'ON' : 'OFF'}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              data-testid="auto-refresh-toggle"
            >
              {autoRefresh ? 'Stop Auto-refresh' : 'Start Auto-refresh'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              data-testid="manual-refresh-btn"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/teacher/exams')}
              data-testid="back-btn"
            >
              Kembali
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Siswa</p>
                <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Sedang Ujian</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Selesai</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{stats.submitted}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Force Submit</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">{stats.forceSubmitted}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Rata-rata Nilai</p>
                <p className="text-xl md:text-2xl font-bold text-primary">{stats.avgScore}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Siswa</CardTitle>
            <CardDescription>Real-time monitoring siswa yang mengikuti ujian</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Belum ada siswa yang memulai ujian</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Pelanggaran</TableHead>
                      <TableHead>Mulai</TableHead>
                      <TableHead>Selesai</TableHead>
                      <TableHead>Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => {
                      const progress = getProgressPercentage(session);
                      return (
                        <TableRow key={session.session_id} data-testid={`session-row-${session.session_id}`}>
                          <TableCell className="font-medium">{session.student_name}</TableCell>
                          <TableCell>{session.student_class}</TableCell>
                          <TableCell>{getStatusBadge(session.status, session.violations_count)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-muted-foreground">{progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {session.violations_count > 0 ? (
                              <Badge variant="destructive">{session.violations_count}x</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(session.started_at)}</TableCell>
                          <TableCell className="text-sm">{formatDate(session.submitted_at)}</TableCell>
                          <TableCell>
                            {session.final_score !== null ? (
                              <span className="font-semibold">{session.final_score}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveMonitor;
