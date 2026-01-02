import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BookOpen, Plus, Search, Trash2, Loader2, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const QuestionBank = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [quota, setQuota] = useState({ used: 0, quota: 20, remaining: 20 });

  useEffect(() => {
    fetchQuestions();
    fetchQuota();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = questions.filter(q => 
        q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.question_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredQuestions(filtered);
    } else {
      setFilteredQuestions(questions);
    }
  }, [searchQuery, questions]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/questions/list');
      setQuestions(response.data);
      setFilteredQuestions(response.data);
    } catch (error) {
      toast.error('Gagal memuat bank soal');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuota = async () => {
    try {
      const response = await api.get('/questions/check-quota');
      setQuota(response.data);
    } catch (error) {
      console.error('Error fetching quota:', error);
    }
  };

  const handleDelete = (question) => {
    setSelectedQuestion(question);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedQuestion) return;
    
    setDeleteLoading(selectedQuestion.question_id);
    try {
      await api.delete(`/questions/${selectedQuestion.question_id}`);
      toast.success('Soal berhasil dihapus');
      fetchQuestions();
      fetchQuota();
    } catch (error) {
      toast.error('Gagal menghapus soal');
    } finally {
      setDeleteLoading(null);
      setShowDeleteDialog(false);
      setSelectedQuestion(null);
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      'multiple_choice': 'Pilihan Ganda',
      'essay': 'Essay',
      'sentence_order': 'Susun Kalimat'
    };
    return types[type] || type;
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      'multiple_choice': 'bg-blue-100 text-blue-700 border-blue-200',
      'essay': 'bg-green-100 text-green-700 border-green-200',
      'sentence_order': 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8" data-testid="question-bank-page">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-heading font-bold">Bank Soal</h2>
            <p className="text-muted-foreground">Kelola soal-soal ujian Anda</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/teacher')}
              data-testid="back-btn"
            >
              Kembali
            </Button>
            <Button
              onClick={() => navigate('/teacher/questions/create')}
              disabled={quota.remaining <= 0}
              data-testid="create-question-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Soal
            </Button>
          </div>
        </div>

        {/* Quota Card */}
        <Card className={quota.remaining <= 5 ? 'border-amber-200 bg-amber-50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quota Soal</p>
                <p className="text-2xl font-bold">
                  {quota.used} / {quota.quota === 999999 ? '∞' : quota.quota}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {quota.remaining === 999999 ? 'Unlimited' : `${quota.remaining} soal tersisa`}
                </p>
              </div>
              {quota.remaining <= 5 && quota.remaining > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/teacher/subscription')}
                >
                  Upgrade ke Pro
                </Button>
              )}
              {quota.remaining === 0 && (
                <div className="text-right">
                  <p className="text-sm font-medium text-destructive mb-2">Quota Habis!</p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate('/teacher/subscription')}
                  >
                    Upgrade Sekarang
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daftar Soal</CardTitle>
                <CardDescription>{filteredQuestions.length} soal</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari soal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                    data-testid="search-input"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { fetchQuestions(); fetchQuota(); }}
                  data-testid="refresh-btn"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'Tidak ada soal ditemukan' : 'Belum Ada Soal'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? 'Coba kata kunci lain' : 'Mulai buat soal untuk ujian Anda'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate('/teacher/questions/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Soal Pertama
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <Card key={question.question_id} className="hover:shadow-md transition-shadow" data-testid={`question-card-${question.question_id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getTypeBadgeColor(question.question_type)}>
                              {getTypeLabel(question.question_type)}
                            </Badge>
                            <Badge variant="outline">{question.points} poin</Badge>
                          </div>
                          <p className="font-medium mb-2">{question.question_text}</p>
                          {question.question_type === 'multiple_choice' && question.options && (
                            <div className="text-sm text-muted-foreground mt-2">
                              <p className="font-medium mb-1">Opsi:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {question.options.slice(0, 2).map((opt, idx) => (
                                  <li key={idx}>{opt}</li>
                                ))}
                                {question.options.length > 2 && (
                                  <li className="text-xs">+{question.options.length - 2} opsi lainnya</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(question)}
                          disabled={deleteLoading === question.question_id}
                          data-testid={`delete-btn-${question.question_id}`}
                        >
                          {deleteLoading === question.question_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="delete-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Soal</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan.
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground">{selectedQuestion?.question_text}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-btn">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="confirm-delete-btn">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuestionBank;