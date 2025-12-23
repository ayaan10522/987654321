import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { initializeAdmin } from '@/lib/firebase';
import crescentLogo from '@/assets/crescent-logo.jpg';
import { User, GraduationCap, Shield, Eye, EyeOff, Sparkles, BookOpen, Users } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { login } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    initializeAdmin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const result = await login(username, password);
    setIsLoading(false);

    if (!result.success) {
      toast({
        title: "Login Failed",
        description: result.error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome!",
        description: "Successfully logged in to Crescent School Portal"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pattern-dots opacity-50"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-green-light/5 rounded-full blur-2xl"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 animate-float hidden lg:block">
        <div className="w-16 h-16 rounded-2xl bg-secondary/20 backdrop-blur-sm flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-secondary" />
        </div>
      </div>
      <div className="absolute bottom-32 left-20 animate-float hidden lg:block" style={{ animationDelay: '1s' }}>
        <div className="w-14 h-14 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center">
          <GraduationCap className="w-7 h-7 text-primary" />
        </div>
      </div>
      <div className="absolute top-1/3 right-32 animate-float hidden lg:block" style={{ animationDelay: '2s' }}>
        <div className="w-12 h-12 rounded-xl bg-gold/20 backdrop-blur-sm flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-gold" />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-secondary/30 rounded-full blur-lg animate-pulse-slow"></div>
              <img 
                src={crescentLogo} 
                alt="Crescent School Logo" 
                className="relative w-14 h-14 object-contain rounded-full border-2 border-secondary shadow-gold"
              />
            </div>
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Crescent School
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Excellence in Education</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center px-4 py-8 min-h-[calc(100vh-180px)]">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl overflow-hidden animate-fade-in bg-card/80 backdrop-blur-xl">
            {/* Card Header with Gradient */}
            <div className="bg-gradient-primary p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-50"></div>
              <div className="relative">
                <div className="mx-auto w-24 h-24 rounded-full bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center mb-4 border border-primary-foreground/20">
                  <img 
                    src={crescentLogo} 
                    alt="Crescent School" 
                    className="w-16 h-16 object-contain rounded-full"
                  />
                </div>
                <h2 className="text-2xl font-display font-bold text-primary-foreground">
                  Welcome Back
                </h2>
                <p className="text-primary-foreground/70 mt-2 text-sm">
                  Sign in to access your portal
                </p>
              </div>
            </div>

            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Username
                  </label>
                  <div className={`relative transition-all duration-300 ${focusedInput === 'username' ? 'scale-[1.02]' : ''}`}>
                    <Input
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedInput('username')}
                      onBlur={() => setFocusedInput(null)}
                      className="h-12 pl-4 pr-4 rounded-xl border-2 border-border/50 bg-muted/30 focus:border-primary focus:bg-card transition-all"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    Password
                  </label>
                  <div className={`relative transition-all duration-300 ${focusedInput === 'password' ? 'scale-[1.02]' : ''}`}>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                      className="h-12 pl-4 pr-12 rounded-xl border-2 border-border/50 bg-muted/30 focus:border-primary focus:bg-card transition-all"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Portal Types */}
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-center text-sm text-muted-foreground mb-5">
                  Portal Access Levels
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="group text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-2 transition-all duration-300 group-hover:bg-primary group-hover:shadow-lg group-hover:scale-110">
                      <Shield className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Admin</p>
                  </div>
                  <div className="group text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary/10 flex items-center justify-center mb-2 transition-all duration-300 group-hover:bg-secondary group-hover:shadow-gold group-hover:scale-110">
                      <Users className="w-6 h-6 text-secondary group-hover:text-secondary-foreground transition-colors" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Teacher</p>
                  </div>
                  <div className="group text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-green-light/10 flex items-center justify-center mb-2 transition-all duration-300 group-hover:bg-green-light group-hover:shadow-lg group-hover:scale-110">
                      <GraduationCap className="w-6 h-6 text-green-light group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Student</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-sm text-muted-foreground">
              First time? Contact your administrator for credentials
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Crescent School. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
