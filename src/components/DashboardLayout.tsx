import React, { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import crescentLogo from '@/assets/crescent-logo.jpg';
import { 
  LogOut, 
  Home, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  ClipboardList,
  FileText,
  Bell,
  Megaphone,
  Menu,
  X,
  ChevronRight,
  Settings,
  BarChart3,
  Clock
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getNavItems = (): NavItem[] => {
    switch (user?.role) {
      case 'admin':
        return [
          { label: 'Dashboard', icon: <Home className="w-5 h-5" />, path: 'dashboard' },
          { label: 'Announcements', icon: <Megaphone className="w-5 h-5" />, path: 'announcements' },
          { label: 'Teachers', icon: <Users className="w-5 h-5" />, path: 'teachers' },
          { label: 'Classes', icon: <BookOpen className="w-5 h-5" />, path: 'classes' },
          { label: 'Students', icon: <GraduationCap className="w-5 h-5" />, path: 'students' },
          { label: 'Timetable', icon: <Clock className="w-5 h-5" />, path: 'timetable' },
          { label: 'Reports', icon: <BarChart3 className="w-5 h-5" />, path: 'reports' },
        ];
      case 'teacher':
        return [
          { label: 'Dashboard', icon: <Home className="w-5 h-5" />, path: 'dashboard' },
          { label: 'My Classes', icon: <BookOpen className="w-5 h-5" />, path: 'classes' },
          { label: 'Attendance', icon: <Calendar className="w-5 h-5" />, path: 'attendance' },
          { label: 'Homework', icon: <ClipboardList className="w-5 h-5" />, path: 'homework' },
          { label: 'Grades', icon: <FileText className="w-5 h-5" />, path: 'grades' },
          { label: 'Announcements', icon: <Megaphone className="w-5 h-5" />, path: 'announcements' },
        ];
      case 'student':
        return [
          { label: 'Dashboard', icon: <Home className="w-5 h-5" />, path: 'dashboard' },
          { label: 'My Schedule', icon: <Clock className="w-5 h-5" />, path: 'schedule' },
          { label: 'Attendance', icon: <Calendar className="w-5 h-5" />, path: 'attendance' },
          { label: 'Homework', icon: <ClipboardList className="w-5 h-5" />, path: 'homework' },
          { label: 'Grades', icon: <FileText className="w-5 h-5" />, path: 'grades' },
          { label: 'Announcements', icon: <Bell className="w-5 h-5" />, path: 'announcements' },
        ];
      default:
        return [];
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin': return 'Principal';
      case 'teacher': return 'Teacher';
      case 'student': return 'Student';
      default: return 'User';
    }
  };

  const getRoleBadgeClass = () => {
    switch (user?.role) {
      case 'admin': return 'bg-secondary text-secondary-foreground';
      case 'teacher': return 'bg-primary text-primary-foreground';
      case 'student': return 'bg-green-light text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const navItems = getNavItems();

  const handleNavigate = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between shadow-elegant">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-secondary/30 rounded-full blur-md"></div>
            <img 
              src={crescentLogo} 
              alt="Crescent School" 
              className="relative w-10 h-10 object-contain rounded-full border-2 border-secondary"
            />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground">Crescent</h1>
            <p className="text-xs text-muted-foreground">School Portal</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-foreground hover:bg-muted"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute top-16 left-0 right-0 bg-card border-b border-border shadow-xl max-h-[calc(100vh-4rem)] overflow-auto animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Info */}
            <div className="p-4 bg-muted/30 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
                  <span className="font-display font-bold text-lg text-primary-foreground">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-foreground">{user?.name}</p>
                  <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeClass()}`}>
                    {getRoleLabel()}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-1">
              {navItems.map((item, index) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 animate-fade-in ${
                    currentPage === item.path
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-foreground hover:bg-muted'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-destructive text-destructive-foreground">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
              <Button 
                variant="outline" 
                className="w-full border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-gradient-primary transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        }`}>
          {/* Logo Section */}
          <div className="p-5 border-b border-sidebar-border/30">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-secondary/40 rounded-full blur-md"></div>
                <img 
                  src={crescentLogo} 
                  alt="Crescent School" 
                  className="relative w-12 h-12 object-contain rounded-full border-2 border-secondary shadow-gold"
                />
              </div>
              {!sidebarCollapsed && (
                <div className="animate-fade-in">
                  <h1 className="font-display font-bold text-xl text-sidebar-foreground leading-tight">
                    Crescent
                  </h1>
                  <p className="text-xs text-sidebar-foreground/60">School Portal</p>
                </div>
              )}
            </div>
          </div>

          {/* User Profile */}
          <div className={`p-4 border-b border-sidebar-border/30 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
            {sidebarCollapsed ? (
              <div className="w-10 h-10 rounded-xl bg-sidebar-accent flex items-center justify-center">
                <span className="font-display font-bold text-sidebar-foreground">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50 backdrop-blur-sm">
                <div className="w-11 h-11 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-gold">
                  <span className="font-display font-bold text-sidebar-primary-foreground">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-sidebar-foreground truncate">{user?.name}</p>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeClass()}`}>
                    {getRoleLabel()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-auto custom-scrollbar">
            {navItems.map((item, index) => (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`nav-item w-full group ${
                  currentPage === item.path ? 'active' : 'text-sidebar-foreground/80 hover:text-sidebar-foreground'
                } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className={`transition-transform duration-200 ${currentPage === item.path ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <>
                    <span className="font-medium flex-1 text-left">{item.label}</span>
                    {currentPage === item.path && (
                      <ChevronRight className="w-4 h-4 animate-fade-in" />
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="p-3 border-t border-sidebar-border/30 space-y-2">
            {/* Collapse Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
            >
              <Settings className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              {!sidebarCollapsed && <span className="text-sm">Collapse Menu</span>}
            </button>
            
            {/* Logout */}
            <button
              onClick={logout}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-all ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <LogOut className="w-5 h-5" />
              {!sidebarCollapsed && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}>
          {/* Top Bar - Desktop */}
          <header className="hidden lg:flex bg-card/80 backdrop-blur-xl border-b border-border px-8 py-4 items-center justify-between shadow-sm sticky top-0 z-30">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground capitalize">
                {currentPage.replace('-', ' ')}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Welcome back, {user?.name?.split(' ')[0]}
              </p>
            </div>
            <div className="flex items-center gap-6">
              {/* Time & Date */}
              <div className="text-right">
                <p className="text-lg font-semibold text-foreground">{currentTime}</p>
                <p className="text-xs text-muted-foreground">{currentDate}</p>
              </div>
              {/* Divider */}
              <div className="w-px h-10 bg-border"></div>
              {/* Quick Stats */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <span className="text-sm font-medium text-muted-foreground">Online</span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 lg:p-8 pt-20 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
