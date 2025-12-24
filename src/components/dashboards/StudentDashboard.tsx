import React, { useState, useEffect, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { dbListen, dbPush } from '@/lib/firebase';
import { 
  Calendar, ClipboardList, FileText, Bell, Check, X, 
  TrendingUp, Award, Clock, BookOpen, Megaphone, Upload,
  CheckCircle2, AlertCircle, BarChart3, Star
} from 'lucide-react';
import TimetablePanel from './TimetablePanel';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

interface Homework { id: string; title: string; description: string; dueDate: string; classId: string; className: string; subject: string; createdAt: string; }
interface AttendanceRecord { id: string; date: string; status: 'present' | 'absent'; }
interface GradeRecord { id: string; subject: string; grade: string; date: string; teacherName?: string; }
interface Announcement { id: string; title: string; content: string; createdAt: string; author?: string; priority?: string; }
interface ClassAnnouncement { id: string; title: string; content: string; classId: string; className: string; teacherName: string; createdAt: string; }
interface Submission { id: string; homeworkId: string; studentId: string; studentName: string; submittedAt: string; }

interface StudentDashboardProps { currentPage: string; }

const StudentDashboard = forwardRef<HTMLDivElement, StudentDashboardProps>(({ currentPage }, ref) => {
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [schoolAnnouncements, setSchoolAnnouncements] = useState<Announcement[]>([]);
  const [classAnnouncements, setClassAnnouncements] = useState<ClassAnnouncement[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const unsubs = [
      dbListen('homework', (data) => setHomework(data ? Object.entries(data).map(([id, h]: [string, any]) => ({ id, ...h })).filter((h: Homework) => h.classId === user?.classId).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) : [])),
      dbListen('submissions', (data) => setMySubmissions(data ? Object.entries(data).map(([id, s]: [string, any]) => ({ id, ...s })).filter((s: Submission) => s.studentId === user?.id) : [])),
      dbListen(`attendance/${user.id}`, (data) => setAttendance(data ? Object.entries(data).map(([id, a]: [string, any]) => ({ id, ...a })) : [])),
      dbListen(`grades/${user.id}`, (data) => setGrades(data ? Object.entries(data).map(([id, g]: [string, any]) => ({ id, ...g })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [])),
      dbListen('announcements', (data) => setSchoolAnnouncements(data ? Object.entries(data).map(([id, a]: [string, any]) => ({ id, ...a })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [])),
      dbListen('classAnnouncements', (data) => setClassAnnouncements(data ? Object.entries(data).map(([id, a]: [string, any]) => ({ id, ...a })).filter((a: ClassAnnouncement) => a.classId === user?.classId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []))
    ];
    return () => unsubs.forEach(u => u());
  }, [user?.id, user?.classId]);

  const getAttendanceStats = () => {
    const present = attendance.filter(a => a.status === 'present').length;
    const total = attendance.length;
    return { present, absent: total - present, total, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  const getUpcomingHomework = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return homework.filter(h => new Date(h.dueDate) >= today);
  };

  const isSubmitted = (hwId: string) => mySubmissions.some(s => s.homeworkId === hwId);

  const handleSubmitHomework = async (hw: Homework) => {
    await dbPush('submissions', { homeworkId: hw.id, studentId: user?.id, studentName: user?.name, submittedAt: new Date().toISOString(), status: 'submitted' });
  };

  const stats = getAttendanceStats();
  const upcomingHomework = getUpcomingHomework();
  const pendingHomework = upcomingHomework.filter(h => !isSubmitted(h.id));

  const StatCard = ({ title, value, icon: Icon, gradient, subtitle }: any) => (
    <Card className={`stat-card border-0 shadow-xl ${gradient}`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-primary-foreground">{value}</p>
            <p className="text-primary-foreground/80 text-sm">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (currentPage === 'dashboard') {
    return (
      <div ref={ref} className="space-y-8">
        {/* Welcome Banner */}
        <Card className="border-0 shadow-xl bg-gradient-primary overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-50"></div>
          <CardContent className="p-8 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 font-medium">Welcome back,</p>
                <h2 className="text-3xl font-display font-bold text-primary-foreground mt-1">{user?.name}</h2>
                <p className="text-primary-foreground/70 mt-2 flex items-center gap-2"><BookOpen className="w-4 h-4" />{user?.className || 'N/A'}</p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="text-center px-6 py-3 rounded-2xl bg-primary-foreground/10">
                  <p className="text-3xl font-display font-bold text-primary-foreground">{stats.percentage}%</p>
                  <p className="text-xs text-primary-foreground/70">Attendance</p>
                </div>
                <div className="text-center px-6 py-3 rounded-2xl bg-primary-foreground/10">
                  <p className="text-3xl font-display font-bold text-primary-foreground">{grades.length}</p>
                  <p className="text-xs text-primary-foreground/70">Grades</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Attendance" value={`${stats.percentage}%`} icon={TrendingUp} gradient="bg-gradient-primary" />
          <StatCard title="Pending Tasks" value={pendingHomework.length} icon={ClipboardList} gradient="bg-gradient-gold" />
          <StatCard title="Total Grades" value={grades.length} icon={Award} gradient="bg-gradient-success" />
          <StatCard title="Days Present" value={stats.present} icon={Calendar} gradient="bg-gradient-warm" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Homework */}
          <Card className="shadow-xl border-0 hover-lift">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="font-display flex items-center gap-2"><ClipboardList className="w-5 h-5 text-secondary" />Upcoming Homework</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {upcomingHomework.slice(0, 4).map((hw, i) => {
                  const dueDate = new Date(hw.dueDate);
                  const daysLeft = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const submitted = isSubmitted(hw.id);
                  return (
                    <div key={hw.id} className={`p-4 rounded-xl border transition-all animate-fade-in ${submitted ? 'bg-success/5 border-success/30' : daysLeft <= 1 ? 'bg-destructive/5 border-destructive/30' : 'bg-muted/30 border-border/50'}`} style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">{hw.subject || 'General'}</span>
                            {submitted && <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-success/20 text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Submitted</span>}
                          </div>
                          <h4 className="font-semibold">{hw.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">Due: {dueDate.toLocaleDateString()}</p>
                        </div>
                        {!submitted && (
                          <Button size="sm" className="bg-gradient-primary" onClick={() => handleSubmitHomework(hw)}>
                            <Upload className="w-3 h-3 mr-1" />Submit
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {upcomingHomework.length === 0 && (
                  <div className="text-center py-8"><CheckCircle2 className="w-12 h-12 mx-auto text-success/50 mb-2" /><p className="text-muted-foreground">All caught up!</p></div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Grades */}
          <Card className="shadow-xl border-0 hover-lift">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="font-display flex items-center gap-2"><Award className="w-5 h-5 text-primary" />Recent Grades</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {grades.slice(0, 4).map((grade, i) => (
                  <div key={grade.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Star className="w-5 h-5 text-primary" /></div>
                      <div><p className="font-medium">{grade.subject}</p><p className="text-xs text-muted-foreground">{new Date(grade.date).toLocaleDateString()}{grade.teacherName && ` • ${grade.teacherName}`}</p></div>
                    </div>
                    <span className="text-2xl font-display font-bold text-primary">{grade.grade}</span>
                  </div>
                ))}
                {grades.length === 0 && <div className="text-center py-8"><FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" /><p className="text-muted-foreground">No grades yet</p></div>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Announcements */}
        {(schoolAnnouncements.length > 0 || classAnnouncements.length > 0) && (
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="font-display flex items-center gap-2"><Bell className="w-5 h-5 text-secondary" />Latest Announcements</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schoolAnnouncements.slice(0, 2).map(ann => (
                  <div key={ann.id} className={`p-4 rounded-xl border ${ann.priority === 'urgent' ? 'bg-destructive/5 border-destructive/30' : 'bg-primary/5 border-primary/30'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">School</span>
                      {ann.priority === 'urgent' && <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-destructive text-destructive-foreground">Urgent</span>}
                    </div>
                    <h4 className="font-semibold">{ann.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
                  </div>
                ))}
                {classAnnouncements.slice(0, 2).map(ann => (
                  <div key={ann.id} className="p-4 rounded-xl bg-secondary/5 border border-secondary/30">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground mb-2 inline-block">{ann.className}</span>
                    <h4 className="font-semibold">{ann.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (currentPage === 'attendance') {
    return (
      <div ref={ref} className="space-y-6">
        <div><h3 className="text-2xl font-display font-bold">My Attendance</h3><p className="text-muted-foreground">Track your attendance record</p></div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-xl border-0 overflow-hidden"><div className="h-1.5 bg-primary"></div><CardContent className="p-6 text-center"><div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3"><TrendingUp className="w-8 h-8 text-primary" /></div><p className="text-4xl font-display font-bold text-primary">{stats.percentage}%</p><p className="text-muted-foreground mt-1">Attendance Rate</p></CardContent></Card>
          <Card className="shadow-xl border-0 overflow-hidden"><div className="h-1.5 bg-success"></div><CardContent className="p-6 text-center"><div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3"><Check className="w-8 h-8 text-success" /></div><p className="text-4xl font-display font-bold text-success">{stats.present}</p><p className="text-muted-foreground mt-1">Days Present</p></CardContent></Card>
          <Card className="shadow-xl border-0 overflow-hidden"><div className="h-1.5 bg-destructive"></div><CardContent className="p-6 text-center"><div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3"><X className="w-8 h-8 text-destructive" /></div><p className="text-4xl font-display font-bold text-destructive">{stats.absent}</p><p className="text-muted-foreground mt-1">Days Absent</p></CardContent></Card>
          <Card className="shadow-xl border-0 overflow-hidden"><div className="h-1.5 bg-secondary"></div><CardContent className="p-6 text-center"><div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3"><Calendar className="w-8 h-8 text-secondary" /></div><p className="text-4xl font-display font-bold text-secondary">{stats.total}</p><p className="text-muted-foreground mt-1">Total Days</p></CardContent></Card>
        </div>

        {/* Attendance History */}
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b border-border/50"><CardTitle className="font-display">Attendance History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {attendance.slice().reverse().slice(0, 20).map((record, i) => (
                <div key={record.id} className="flex items-center justify-between p-4 hover:bg-muted/30 animate-fade-in" style={{ animationDelay: `${i * 0.02}s` }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.status === 'present' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                      {record.status === 'present' ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-destructive" />}
                    </div>
                    <div><p className="font-medium">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p></div>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${record.status === 'present' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{record.status}</span>
                </div>
              ))}
              {attendance.length === 0 && <p className="text-muted-foreground text-center py-8">No attendance records</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentPage === 'schedule') {
    return (
      <div ref={ref}>
        <TimetablePanel currentPage={currentPage} />
      </div>
    );
  }

  if (currentPage === 'homework') {
    return (
      <div ref={ref} className="space-y-6">
        <div><h3 className="text-2xl font-display font-bold">Homework</h3><p className="text-muted-foreground">View and submit your assignments</p></div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-lg border-0 bg-gradient-primary"><CardContent className="p-5 flex items-center gap-4"><FileText className="w-10 h-10 text-primary-foreground/80" /><div><p className="text-3xl font-display font-bold text-primary-foreground">{homework.length}</p><p className="text-sm text-primary-foreground/80">Total Assignments</p></div></CardContent></Card>
          <Card className="shadow-lg border-0 bg-gradient-success"><CardContent className="p-5 flex items-center gap-4"><CheckCircle2 className="w-10 h-10 text-primary-foreground/80" /><div><p className="text-3xl font-display font-bold text-primary-foreground">{mySubmissions.length}</p><p className="text-sm text-primary-foreground/80">Submitted</p></div></CardContent></Card>
          <Card className="shadow-lg border-0 bg-gradient-warm"><CardContent className="p-5 flex items-center gap-4"><AlertCircle className="w-10 h-10 text-primary-foreground/80" /><div><p className="text-3xl font-display font-bold text-primary-foreground">{pendingHomework.length}</p><p className="text-sm text-primary-foreground/80">Pending</p></div></CardContent></Card>
        </div>

        {/* Homework List */}
        <div className="grid gap-4">
          {homework.map((hw, i) => {
            const dueDate = new Date(hw.dueDate);
            const daysLeft = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const submitted = isSubmitted(hw.id);
            const isOverdue = daysLeft < 0 && !submitted;
            return (
              <Card key={hw.id} className={`hover-lift animate-fade-in ${submitted ? 'border-success/30' : isOverdue ? 'border-destructive/30' : ''}`} style={{ animationDelay: `${i * 0.05}s` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">{hw.subject || 'General'}</span>
                        {submitted && <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-success text-success-foreground flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Submitted</span>}
                        {isOverdue && <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-destructive text-destructive-foreground">Overdue</span>}
                        {!submitted && !isOverdue && daysLeft <= 2 && <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-warning text-warning-foreground">Due Soon</span>}
                      </div>
                      <h4 className="text-lg font-semibold">{hw.title}</h4>
                      <p className="text-muted-foreground mt-1">{hw.description}</p>
                      <p className="text-sm text-muted-foreground mt-3">Due: {dueDate.toLocaleDateString()} {!submitted && daysLeft >= 0 && `(${daysLeft} days left)`}</p>
                    </div>
                    {!submitted && (
                      <Button className="bg-gradient-primary" onClick={() => handleSubmitHomework(hw)}><Upload className="w-4 h-4 mr-2" />Submit</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {homework.length === 0 && <Card><CardContent className="p-12 text-center text-muted-foreground">No homework assigned</CardContent></Card>}
        </div>
      </div>
    );
  }

  if (currentPage === 'grades') {
    const numericGrades = grades.filter(g => !isNaN(parseInt(g.grade)));
    const avgGrade = numericGrades.length > 0 ? numericGrades.reduce((acc, g) => acc + parseInt(g.grade), 0) / numericGrades.length : 0;
    const gradeTrend = numericGrades.slice().reverse().map(g => ({
      date: new Date(g.date).toLocaleDateString(),
      value: parseInt(g.grade)
    }));
    const subjectMap: Record<string, { total: number; count: number }> = {};
    numericGrades.forEach(g => {
      const key = g.subject || 'General';
      subjectMap[key] = subjectMap[key] || { total: 0, count: 0 };
      subjectMap[key].total += parseInt(g.grade);
      subjectMap[key].count += 1;
    });
    const subjectAverages = Object.entries(subjectMap).map(([subject, { total, count }]) => ({
      subject,
      avg: Math.round((total / count) * 10) / 10
    }));
    return (
      <div ref={ref} className="space-y-6">
        <div><h3 className="text-2xl font-display font-bold">My Grades</h3><p className="text-muted-foreground">View your academic performance</p></div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-lg border-0 bg-gradient-primary"><CardContent className="p-5 flex items-center gap-4"><Award className="w-10 h-10 text-primary-foreground/80" /><div><p className="text-3xl font-display font-bold text-primary-foreground">{grades.length}</p><p className="text-sm text-primary-foreground/80">Total Grades</p></div></CardContent></Card>
          <Card className="shadow-lg border-0 bg-gradient-gold"><CardContent className="p-5 flex items-center gap-4"><BarChart3 className="w-10 h-10 text-secondary-foreground/80" /><div><p className="text-3xl font-display font-bold text-secondary-foreground">{avgGrade > 0 ? avgGrade.toFixed(1) : 'N/A'}</p><p className="text-sm text-secondary-foreground/80">Average (numeric)</p></div></CardContent></Card>
          <Card className="shadow-lg border-0 bg-gradient-success"><CardContent className="p-5 flex items-center gap-4"><Star className="w-10 h-10 text-primary-foreground/80" /><div><p className="text-3xl font-display font-bold text-primary-foreground">{grades[0]?.grade || 'N/A'}</p><p className="text-sm text-primary-foreground/80">Latest Grade</p></div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-border/50"><CardTitle className="font-display">Trend</CardTitle></CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gradeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-border/50"><CardTitle className="font-display">Subject Averages</CardTitle></CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAverages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="avg" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Grades List */}
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b border-border/50"><CardTitle className="font-display">Grade History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {grades.map((grade, i) => (
                <div key={grade.id} className="flex items-center justify-between p-4 hover:bg-muted/30 animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center"><Star className="w-6 h-6 text-primary-foreground" /></div>
                    <div><p className="font-medium">{grade.subject}</p><p className="text-sm text-muted-foreground">{new Date(grade.date).toLocaleDateString()}{grade.teacherName && ` • ${grade.teacherName}`}</p></div>
                  </div>
                  <span className="text-3xl font-display font-bold text-primary">{grade.grade}</span>
                </div>
              ))}
              {grades.length === 0 && <p className="text-muted-foreground text-center py-8">No grades yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentPage === 'announcements') {
    const allAnnouncements = [...schoolAnnouncements.map(a => ({ ...a, type: 'school' })), ...classAnnouncements.map(a => ({ ...a, type: 'class' }))].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return (
      <div ref={ref} className="space-y-6">
        <div><h3 className="text-2xl font-display font-bold">Announcements</h3><p className="text-muted-foreground">Stay updated with school and class news</p></div>
        <div className="grid gap-4">
          {allAnnouncements.map((ann: any, i) => (
            <Card key={ann.id} className={`hover-lift animate-fade-in ${ann.priority === 'urgent' ? 'border-destructive/30' : ''}`} style={{ animationDelay: `${i * 0.05}s` }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${ann.type === 'school' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>{ann.type === 'school' ? 'School' : ann.className}</span>
                  {ann.priority === 'urgent' && <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-destructive text-destructive-foreground">Urgent</span>}
                  {ann.priority === 'important' && <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-warning text-warning-foreground">Important</span>}
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="text-lg font-semibold">{ann.title}</h4>
                <p className="text-muted-foreground mt-2">{ann.content}</p>
              </CardContent>
            </Card>
          ))}
          {allAnnouncements.length === 0 && <Card><CardContent className="p-12 text-center text-muted-foreground">No announcements</CardContent></Card>}
        </div>
      </div>
    );
  }

  return <div ref={ref} className="text-center py-16 text-muted-foreground">Select a section</div>;
});

StudentDashboard.displayName = 'StudentDashboard';
export default StudentDashboard;
