import React, { useState, useEffect, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { dbGet, dbPush, dbUpdate, dbListen, dbRemove } from '@/lib/firebase';
import { 
  Check, X, Plus, BookOpen, Calendar, FileText, ClipboardCheck, 
  Send, Users, Clock, AlertCircle, CheckCircle2, Megaphone, Trash2,
  TrendingUp, BarChart3, UserCheck, UserX, Eye, ChevronDown, ChevronUp
} from 'lucide-react';

interface Student { id: string; name: string; classId: string; className: string; }
interface Class { id: string; name: string; grade: string; teacherId: string; }
interface Homework { id: string; title: string; description: string; dueDate: string; classId: string; className: string; subject: string; createdAt: string; }
interface AttendanceRecord { id: string; studentId: string; date: string; status: 'present' | 'absent'; classId: string; }
interface Announcement { id: string; title: string; content: string; classId: string; className: string; createdAt: string; }
interface Submission { id: string; homeworkId: string; studentId: string; studentName: string; submittedAt: string; status: 'submitted' | 'late' | 'graded'; grade?: string; }

interface TeacherDashboardProps { currentPage: string; }

const TeacherDashboard = forwardRef<HTMLDivElement, TeacherDashboardProps>(({ currentPage }, ref) => {
  const { user } = useAuth();
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedHomework, setSelectedHomework] = useState<string>('');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [expandedHomework, setExpandedHomework] = useState<string | null>(null);
  const [newHomework, setNewHomework] = useState({ title: '', description: '', dueDate: '', classId: '', subject: '' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', classId: '' });
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [existingAttendance, setExistingAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [gradeInput, setGradeInput] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.id) return;
    const unsubs = [
      dbListen('classes', (data) => {
        if (data) {
          const list = Object.entries(data).map(([id, c]: [string, any]) => ({ id, ...c })).filter((c: Class) => c.teacherId === user?.id);
          setMyClasses(list);
          if (list.length > 0 && !selectedClass) setSelectedClass(list[0].id);
        }
      }),
      dbListen('students', (data) => setStudents(data ? Object.entries(data).map(([id, s]: [string, any]) => ({ id, ...s })) : [])),
      dbListen('homework', (data) => setHomework(data ? Object.entries(data).map(([id, h]: [string, any]) => ({ id, ...h })) : [])),
      dbListen('submissions', (data) => setSubmissions(data ? Object.entries(data).map(([id, s]: [string, any]) => ({ id, ...s })) : [])),
      dbListen('classAnnouncements', (data) => setAnnouncements(data ? Object.entries(data).map(([id, a]: [string, any]) => ({ id, ...a })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []))
    ];
    return () => unsubs.forEach(u => u());
  }, [user?.id, selectedClass]);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!selectedClass || !attendanceDate) return;
      const classStudents = students.filter(s => s.classId === selectedClass);
      const attendanceMap: Record<string, AttendanceRecord> = {};
      const statusMap: Record<string, 'present' | 'absent'> = {};
      for (const student of classStudents) {
        const data = await dbGet(`attendance/${student.id}`);
        if (data) {
          const records = Object.entries(data);
          const todayRecord = records.find(([_, r]: [string, any]) => r.date === attendanceDate);
          if (todayRecord) {
            attendanceMap[student.id] = { id: todayRecord[0], ...todayRecord[1] as any };
            statusMap[student.id] = (todayRecord[1] as any).status;
          }
        }
      }
      setExistingAttendance(attendanceMap);
      setAttendance(statusMap);
    };
    loadAttendance();
  }, [selectedClass, attendanceDate, students]);

  const getClassStudents = () => students.filter(s => s.classId === selectedClass);
  const myStudentCount = students.filter(s => myClasses.some(c => c.id === s.classId)).length;
  const myHomework = homework.filter(h => myClasses.some(c => c.id === h.classId));

  const handleAddHomework = async () => {
    if (!newHomework.title || !newHomework.dueDate || !newHomework.classId) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" }); return;
    }
    const cls = myClasses.find(c => c.id === newHomework.classId);
    await dbPush('homework', { ...newHomework, className: cls?.name || '', teacherId: user?.id, createdAt: new Date().toISOString() });
    setNewHomework({ title: '', description: '', dueDate: '', classId: '', subject: '' });
    setShowModal(null);
    toast({ title: "Success", description: "Homework assigned" });
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content || !newAnnouncement.classId) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" }); return;
    }
    const cls = myClasses.find(c => c.id === newAnnouncement.classId);
    await dbPush('classAnnouncements', { ...newAnnouncement, className: cls?.name || '', teacherId: user?.id, teacherName: user?.name, createdAt: new Date().toISOString() });
    setNewAnnouncement({ title: '', content: '', classId: '' });
    setShowModal(null);
    toast({ title: "Success", description: "Announcement posted" });
  };

  const handleMarkAttendance = (studentId: string, status: 'present' | 'absent') => setAttendance(prev => ({ ...prev, [studentId]: status }));

  const handleSaveAttendance = async () => {
    const classStudents = getClassStudents();
    for (const student of classStudents) {
      const status = attendance[student.id];
      if (!status) continue;
      const existingRecord = existingAttendance[student.id];
      if (existingRecord) {
        await dbUpdate(`attendance/${student.id}/${existingRecord.id}`, { status, updatedAt: new Date().toISOString() });
      } else {
        await dbPush(`attendance/${student.id}`, { date: attendanceDate, status, classId: selectedClass, markedBy: user?.id, createdAt: new Date().toISOString() });
      }
    }
    toast({ title: "Success", description: "Attendance saved" });
  };

  const handleMarkAllPresent = () => {
    const newAtt: Record<string, 'present'> = {};
    getClassStudents().forEach(s => newAtt[s.id] = 'present');
    setAttendance(newAtt);
  };

  const handleSaveGrade = async (studentId: string, homeworkId: string) => {
    const grade = gradeInput[`${studentId}-${homeworkId}`];
    if (!grade) { toast({ title: "Error", description: "Enter a grade", variant: "destructive" }); return; }
    const student = students.find(s => s.id === studentId);
    const hw = homework.find(h => h.id === homeworkId);
    await dbPush(`grades/${studentId}`, { subject: hw?.subject || 'Assignment', grade, homeworkId, teacherId: user?.id, teacherName: user?.name, date: new Date().toISOString() });
    setGradeInput({ ...gradeInput, [`${studentId}-${homeworkId}`]: '' });
    toast({ title: "Success", description: "Grade saved" });
  };

  const getSubmissionStatus = (homeworkId: string) => {
    const hw = homework.find(h => h.id === homeworkId);
    if (!hw) return { submitted: 0, pending: 0, total: 0 };
    const classStudents = students.filter(s => s.classId === hw.classId);
    const hwSubmissions = submissions.filter(s => s.homeworkId === homeworkId);
    return { submitted: hwSubmissions.length, pending: classStudents.length - hwSubmissions.length, total: classStudents.length };
  };

  const Modal = ({ title, children, onClose }: any) => (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-lg shadow-2xl border-2 border-primary/10 animate-scale-in">
        <CardHeader className="border-b border-border"><div className="flex items-center justify-between"><CardTitle className="font-display">{title}</CardTitle><Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button></div></CardHeader>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
  );

  const StatCard = ({ title, value, icon: Icon, gradient, subtitle }: any) => (
    <Card className={`stat-card border-0 shadow-xl ${gradient}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm font-medium">{title}</p>
            <p className="text-4xl font-display font-bold text-primary-foreground mt-1">{value}</p>
            {subtitle && <p className="text-xs text-primary-foreground/60 mt-1">{subtitle}</p>}
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (currentPage === 'dashboard') {
    const attendanceToday = Object.values(attendance).filter(a => a === 'present').length;
    const totalStudentsToday = getClassStudents().length;
    return (
      <div ref={ref} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="My Classes" value={myClasses.length} icon={BookOpen} gradient="bg-gradient-primary" />
          <StatCard title="My Students" value={myStudentCount} icon={Users} gradient="bg-gradient-gold" />
          <StatCard title="Assignments" value={myHomework.length} icon={FileText} gradient="bg-gradient-success" />
          <StatCard title="Announcements" value={announcements.filter(a => myClasses.some(c => c.id === a.classId)).length} icon={Megaphone} gradient="bg-gradient-warm" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-xl border-0 hover-lift">
            <CardHeader><CardTitle className="font-display flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground" onClick={() => setShowModal('homework')}><FileText className="w-4 h-4 mr-3" />Assign Homework</Button>
              <Button variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground" onClick={() => setShowModal('announcement')}><Megaphone className="w-4 h-4 mr-3" />Post Announcement</Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 lg:col-span-2 hover-lift">
            <CardHeader><CardTitle className="font-display flex items-center gap-2"><BookOpen className="w-5 h-5 text-secondary" />My Classes</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myClasses.map(cls => (
                  <div key={cls.id} className="p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center"><span className="font-display font-bold text-primary-foreground">{cls.grade}</span></div>
                      <div><h4 className="font-semibold">{cls.name}</h4><p className="text-sm text-muted-foreground">{students.filter(s => s.classId === cls.id).length} students</p></div>
                    </div>
                  </div>
                ))}
                {myClasses.length === 0 && <p className="text-muted-foreground text-center py-8 col-span-2">No classes assigned</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {showModal === 'homework' && <Modal title="Assign Homework" onClose={() => setShowModal(null)}><div className="space-y-4"><Input placeholder="Title" value={newHomework.title} onChange={(e) => setNewHomework({...newHomework, title: e.target.value})} /><Input placeholder="Subject" value={newHomework.subject} onChange={(e) => setNewHomework({...newHomework, subject: e.target.value})} /><Textarea placeholder="Description..." rows={3} value={newHomework.description} onChange={(e) => setNewHomework({...newHomework, description: e.target.value})} /><div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-muted-foreground">Due Date</label><Input type="date" value={newHomework.dueDate} onChange={(e) => setNewHomework({...newHomework, dueDate: e.target.value})} /></div><div><label className="text-sm text-muted-foreground">Class</label><select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newHomework.classId} onChange={(e) => setNewHomework({...newHomework, classId: e.target.value})}><option value="">Select</option>{myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div><Button className="w-full bg-gradient-primary" onClick={handleAddHomework}><Send className="w-4 h-4 mr-2" />Assign</Button></div></Modal>}
        {showModal === 'announcement' && <Modal title="Post Announcement" onClose={() => setShowModal(null)}><div className="space-y-4"><Input placeholder="Title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} /><Textarea placeholder="Content..." rows={4} value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})} /><select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newAnnouncement.classId} onChange={(e) => setNewAnnouncement({...newAnnouncement, classId: e.target.value})}><option value="">Select Class</option>{myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><Button className="w-full bg-gradient-primary" onClick={handleAddAnnouncement}><Send className="w-4 h-4 mr-2" />Post</Button></div></Modal>}
      </div>
    );
  }

  if (currentPage === 'attendance') {
    const classStudents = getClassStudents();
    const presentCount = Object.values(attendance).filter(a => a === 'present').length;
    const absentCount = Object.values(attendance).filter(a => a === 'absent').length;
    return (
      <div ref={ref} className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div><h3 className="text-2xl font-display font-bold">Attendance</h3><p className="text-muted-foreground">Mark daily attendance for your classes</p></div>
          <div className="flex gap-3">
            <select className="h-10 px-4 rounded-xl border border-input bg-card" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input type="date" className="w-auto" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-success"><CardContent className="p-5 text-center"><p className="text-4xl font-display font-bold text-primary-foreground">{presentCount}</p><p className="text-primary-foreground/80 text-sm">Present</p></CardContent></Card>
          <Card className="border-0 shadow-lg bg-gradient-warm"><CardContent className="p-5 text-center"><p className="text-4xl font-display font-bold text-primary-foreground">{absentCount}</p><p className="text-primary-foreground/80 text-sm">Absent</p></CardContent></Card>
          <Card className="border-0 shadow-lg bg-gradient-primary"><CardContent className="p-5 text-center"><p className="text-4xl font-display font-bold text-primary-foreground">{classStudents.length > 0 ? Math.round((presentCount / classStudents.length) * 100) : 0}%</p><p className="text-primary-foreground/80 text-sm">Attendance Rate</p></CardContent></Card>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="font-display">Students</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleMarkAllPresent}><CheckCircle2 className="w-4 h-4 mr-2" />Mark All Present</Button>
              <Button className="bg-gradient-primary" size="sm" onClick={handleSaveAttendance}><Check className="w-4 h-4 mr-2" />Save</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {classStudents.map((student, i) => (
                <div key={student.id} className="flex items-center justify-between p-4 hover:bg-muted/30 animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center"><span className="font-bold text-sm text-primary-foreground">{student.name.charAt(0)}</span></div>
                    <div><p className="font-medium">{student.name}</p><p className="text-xs text-muted-foreground">{student.className}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant={attendance[student.id] === 'present' ? 'default' : 'outline'} size="sm" className={attendance[student.id] === 'present' ? 'bg-success hover:bg-success/90' : ''} onClick={() => handleMarkAttendance(student.id, 'present')}><UserCheck className="w-4 h-4 mr-1" />Present</Button>
                    <Button variant={attendance[student.id] === 'absent' ? 'default' : 'outline'} size="sm" className={attendance[student.id] === 'absent' ? 'bg-destructive hover:bg-destructive/90' : ''} onClick={() => handleMarkAttendance(student.id, 'absent')}><UserX className="w-4 h-4 mr-1" />Absent</Button>
                  </div>
                </div>
              ))}
              {classStudents.length === 0 && <p className="text-muted-foreground text-center py-8">No students in this class</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentPage === 'homework') {
    return (
      <div ref={ref} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h3 className="text-2xl font-display font-bold">Homework</h3><p className="text-muted-foreground">Manage assignments & track submissions</p></div>
          <Button className="bg-gradient-primary" onClick={() => setShowModal('homework')}><Plus className="w-4 h-4 mr-2" />Assign New</Button>
        </div>

        <div className="grid gap-4">
          {myHomework.map((hw, i) => {
            const status = getSubmissionStatus(hw.id);
            const isExpanded = expandedHomework === hw.id;
            const classStudents = students.filter(s => s.classId === hw.classId);
            const hwSubmissions = submissions.filter(s => s.homeworkId === hw.id);
            const submittedIds = hwSubmissions.map(s => s.studentId);
            const pendingStudents = classStudents.filter(s => !submittedIds.includes(s.id));
            const dueDate = new Date(hw.dueDate);
            const isOverdue = dueDate < new Date();

            return (
              <Card key={hw.id} className="hover-lift animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">{hw.subject || 'General'}</span>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">{hw.className}</span>
                        {isOverdue && <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-destructive/10 text-destructive">Overdue</span>}
                      </div>
                      <h4 className="text-lg font-semibold">{hw.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{hw.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">Due: {dueDate.toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-success font-bold">{status.submitted}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-muted-foreground">{status.total}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Submitted</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setExpandedHomework(isExpanded ? null : hw.id)}>
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => dbRemove(`homework/${hw.id}`)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-border space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-semibold text-success flex items-center gap-2 mb-3"><CheckCircle2 className="w-4 h-4" />Submitted ({hwSubmissions.length})</h5>
                          <div className="space-y-2 max-h-48 overflow-auto custom-scrollbar">
                            {hwSubmissions.map(sub => (
                              <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-success" />
                                  <span className="text-sm font-medium">{sub.studentName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input placeholder="Grade" className="w-20 h-8 text-sm" value={gradeInput[`${sub.studentId}-${hw.id}`] || ''} onChange={(e) => setGradeInput({...gradeInput, [`${sub.studentId}-${hw.id}`]: e.target.value})} />
                                  <Button size="sm" variant="outline" onClick={() => handleSaveGrade(sub.studentId, hw.id)}><Check className="w-3 h-3" /></Button>
                                </div>
                              </div>
                            ))}
                            {hwSubmissions.length === 0 && <p className="text-sm text-muted-foreground">No submissions yet</p>}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-semibold text-warning flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4" />Pending ({pendingStudents.length})</h5>
                          <div className="space-y-2 max-h-48 overflow-auto custom-scrollbar">
                            {pendingStudents.map(student => (
                              <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-warning" />
                                  <span className="text-sm font-medium">{student.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Not submitted</span>
                              </div>
                            ))}
                            {pendingStudents.length === 0 && <p className="text-sm text-muted-foreground">All submitted!</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {myHomework.length === 0 && <Card className="shadow-xl border-0"><CardContent className="p-12 text-center text-muted-foreground">No homework assigned yet</CardContent></Card>}
        </div>

        {showModal === 'homework' && <Modal title="Assign Homework" onClose={() => setShowModal(null)}><div className="space-y-4"><Input placeholder="Title" value={newHomework.title} onChange={(e) => setNewHomework({...newHomework, title: e.target.value})} /><Input placeholder="Subject" value={newHomework.subject} onChange={(e) => setNewHomework({...newHomework, subject: e.target.value})} /><Textarea placeholder="Description..." rows={3} value={newHomework.description} onChange={(e) => setNewHomework({...newHomework, description: e.target.value})} /><div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-muted-foreground">Due Date</label><Input type="date" value={newHomework.dueDate} onChange={(e) => setNewHomework({...newHomework, dueDate: e.target.value})} /></div><div><label className="text-sm text-muted-foreground">Class</label><select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newHomework.classId} onChange={(e) => setNewHomework({...newHomework, classId: e.target.value})}><option value="">Select</option>{myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div><Button className="w-full bg-gradient-primary" onClick={handleAddHomework}><Send className="w-4 h-4 mr-2" />Assign</Button></div></Modal>}
      </div>
    );
  }

  if (currentPage === 'grades') {
    return (
      <div ref={ref} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h3 className="text-2xl font-display font-bold">Grades</h3><p className="text-muted-foreground">Enter and manage student grades</p></div>
          <select className="h-10 px-4 rounded-xl border border-input bg-card" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {getClassStudents().map((student, i) => (
                <div key={student.id} className="flex items-center justify-between p-4 hover:bg-muted/30 animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center"><span className="font-bold text-sm text-primary-foreground">{student.name.charAt(0)}</span></div>
                    <p className="font-medium">{student.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input placeholder="Grade (e.g., A, 95)" className="w-32" value={gradeInput[student.id] || ''} onChange={(e) => setGradeInput({...gradeInput, [student.id]: e.target.value})} />
                    <Button className="bg-gradient-primary" onClick={() => {
                      const grade = gradeInput[student.id];
                      if (!grade) return;
                      const cls = myClasses.find(c => c.id === selectedClass);
                      dbPush(`grades/${student.id}`, { subject: 'General', grade, className: cls?.name || '', teacherId: user?.id, teacherName: user?.name, date: new Date().toISOString() });
                      setGradeInput({...gradeInput, [student.id]: ''});
                      toast({ title: "Success", description: "Grade saved" });
                    }}><Check className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentPage === 'classes') {
    return (
      <div ref={ref} className="space-y-6">
        <div><h3 className="text-2xl font-display font-bold">My Classes</h3><p className="text-muted-foreground">View and manage your assigned classes</p></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myClasses.map((cls, i) => {
            const classStudents = students.filter(s => s.classId === cls.id);
            return (
              <Card key={cls.id} className="hover-lift animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center"><span className="font-display font-bold text-xl text-primary-foreground">{cls.grade}</span></div>
                    <div><h4 className="text-lg font-semibold">{cls.name}</h4><p className="text-sm text-muted-foreground">{classStudents.length} students</p></div>
                  </div>
                  <div className="space-y-2">
                    {classStudents.slice(0, 3).map(s => (<div key={s.id} className="flex items-center gap-2 text-sm text-muted-foreground"><div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{s.name.charAt(0)}</div>{s.name}</div>))}
                    {classStudents.length > 3 && <p className="text-xs text-muted-foreground">+{classStudents.length - 3} more</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (currentPage === 'announcements') {
    const myAnnouncements = announcements.filter(a => myClasses.some(c => c.id === a.classId));
    return (
      <div ref={ref} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h3 className="text-2xl font-display font-bold">Announcements</h3><p className="text-muted-foreground">Post updates for your classes</p></div>
          <Button className="bg-gradient-primary" onClick={() => setShowModal('announcement')}><Plus className="w-4 h-4 mr-2" />New</Button>
        </div>
        <div className="grid gap-4">
          {myAnnouncements.map((ann, i) => (
            <Card key={ann.id} className="hover-lift animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-secondary/20 text-secondary-foreground mb-2 inline-block">{ann.className}</span>
                    <h4 className="text-lg font-semibold">{ann.title}</h4>
                    <p className="text-muted-foreground mt-2">{ann.content}</p>
                    <p className="text-xs text-muted-foreground mt-3">{new Date(ann.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => dbRemove(`classAnnouncements/${ann.id}`)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {myAnnouncements.length === 0 && <Card><CardContent className="p-12 text-center text-muted-foreground">No announcements</CardContent></Card>}
        </div>
        {showModal === 'announcement' && <Modal title="Post Announcement" onClose={() => setShowModal(null)}><div className="space-y-4"><Input placeholder="Title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} /><Textarea placeholder="Content..." rows={4} value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})} /><select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newAnnouncement.classId} onChange={(e) => setNewAnnouncement({...newAnnouncement, classId: e.target.value})}><option value="">Select Class</option>{myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><Button className="w-full bg-gradient-primary" onClick={handleAddAnnouncement}><Send className="w-4 h-4 mr-2" />Post</Button></div></Modal>}
      </div>
    );
  }

  return <div ref={ref} className="text-center py-16 text-muted-foreground">Select a section</div>;
});

TeacherDashboard.displayName = 'TeacherDashboard';
export default TeacherDashboard;
