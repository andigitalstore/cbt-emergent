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
import ExamResultPage from './pages/ExamResultPage';

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

// Import teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import QuestionBank from './pages/teacher/QuestionBank';
import CreateQuestion from './pages/teacher/CreateQuestion';
import ExamsList from './pages/teacher/ExamsList';
import CreateExam from './pages/teacher/CreateExam';
import LiveMonitor from './pages/teacher/LiveMonitor';
import ExamResults from './pages/teacher/ExamResults';
import SubscriptionPage from './pages/teacher/SubscriptionPage';

// Import superadmin pages
import SuperadminDashboard from './pages/superadmin/SuperadminDashboard';
import PendingUsers from './pages/superadmin/PendingUsers';
import AllTeachers from './pages/superadmin/AllTeachers';

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
                  <Routes>
                    <Route index element={<TeacherDashboard />} />
                    <Route path="questions" element={<QuestionBank />} />
                    <Route path="questions/create" element={<CreateQuestion />} />
                    <Route path="exams" element={<ExamsList />} />
                    <Route path="exams/create" element={<CreateExam />} />
                    <Route path="exams/:examId/monitor" element={<LiveMonitor />} />
                  </Routes>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/superadmin/*"
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <Routes>
                    <Route index element={<SuperadminDashboard />} />
                    <Route path="pending-users" element={<PendingUsers />} />
                    <Route path="teachers" element={<AllTeachers />} />
                  </Routes>
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
