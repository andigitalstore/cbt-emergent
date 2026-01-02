import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, BookOpen } from 'lucide-react';
import api from '../lib/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    student_name: '',
    student_class: '',
    token: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/student/start-exam', formData);
      localStorage.setItem('exam_session', JSON.stringify(response.data));
      navigate(`/exam/${response.data.session_id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Token tidak valid atau ujian tidak tersedia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-primary mb-4">
            CBT Pro
          </h1>
          <p className="text-lg text-muted-foreground">
            Sistem Ujian Berbasis Komputer yang Modern dan Aman
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <Card className="shadow-lg" data-testid="student-login-card">
            <CardHeader>
              <CardTitle className="text-2xl font-heading">Masuk Ujian</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4" data-testid="error-alert">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student_name">Nama Lengkap</Label>
                  <Input
                    id="student_name"
                    value={formData.student_name}
                    onChange={(e) => handleChange('student_name', e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Masukkan nama lengkap"
                    data-testid="student-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student_class">Kelas</Label>
                  <Input
                    id="student_class"
                    value={formData.student_class}
                    onChange={(e) => handleChange('student_class', e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Contoh: 12 IPA 1"
                    data-testid="student-class-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token">Token Ujian</Label>
                  <Input
                    id="token"
                    value={formData.token}
                    onChange={(e) => handleChange('token', e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Masukkan token dari guru"
                    data-testid="token-input"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full"
                  disabled={loading}
                  data-testid="start-exam-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memvalidasi...
                    </>
                  ) : (
                    'Mulai Ujian'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-md border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-heading font-semibold text-lg mb-3">Untuk Guru</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Buat dan kelola ujian dengan mudah. Daftar atau masuk untuk memulai.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full"
                    onClick={() => navigate('/login')}
                    data-testid="teacher-login-btn"
                  >
                    Masuk
                  </Button>
                  <Button
                    className="flex-1 rounded-full"
                    onClick={() => navigate('/register')}
                    data-testid="teacher-register-btn"
                  >
                    Daftar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardContent className="pt-6">
                <h3 className="font-heading font-semibold text-lg mb-3">Fitur Unggulan</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Mode fullscreen dengan timer otomatis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Anti-cheat: Deteksi pergantian tab</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Jawaban tersimpan otomatis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Monitoring real-time untuk guru</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;