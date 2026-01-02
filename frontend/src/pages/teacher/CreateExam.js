import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, Check } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const CreateExam = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    token: '',
    settings: {
      shuffle_questions: false,
      shuffle_options: false
    }
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const response = await api.get('/questions/list');
      setQuestions(response.data);
    } catch (error) {
      toast.error('Gagal memuat bank soal');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const selectAllQuestions = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.question_id));
    }
  };

  const generateRandomToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 8; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleChange('token', token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Judul ujian tidak boleh kosong');
      return;
    }

    if (!formData.token.trim()) {
      toast.error('Token ujian tidak boleh kosong');
      return;
    }

    if (selectedQuestions.length === 0) {
      toast.error('Pilih minimal 1 soal untuk ujian');
      return;
    }

    if (formData.duration_minutes < 1) {
      toast.error('Durasi minimal 1 menit');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        duration_minutes: parseInt(formData.duration_minutes),
        token: formData.token,
        question_ids: selectedQuestions,
        settings: formData.settings
      };

      await api.post('/exams/create', payload);
      toast.success('Ujian berhasil dibuat');
      navigate('/teacher/exams');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal membuat ujian');
    } finally {
      setLoading(false);
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

  const totalPoints = questions
    .filter(q => selectedQuestions.includes(q.question_id))
    .reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="min-h-screen bg-background p-8" data-testid="create-exam-page">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-heading font-bold">Buat Ujian Baru</h2>
            <p className="text-muted-foreground">Setup ujian untuk siswa Anda</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/teacher/exams')}
            data-testid="back-btn"
          >
            Kembali
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Ujian</CardTitle>
                <CardDescription>Detail dasar tentang ujian</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Ujian *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Contoh: Ujian Tengah Semester Matematika"
                    required
                    data-testid="title-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Deskripsi singkat tentang ujian..."
                    rows={3}
                    data-testid="description-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Durasi (Menit) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => handleChange('duration_minutes', e.target.value)}
                      min="1"
                      max="300"
                      required
                      data-testid="duration-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="token">Token Ujian *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="token"
                        value={formData.token}
                        onChange={(e) => handleChange('token', e.target.value.toUpperCase())}
                        placeholder="TEST123"
                        required
                        data-testid="token-input"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateRandomToken}
                        data-testid="generate-token-btn"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pilih Soal</CardTitle>
                    <CardDescription>
                      {selectedQuestions.length} soal dipilih - Total {totalPoints} poin
                    </CardDescription>
                  </div>
                  {questions.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllQuestions}
                      data-testid="select-all-btn"
                    >
                      {selectedQuestions.length === questions.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingQuestions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      Belum ada soal di bank soal. Buat soal terlebih dahulu.
                    </p>
                    <Button
                      type="button"
                      onClick={() => navigate('/teacher/questions/create')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Buat Soal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {questions.map((question) => {
                      const isSelected = selectedQuestions.includes(question.question_id);
                      return (
                        <div
                          key={question.question_id}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => toggleQuestionSelection(question.question_id)}
                          data-testid={`question-item-${question.question_id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {isSelected ? (
                                <div className="h-5 w-5 rounded bg-primary flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              ) : (
                                <div className="h-5 w-5 rounded border-2 border-muted-foreground"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getTypeBadgeColor(question.question_type)}>
                                  {getTypeLabel(question.question_type)}
                                </Badge>
                                <Badge variant="outline">{question.points} poin</Badge>
                              </div>
                              <p className="font-medium text-sm">{question.question_text}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Settings & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Ujian</CardTitle>
                <CardDescription>Konfigurasi tambahan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shuffle_questions"
                    checked={formData.settings.shuffle_questions}
                    onCheckedChange={(checked) => handleSettingChange('shuffle_questions', checked)}
                    data-testid="shuffle-questions-checkbox"
                  />
                  <Label
                    htmlFor="shuffle_questions"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Acak urutan soal
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shuffle_options"
                    checked={formData.settings.shuffle_options}
                    onCheckedChange={(checked) => handleSettingChange('shuffle_options', checked)}
                    data-testid="shuffle-options-checkbox"
                  />
                  <Label
                    htmlFor="shuffle_options"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Acak opsi jawaban
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ringkasan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Soal dipilih:</span>
                  <span className="font-medium">{selectedQuestions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total poin:</span>
                  <span className="font-medium">{totalPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durasi:</span>
                  <span className="font-medium">{formData.duration_minutes} menit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token:</span>
                  <span className="font-mono font-medium">{formData.token || '-'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || selectedQuestions.length === 0}
                    data-testid="submit-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Membuat Ujian...
                      </>
                    ) : (
                      'Buat Ujian'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/teacher/exams')}
                    disabled={loading}
                    data-testid="cancel-btn"
                  >
                    Batal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExam;
