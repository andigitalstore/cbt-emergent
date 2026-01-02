import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMidtransSnap } from '../../hooks/useMidtransSnap';
import api from '../../lib/api';
import { toast } from 'sonner';

const SubscriptionPage = () => {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const { openSnapPayment } = useMidtransSnap();
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchTeacherInfo();
  }, []);

  const fetchTeacherInfo = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/me');
      setTeacherInfo(response.data.teacher_info);
    } catch (error) {
      toast.error('Gagal memuat informasi langganan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const response = await api.post('/subscription/create', {
        teacher_id: user.user_id,
        plan_tier: 'pro'
      });

      const snapToken = response.data.snap_token;

      // Open Midtrans Snap payment
      openSnapPayment(
        snapToken,
        async () => {
          toast.success('Pembayaran berhasil! Akun Anda akan segera diupgrade.');
          await checkAuth();
          fetchTeacherInfo();
        },
        () => {
          toast.error('Pembayaran gagal atau dibatalkan');
        }
      );
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal membuat transaksi');
    } finally {
      setSubscribing(false);
    }
  };

  const freePlanFeatures = [
    '20 Soal maksimal',
    '10 Siswa maksimal',
    'Semua tipe soal (Pilihan Ganda, Essay, Susun Kalimat)',
    'Live monitoring siswa',
    'Export hasil ke CSV',
    'Anti-cheat system'
  ];

  const proPlanFeatures = [
    'Unlimited Soal',
    'Unlimited Siswa',
    'Semua tipe soal (Pilihan Ganda, Essay, Susun Kalimat)',
    'Live monitoring siswa',
    'Export hasil ke CSV',
    'Anti-cheat system',
    'Prioritas customer support',
    'Akses fitur beta terbaru'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPro = teacherInfo?.subscription_tier === 'pro';
  const isActive = teacherInfo?.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-orange-50 p-4 md:p-8" data-testid="subscription-page">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4">
            Upgrade ke <span className="text-primary">CBT Pro</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Dapatkan akses unlimited untuk semua fitur dan tingkatkan pengalaman ujian Anda
          </p>
        </div>

        {/* Current Status */}
        {isPro && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Crown className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold text-lg">Status Langganan: Pro</p>
                    <p className="text-sm text-muted-foreground">
                      Berakhir: {teacherInfo.subscription_end_date 
                        ? new Date(teacherInfo.subscription_end_date).toLocaleDateString('id-ID')
                        : '-'
                      }
                    </p>
                  </div>
                </div>
                <Badge className="px-4 py-2 bg-green-100 text-green-700 border-green-200">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Aktif
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card className={!isPro ? 'border-primary/50' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">Free</CardTitle>
                {!isPro && <Badge>Current Plan</Badge>}
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold">Rp 0</span>
                <span className="text-muted-foreground"> / bulan</span>
              </div>
              <CardDescription>Cocok untuk mencoba CBT Pro</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {freePlanFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                variant="outline" 
                className="w-full" 
                disabled
              >
                Paket Saat Ini
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={`relative ${isPro ? 'border-primary/50' : 'border-primary shadow-lg'}`}>
            {!isPro && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="px-4 py-1 bg-primary text-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Paling Populer
                </Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Crown className="h-6 w-6 text-primary" />
                  Pro
                </CardTitle>
                {isPro && <Badge className="bg-primary">Current Plan</Badge>}
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold">Rp 500.000</span>
                <span className="text-muted-foreground"> / bulan</span>
              </div>
              <CardDescription>Untuk guru yang serius dengan ujian digital</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {proPlanFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              {isPro ? (
                <Button className="w-full" disabled>
                  <Crown className="h-4 w-4 mr-2" />
                  Langganan Aktif
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  data-testid="subscribe-btn"
                >
                  {subscribing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade ke Pro
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FAQ or Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Mengapa Upgrade ke Pro?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg">
                <h3 className="font-semibold mb-2">Unlimited Access</h3>
                <p className="text-sm text-muted-foreground">
                  Buat soal dan ujian tanpa batas untuk semua kelas Anda
                </p>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg">
                <h3 className="font-semibold mb-2">Hemat Waktu</h3>
                <p className="text-sm text-muted-foreground">
                  Sistem otomatis untuk penilaian dan monitoring real-time
                </p>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg">
                <h3 className="font-semibold mb-2">Support Prioritas</h3>
                <p className="text-sm text-muted-foreground">
                  Dapatkan bantuan cepat dari tim kami kapan saja
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/teacher')}
            data-testid="back-btn"
          >
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
