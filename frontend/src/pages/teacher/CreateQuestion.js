import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const CreateQuestion = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 10
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index) => {
    if (formData.options.length <= 2) {
      toast.error('Minimal harus ada 2 opsi');
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.question_text.trim()) {
      toast.error('Pertanyaan tidak boleh kosong');
      return;
    }

    if (formData.question_type === 'multiple_choice') {
      const validOptions = formData.options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        toast.error('Minimal harus ada 2 opsi jawaban');
        return;
      }
      if (!formData.correct_answer.trim()) {
        toast.error('Pilih jawaban yang benar');
        return;
      }
    }

    if (!formData.correct_answer.trim()) {
      toast.error('Jawaban tidak boleh kosong');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        question_text: formData.question_text,
        question_type: formData.question_type,
        options: formData.question_type === 'multiple_choice' 
          ? formData.options.filter(opt => opt.trim())
          : null,
        correct_answer: formData.correct_answer,
        points: parseInt(formData.points)
      };

      await api.post('/questions/create', payload);
      toast.success('Soal berhasil dibuat');
      navigate('/teacher/questions');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal membuat soal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8" data-testid="create-question-page">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-heading font-bold">Buat Soal Baru</h2>
            <p className="text-muted-foreground">Tambahkan soal ke bank soal Anda</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/teacher/questions')}
            data-testid="back-btn"
          >
            Kembali
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Detail Soal</CardTitle>
              <CardDescription>Isi informasi soal dengan lengkap</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Type */}
              <div className="space-y-2">
                <Label htmlFor="question_type">Tipe Soal</Label>
                <Select
                  value={formData.question_type}
                  onValueChange={(value) => {
                    handleChange('question_type', value);
                    handleChange('correct_answer', '');
                  }}
                  data-testid="question-type-select"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                    <SelectItem value="sentence_order">Susun Kalimat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <Label htmlFor="question_text">Pertanyaan *</Label>
                <Textarea
                  id="question_text"
                  value={formData.question_text}
                  onChange={(e) => handleChange('question_text', e.target.value)}
                  placeholder="Tuliskan pertanyaan..."
                  rows={4}
                  required
                  data-testid="question-text-input"
                />
              </div>

              {/* Multiple Choice Options */}
              {formData.question_type === 'multiple_choice' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Opsi Jawaban *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      data-testid="add-option-btn"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Opsi
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Opsi ${index + 1}`}
                          data-testid={`option-input-${index}`}
                        />
                        {formData.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index)}
                            data-testid={`remove-option-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Correct Answer */}
              <div className="space-y-2">
                <Label htmlFor="correct_answer">
                  Jawaban yang Benar *
                  {formData.question_type === 'multiple_choice' && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Salin persis dari opsi di atas)
                    </span>
                  )}
                </Label>
                {formData.question_type === 'multiple_choice' ? (
                  <Select
                    value={formData.correct_answer}
                    onValueChange={(value) => handleChange('correct_answer', value)}
                    data-testid="correct-answer-select"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jawaban yang benar" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.options.filter(opt => opt.trim()).map((option, index) => (
                        <SelectItem key={index} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Textarea
                    id="correct_answer"
                    value={formData.correct_answer}
                    onChange={(e) => handleChange('correct_answer', e.target.value)}
                    placeholder={
                      formData.question_type === 'essay' 
                        ? 'Kunci jawaban essay (untuk referensi guru)' 
                        : 'Contoh: A-B-C-D'
                    }
                    rows={3}
                    required
                    data-testid="correct-answer-input"
                  />
                )}
              </div>

              {/* Points */}
              <div className="space-y-2">
                <Label htmlFor="points">Poin</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={(e) => handleChange('points', e.target.value)}
                  min="1"
                  max="100"
                  required
                  data-testid="points-input"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/teacher/questions')}
                  disabled={loading}
                  data-testid="cancel-btn"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  data-testid="submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Soal'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default CreateQuestion;
