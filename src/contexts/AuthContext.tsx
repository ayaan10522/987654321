import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { dbGet } from '@/lib/firebase';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  classId?: string;
  className?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('crescentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check all user types
      const paths = ['users/admin', 'teachers', 'students'];
      
      // Check admin first
      const adminData = await dbGet('users/admin');
      if (adminData && adminData.username === username && adminData.password === password) {
        const userData: User = {
          id: adminData.id,
          username: adminData.username,
          name: adminData.name,
          role: 'admin'
        };
        setUser(userData);
        localStorage.setItem('crescentUser', JSON.stringify(userData));
        return { success: true };
      }

      // Check teachers
      const teachers = await dbGet('teachers');
      if (teachers) {
        for (const [key, teacher] of Object.entries(teachers as Record<string, any>)) {
          if (teacher.username === username && teacher.password === password) {
            const userData: User = {
              id: key,
              username: teacher.username,
              name: teacher.name,
              role: 'teacher'
            };
            setUser(userData);
            localStorage.setItem('crescentUser', JSON.stringify(userData));
            return { success: true };
          }
        }
      }

      // Check students
      const students = await dbGet('students');
      if (students) {
        for (const [key, student] of Object.entries(students as Record<string, any>)) {
          if (student.username === username && student.password === password) {
            const userData: User = {
              id: key,
              username: student.username,
              name: student.name,
              role: 'student',
              classId: student.classId,
              className: student.className
            };
            setUser(userData);
            localStorage.setItem('crescentUser', JSON.stringify(userData));
            return { success: true };
          }
        }
      }

      return { success: false, error: 'Invalid username or password' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crescentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
