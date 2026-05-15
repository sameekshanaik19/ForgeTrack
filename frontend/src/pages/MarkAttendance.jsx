import { useState, useEffect } from 'react';
import { Calendar, Search, PlusCircle, MonitorPlay, Users as UsersIcon, X, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function MarkAttendance() {
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentSessions, setCurrentSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [presentStudentIds, setPresentStudentIds] = useState(new Set());
  
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for creating a session
  const [newTopic, setNewTopic] = useState("");
  const [newMode, setNewMode] = useState("offline");
  const [newDuration, setNewDuration] = useState("2.0");

  const activeSession = currentSessions.find(s => s.id === selectedSessionId);

  // 1. Initial Load: Fetch all students
  useEffect(() => {
    async function fetchStudents() {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (data && data.length > 0) {
        setStudents(data);
      } else {
        // Fallback to localStorage
        const localStudents = localStorage.getItem('forge_students');
        if (localStudents) {
          setStudents(JSON.parse(localStudents));
          console.log('Using local students fallback');
        }
      }
    }
    fetchStudents();
  }, []);

  // 2. Date/Session Change: Fetch sessions for date
  useEffect(() => {
    async function fetchSessions() {
      setIsLoading(true);
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('date', selectedDate);
      
      setCurrentSessions(data || []);
      
      if (data && data.length > 0) {
        setSelectedSessionId(data[0].id);
      } else {
        setSelectedSessionId(null);
      }
      setIsLoading(false);
    }
    fetchSessions();
  }, [selectedDate]);

  // 3. Session Change: Fetch attendance for session
  useEffect(() => {
    async function fetchAttendance() {
      if (!selectedSessionId) {
        setPresentStudentIds(new Set());
        return;
      }
      
      const { data } = await supabase
        .from('attendance')
        .select('student_id')
        .eq('session_id', selectedSessionId)
        .eq('present', true);
      
      setPresentStudentIds(new Set(data?.map(a => a.student_id) || []));
    }
    fetchAttendance();
  }, [selectedSessionId]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.usn.toLowerCase().includes(search.toLowerCase())
  );

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setIsCreatingSession(false);
    setSearch("");
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        date: selectedDate,
        topic: newTopic,
        session_type: newMode,
        duration_hours: parseFloat(newDuration),
        month_number: new Date(selectedDate).getMonth() + 1
      })
      .select()
      .single();

    if (data) {
      setCurrentSessions(prev => [...prev, data]);
      setSelectedSessionId(data.id);
      setIsCreatingSession(false);
      setNewTopic("");
    } else {
      console.error("Error creating session:", error);
      alert("Failed to create session. Maybe a session already exists for this date?");
    }
  };

  const handleToggle = (id) => {
    const newSet = new Set(presentStudentIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setPresentStudentIds(newSet);
  };

  const handleSelectAll = (present) => {
    const newSet = new Set(presentStudentIds);
    filteredStudents.forEach(s => {
      if (present) newSet.add(s.id);
      else newSet.delete(s.id);
    });
    setPresentStudentIds(newSet);
  };

  const handleSave = async () => {
    if (!selectedSessionId) return;
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const markedBy = user?.email || 'Mentor';

      const records = students.map(s => ({
        student_id: s.id,
        session_id: selectedSessionId,
        present: presentStudentIds.has(s.id),
        marked_by: markedBy
      }));

      const { error } = await supabase
        .from('attendance')
        .insert(records);

      if (error) throw error;
      
      setTimeout(() => setIsSaving(false), 1500);
    } catch (error) {
      console.error("Error saving attendance:", error);
      setIsSaving(false);
      alert("Error saving attendance. Please try again.");
    }
  };

  return (
    <div className="w-full relative pb-24">
      {/* Top Header */}
      <header className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-h1">Mark Attendance</h1>
          
          {!isCreatingSession && (
            <button 
              onClick={() => setIsCreatingSession(true)}
              className="flex items-center gap-2 bg-[var(--text-primary)] text-[var(--text-inverse)] rounded-[var(--radius-md)] px-4 py-2 font-medium text-sm hover:bg-[#E5E5E7] transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              New Session
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative w-48">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={handleDateChange}
              className="w-full bg-[var(--bg-surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent-glow)] focus:outline-none transition-colors"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {!isCreatingSession && currentSessions.length > 0 && (
            <div className="relative min-w-[300px]">
              <select 
                value={selectedSessionId || ''}
                onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                className="w-full appearance-none bg-[var(--bg-surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] py-2 pl-4 pr-10 text-sm text-[var(--text-primary)] focus:border-[var(--accent-glow)] focus:outline-none transition-colors"
              >
                {currentSessions.map(s => (
                  <option key={s.id} value={s.id}>{s.topic}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-tertiary)]"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          )}
        </div>

        {!isCreatingSession && activeSession && (
          <div className="card max-w-2xl py-6 flex items-center justify-between border border-[var(--border-strong)]">
            <div>
              <div className="text-label text-[var(--text-tertiary)] mb-2">SELECTED SESSION</div>
              <h3 className="text-h3 font-display">{activeSession.topic}</h3>
            </div>
            <div className="flex gap-3">
              <span className={`pill ${activeSession.session_type === 'online' ? 'pill-success' : 'pill-neutral'} capitalize`}>
                {activeSession.session_type}
              </span>
              <span className="pill pill-neutral">{activeSession.duration_hours} hrs</span>
            </div>
          </div>
        )}
      </header>

      {isCreatingSession ? (
        <div className="card max-w-2xl relative">
          {currentSessions.length > 0 && (
            <button 
              onClick={() => setIsCreatingSession(false)}
              className="absolute top-6 right-6 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-surface-inset)] flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-[var(--accent-glow)]" />
            </div>
            <div>
              <h2 className="text-h2">Create New Session</h2>
              <p className="text-body text-[var(--text-secondary)]">Schedule a class for {selectedDate}.</p>
            </div>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-6">
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-2">SESSION TOPIC</label>
              <input 
                type="text" 
                required
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g. Intro to RAG Agents" 
                className="w-full bg-[var(--bg-surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] py-3 px-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent-glow)] focus:outline-none transition-colors placeholder:text-[var(--text-tertiary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-label text-[var(--text-secondary)] mb-2">MODE</label>
                <div className="flex bg-[var(--bg-surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-1">
                  <button 
                    type="button"
                    onClick={() => setNewMode('offline')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[6px] text-sm font-medium transition-colors ${newMode === 'offline' ? 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    <UsersIcon className="w-4 h-4" /> Offline
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewMode('online')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[6px] text-sm font-medium transition-colors ${newMode === 'online' ? 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    <MonitorPlay className="w-4 h-4" /> Online
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-label text-[var(--text-secondary)] mb-2">DURATION (HOURS)</label>
                <input 
                  type="number" 
                  step="0.5"
                  min="0.5"
                  required
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full bg-[var(--bg-surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] py-3 px-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent-glow)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              {currentSessions.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => setIsCreatingSession(false)}
                  className="flex-1 bg-[var(--bg-surface-raised)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-6 py-3 font-medium hover:bg-[var(--bg-surface-inset)] transition-colors"
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit" 
                className="flex-[2] bg-[var(--text-primary)] text-[var(--text-inverse)] rounded-[var(--radius-md)] px-6 py-3 font-medium hover:bg-[#E5E5E7] transition-colors shadow-lg"
              >
                Create Session
              </button>
            </div>
          </form>
        </div>
      ) : isLoading ? (
        <div className="card py-24 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[var(--accent-glow)] animate-spin mb-4" />
          <p className="text-body text-[var(--text-secondary)]">Loading students and session data...</p>
        </div>
      ) : !activeSession ? (
        <div className="card max-w-2xl py-12 flex flex-col items-center justify-center text-center border-dashed border-[var(--border-strong)] bg-transparent">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-raised)] flex items-center justify-center mb-6">
            <Calendar className="w-8 h-8 text-[var(--text-tertiary)]" />
          </div>
          <h2 className="text-h2 mb-2">No Sessions Scheduled</h2>
          <p className="text-body text-[var(--text-secondary)] mb-8 max-w-md">
            There are currently no sessions scheduled for {selectedDate}. Create a new session to start marking attendance.
          </p>
          <button 
            onClick={() => setIsCreatingSession(true)}
            className="flex items-center gap-2 bg-[var(--text-primary)] text-[var(--text-inverse)] rounded-[var(--radius-md)] px-6 py-3 font-medium text-sm hover:bg-[#E5E5E7] transition-colors shadow-lg"
          >
            <PlusCircle className="w-4 h-4" />
            Create First Session
          </button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden flex flex-col h-[600px] border border-[var(--border-strong)]">
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-surface)]">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input 
                type="text" 
                placeholder="Filter students..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent-glow)] focus:outline-none transition-colors placeholder:text-[var(--text-tertiary)]"
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => handleSelectAll(true)}
                className="bg-[var(--bg-surface-raised)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2 font-medium text-[13px] hover:bg-[var(--bg-surface-inset)] transition-colors"
              >
                Select All Present
              </button>
              <button 
                onClick={() => handleSelectAll(false)}
                className="bg-[var(--bg-surface-raised)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2 font-medium text-[13px] hover:bg-[var(--bg-surface-inset)] transition-colors"
              >
                Select All Absent
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {filteredStudents.map((student) => {
              const isPresent = presentStudentIds.has(student.id);
              return (
                <div 
                  key={student.id} 
                  onClick={() => handleToggle(student.id)}
                  className={`flex items-center justify-between h-[56px] px-4 mx-2 rounded-[var(--radius-md)] cursor-pointer transition-colors border-b border-[var(--border-subtle)] last:border-0 ${
                    isPresent ? 'bg-[var(--accent-glow-soft)]' : 'hover:bg-[var(--bg-surface-raised)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      isPresent 
                        ? 'bg-[var(--accent-glow)] border-[var(--accent-glow)]' 
                        : 'bg-[var(--bg-surface-inset)] border-[var(--border-strong)]'
                    }`}>
                      {isPresent && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-body-lg text-[var(--text-primary)] font-medium leading-tight">
                        {student.name}
                      </div>
                      <div className="text-caption font-mono text-[var(--text-tertiary)] mt-0.5">
                        {student.usn}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`pill ${isPresent ? 'pill-success' : 'pill-danger'} min-w-[80px] justify-center`}>
                      {isPresent ? 'Present' : 'Absent'}
                    </span>
                    <span className="pill pill-neutral w-12 justify-center">{student.branch_code}</span>
                  </div>
                </div>
              );
            })}
            {filteredStudents.length === 0 && (
              <div className="h-full flex items-center justify-center text-[var(--text-tertiary)] text-body">
                No students found
              </div>
            )}
          </div>
        </div>
      )}

      {!isCreatingSession && activeSession && (
        <div className="fixed bottom-0 left-[260px] right-0 p-6 bg-gradient-to-t from-[var(--bg-canvas)] to-transparent pointer-events-none z-20">
          <div className="max-w-[1440px] mx-auto pointer-events-auto">
            <div className="card py-4 px-6 flex items-center justify-between border border-[var(--border-strong)] shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="text-body-lg font-medium">
                  <span className="text-[var(--success-fg)]">{presentStudentIds.size} Present</span>
                  <span className="text-[var(--text-tertiary)] mx-2">•</span>
                  <span className="text-[var(--danger-fg)]">{students.length - presentStudentIds.size} Absent</span>
                </div>
              </div>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-2.5 font-medium text-sm transition-all shadow-lg ${
                  isSaving 
                    ? 'bg-[var(--success-fg)] text-white scale-95' 
                    : 'bg-[var(--text-primary)] text-[var(--text-inverse)] hover:bg-[#E5E5E7]'
                }`}
              >
                {isSaving ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  "Save Attendance"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
