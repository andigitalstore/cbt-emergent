import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Loader2, Search, RefreshCw, Crown } from 'lucide-react';
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTierColor = (tier) => {
    return tier === 'pro' 
      ? 'bg-primary/10 text-primary border-primary/20' 
      : 'bg-slate-100 text-slate-600 border-slate-200';
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
    <div className="space-y-6" data-testid="all-teachers-page">
      <div>
        <h2 className="text-3xl font-heading font-bold">Semua Guru</h2>
        <p className="text-muted-foreground">Kelola dan monitor guru yang terdaftar</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Guru</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pro Members</p>
                <p className="text-2xl font-bold text-primary">{stats.pro}</p>
              </div>
              <Crown className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Free Tier</p>
                <p className="text-2xl font-bold">{stats.free}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Subs</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Guru Terdaftar</CardTitle>
              <CardDescription>{filteredTeachers.length} guru</CardDescription>
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
        </CardHeader>
        <CardContent>
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'Tidak ada guru yang ditemukan' : 'Belum ada guru terdaftar'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Sekolah</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quota Soal</TableHead>
                  <TableHead>Quota Siswa</TableHead>
                  <TableHead>Akhir Langganan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.user_id} data-testid={`teacher-row-${teacher.user_id}`}>
                    <TableCell className="font-mono text-xs">
                      {teacher.user_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{teacher.school_name || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getTierColor(teacher.subscription_tier)}>
                        {teacher.subscription_tier === 'pro' && <Crown className="h-3 w-3 mr-1" />}
                        {teacher.subscription_tier.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(teacher.subscription_status)}>
                        {teacher.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {teacher.quota_questions === 999999 ? '∞' : teacher.quota_questions}
                    </TableCell>
                    <TableCell>
                      {teacher.quota_students === 999999 ? '∞' : teacher.quota_students}
                    </TableCell>
                    <TableCell>
                      {formatDate(teacher.subscription_end_date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllTeachers;