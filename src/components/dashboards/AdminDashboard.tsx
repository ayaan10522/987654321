import React, { useState, useEffect, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { dbPush, dbRemove, dbListen } from '@/lib/firebase';
import { 
  Users, GraduationCap, BookOpen, Plus, Trash2, X, Check, 
  Megaphone, Send, TrendingUp, Award, Search, MoreVertical,
  UserPlus, School, Bell, Calendar, Clock, ChevronRight
} from 'lucide-react';

interface Teacher { id: string; name: string; username: string; password: string; subject: string; }
interface Class { id: string; name: string; grade: string; teacherId: string; teacherName: string; }
interface Student { id: string; name: string; username: string; password: string; classId: string; className: string; }
interface Announcement { id: string; title: string; content: string; priority: 'normal' | 'important' | 'urgent'; createdAt: string; author: string; }

interface AdminDashboardProps { currentPage: string; }

const AdminDashboard = forwardRef<HTMLDivElement, AdminDashboardProps>(({ currentPage }, ref) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTeacher, setNewTeacher] = useState({ name: '', username: '', password: '', subject: '' });
  const [newClass, setNewClass] = useState({ name: '', grade: '', teacherId: '' });
  const [newStudent, setNewStudent] = useState({ name: '', username: '', password: '', classId: '' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', priority: 'normal' as const });
  const { toast } = useToast();

  useEffect(() => {
    const unsubs = [
      dbListen('teachers', (data) => setTeachers(data ? Object.entries(data).map(([id, t]: [string, any]) => ({ id, ...t })) : [])),
      dbListen('classes', (data) => setClasses(data ? Object.entries(data).map(([id, c]: [string, any]) => ({ id, ...c })) : [])),
      dbListen('students', (data) => setStudents(data ? Object.entries(data).map(([id, s]: [string, any]) => ({ id, ...s })) : [])),
      dbListen('announcements', (data) => setAnnouncements(data ? Object.entries(data).map(([id, a]: [string, any]) => ({ id, ...a })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []))
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.username || !newTeacher.password || !newTeacher.subject) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" }); return;
    }
    await dbPush('teachers', { ...newTeacher, createdAt: new Date().toISOString() });
    setNewTeacher({ name: '', username: '', password: '', subject: '' });
    setShowModal(null);
    toast({ title: "Success", description: "Teacher added successfully" });
  };

  const handleAddClass = async () => {
    if (!newClass.name || !newClass.grade || !newClass.teacherId) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" }); return;
    }
    const teacher = teachers.find(t => t.id === newClass.teacherId);
    await dbPush('classes', { ...newClass, teacherName: teacher?.name || 'Unassigned', createdAt: new Date().toISOString() });
    setNewClass({ name: '', grade: '', teacherId: '' });
    setShowModal(null);
    toast({ title: "Success", description: "Class created successfully" });
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.username || !newStudent.password || !newStudent.classId) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" }); return;
    }
    const cls = classes.find(c => c.id === newStudent.classId);
    await dbPush('students', { ...newStudent, className: cls?.name || 'Unassigned', createdAt: new Date().toISOString() });
    setNewStudent({ name: '', username: '', password: '', classId: '' });
    setShowModal(null);
    toast({ title: "Success", description: "Student enrolled successfully" });
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" }); return;
    }
    await dbPush('announcements', { ...newAnnouncement, author: 'Principal', createdAt: new Date().toISOString() });
    setNewAnnouncement({ title: '', content: '', priority: 'normal' });
    setShowModal(null);
    toast({ title: "Success", description: "Announcement posted" });
  };

  const StatCard = ({ title, value, icon: Icon, gradient, delay = 0 }: any) => (
    <Card className={`stat-card border-0 shadow-xl ${gradient} animate-fade-in`} style={{ animationDelay: `${delay}s` }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm font-medium">{title}</p>
            <p className="text-4xl font-display font-bold text-primary-foreground mt-2">{value}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const Modal = ({ title, children, onClose }: any) => (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-lg shadow-2xl border-2 border-primary/10 animate-scale-in">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display">{title}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
  );

  if (currentPage === 'dashboard') {
    return (
      <div ref={ref} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Teachers" value={teachers.length} icon={Users} gradient="bg-gradient-primary" delay={0} />
          <StatCard title="Total Classes" value={classes.length} icon={BookOpen} gradient="bg-gradient-gold" delay={0.1} />
          <StatCard title="Total Students" value={students.length} icon={GraduationCap} gradient="bg-gradient-success" delay={0.2} />
          <StatCard title="Announcements" value={announcements.length} icon={Megaphone} gradient="bg-gradient-warm" delay={0.3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-xl border-0 hover-lift">
            <CardHeader><CardTitle className="font-display flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: Megaphone, label: 'Post Announcement', modal: 'announcement' },
                { icon: UserPlus, label: 'Add Teacher', modal: 'teacher' },
                { icon: School, label: 'Create Class', modal: 'class' },
                { icon: GraduationCap, label: 'Enroll Student', modal: 'student' },
              ].map((action, i) => (
                <Button key={i} variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-all" onClick={() => setShowModal(action.modal)}>
                  <action.icon className="w-4 h-4 mr-3" /> {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 lg:col-span-2 hover-lift">
            <CardHeader><CardTitle className="font-display flex items-center gap-2"><Bell className="w-5 h-5 text-secondary" />Recent Announcements</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {announcements.slice(0, 3).map(ann => (
                  <div key={ann.id} className="p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mb-2 ${ann.priority === 'urgent' ? 'bg-destructive/10 text-destructive' : ann.priority === 'important' ? 'bg-secondary/20 text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {ann.priority.toUpperCase()}
                        </span>
                        <h4 className="font-semibold">{ann.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => dbRemove(`announcements/${ann.id}`)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && <p className="text-muted-foreground text-center py-8">No announcements yet</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {showModal === 'announcement' && (
          <Modal title="Post Announcement" onClose={() => setShowModal(null)}>
            <div className="space-y-4">
              <Input placeholder="Title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
              <Textarea placeholder="Content..." rows={4} value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})} />
              <select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newAnnouncement.priority} onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value as any})}>
                <option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option>
              </select>
              <Button className="w-full bg-gradient-primary" onClick={handleAddAnnouncement}><Send className="w-4 h-4 mr-2" />Post</Button>
            </div>
          </Modal>
        )}
        {showModal === 'teacher' && (
          <Modal title="Add Teacher" onClose={() => setShowModal(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Full Name" value={newTeacher.name} onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})} />
                <Input placeholder="Subject" value={newTeacher.subject} onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})} />
                <Input placeholder="Username" value={newTeacher.username} onChange={(e) => setNewTeacher({...newTeacher, username: e.target.value})} />
                <Input placeholder="Password" type="password" value={newTeacher.password} onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})} />
              </div>
              <Button className="w-full bg-gradient-primary" onClick={handleAddTeacher}><Check className="w-4 h-4 mr-2" />Save</Button>
            </div>
          </Modal>
        )}
        {showModal === 'class' && (
          <Modal title="Create Class" onClose={() => setShowModal(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Class Name" value={newClass.name} onChange={(e) => setNewClass({...newClass, name: e.target.value})} />
                <Input placeholder="Grade" value={newClass.grade} onChange={(e) => setNewClass({...newClass, grade: e.target.value})} />
              </div>
              <select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newClass.teacherId} onChange={(e) => setNewClass({...newClass, teacherId: e.target.value})}>
                <option value="">Select Teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
              </select>
              <Button className="w-full bg-gradient-primary" onClick={handleAddClass}><Check className="w-4 h-4 mr-2" />Create</Button>
            </div>
          </Modal>
        )}
        {showModal === 'student' && (
          <Modal title="Enroll Student" onClose={() => setShowModal(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Full Name" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} />
                <Input placeholder="Username" value={newStudent.username} onChange={(e) => setNewStudent({...newStudent, username: e.target.value})} />
              </div>
              <Input placeholder="Password" type="password" value={newStudent.password} onChange={(e) => setNewStudent({...newStudent, password: e.target.value})} />
              <select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newStudent.classId} onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} (Grade {c.grade})</option>)}
              </select>
              <Button className="w-full bg-gradient-primary" onClick={handleAddStudent}><Check className="w-4 h-4 mr-2" />Enroll</Button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  if (currentPage === 'announcements') {
    return (
      <div ref={ref} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h3 className="text-2xl font-display font-bold">Announcements</h3><p className="text-muted-foreground">Manage school announcements</p></div>
          <Button className="bg-gradient-primary" onClick={() => setShowModal('announcement')}><Plus className="w-4 h-4 mr-2" />New Announcement</Button>
        </div>
        <div className="grid gap-4">
          {announcements.map((ann, i) => (
            <Card key={ann.id} className="hover-lift animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${ann.priority === 'urgent' ? 'bg-destructive text-destructive-foreground' : ann.priority === 'important' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>{ann.priority}</span>
                      <span className="text-xs text-muted-foreground">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-lg font-semibold">{ann.title}</h4>
                    <p className="text-muted-foreground mt-2">{ann.content}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => dbRemove(`announcements/${ann.id}`)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {showModal === 'announcement' && <Modal title="Post Announcement" onClose={() => setShowModal(null)}><div className="space-y-4"><Input placeholder="Title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} /><Textarea placeholder="Content..." rows={4} value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})} /><select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newAnnouncement.priority} onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value as any})}><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select><Button className="w-full bg-gradient-primary" onClick={handleAddAnnouncement}><Send className="w-4 h-4 mr-2" />Post</Button></div></Modal>}
      </div>
    );
  }

  if (currentPage === 'teachers') {
    const filtered = teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div ref={ref} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div><h3 className="text-2xl font-display font-bold">Teachers</h3><p className="text-muted-foreground">Manage teaching staff</p></div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <Button className="bg-gradient-primary" onClick={() => setShowModal('teacher')}><Plus className="w-4 h-4 mr-2" />Add</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, i) => (
            <Card key={t.id} className="hover-lift animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center"><span className="font-display font-bold text-primary-foreground">{t.name.charAt(0)}</span></div>
                    <div><h4 className="font-semibold">{t.name}</h4><p className="text-sm text-muted-foreground">{t.subject}</p><p className="text-xs text-muted-foreground">@{t.username}</p></div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => dbRemove(`teachers/${t.id}`)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {showModal === 'teacher' && <Modal title="Add Teacher" onClose={() => setShowModal(null)}><div className="space-y-4"><div className="grid grid-cols-2 gap-4"><Input placeholder="Full Name" value={newTeacher.name} onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})} /><Input placeholder="Subject" value={newTeacher.subject} onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})} /><Input placeholder="Username" value={newTeacher.username} onChange={(e) => setNewTeacher({...newTeacher, username: e.target.value})} /><Input placeholder="Password" type="password" value={newTeacher.password} onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})} /></div><Button className="w-full bg-gradient-primary" onClick={handleAddTeacher}><Check className="w-4 h-4 mr-2" />Save</Button></div></Modal>}
      </div>
    );
  }

  if (currentPage === 'classes') {
    return (
      <div ref={ref} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h3 className="text-2xl font-display font-bold">Classes</h3><p className="text-muted-foreground">Manage school classes</p></div>
          <Button className="bg-gradient-primary" onClick={() => setShowModal('class')}><Plus className="w-4 h-4 mr-2" />Create</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((c, i) => (
            <Card key={c.id} className="hover-lift animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center"><span className="font-display font-bold text-secondary-foreground">{c.grade}</span></div>
                    <div><h4 className="font-semibold">{c.name}</h4><p className="text-sm text-muted-foreground">{c.teacherName}</p><p className="text-xs text-muted-foreground">{students.filter(s => s.classId === c.id).length} students</p></div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => dbRemove(`classes/${c.id}`)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {showModal === 'class' && <Modal title="Create Class" onClose={() => setShowModal(null)}><div className="space-y-4"><div className="grid grid-cols-2 gap-4"><Input placeholder="Class Name" value={newClass.name} onChange={(e) => setNewClass({...newClass, name: e.target.value})} /><Input placeholder="Grade" value={newClass.grade} onChange={(e) => setNewClass({...newClass, grade: e.target.value})} /></div><select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newClass.teacherId} onChange={(e) => setNewClass({...newClass, teacherId: e.target.value})}><option value="">Select Teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><Button className="w-full bg-gradient-primary" onClick={handleAddClass}><Check className="w-4 h-4 mr-2" />Create</Button></div></Modal>}
      </div>
    );
  }

  if (currentPage === 'students') {
    const filtered = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div ref={ref} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div><h3 className="text-2xl font-display font-bold">Students</h3><p className="text-muted-foreground">Manage enrolled students</p></div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <Button className="bg-gradient-primary" onClick={() => setShowModal('student')}><Plus className="w-4 h-4 mr-2" />Enroll</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <Card key={s.id} className="hover-lift animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-success flex items-center justify-center"><span className="font-display font-bold text-primary-foreground">{s.name.charAt(0)}</span></div>
                    <div><h4 className="font-semibold">{s.name}</h4><p className="text-sm text-muted-foreground">{s.className}</p><p className="text-xs text-muted-foreground">@{s.username}</p></div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => dbRemove(`students/${s.id}`)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {showModal === 'student' && <Modal title="Enroll Student" onClose={() => setShowModal(null)}><div className="space-y-4"><div className="grid grid-cols-2 gap-4"><Input placeholder="Full Name" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} /><Input placeholder="Username" value={newStudent.username} onChange={(e) => setNewStudent({...newStudent, username: e.target.value})} /></div><Input placeholder="Password" type="password" value={newStudent.password} onChange={(e) => setNewStudent({...newStudent, password: e.target.value})} /><select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newStudent.classId} onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><Button className="w-full bg-gradient-primary" onClick={handleAddStudent}><Check className="w-4 h-4 mr-2" />Enroll</Button></div></Modal>}
      </div>
    );
  }

  return <div ref={ref} className="text-center py-16 text-muted-foreground">Select a section from the menu</div>;
});

AdminDashboard.displayName = 'AdminDashboard';
export default AdminDashboard;
