import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Crown, TrendingUp, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { toast } from 'sonner';

const SuperadminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingUsers: 0,
    totalTeachers: 0,
    proTeachers: 0,
    activeSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [pendingResponse, teachersResponse] = await Promise.all([
        api.get('/superadmin/pending-users'),
        api.get('/superadmin/all-teachers')
      ]);

      setStats({
        pendingUsers: pendingResponse.data.length,
        totalTeachers: teachersResponse.data.length,
        proTeachers: teachersResponse.data.filter(t => t.subscription_tier === 'pro').length,
        activeSubscriptions: teachersResponse.data.filter(t => t.subscription_status === 'active' && t.subscription_tier === 'pro').length
      });
    } catch (error) {
      toast.error('Gagal memuat statistik');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Pending Users',
      description: `${stats.pendingUsers} guru menunggu approval`,
      icon: UserCheck,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      action: () => navigate('/superadmin/pending-users'),
      testId: 'pending-users-card'
    },
    {
      title: 'Semua Guru',
      description: `${stats.totalTeachers} guru terdaftar`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => navigate('/superadmin/teachers'),
      testId: 'all-teachers-card'
    }
  ];

  return (
    <div className="min-h-screen bg-background p-8" data-testid="superadmin-dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-heading font-bold">Dashboard Superadmin</h1>
            <p className="text-muted-foreground mt-1">Selamat datang, {user?.first_name}!</p>
          </div>
          <Button
            onClick={logout}
            variant="destructive"
            data-testid="logout-btn"
          >
            Logout
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card data-testid="stat-pending">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Guru Pending</p>
                <UserCheck className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-3xl font-bold">{stats.pendingUsers}</p>
              <p className="text-xs text-muted-foreground mt-1">Menunggu approval</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-total">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Guru</p>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold">{stats.totalTeachers}</p>
              <p className="text-xs text-muted-foreground mt-1">Guru aktif</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-pro">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Pro Members</p>
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-primary">{stats.proTeachers}</p>
              <p className="text-xs text-muted-foreground mt-1">Guru premium</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-revenue">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">
                Rp {(stats.activeSubscriptions * 500000).toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Dari {stats.activeSubscriptions} langganan</p>
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
            <CardTitle>Platform Info</CardTitle>
            <CardDescription>Informasi tentang CBT Pro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Paket Free</span>
              <span className="text-sm font-medium">20 Soal, 10 Siswa</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Paket Pro</span>
              <span className="text-sm font-medium">Rp 500.000 / bulan</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Fitur Pro</span>
              <span className="text-sm font-medium">Unlimited Soal & Siswa</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Payment Gateway</span>
              <span className="text-sm font-medium">Midtrans (Sandbox)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperadminDashboard;