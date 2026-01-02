import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import './App.css';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ExamPage from './pages/ExamPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Import superadmin pages
import SuperadminDashboard from './pages/superadmin/SuperadminDashboard';
import PendingUsers from './pages/superadmin/PendingUsers';
import AllTeachers from './pages/superadmin/AllTeachers';

// Placeholder component for teacher dashboard
const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold">Dashboard Guru</h1>
            <p className="text-muted-foreground">Selamat datang, {user?.first_name}!</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90"
          >
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-2">Bank Soal</h3>
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground">Soal tersimpan</p>
          </div>
          
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-2">Ujian Aktif</h3>
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground">Ujian berjalan</p>
          </div>
          
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-2">Total Siswa</h3>
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground">Mengikuti ujian</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-white rounded-xl border shadow-sm">
          <h2 className="text-xl font-heading font-semibold mb-4">Fitur Akan Datang</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Manajemen Bank Soal</li>
            <li>• Buat & Kelola Ujian</li>
            <li>• Live Monitoring Siswa</li>
            <li>• Export Hasil ke CSV</li>
            <li>• Berlangganan Paket Premium</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/exam/:sessionId" element={<ExamPage />} />
            
            <Route
              path="/teacher/*"
              element={
                <ProtectedRoute allowedRoles={['guru']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/superadmin/*"
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <SuperadminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
