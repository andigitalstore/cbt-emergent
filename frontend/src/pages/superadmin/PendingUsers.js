import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserCheck, UserX, Loader2, RefreshCw, Mail, School, Calendar, User } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const PendingUsers = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/superadmin/pending-users');
      setPendingUsers(response.data);
    } catch (error) {
      toast.error('Gagal memuat data pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setShowDialog(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;
    
    setActionLoading(selectedUser.user_id);
    try {
      const endpoint = actionType === 'approve' 
        ? `/superadmin/approve-user/${selectedUser.user_id}`
        : `/superadmin/reject-user/${selectedUser.user_id}`;
      
      await api.post(endpoint);
      toast.success(`User berhasil di${actionType === 'approve' ? 'approve' : 'reject'}`);
      fetchPendingUsers();
    } catch (error) {
      toast.error(`Gagal ${actionType} user`);
    } finally {
      setActionLoading(null);
      setShowDialog(false);
      setSelectedUser(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" data-testid="pending-users-page">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-heading font-bold">Pending Approvals</h2>
            <p className="text-muted-foreground">Review dan approve pendaftaran guru baru</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPendingUsers}
            data-testid="refresh-btn"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {pendingUsers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <UserCheck className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Semua Bersih!</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Tidak ada guru yang menunggu approval. Semua pendaftaran telah diproses.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Banner */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-900">{pendingUsers.length}</p>
                    <p className="text-sm text-amber-700">Guru menunggu approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Users Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingUsers.map((user) => (
                <Card key={user.user_id} className="hover:shadow-lg transition-shadow" data-testid={`user-card-${user.user_id}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {getInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                          {user.first_name} {user.last_name}
                        </h3>
                        <Badge variant="secondary" className="mt-1">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Daftar: {formatDate(user.created_at)}</span>
                    </div>

                    <div className="pt-4 flex gap-2">
                      <Button
                        className="flex-1 rounded-full"
                        onClick={() => handleAction(user, 'approve')}
                        disabled={actionLoading === user.user_id}
                        data-testid={`approve-btn-${user.user_id}`}
                      >
                        {actionLoading === user.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => handleAction(user, 'reject')}
                        disabled={actionLoading === user.user_id}
                        data-testid={`reject-btn-${user.user_id}`}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent data-testid="confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <>
                  <UserCheck className="h-5 w-5 text-green-600" />
                  Approve User
                </>
              ) : (
                <>
                  <UserX className="h-5 w-5 text-red-600" />
                  Reject User
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' ? (
                <div className="space-y-2">
                  <p>Apakah Anda yakin ingin approve <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?</p>
                  <div className="p-3 bg-green-50 rounded-lg text-green-900 text-sm">
                    User akan dapat login dan menggunakan sistem dengan paket Free (20 soal, 10 siswa).
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>Apakah Anda yakin ingin reject <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?</p>
                  <div className="p-3 bg-red-50 rounded-lg text-red-900 text-sm">
                    User tidak akan dapat login ke sistem dan perlu mendaftar ulang.
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-btn">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              className={actionType === 'reject' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              data-testid="confirm-action-btn"
            >
              {actionType === 'approve' ? 'Ya, Approve' : 'Ya, Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PendingUsers;
