import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { dbUpdate, dbGet } from '@/lib/firebase';
import { 
  User as UserIcon, Lock, Bell, Palette, Globe, Shield, 
  Save, Moon, Sun, Monitor, Check, AlertTriangle
} from 'lucide-react';

interface SettingsPanelProps {
  currentPage: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ currentPage }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dbUser, setDbUser] = useState<any>(null);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState({
    announcements: true,
    homework: true,
    grades: true,
    attendance: true
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) return;
      const path = user.role === 'admin' ? `users/${user.id}` : 
                   user.role === 'teacher' ? `teachers/${user.id}` : 
                   `students/${user.id}`;
      const data = await dbGet(path);
      setDbUser(data);
      if (data) {
        setProfileData({
          name: data.name || user.name || '',
          email: data.email || '',
          phone: data.phone || ''
        });
      }
    };
    fetchUser();
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      const path = user?.role === 'admin' ? `users/${user.id}` : 
                   user?.role === 'teacher' ? `teachers/${user.id}` : 
                   `students/${user.id}`;
      await dbUpdate(path, { ...profileData });
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  const handleChangePassword = async () => {
    if (!dbUser) return;

    if (user?.role !== 'admin' && dbUser.passwordChanged) {
      toast({ 
        title: "Permission Denied", 
        description: "You have already changed your password once. Contact admin to reset it.", 
        variant: "destructive" 
      });
      return;
    }

    if (passwordData.currentPassword !== dbUser.password) {
      toast({ title: "Error", description: "Current password is incorrect", variant: "destructive" });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    if (user?.role !== 'admin' && (passwordData.newPassword === dbUser.password || passwordData.newPassword === dbUser.oldPassword)) {
      toast({ title: "Error", description: "New password cannot be the same as old password", variant: "destructive" });
      return;
    }

    try {
      const path = user?.role === 'admin' ? `users/${user.id}` : 
                   user?.role === 'teacher' ? `teachers/${user.id}` : 
                   `students/${user.id}`;
      
      await dbUpdate(path, { 
        password: passwordData.newPassword,
        oldPassword: dbUser.password,
        passwordChanged: true
      });

      setDbUser({ ...dbUser, password: passwordData.newPassword, oldPassword: dbUser.password, passwordChanged: true });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({ title: "Success", description: "Password changed successfully. You cannot change it again." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to change password", variant: "destructive" });
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin': return 'Principal / Administrator';
      case 'teacher': return 'Teacher';
      case 'student': return 'Student';
      default: return 'User';
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-display font-bold">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card className="shadow-xl border-0 overflow-hidden">
        <div className="h-1.5 bg-gradient-primary" />
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
              <span className="font-display font-bold text-3xl text-primary-foreground">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user?.name}</h3>
              <p className="text-muted-foreground">{getRoleLabel()}</p>
              <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <Input 
                value={profileData.name} 
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <Input value={user?.username || ''} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email (optional)</label>
              <Input 
                type="email"
                value={profileData.email} 
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Phone (optional)</label>
              <Input 
                value={profileData.phone} 
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="Enter phone"
              />
            </div>
          </div>

          <Button className="bg-gradient-primary" onClick={handleSaveProfile}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="shadow-xl border-0 overflow-hidden">
        <div className="h-1.5 bg-gradient-gold" />
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Lock className="w-5 h-5 text-secondary" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Current Password</label>
              <Input 
                type="password"
                value={passwordData.currentPassword} 
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">New Password</label>
              <Input 
                type="password"
                value={passwordData.newPassword} 
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Confirm Password</label>
              <Input 
                type="password"
                value={passwordData.confirmPassword} 
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button variant="outline" onClick={handleChangePassword}>
            <Shield className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card className="shadow-xl border-0 overflow-hidden">
        <div className="h-1.5 bg-gradient-success" />
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Bell className="w-5 h-5 text-success" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                <div>
                  <p className="font-medium capitalize">{key}</p>
                  <p className="text-sm text-muted-foreground">Receive notifications for {key}</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [key]: !value })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card className="shadow-xl border-0 overflow-hidden">
        <div className="h-1.5 bg-gradient-warm" />
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Palette className="w-5 h-5 text-orange-500" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'light', icon: Sun, label: 'Light' },
              { value: 'dark', icon: Moon, label: 'Dark' },
              { value: 'system', icon: Monitor, label: 'System' }
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
                className={`p-4 rounded-xl border-2 transition-all ${theme === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${theme === value ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className={`text-sm font-medium ${theme === value ? 'text-primary' : ''}`}>{label}</p>
                {theme === value && <Check className="w-4 h-4 mx-auto mt-2 text-primary" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
