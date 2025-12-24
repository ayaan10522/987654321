import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dbListen } from '@/lib/firebase';
import { 
  TrendingUp, Users, GraduationCap, BookOpen, Calendar,
  BarChart3, PieChart, Activity, Award, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';

interface AnalyticsPanelProps {
  currentPage: string;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ currentPage }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);

  useEffect(() => {
    const unsubs = [
      dbListen('teachers', (data) => setTeachers(data ? Object.entries(data).map(([id, t]: [string, any]) => ({ id, ...t })) : [])),
      dbListen('classes', (data) => setClasses(data ? Object.entries(data).map(([id, c]: [string, any]) => ({ id, ...c })) : [])),
      dbListen('students', (data) => setStudents(data ? Object.entries(data).map(([id, s]: [string, any]) => ({ id, ...s })) : [])),
      dbListen('homework', (data) => setHomework(data ? Object.entries(data).map(([id, h]: [string, any]) => ({ id, ...h })) : [])),
      dbListen('submissions', (data) => setSubmissions(data ? Object.entries(data).map(([id, s]: [string, any]) => ({ id, ...s })) : []))
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // Calculate statistics
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;
  const totalHomework = homework.length;
  const submissionRate = homework.length > 0 ? Math.round((submissions.length / (homework.length * students.length)) * 100) : 0;

  // Class distribution data
  const classDistribution = classes.map(c => ({
    name: c.name,
    students: students.filter(s => s.classId === c.id).length
  }));

  // Subject distribution
  const subjectCount: Record<string, number> = {};
  teachers.forEach(t => {
    subjectCount[t.subject] = (subjectCount[t.subject] || 0) + 1;
  });
  const subjectData = Object.entries(subjectCount).map(([name, value]) => ({ name, value }));

  // Weekly activity data (mock)
  const weeklyActivity = [
    { day: 'Mon', homework: 12, submissions: 45, attendance: 95 },
    { day: 'Tue', homework: 8, submissions: 52, attendance: 92 },
    { day: 'Wed', homework: 15, submissions: 48, attendance: 88 },
    { day: 'Thu', homework: 10, submissions: 60, attendance: 94 },
    { day: 'Fri', homework: 6, submissions: 55, attendance: 90 },
  ];

  // Monthly trend data (mock)
  const monthlyTrend = [
    { month: 'Sep', students: 120, submissions: 340 },
    { month: 'Oct', students: 135, submissions: 420 },
    { month: 'Nov', students: 142, submissions: 480 },
    { month: 'Dec', students: totalStudents, submissions: submissions.length },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--success))', 'hsl(var(--destructive))', 'hsl(var(--warning))'];

  const StatCard = ({ title, value, icon: Icon, gradient, change, subtitle }: any) => (
    <Card className={`border-0 shadow-xl overflow-hidden hover-lift`}>
      <div className={`h-1.5 ${gradient}`} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-display font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {change && (
              <span className={`inline-flex items-center gap-1 mt-2 text-xs font-medium ${change > 0 ? 'text-success' : 'text-destructive'}`}>
                <TrendingUp className={`w-3 h-3 ${change < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(change)}% from last month
              </span>
            )}
          </div>
          <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center`}>
            <Icon className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-display font-bold">Analytics & Reports</h2>
        <p className="text-muted-foreground mt-1">Overview of school performance and statistics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={totalStudents} 
          icon={GraduationCap} 
          gradient="bg-gradient-primary"
          change={12}
        />
        <StatCard 
          title="Total Teachers" 
          value={totalTeachers} 
          icon={Users} 
          gradient="bg-gradient-gold"
          change={5}
        />
        <StatCard 
          title="Active Classes" 
          value={totalClasses} 
          icon={BookOpen} 
          gradient="bg-gradient-success"
        />
        <StatCard 
          title="Submission Rate" 
          value={`${submissionRate}%`} 
          icon={Award} 
          gradient="bg-gradient-warm"
          change={8}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Distribution */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Students per Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subject Distribution */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <PieChart className="w-5 h-5 text-secondary" />
              Teachers by Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Activity className="w-5 h-5 text-success" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="homework" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="submissions" stroke="hsl(var(--success))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Growth Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Area type="monotone" dataKey="students" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.3)" />
                  <Area type="monotone" dataKey="submissions" stackId="2" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary)/0.3)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Table */}
      <Card className="shadow-xl border-0">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Class Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Class</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Grade</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Teacher</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Students</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Assignments</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls, i) => (
                  <tr key={cls.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="py-3 px-4 font-medium">{cls.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        Grade {cls.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{cls.teacherName}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">{students.filter(s => s.classId === cls.id).length}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">{homework.filter(h => h.classId === cls.id).length}</span>
                    </td>
                  </tr>
                ))}
                {classes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">No classes found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPanel;
