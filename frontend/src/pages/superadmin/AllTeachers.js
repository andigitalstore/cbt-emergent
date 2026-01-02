import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Loader2, Search, RefreshCw, Crown, School, Calendar, TrendingUp } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const AllTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = teachers.filter(teacher => 
        teacher.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (teacher.school_name && teacher.school_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers(teachers);
    }
  }, [searchQuery, teachers]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/superadmin/all-teachers');
      setTeachers(response.data);
      setFilteredTeachers(response.data);
    } catch (error) {
      toast.error('Gagal memuat data teachers');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTierBadge = (tier) => {
    if (tier === 'pro') {
      return (
        <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-0">
          <Crown className="h-3 w-3 mr-1" />
          PRO
        </Badge>
      );
    }
    return <Badge variant="secondary">FREE</Badge>;
  };

  const getStatusBadge = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-700 border-green-200',
      'expired': 'bg-red-100 text-red-700 border-red-200'
    };
    return (
      <Badge className={colors[status] || 'bg-slate-100 text-slate-700 border-slate-200'}>
        {status}
      </Badge>
    );
  };

  const getInitials = (userId) => {
    return userId.substring(0, 2).toUpperCase();
  };

  const stats = {
    total: teachers.length,
    pro: teachers.filter(t => t.subscription_tier === 'pro').length,
    free: teachers.filter(t => t.subscription_tier === 'free').length,
    active: teachers.filter(t => t.subscription_status === 'active').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" data-testid="all-teachers-page">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-heading font-bold">Semua Guru</h2>
            <p className="text-muted-foreground">Kelola dan monitor guru yang terdaftar</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari guru..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="search-input"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTeachers}
              data-testid="refresh-btn"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Guru</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.pro}</p>
                  <p className="text-xs text-muted-foreground">Pro Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.free}</p>
                  <p className="text-xs text-muted-foreground">Free Tier</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active Subs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teachers Grid */}
        {filteredTeachers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'Tidak ada guru yang ditemukan' : 'Belum ada guru terdaftar'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => (
              <Card key={teacher.user_id} className="hover:shadow-lg transition-shadow" data-testid={`teacher-card-${teacher.user_id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarFallback className={`font-semibold text-lg ${
                        teacher.subscription_tier === 'pro' 
                          ? 'bg-gradient-to-br from-primary/20 to-secondary/20 text-primary' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {getInitials(teacher.user_id)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTierBadge(teacher.subscription_tier)}
                        {getStatusBadge(teacher.subscription_status)}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {teacher.user_id.substring(0, 18)}...
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {teacher.school_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <School className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate font-medium">{teacher.school_name}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Quota Soal</p>
                      <p className="text-lg font-bold">
                        {teacher.quota_questions === 999999 ? '∞' : teacher.quota_questions}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Quota Siswa</p>
                      <p className="text-lg font-bold">
                        {teacher.quota_students === 999999 ? '∞' : teacher.quota_students}
                      </p>
                    </div>
                  </div>

                  {teacher.subscription_end_date && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <Calendar className="h-3 w-3" />
                      <span>Berakhir: {formatDate(teacher.subscription_end_date)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTeachers;
