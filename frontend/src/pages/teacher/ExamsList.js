import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Search, Eye, Trash2, Loader2, RefreshCw, Copy } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const ExamsList = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = exams.filter(e => 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.token.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredExams(filtered);
    } else {
      setFilteredExams(exams);
    }
  }, [searchQuery, exams]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await api.get('/exams/list');
      setExams(response.data);
      setFilteredExams(response.data);
    } catch (error) {
      toast.error('Gagal memuat daftar ujian');
    } finally {
      setLoading(false);
    }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token);
    toast.success('Token berhasil disalin');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8" data-testid="exams-list-page">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-heading font-bold">Daftar Ujian</h2>
            <p className="text-muted-foreground">Kelola ujian Anda</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/teacher')} data-testid="back-btn">
              Kembali
            </Button>
            <Button onClick={() => navigate('/teacher/exams/create')} data-testid="create-exam-btn">
              <Plus className="h-4 w-4 mr-2" />
              Buat Ujian
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daftar Ujian</CardTitle>
                <CardDescription>{filteredExams.length} ujian</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari ujian..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                    data-testid="search-input"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={fetchExams} data-testid="refresh-btn">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredExams.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'Tidak ada ujian ditemukan' : 'Belum Ada Ujian'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? 'Coba kata kunci lain' : 'Mulai buat ujian untuk siswa Anda'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate('/teacher/exams/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Ujian Pertama
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExams.map((exam) => (
                  <Card key={exam.exam_id} className="hover:shadow-md transition-shadow" data-testid={`exam-card-${exam.exam_id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{exam.title}</h3>
                            <Badge variant={exam.status === 'active' ? 'default' : 'secondary'}>
                              {exam.status}
                            </Badge>
                          </div>
                          {exam.description && (
                            <p className="text-sm text-muted-foreground mb-3">{exam.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Token:</span>
                              <code className="px-2 py-1 bg-muted rounded font-mono">{exam.token}</code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToken(exam.token)}
                                data-testid={`copy-token-${exam.exam_id}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Durasi:</span> {exam.duration_minutes} menit
                            </div>
                            <div>
                              <span className="text-muted-foreground">Soal:</span> {exam.questions_count || exam.question_ids?.length || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Dibuat: {formatDate(exam.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/teacher/exams/${exam.exam_id}/monitor`)}
                            data-testid={`monitor-btn-${exam.exam_id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Monitor
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/teacher/exams/${exam.exam_id}/results`)}
                            data-testid={`results-btn-${exam.exam_id}`}
                          >
                            Hasil
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExamsList;