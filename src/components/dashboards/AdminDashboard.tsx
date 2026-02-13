import React, { useState, useEffect, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { dbPush, dbRemove, dbListen, dbUpdate } from '@/lib/firebase';
import SlidePanel from '@/components/ui/SlidePanel';
import TimetablePanel from './TimetablePanel';
import AnalyticsPanel from './AnalyticsPanel';
import SettingsPanel from './SettingsPanel';
import { 
  Users, GraduationCap, BookOpen, Plus, Trash2, Check, 
  Megaphone, Send, TrendingUp, Award, Search, Sparkles,
  UserPlus, School, Bell, Calendar, Clock, ChevronRight, Save, MoreVertical, Cog, Lock,
  Download, Upload, Shield
} from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

interface Teacher { id: string; name: string; username: string; password: string; subject: string; }
interface Class { id: string; name: string; grade: string; teacherId: string; teacherName: string; secondaryTeachers?: { id: string; name: string }[]; }
interface Student { id: string; name: string; username: string; password: string; classId: string; className: string; }
interface Announcement { id: string; title: string; content: string; priority: 'normal' | 'important' | 'urgent'; createdAt: string; author: string; }
interface Complaint { id: string; studentId: string; studentName: string; classId: string; className: string; subject: string; message: string; createdAt: string; status: 'sent' | 'read' | 'resolved'; read: boolean; sender?: 'student' | 'admin'; }

interface AdminDashboardProps { currentPage: string; }

const AdminDashboard = forwardRef<HTMLDivElement, AdminDashboardProps>(({ currentPage }, ref) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [showPanel, setShowPanel] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTeacher, setNewTeacher] = useState({ name: '', username: '', password: '', subject: '' });
  const [newClass, setNewClass] = useState({ name: '', grade: '', teacherId: '' });
  const [newStudent, setNewStudent] = useState({ name: '', username: '', password: '', classId: '' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', priority: 'normal' as const });
  const [popupConfig, setPopupConfig] = useState({ enabled: false, bannerText: '' });
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [manageClass, setManageClass] = useState({ name: '', grade: '', teacherId: '', secondaryTeacherIds: [] as string[] });
  const [secondarySelections, setSecondarySelections] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const unsubs = [
      dbListen('teachers', (data) => setTeachers(data ? Object.entries(data).map(([id, t]: [string, any]) => ({ id, ...t })) : [])),
      dbListen('classes', (data) => setClasses(data ? Object.entries(data).map(([id, c]: [string, any]) => ({ id, ...c })) : [])),
      dbListen('students', (data) => setStudents(data ? Object.entries(data).map(([id, s]: [string, any]) => ({ id, ...s })) : [])),
      dbListen('announcements', (data) => setAnnouncements(data ? Object.entries(data).map(([id, a]: [string, any]) => ({ id, ...a })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [])),
      dbListen('complaints', (data) => setComplaints(data ? Object.entries(data).map(([id, c]: [string, any]) => ({ id, ...c })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [])),
      dbListen('settings/popup', (data) => setPopupConfig(data || { enabled: false, bannerText: '' }))
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const conversations = React.useMemo(() => {
    const groups: Record<string, Complaint[]> = {};
    complaints.forEach(c => {
      const key = c.studentId || 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
    const toMinutes = (iso: string) => new Date(iso).getTime();
    const convs = Object.values(groups).map(group => {
      const sorted = group.slice().sort((a, b) => toMinutes(a.createdAt) - toMinutes(b.createdAt));
      const last = sorted[sorted.length - 1];
      return last;
    });
    return convs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [complaints]);

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.username || !newTeacher.password || !newTeacher.subject) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" }); return;
    }
    if (teachers.some(t => t.username === newTeacher.username)) {
      toast({ title: "Error", description: "Username already exists", variant: "destructive" }); return;
    }
    await dbPush('teachers', { ...newTeacher, createdAt: new Date().toISOString() });
    setNewTeacher({ name: '', username: '', password: '', subject: '' });
    toast({ title: "Success", description: "Teacher added successfully" });
  };

  const handleAddClass = async () => {
    if (!newClass.name || !newClass.grade || !newClass.teacherId) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" }); return;
    }
    const teacher = teachers.find(t => t.id === newClass.teacherId);
    await dbPush('classes', { ...newClass, teacherName: teacher?.name || 'Unassigned', createdAt: new Date().toISOString() });
    setNewClass({ name: '', grade: '', teacherId: '' });
    toast({ title: "Success", description: "Class created successfully" });
  };

  const handleUpdateClass = async () => {
    if (!selectedClassId) return;
    if (!manageClass.name || !manageClass.grade || !manageClass.teacherId) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" }); return;
    }
    const primary = teachers.find(t => t.id === manageClass.teacherId);
    const secondaryTeachers = manageClass.secondaryTeacherIds
      .map(id => {
        const t = teachers.find(tt => tt.id === id);
        return t ? { id: t.id, name: t.name } : null;
      })
      .filter(Boolean) as { id: string; name: string }[];
    await dbUpdate(`classes/${selectedClassId}`, {
      name: manageClass.name,
      grade: manageClass.grade,
      teacherId: manageClass.teacherId,
      teacherName: primary?.name || 'Unassigned',
      secondaryTeachers
    });
    setShowPanel(null);
    toast({ title: "Success", description: "Class updated successfully" });
  };

  const handleAddSecondaryTeacher = async () => {
    if (!selectedClassId) return;
    const selectedIds = Object.entries(secondarySelections).filter(([, v]) => v).map(([k]) => k);
    if (selectedIds.length === 0) { toast({ title: "Error", description: "Please select at least one teacher", variant: "destructive" }); return; }
    const secondaryTeachers = selectedIds
      .map(id => {
        const t = teachers.find(tt => tt.id === id);
        return t ? { id: t.id, name: t.name } : null;
      })
      .filter(Boolean) as { id: string; name: string }[];
    const existing = classes.find(c => c.id === selectedClassId)?.secondaryTeachers || [];
    const merged = [
      ...existing,
      ...secondaryTeachers.filter(nt => !existing.some(et => et.id === nt.id))
    ];
    await dbUpdate(`classes/${selectedClassId}`, { secondaryTeachers: merged });
    setShowPanel(null);
    toast({ title: "Success", description: "Secondary teacher added" });
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.username || !newStudent.password || !newStudent.classId) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" }); return;
    }
    if (students.some(s => s.username === newStudent.username)) {
      toast({ title: "Error", description: "Username already exists", variant: "destructive" }); return;
    }
    const cls = classes.find(c => c.id === newStudent.classId);
    await dbPush('students', { ...newStudent, className: cls?.name || 'Unassigned', createdAt: new Date().toISOString() });
    setNewStudent({ name: '', username: '', password: '', classId: '' });
    toast({ title: "Success", description: "Student enrolled successfully" });
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" }); return;
    }
    await dbPush('announcements', { ...newAnnouncement, author: 'Principal', createdAt: new Date().toISOString() });
    setNewAnnouncement({ title: '', content: '', priority: 'normal' });
    toast({ title: "Success", description: "Announcement posted" });
  };

  const handleUpdatePopupConfig = async () => {
    await dbUpdate('settings/popup', popupConfig);
    setShowPanel(null);
    toast({ title: "Success", description: "Social Media Popup updated" });
  };

  const handleExportData = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({ title: "Error", description: "No data to export", variant: "destructive" });
      return;
    }

    // Deduplicate data before exporting to prevent double entries in the CSV
    // We use username as unique key for teachers/students, and name for classes
    const uniqueData = Array.from(new Map(data.map(item => [item.username || item.name || item.id, item])).values());

    const headers = Object.keys(uniqueData[0]).filter(k => k !== 'id').join(',');
    const rows = uniqueData.map(obj => 
      Object.entries(obj)
        .filter(([k]) => k !== 'id')
        .map(([, v]) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportTeachers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const importedTeachers = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const teacher: any = {};
        headers.forEach((header, i) => {
          teacher[header] = values[i];
        });
        return teacher;
      });

      // Filter out duplicates within the Excel/CSV file itself
      const uniqueImportedTeachers = importedTeachers.filter((t, index, self) =>
        index === self.findIndex((temp) => temp.username === t.username)
      );

      let count = 0;
      let skipped = 0;
      const processedUsernames = new Set(teachers.map(t => t.username));

      for (const t of uniqueImportedTeachers) {
        if (t.name && t.username && t.password && t.subject) {
          if (processedUsernames.has(t.username)) {
            skipped++;
            continue;
          }
          await dbPush('teachers', { ...t, createdAt: new Date().toISOString() });
          processedUsernames.add(t.username);
          count++;
        }
      }
      toast({ 
        title: "Import Complete", 
        description: `Imported ${count} teachers.${skipped > 0 ? ` Skipped ${skipped} duplicates.` : ''}` 
      });
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleImportStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const importedStudents = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const student: any = {};
        headers.forEach((header, i) => {
          student[header] = values[i];
        });
        return student;
      });

      // Filter out duplicates within the Excel/CSV file itself
      const uniqueImportedStudents = importedStudents.filter((s, index, self) =>
        index === self.findIndex((temp) => temp.username === s.username)
      );

      let count = 0;
      let skipped = 0;
      const processedUsernames = new Set(students.map(s => s.username));

      for (const s of uniqueImportedStudents) {
        if (s.name && s.username && s.password && (s.classId || s.className)) {
          if (processedUsernames.has(s.username)) {
            skipped++;
            continue;
          }
          const cls = classes.find(c => c.id === s.classId || c.name === s.className);
          await dbPush('students', { 
            ...s, 
            classId: cls?.id || s.classId || '',
            className: cls?.name || s.className || 'Unassigned',
            createdAt: new Date().toISOString() 
          });
          processedUsernames.add(s.username);
          count++;
        }
      }
      toast({ 
        title: "Import Complete", 
        description: `Imported ${count} students.${skipped > 0 ? ` Skipped ${skipped} duplicates.` : ''}` 
      });
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [promoteAction, setPromoteAction] = useState<'graduate' | 'demote' | null>(null);
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string, name: string, role: 'teacher' | 'student' } | null>(null);
  const [editingUser, setEditingUser] = useState<{ id: string, name: string, username: string, password: string, role: 'teacher' | 'student', subject?: string, classId?: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleUpdatePassword = async () => {
    if (!selectedUser || !newPassword.trim()) return;
    setIsSubmitting(true);
    try {
      const path = selectedUser.role === 'teacher' ? `teachers/${selectedUser.id}` : `students/${selectedUser.id}`;
      await dbUpdate(path, { 
        password: newPassword,
        passwordChanged: false, // Reset so the user can change it again
        oldPassword: "" // Clear old password history
      });
      toast({ title: "Success", description: `Password updated for ${selectedUser.name}` });
      setShowPanel(null);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!editingUser.name || !editingUser.username || !editingUser.password) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const path = editingUser.role === 'teacher' ? `teachers/${editingUser.id}` : `students/${editingUser.id}`;
      const updateData: any = {
        name: editingUser.name,
        username: editingUser.username,
        password: editingUser.password
      };

      if (editingUser.role === 'teacher' && editingUser.subject) {
        updateData.subject = editingUser.subject;
      }
      
      if (editingUser.role === 'student' && editingUser.classId) {
        const targetClass = classes.find(c => c.id === editingUser.classId);
        if (targetClass) {
          updateData.classId = targetClass.id;
          updateData.className = targetClass.name;
        }
      }

      await dbUpdate(path, updateData);
      toast({ title: "Success", description: `${editingUser.role === 'teacher' ? 'Teacher' : 'Student'} updated successfully` });
      setShowPanel(null);
      setEditingUser(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGraduateStudent = async (student: Student) => {
    setSelectedStudent(student);
    setPromoteAction('graduate');
    setShowPanel('promote');
    // Default to the next grade class if possible
    const currentClass = classes.find(c => c.id === student.classId);
    if (currentClass) {
      const nextGrade = (parseInt(currentClass.grade) + 1).toString();
      const nextClass = classes.find(c => c.grade === nextGrade);
      if (nextClass) setTargetClassId(nextClass.id);
      else setTargetClassId('graduate_out');
    }
  };

  const handleDemoteStudent = async (student: Student) => {
    setSelectedStudent(student);
    setPromoteAction('demote');
    setShowPanel('promote');
    // Default to the previous grade class if possible
    const currentClass = classes.find(c => c.id === student.classId);
    if (currentClass) {
      const prevGrade = (parseInt(currentClass.grade) - 1).toString();
      const prevClass = classes.find(c => c.grade === prevGrade);
      if (prevClass) setTargetClassId(prevClass.id);
    }
  };

  const handleConfirmPromotion = async () => {
    if (!selectedStudent || !targetClassId) return;
    setIsSubmitting(true);
    try {
      if (targetClassId === 'graduate_out') {
        await dbRemove(`students/${selectedStudent.id}`);
        toast({ title: "Success", description: `${selectedStudent.name} has graduated from the school!` });
      } else {
        const targetClass = classes.find(c => c.id === targetClassId);
        if (!targetClass) throw new Error("Target class not found");
        
        await dbUpdate(`students/${selectedStudent.id}`, {
          classId: targetClass.id,
          className: targetClass.name
        });
        toast({ title: "Success", description: `${selectedStudent.name} ${promoteAction === 'graduate' ? 'graduated' : 'demoted'} to ${targetClass.name}` });
      }
      setShowPanel(null);
      setSelectedStudent(null);
      setTargetClassId('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExitStudent = async (student: Student) => {
    if (window.confirm(`Are you sure you want to remove ${student.name} from the school records?`)) {
      await dbRemove(`students/${student.id}`);
      toast({ title: "Success", description: `${student.name} has been removed from records` });
    }
  };

  const handleCleanupDuplicates = async () => {
    let cleanedTeachers = 0;
    let cleanedStudents = 0;

    // Cleanup Teachers
    const teacherUsernames = new Set();
    for (const t of teachers) {
      if (teacherUsernames.has(t.username)) {
        await dbRemove(`teachers/${t.id}`);
        cleanedTeachers++;
      } else {
        teacherUsernames.add(t.username);
      }
    }

    // Cleanup Students
    const studentUsernames = new Set();
    for (const s of students) {
      if (studentUsernames.has(s.username)) {
        await dbRemove(`students/${s.id}`);
        cleanedStudents++;
      } else {
        studentUsernames.add(s.username);
      }
    }

    if (cleanedTeachers > 0 || cleanedStudents > 0) {
      toast({ 
        title: "Cleanup Complete", 
        description: `Removed ${cleanedTeachers} duplicate teachers and ${cleanedStudents} duplicate students.` 
      });
    } else {
      toast({ title: "Clean", description: "No duplicate entries found." });
    }
  };

  const handleSendReply = async () => {
    if (!selectedComplaint || !replyMessage.trim()) return;

    await dbPush('complaints', {
      studentId: selectedComplaint.studentId,
      studentName: selectedComplaint.studentName,
      classId: selectedComplaint.classId,
      className: selectedComplaint.className,
      subject: "Reply",
      message: replyMessage,
      createdAt: new Date().toISOString(),
      status: 'sent',
      read: false,
      sender: 'admin'
    });

    setReplyMessage('');
    toast({ title: "Sent", description: "Reply sent to student" });
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

  // Timetable page
  if (currentPage === 'timetable') {
    return (
      <div ref={ref}>
        <TimetablePanel currentPage={currentPage} />
      </div>
    );
  }

  // Reports/Analytics page
  if (currentPage === 'reports') {
    return (
      <div ref={ref}>
        <AnalyticsPanel currentPage={currentPage} />
      </div>
    );
  }

  // Settings page
  if (currentPage === 'settings') {
    return (
      <div ref={ref}>
        <SettingsPanel currentPage={currentPage} />
      </div>
    );
  }

  if (currentPage === 'complaints') {
    return (
      <div ref={ref} className="h-[calc(100vh-120px)] flex bg-background rounded-2xl overflow-hidden shadow-2xl border border-border/50">
        {/* Sidebar */}
        <div className="w-[350px] flex flex-col border-r border-border/50 bg-muted/10">
           <div className="p-4 bg-muted/20 border-b border-border/50 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-bold text-primary">P</span>
               </div>
               <h2 className="font-display font-bold text-lg">Complaints</h2>
             </div>
             <div className="flex gap-2">
               <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
             </div>
           </div>
           
           <div className="p-3">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input 
                 placeholder="Search or start new chat" 
                 className="pl-9 bg-muted/20 border-0 focus-visible:ring-1" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
           </div>

           <div className="flex-1 overflow-y-auto">
             {conversations
               .filter(c => (c.studentName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (c.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (c.message?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
               .map(complaint => (
               <div 
                 key={complaint.id} 
                 onClick={() => setSelectedComplaint(complaint)}
                 className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/30 ${selectedComplaint?.id === complaint.id ? 'bg-muted/40' : ''}`}
               >
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                   {(complaint.studentName || '?').charAt(0)}
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-baseline mb-0.5">
                     <span className="font-semibold text-sm truncate">{complaint.studentName || 'Unknown Student'}</span>
                     <span className={`text-[10px] ${selectedComplaint?.id === complaint.id ? 'text-primary' : 'text-muted-foreground'}`}>
                       {new Date(complaint.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                     </span>
                   </div>
                   <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                     {complaint.status === 'resolved' && <Check className="w-3 h-3 text-blue-500" />}
                     {(complaint.subject || 'No Subject') + ' • ' + (complaint.message || '')}
                   </p>
                 </div>
               </div>
             ))}
             {conversations.length === 0 && (
               <div className="p-8 text-center text-muted-foreground text-sm">
                 <p>No messages</p>
               </div>
             )}
           </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-background relative">
          {/* Chat Background Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>
          
          {selectedComplaint ? (
            <>
              {/* Chat Header */}
              <div className="h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50 flex items-center justify-between px-4 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                    {(selectedComplaint.studentName || '?').charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{selectedComplaint.studentName || 'Unknown Student'}</span>
                    <span className="text-xs text-muted-foreground">{selectedComplaint.className || 'Unknown Class'} • Student</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   {selectedComplaint.status !== 'resolved' && (
                     <Button size="sm" variant="outline" className="h-9" onClick={() => dbUpdate(`complaints/${selectedComplaint.id}`, { status: 'resolved' })}>
                       <Check className="w-4 h-4 mr-2" /> Mark Resolved
                     </Button>
                   )}
                   <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => {
                     dbRemove(`complaints/${selectedComplaint.id}`);
                     setSelectedComplaint(null);
                   }}>
                     <Trash2 className="w-5 h-5" />
                   </Button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 z-0 space-y-4">
                <div className="flex justify-center mb-4">
                  <span className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] text-muted-foreground shadow-sm border border-border/50 uppercase tracking-wider font-medium">
                    {new Date(selectedComplaint.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                {complaints
                  .filter(c => c.studentId === selectedComplaint.studentId)
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm relative group ${
                        msg.sender === 'admin' 
                          ? 'bg-[#d9fdd3] dark:bg-primary/20 rounded-tr-none' 
                          : 'bg-white dark:bg-muted rounded-tl-none'
                      }`}>
                        {msg.subject !== 'Chat Message' && msg.subject !== 'Reply' && (
                          <p className="font-bold text-xs text-blue-600 mb-1">{msg.subject}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{msg.message}</p>
                        <div className="flex justify-end items-center gap-1 mt-1">
                          <span className="text-[10px] text-muted-foreground/80">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.sender === 'admin' && (
                             <div className="flex -space-x-1">
                               <Check className="w-3 h-3 text-blue-500" />
                               <Check className="w-3 h-3 text-blue-500" />
                             </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {/* System Message if resolved */}
                {selectedComplaint.status === 'resolved' && (
                  <div className="flex justify-center mt-4">
                     <div className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 shadow-sm">
                       <Check className="w-3 h-3" /> This complaint was marked as resolved
                     </div>
                  </div>
                )}
              </div>

              {/* Chat Input Area */}
              <div className="p-3 bg-background border-t border-border/50 z-10 flex gap-2 items-center">
                <Button variant="ghost" size="icon"><Plus className="w-5 h-5 text-muted-foreground" /></Button>
                <Input 
                  className="flex-1 bg-muted/30 border-0 focus-visible:ring-1"
                  placeholder="Type a reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                />
                <Button variant="ghost" size="icon" onClick={handleSendReply} disabled={!replyMessage.trim()}>
                  <Send className={`w-5 h-5 ${replyMessage.trim() ? 'text-primary' : 'text-muted-foreground'}`} />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground z-10">
              <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                <Megaphone className="w-10 h-10 opacity-30" />
              </div>
              <h3 className="text-xl font-light text-foreground/70 mb-2">Principal's WhatsApp</h3>
              <p className="text-sm opacity-60">Select a complaint to view details</p>
              <div className="mt-8 flex gap-2 text-xs opacity-40">
                <Lock className="w-3 h-3" /> End-to-end encrypted
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Get unique counts for dashboard statistics to avoid double-counting
  const uniqueTeachersCount = new Set(teachers.map(t => t.username)).size;
  const uniqueStudentsCount = new Set(students.map(s => s.username)).size;
  const uniqueClassesCount = new Set(classes.map(c => c.name)).size;

  if (currentPage === 'dashboard') {
    return (
      <div ref={ref} className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-display font-bold">Admin Overview</h2>
            <p className="text-muted-foreground">Manage your school's data and operations</p>
          </div>
          <Button variant="outline" onClick={handleCleanupDuplicates} className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700">
            <Shield className="w-4 h-4 mr-2" /> Cleanup Duplicates
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Teachers" value={uniqueTeachersCount} icon={Users} gradient="bg-gradient-primary" delay={0} />
          <StatCard title="Total Classes" value={uniqueClassesCount} icon={BookOpen} gradient="bg-gradient-gold" delay={0.1} />
          <StatCard title="Total Students" value={uniqueStudentsCount} icon={GraduationCap} gradient="bg-gradient-success" delay={0.2} />
          <StatCard title="Announcements" value={announcements.length} icon={Megaphone} gradient="bg-gradient-warm" delay={0.3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-xl border-0 hover-lift">
            <CardHeader><CardTitle className="font-display flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: Megaphone, label: 'Post Announcement', panel: 'announcement' },
                { icon: Sparkles, label: 'Social Popup', panel: 'popup' },
                { icon: UserPlus, label: 'Add Teacher', panel: 'teacher' },
                { icon: School, label: 'Create Class', panel: 'class' },
                { icon: GraduationCap, label: 'Enroll Student', panel: 'student' },
              ].map((action, i) => (
                <Button key={i} variant="outline" className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-all" onClick={() => setShowPanel(action.panel)}>
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

        {/* Slide Panels */}
        <SlidePanel isOpen={showPanel === 'announcement'} onClose={() => setShowPanel(null)} title="Post Announcement">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <Input placeholder="Announcement title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Content</label>
              <Textarea placeholder="Write your announcement..." rows={4} value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Priority</label>
              <select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newAnnouncement.priority} onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value as any})}>
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <Button className="w-full bg-gradient-primary" onClick={handleAddAnnouncement}><Send className="w-4 h-4 mr-2" />Post Announcement</Button>
          </div>
        </SlidePanel>

        <SlidePanel isOpen={showPanel === 'teacher'} onClose={() => setShowPanel(null)} title="Add New Teacher">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <Input placeholder="Enter full name" value={newTeacher.name} onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Subject</label>
              <Input placeholder="Teaching subject" value={newTeacher.subject} onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <Input placeholder="Login username" value={newTeacher.username} onChange={(e) => setNewTeacher({...newTeacher, username: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password</label>
              <Input type="password" placeholder="Set password" value={newTeacher.password} onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})} />
            </div>
            <Button className="w-full bg-gradient-primary" onClick={handleAddTeacher}><Save className="w-4 h-4 mr-2" />Save Teacher</Button>
          </div>
        </SlidePanel>

        <SlidePanel isOpen={showPanel === 'class'} onClose={() => setShowPanel(null)} title="Create New Class">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Class Name</label>
              <Input placeholder="e.g., Class 10A" value={newClass.name} onChange={(e) => setNewClass({...newClass, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Grade</label>
              <Input placeholder="e.g., 10" value={newClass.grade} onChange={(e) => setNewClass({...newClass, grade: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Assign Teacher</label>
              <select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newClass.teacherId} onChange={(e) => setNewClass({...newClass, teacherId: e.target.value})}>
                <option value="">Select a teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
              </select>
            </div>
            <Button className="w-full bg-gradient-primary" onClick={handleAddClass}><Save className="w-4 h-4 mr-2" />Create Class</Button>
          </div>
        </SlidePanel>

        <SlidePanel isOpen={showPanel === 'student'} onClose={() => setShowPanel(null)} title="Enroll New Student">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <Input placeholder="Student's full name" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <Input placeholder="Login username" value={newStudent.username} onChange={(e) => setNewStudent({...newStudent, username: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password</label>
              <Input type="password" placeholder="Set password" value={newStudent.password} onChange={(e) => setNewStudent({...newStudent, password: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Assign to Class</label>
              <select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newStudent.classId} onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}>
                <option value="">Select a class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} (Grade {c.grade})</option>)}
              </select>
            </div>
            <Button className="w-full bg-gradient-primary" onClick={handleAddStudent}><Save className="w-4 h-4 mr-2" />Enroll Student</Button>
          </div>
        </SlidePanel>

        <SlidePanel 
          isOpen={showPanel === 'edit-user'} 
          onClose={() => { setShowPanel(null); setEditingUser(null); }} 
          title={`Edit ${editingUser?.role === 'teacher' ? 'Teacher' : 'Student'} Details`}
        >
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <Input 
                  placeholder="Enter full name" 
                  value={editingUser.name} 
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} 
                />
              </div>
              
              {editingUser.role === 'teacher' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <Input 
                    placeholder="Teaching subject" 
                    value={editingUser.subject || ''} 
                    onChange={(e) => setEditingUser({ ...editingUser, subject: e.target.value })} 
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <Input 
                  placeholder="Login username" 
                  value={editingUser.username} 
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Password</label>
                <Input 
                  type="text" 
                  placeholder="Set password" 
                  value={editingUser.password} 
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} 
                />
                <p className="text-xs text-muted-foreground italic">Password is visible for admin editing.</p>
              </div>

              {editingUser.role === 'student' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Class</label>
                  <select 
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background" 
                    value={editingUser.classId || ''} 
                    onChange={(e) => setEditingUser({ ...editingUser, classId: e.target.value })}
                  >
                    <option value="">Select a class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} (Grade {c.grade})</option>)}
                  </select>
                </div>
              )}

              <div className="pt-4">
                <Button 
                  className="w-full bg-gradient-primary h-11 rounded-xl shadow-lg" 
                  onClick={handleUpdateUser}
                  disabled={isSubmitting}
                >
                  <Save className="w-4 h-4 mr-2" /> 
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </SlidePanel>

        <SlidePanel isOpen={showPanel === 'popup'} onClose={() => setShowPanel(null)} title="Social Media Popup Settings">
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold">Enable Popup</label>
                  <p className="text-xs text-muted-foreground">Show social links to all visitors</p>
                </div>
                <Switch 
                  checked={popupConfig.enabled} 
                  onCheckedChange={(val) => setPopupConfig({ ...popupConfig, enabled: val })} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Banner Text</label>
              <Textarea 
                placeholder="Enter a cool banner text (e.g., Join our community!)" 
                rows={3} 
                value={popupConfig.bannerText} 
                onChange={(e) => setPopupConfig({ ...popupConfig, bannerText: e.target.value })} 
              />
              <p className="text-xs text-muted-foreground italic">This text will appear at the top of the popup.</p>
            </div>

            <div className="pt-4">
              <Button className="w-full bg-gradient-primary h-11 rounded-xl shadow-lg" onClick={handleUpdatePopupConfig}>
                <Save className="w-4 h-4 mr-2" /> Save Settings
              </Button>
            </div>
          </div>
        </SlidePanel>
      </div>
    );
  }

  if (currentPage === 'announcements') {
    return (
      <div ref={ref} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h3 className="text-2xl font-display font-bold">Announcements</h3><p className="text-muted-foreground">Manage school announcements</p></div>
          <Button className="bg-gradient-primary" onClick={() => setShowPanel('announcement')}><Plus className="w-4 h-4 mr-2" />New Announcement</Button>
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
        <SlidePanel isOpen={showPanel === 'announcement'} onClose={() => setShowPanel(null)} title="Post Announcement">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <Input placeholder="Announcement title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Content</label>
              <Textarea placeholder="Write your announcement..." rows={4} value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Priority</label>
              <select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newAnnouncement.priority} onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value as any})}>
                <option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option>
              </select>
            </div>
            <Button className="w-full bg-gradient-primary" onClick={handleAddAnnouncement}><Send className="w-4 h-4 mr-2" />Post</Button>
          </div>
        </SlidePanel>
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
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => handleExportData(teachers, 'teachers')} title="Export Teachers"><Download className="w-4 h-4" /></Button>
              <div className="relative">
                <input type="file" accept=".csv" className="hidden" id="import-teachers" onChange={handleImportTeachers} />
                <Button variant="outline" size="icon" onClick={() => document.getElementById('import-teachers')?.click()} title="Import Teachers"><Upload className="w-4 h-4" /></Button>
              </div>
              <Button className="bg-gradient-primary" onClick={() => setShowPanel('teacher')}><Plus className="w-4 h-4 mr-2" />Add</Button>
            </div>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditingUser({ ...t, role: 'teacher' });
                        setShowPanel('edit-user');
                      }}>
                        <Cog className="w-4 h-4 mr-2" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedUser({ id: t.id, name: t.name, role: 'teacher' });
                        setShowPanel('change-password');
                      }}>
                        <Lock className="w-4 h-4 mr-2" /> Change Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => dbRemove(`teachers/${t.id}`)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Teacher
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <SlidePanel isOpen={showPanel === 'teacher'} onClose={() => setShowPanel(null)} title="Add New Teacher">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <Input placeholder="Enter full name" value={newTeacher.name} onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Subject</label>
              <Input placeholder="Teaching subject" value={newTeacher.subject} onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <Input placeholder="Login username" value={newTeacher.username} onChange={(e) => setNewTeacher({...newTeacher, username: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password</label>
              <Input type="password" placeholder="Set password" value={newTeacher.password} onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})} />
            </div>
            <Button className="w-full bg-gradient-primary" onClick={handleAddTeacher}><Save className="w-4 h-4 mr-2" />Save Teacher</Button>
          </div>
        </SlidePanel>

        <SlidePanel 
          isOpen={showPanel === 'change-password'} 
          onClose={() => { setShowPanel(null); setSelectedUser(null); setNewPassword(''); }} 
          title="Change Password"
        >
          {selectedUser && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <p className="text-sm text-muted-foreground">{selectedUser.role === 'teacher' ? 'Teacher' : 'Student'}</p>
                <p className="font-bold text-lg">{selectedUser.name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">New Password</label>
                <Input 
                  type="password" 
                  placeholder="Enter new password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                />
              </div>
              <div className="pt-4">
                <Button 
                  className="w-full bg-gradient-primary" 
                  onClick={handleUpdatePassword}
                  disabled={!newPassword.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </div>
          )}
        </SlidePanel>
      </div>
    );
  }

  if (currentPage === 'classes') {
    return (
      <div ref={ref} className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h3 className="text-2xl font-display font-bold">Classes</h3><p className="text-muted-foreground">Manage school classes</p></div>
          <Button className="bg-gradient-primary" onClick={() => setShowPanel('class')}><Plus className="w-4 h-4 mr-2" />Create</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((c, i) => (
            <Card key={c.id} className="hover-lift animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center"><span className="font-display font-bold text-secondary-foreground">{c.grade}</span></div>
                    <div>
                      <h4 className="font-semibold">{c.name}</h4>
                      <p className="text-sm text-muted-foreground">{c.teacherName}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.secondaryTeachers && c.secondaryTeachers.length > 0
                          ? `Secondary: ${c.secondaryTeachers.map(st => st.name).join(', ')}`
                          : 'Secondary: None'}
                      </p>
                      <p className="text-xs text-muted-foreground">{students.filter(s => s.classId === c.id).length} students</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedClassId(c.id);
                          setManageClass({
                            name: c.name,
                            grade: c.grade,
                            teacherId: c.teacherId,
                            secondaryTeacherIds: (c.secondaryTeachers || []).map(st => st.id)
                          });
                          setShowPanel('manage-class');
                        }}
                      >
                        <Cog className="w-4 h-4 mr-2" /> Manage
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedClassId(c.id);
                          const initial: Record<string, boolean> = {};
                          (c.secondaryTeachers || []).forEach(st => { initial[st.id] = true; });
                          setSecondarySelections(initial);
                          setShowPanel('add-secondary');
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" /> Add Secondary Teacher
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => dbRemove(`classes/${c.id}`)}>
                        <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <SlidePanel isOpen={showPanel === 'class'} onClose={() => setShowPanel(null)} title="Create New Class">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Class Name</label>
              <Input placeholder="e.g., Class 10A" value={newClass.name} onChange={(e) => setNewClass({...newClass, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Grade</label>
              <Input placeholder="e.g., 10" value={newClass.grade} onChange={(e) => setNewClass({...newClass, grade: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Assign Teacher</label>
              <select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newClass.teacherId} onChange={(e) => setNewClass({...newClass, teacherId: e.target.value})}>
                <option value="">Select a teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <Button className="w-full bg-gradient-primary" onClick={handleAddClass}><Save className="w-4 h-4 mr-2" />Create Class</Button>
          </div>
        </SlidePanel>
        <SlidePanel isOpen={showPanel === 'manage-class'} onClose={() => setShowPanel(null)} title="Manage Class">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Class Name</label>
              <Input placeholder="e.g., Class 10A" value={manageClass.name} onChange={(e) => setManageClass({ ...manageClass, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Grade</label>
              <Input placeholder="e.g., 10" value={manageClass.grade} onChange={(e) => setManageClass({ ...manageClass, grade: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Primary Teacher</label>
              <select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={manageClass.teacherId} onChange={(e) => setManageClass({ ...manageClass, teacherId: e.target.value })}>
                <option value="">Select a teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Secondary Teacher</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {teachers.map(t => (
                  <label key={t.id} className="flex items-center gap-2 p-2 rounded-lg border border-input">
                    <Checkbox
                      checked={manageClass.secondaryTeacherIds.includes(t.id)}
                      onCheckedChange={(checked) => {
                        setManageClass(prev => {
                          const set = new Set(prev.secondaryTeacherIds);
                          if (checked) set.add(t.id); else set.delete(t.id);
                          return { ...prev, secondaryTeacherIds: Array.from(set) };
                        });
                      }}
                    />
                    <span className="text-sm">{t.name} ({t.subject})</span>
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full bg-gradient-primary" onClick={handleUpdateClass}><Save className="w-4 h-4 mr-2" />Save Changes</Button>
          </div>
        </SlidePanel>
        <SlidePanel isOpen={showPanel === 'add-secondary'} onClose={() => setShowPanel(null)} title="Add Secondary Teachers">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Select Teachers</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {teachers.map(t => (
                  <label key={t.id} className="flex items-center gap-2 p-2 rounded-lg border border-input">
                    <Checkbox
                      checked={!!secondarySelections[t.id]}
                      onCheckedChange={(checked) => {
                        setSecondarySelections(prev => ({ ...prev, [t.id]: !!checked }));
                      }}
                    />
                    <span className="text-sm">{t.name} ({t.subject})</span>
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full bg-gradient-primary" onClick={handleAddSecondaryTeacher}><Save className="w-4 h-4 mr-2" />Add</Button>
          </div>
        </SlidePanel>
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
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => handleExportData(students, 'students')} title="Export Students"><Download className="w-4 h-4" /></Button>
              <div className="relative">
                <input type="file" accept=".csv" className="hidden" id="import-students" onChange={handleImportStudents} />
                <Button variant="outline" size="icon" onClick={() => document.getElementById('import-students')?.click()} title="Import Students"><Upload className="w-4 h-4" /></Button>
              </div>
              <Button className="bg-gradient-primary" onClick={() => setShowPanel('student')}><Plus className="w-4 h-4 mr-2" />Enroll</Button>
            </div>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditingUser({ ...s, role: 'student' });
                        setShowPanel('edit-user');
                      }}>
                        <Cog className="w-4 h-4 mr-2" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleGraduateStudent(s)}>
                        <TrendingUp className="w-4 h-4 mr-2 text-green-500" /> Graduate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDemoteStudent(s)}>
                        <TrendingUp className="w-4 h-4 mr-2 text-orange-500 rotate-180" /> Demote
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedUser({ id: s.id, name: s.name, role: 'student' });
                        setShowPanel('change-password');
                      }}>
                        <Lock className="w-4 h-4 mr-2" /> Change Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleExitStudent(s)}>
                        <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Exit School
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <SlidePanel isOpen={showPanel === 'student'} onClose={() => setShowPanel(null)} title="Enroll New Student">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <Input placeholder="Student's full name" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <Input placeholder="Login username" value={newStudent.username} onChange={(e) => setNewStudent({...newStudent, username: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password</label>
              <Input type="password" placeholder="Set password" value={newStudent.password} onChange={(e) => setNewStudent({...newStudent, password: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Assign to Class</label>
              <select className="w-full h-10 px-3 rounded-lg border border-input bg-background" value={newStudent.classId} onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}>
                <option value="">Select a class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Button className="w-full bg-gradient-primary" onClick={handleAddStudent}><Save className="w-4 h-4 mr-2" />Enroll Student</Button>
          </div>
        </SlidePanel>

        <SlidePanel 
          isOpen={showPanel === 'promote'} 
          onClose={() => { setShowPanel(null); setSelectedStudent(null); }} 
          title={promoteAction === 'graduate' ? 'Graduate Student' : 'Demote Student'}
        >
          {selectedStudent && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="font-bold text-lg">{selectedStudent.name}</p>
                <p className="text-xs text-muted-foreground">Current Class: {selectedStudent.className}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Select Target Class</label>
                <select 
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background" 
                  value={targetClassId} 
                  onChange={(e) => setTargetClassId(e.target.value)}
                >
                  <option value="">Select target class</option>
                  {promoteAction === 'graduate' && <option value="graduate_out">Graduate out of School (Complete)</option>}
                  {classes
                    .filter(c => c.id !== selectedStudent.classId)
                    .sort((a, b) => parseInt(a.grade) - parseInt(b.grade))
                    .map(c => (
                      <option key={c.id} value={c.id}>Grade {c.grade} - {c.name}</option>
                    ))
                  }
                </select>
              </div>

              <div className="pt-4">
                <Button 
                  className="w-full bg-gradient-primary" 
                  onClick={handleConfirmPromotion}
                  disabled={!targetClassId || isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : `Confirm ${promoteAction === 'graduate' ? 'Graduation' : 'Demotion'}`}
                </Button>
              </div>
            </div>
          )}
        </SlidePanel>

        <SlidePanel 
          isOpen={showPanel === 'change-password'} 
          onClose={() => { setShowPanel(null); setSelectedUser(null); setNewPassword(''); }} 
          title="Change Password"
        >
          {selectedUser && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <p className="text-sm text-muted-foreground">{selectedUser.role === 'teacher' ? 'Teacher' : 'Student'}</p>
                <p className="font-bold text-lg">{selectedUser.name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">New Password</label>
                <Input 
                  type="password" 
                  placeholder="Enter new password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                />
              </div>
              <div className="pt-4">
                <Button 
                  className="w-full bg-gradient-primary" 
                  onClick={handleUpdatePassword}
                  disabled={!newPassword.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </div>
          )}
        </SlidePanel>
      </div>
    );
  }

  return <div ref={ref} className="text-center py-16 text-muted-foreground">Select a section from the menu</div>;
});

AdminDashboard.displayName = 'AdminDashboard';
export default AdminDashboard;
