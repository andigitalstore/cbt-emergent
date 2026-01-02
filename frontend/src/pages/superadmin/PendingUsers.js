import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserCheck, UserX, Loader2, RefreshCw } from 'lucide-react';
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="pending-users-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold">Pending Users</h2>
          <p className="text-muted-foreground">Kelola pendaftaran guru yang menunggu approval</p>
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCheck className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Pending Users</h3>
            <p className="text-sm text-muted-foreground text-center">
              Semua pendaftaran guru telah diproses
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Guru Pending</CardTitle>
            <CardDescription>
              {pendingUsers.length} guru menunggu approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.user_id} data-testid={`user-row-${user.user_id}`}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="default"
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
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(user, 'reject')}
                        disabled={actionLoading === user.user_id}
                        data-testid={`reject-btn-${user.user_id}`}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent data-testid="confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve User' : 'Reject User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' ? (
                <span>
                  Apakah Anda yakin ingin approve <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>? 
                  User akan dapat login dan menggunakan sistem.
                </span>
              ) : (
                <span>
                  Apakah Anda yakin ingin reject <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>? 
                  User tidak akan dapat login ke sistem.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-btn">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} data-testid="confirm-action-btn">
              {actionType === 'approve' ? 'Ya, Approve' : 'Ya, Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PendingUsers;