import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { dbPush, dbListen, dbRemove } from '@/lib/firebase';
import SlidePanel from '@/components/ui/SlidePanel';
import { 
  Clock, Plus, Trash2, Calendar, BookOpen, 
  ChevronLeft, ChevronRight, Save
} from 'lucide-react';

interface TimetableEntry {
  id: string;
  classId: string;
  className: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  teacherName: string;
  room?: string;
}

interface Class {
  id: string;
  name: string;
  grade: string;
  teacherId: string;
  teacherName: string;
}

interface TimetablePanelProps {
  currentPage: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
];

const TimetablePanel: React.FC<TimetablePanelProps> = ({ currentPage }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [newEntry, setNewEntry] = useState({
    subject: '',
    day: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    room: ''
  });

  useEffect(() => {
    const unsubs = [
      dbListen('timetable', (data) => {
        if (data) {
          const entries = Object.entries(data).map(([id, e]: [string, any]) => ({ id, ...e }));
          setTimetable(entries);
        } else {
          setTimetable([]);
        }
      }),
      dbListen('classes', (data) => {
        if (data) {
          const classList = Object.entries(data).map(([id, c]: [string, any]) => ({ id, ...c }));
          
          if (user?.role === 'teacher') {
            const myClasses = classList.filter(c => c.teacherId === user.id);
            setClasses(myClasses);
            if (myClasses.length > 0 && !selectedClass) {
              setSelectedClass(myClasses[0].id);
            }
          } else if (user?.role === 'student') {
            const myClass = classList.find(c => c.id === user.classId);
            if (myClass) {
              setClasses([myClass]);
              setSelectedClass(myClass.id);
            }
          } else {
            setClasses(classList);
            if (classList.length > 0 && !selectedClass) {
              setSelectedClass(classList[0].id);
            }
          }
        }
      })
    ];
    return () => unsubs.forEach(u => u());
  }, [user?.id, user?.role, user?.classId]);

  const getFilteredTimetable = () => {
    if (!selectedClass) return [];
    return timetable.filter(t => t.classId === selectedClass);
  };

  const getEntryForSlot = (day: string, time: string) => {
    return getFilteredTimetable().find(
      t => t.day === day && t.startTime === time
    );
  };

  const handleAddEntry = async () => {
    if (!newEntry.subject || !selectedClass) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const cls = classes.find(c => c.id === selectedClass);
    await dbPush('timetable', {
      ...newEntry,
      classId: selectedClass,
      className: cls?.name || '',
      teacherId: user?.role === 'teacher' ? user.id : cls?.teacherId,
      teacherName: user?.role === 'teacher' ? user.name : cls?.teacherName,
      createdAt: new Date().toISOString()
    });

    setNewEntry({ subject: '', day: 'Monday', startTime: '08:00', endTime: '09:00', room: '' });
    setShowAddPanel(false);
    toast({ title: "Success", description: "Timetable entry added" });
  };

  const handleDeleteEntry = async (id: string) => {
    await dbRemove(`timetable/${id}`);
    toast({ title: "Deleted", description: "Entry removed from timetable" });
  };

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const currentClass = classes.find(c => c.id === selectedClass);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold">
            {user?.role === 'admin' ? 'All Timetables' : user?.role === 'teacher' ? 'Class Timetable' : 'My Schedule'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {user?.role === 'admin' ? 'View and manage all class schedules' : 
             user?.role === 'teacher' ? 'Manage your class schedules' : 
             'View your weekly class schedule'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {classes.length > 1 && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-10 px-4 rounded-xl border border-input bg-card font-medium"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} (Grade {c.grade})</option>
              ))}
            </select>
          )}
          {canEdit && (
            <Button className="bg-gradient-primary" onClick={() => setShowAddPanel(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Period
            </Button>
          )}
        </div>
      </div>

      {/* Current Class Info */}
      {currentClass && (
        <Card className="shadow-lg border-0 bg-gradient-primary overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold text-primary-foreground">{currentClass.name}</h3>
                <p className="text-primary-foreground/80">Grade {currentClass.grade} • {currentClass.teacherName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timetable Grid */}
      <Card className="shadow-xl border-0 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-4 text-left font-semibold text-muted-foreground border-b border-border">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Time
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="p-4 text-center font-semibold text-foreground border-b border-border">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time, index) => (
                  <tr key={time} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 border-b border-border/50 font-medium text-muted-foreground">
                      {time} - {TIME_SLOTS[index + 1] || '17:00'}
                    </td>
                    {DAYS.map(day => {
                      const entry = getEntryForSlot(day, time);
                      return (
                        <td key={`${day}-${time}`} className="p-2 border-b border-border/50">
                          {entry ? (
                            <div className="group relative p-3 rounded-xl bg-primary/10 border border-primary/20 hover:shadow-md transition-all animate-fade-in">
                              <p className="font-semibold text-sm text-primary">{entry.subject}</p>
                              <p className="text-xs text-muted-foreground mt-1">{entry.startTime} - {entry.endTime}</p>
                              {entry.room && <p className="text-xs text-muted-foreground">Room: {entry.room}</p>}
                              {canEdit && (
                                <button
                                  onClick={() => handleDeleteEntry(entry.id)}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="h-16 rounded-xl border-2 border-dashed border-border/50" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule Summary */}
      <Card className="shadow-xl border-0">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Calendar className="w-5 h-5 text-secondary" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const today = DAYS[new Date().getDay() - 1] || 'Monday';
            const todayEntries = getFilteredTimetable()
              .filter(t => t.day === today)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            if (todayEntries.length === 0) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No classes scheduled for today</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {todayEntries.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{entry.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.startTime} - {entry.endTime}
                        {entry.room && ` • Room ${entry.room}`}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {entry.className}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Add Entry Panel */}
      <SlidePanel
        isOpen={showAddPanel}
        onClose={() => setShowAddPanel(false)}
        title="Add Timetable Entry"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Subject *</label>
            <Input
              placeholder="e.g., Mathematics"
              value={newEntry.subject}
              onChange={(e) => setNewEntry({ ...newEntry, subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Day *</label>
            <select
              value={newEntry.day}
              onChange={(e) => setNewEntry({ ...newEntry, day: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background"
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Start Time *</label>
              <select
                value={newEntry.startTime}
                onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background"
              >
                {TIME_SLOTS.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">End Time *</label>
              <select
                value={newEntry.endTime}
                onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background"
              >
                {TIME_SLOTS.map((time, i) => (
                  <option key={time} value={TIME_SLOTS[i + 1] || '17:00'}>
                    {TIME_SLOTS[i + 1] || '17:00'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Room (optional)</label>
            <Input
              placeholder="e.g., Room 101"
              value={newEntry.room}
              onChange={(e) => setNewEntry({ ...newEntry, room: e.target.value })}
            />
          </div>

          <Button className="w-full bg-gradient-primary" onClick={handleAddEntry}>
            <Save className="w-4 h-4 mr-2" />
            Save Entry
          </Button>
        </div>
      </SlidePanel>
    </div>
  );
};

export default TimetablePanel;
