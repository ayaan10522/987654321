import { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import DashboardLayout from '@/components/DashboardLayout';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import TeacherDashboard from '@/components/dashboards/TeacherDashboard';
import StudentDashboard from '@/components/dashboards/StudentDashboard';
import SocialMediaPopup from '@/components/SocialMediaPopup';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Reset to dashboard when user changes
  useEffect(() => {
    setCurrentPage('dashboard');
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary font-display text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard currentPage={currentPage} />;
      case 'teacher':
        return <TeacherDashboard currentPage={currentPage} />;
      case 'student':
        return <StudentDashboard currentPage={currentPage} />;
      default:
        return null;
    }
  };

  return (
    <>
      <DashboardLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderDashboard()}
      </DashboardLayout>
      <SocialMediaPopup />
    </>
  );
};

const Index: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
