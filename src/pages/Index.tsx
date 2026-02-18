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

  useEffect(() => {
    setCurrentPage('dashboard');
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id) return;
    (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
    (window as any).OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        await OneSignal.login(user.id);
        await OneSignal.User.addTag("role", user.role);
        if (user.classId) {
          await OneSignal.User.addTag("classId", user.classId);
        }
        await OneSignal.Notifications.requestPermission(true);
      } catch (error) {
        console.error('OneSignal user setup failed', error);
      }
    });
  }, [user?.id, user?.role, user?.classId]);

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
