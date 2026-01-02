import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2, RefreshCw, TrendingUp, Users, Award } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const ExamResults = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [examId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const [examRes, resultsRes] = await Promise.all([
        api.get(`/exams/${examId}`),
        api.get(`/results/exam/${examId}`)
      ]);
      setExam(examRes.data);
      setResults(resultsRes.data);
    } catch (error) {
      toast.error('Gagal memuat hasil ujian');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/results/export/${examId}`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hasil_ujian_${examId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('File CSV berhasil didownload');
    } catch (error) {
      toast.error('Gagal mengexport CSV');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status, score) => {
    if (status === 'force_submitted') {
      return <Badge variant="destructive">Force Submit</Badge>;
    }
    if (status === 'submitted') {
      if (score >= 80) return <Badge className="bg-green-100 text-green-700 border-green-200">Luar Biasa</Badge>;
      if (score >= 60) return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Bagus</Badge>;
      if (score >= 40) return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Cukup</Badge>;
      return <Badge className="bg-red-100 text-red-700 border-red-200">Perlu Peningkatan</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const stats = {
    total: results.length,
    completed: results.filter(r => r.status === 'submitted').length,
    avgScore: results.filter(r => r.final_score !== null).length > 0
      ? (results.reduce((sum, r) => sum + (r.final_score || 0), 0) / results.filter(r => r.final_score !== null).length).toFixed(2)
      : 0,
    highest: results.length > 0 ? Math.max(...results.map(r => r.final_score || 0)).toFixed(2) : 0,
    lowest: results.length > 0 ? Math.min(...results.map(r => r.final_score || 0)).toFixed(2) : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" data-testid="exam-results-page">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold">{exam?.title}</h2>
            <p className="text-muted-foreground">Hasil Ujian & Statistik</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchResults}
              data-testid="refresh-btn"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExportCSV}
              disabled={downloading || results.length === 0}
              data-testid="export-csv-btn"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </>
              )}
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Siswa</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Selesai</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <Award className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Rata-rata</p>
                  <p className="text-xl md:text-2xl font-bold text-primary">{stats.avgScore}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Tertinggi</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{stats.highest}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Terendah</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">{stats.lowest}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Hasil Siswa</CardTitle>
            <CardDescription>{results.length} siswa mengikuti ujian</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Belum ada siswa yang mengikuti ujian</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Nilai</TableHead>
                      <TableHead>Pelanggaran</TableHead>
                      <TableHead>Waktu Mulai</TableHead>
                      <TableHead>Waktu Selesai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results
                      .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
                      .map((result, index) => (
                        <TableRow key={result.session_id} data-testid={`result-row-${index}`}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{result.student_name}</TableCell>
                          <TableCell>{result.student_class}</TableCell>
                          <TableCell>{getStatusBadge(result.status, result.final_score)}</TableCell>
                          <TableCell>
                            <span className={`font-bold text-lg ${
                              result.final_score >= 80 ? 'text-green-600' :
                              result.final_score >= 60 ? 'text-blue-600' :
                              result.final_score >= 40 ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {result.final_score?.toFixed(2) || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            {result.violations_count > 0 ? (
                              <Badge variant="destructive">{result.violations_count}x</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(result.started_at)}</TableCell>
                          <TableCell className="text-sm">{formatDate(result.submitted_at)}</TableCell>
                        </TableRow>
                      ))}
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

export default ExamResults;
