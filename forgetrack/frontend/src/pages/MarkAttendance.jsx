import { useState } from 'react';
import { Calendar, Search, PlusCircle, MonitorPlay, Users as UsersIcon, X, CheckCircle2 } from 'lucide-react';

// Mock Data
const MOCK_STUDENTS = [
  { id: 1, name: "Aarav Patel", usn: "4SH24CS001", branch: "AI" },
  { id: 2, name: "Vihaan Sharma", usn: "4SH24CS002", branch: "EC" },
  { id: 3, name: "Vivaan Kumar", usn: "4SH24CS003", branch: "IS" },
  { id: 4, name: "Ananya Singh", usn: "4SH24CS004", branch: "EC" },
  { id: 5, name: "Diya Gupta", usn: "4SH24CS005", branch: "EC" },
  { id: 6, name: "Aditya Rao", usn: "4SH24CS006", branch: "CS" },
  { id: 7, name: "Ishaan Desai", usn: "4SH24CS007", branch: "CS" },
  { id: 8, name: "Saanvi Reddy", usn: "4SH24CS008", branch: "IS" },
  { id: 9, name: "Neha Joshi", usn: "4SH24CS009", branch: "EC" },
  { id: 10, name: "Rohan Mehta", usn: "4SH24CS010", branch: "IS" },
  { id: 11, name: "Kavya Nair", usn: "4SH24CS011", branch: "IS" },
  { id: 12, name: "Arjun Verma", usn: "4SH24CS012", branch: "EC" },
  { id: 13, name: "Aryan Choudhury", usn: "4SH24CS013", branch: "CS" },
  { id: 14, name: "Meera Iyer", usn: "4SH24CS014", branch: "CS" },
  { id: 15, name: "Karthik Pillai", usn: "4SH24CS015", branch: "IS" },
  { id: 16, name: "Rahul Kapoor", usn: "4SH24CS016", branch: "EC" },
  { id: 17, name: "Shruti Das", usn: "4SH24CS017", branch: "IS" },
  { id: 18, name: "Nikhil Menon", usn: "4SH24CS018", branch: "AI" },
  { id: 19, name: "Pooja Bhatt", usn: "4SH24CS019", branch: "IS" },
  { id: 20, name: "Siddharth Sen", usn: "4SH24CS020", branch: "IS" },
];

export function MarkAttendance() {
  const [selectedDate, setSelectedDate] = useState("2026-05-06");
  
  // Track all sessions for the selected date
  const [sessionsByDate, setSessionsByDate] = useState({
    "2026-05-06": [
      { id: 1, topic: "8-Layer AI Application Stack", mode: "Offline", duration: "2.0" }
    ]
  });

  // Track attendance PER SESSION ID to prevent State Bleed
  const [attendanceBySessionId, setAttendanceBySessionId] = useState({
    1: new Set() // Default empty set for session 1
  });

  const currentSessions = sessionsByDate[selectedDate] || [];
  
  const [selectedSessionId, setSelectedSessionId] = useState(
    currentSessions.length > 0 ? currentSessions[0].id : null
  );

  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Form states for creating a session
  const [newTopic, setNewTopic] = useState("");
  const [newMode, setNewMode] = useState("Offline");
  const [newDuration, setNewDuration] = useState("2.0");

  const activeSession = currentSessions.find(s => s.id === selectedSessionId);
  const currentPresentIds = activeSession ? (attendanceBySessionId[activeSession.id] || new Set()) : new Set();

  const filteredStudents = MOCK_STUDENTS.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.usn.toLowerCase().includes(search.toLowerCase())
  );

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    
    const sessions = sessionsByDate[newDate] || [];
    if (sessions.length > 0) {
      setSelectedSessionId(sessions[0].id);
      setIsCreatingSession(false);
    } else {
      setSelectedSessionId(null);
      setIsCreatingSession(false); // Don't force open form, let empty state show
    }
    setSearch("");
  };

  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    
    const newSession = {
      id: Date.now(),
      topic: newTopic,
      mode: newMode,
      duration: newDuration
    };

    setSessionsByDate(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), newSession]
    }));

    // Initialize empty attendance for new session
    setAttendanceBySessionId(prev => ({
      ...prev,
      [newSession.id]: new Set()
    }));

    setSelectedSessionId(newSession.id);
    setIsCreatingSession(false);
    setNewTopic(""); // Reset form
  };

  const handleToggle = (id) => {
    if (!activeSession) return;
    
    const newSet = new Set(currentPresentIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    
    setAttendanceBySessionId(prev => ({
      ...prev,
      [activeSession.id]: newSet
    }));
  };

  const handleSelectAll = (present) => {
    if (!activeSession) return;

    const newSet = new Set(currentPresentIds);
    
    // Only apply to the students CURRENTLY FILTERED in the view
    filteredStudents.forEach(s => {
      if (present) {
        newSet.add(s.id);
      } else {
        newSet.delete(s.id);
      }
    });

    setAttendanceBySessionId(prev => ({
      ...prev,
      [activeSession.id]: newSet
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 2000);
  };

  return (
    <div className="w-full relative pb-24">
      {/* Top Header */}
      <header className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-h1">Mark Attendance</h1>
          
          {/* Explicit Create Session Button */}
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
        
        {/* Date & Session Selectors */}
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

        {/* Selected Session Info (Only show if not creating and session exists) */}
        {!isCreatingSession && activeSession && (
          <div className="card max-w-2xl py-6 flex items-center justify-between border border-[var(--border-strong)]">
            <div>
              <div className="text-label text-[var(--text-tertiary)] mb-2">SELECTED SESSION</div>
              <h3 className="text-h3 font-display">{activeSession.topic}</h3>
            </div>
            <div className="flex gap-3">
              <span className={`pill ${activeSession.mode === 'Online' ? 'pill-success' : 'pill-neutral'}`}>
                {activeSession.mode}
              </span>
              <span className="pill pill-neutral">{activeSession.duration} hrs</span>
            </div>
          </div>
        )}
      </header>

      {/* Conditional Rendering: Create Form vs Empty State vs Student List */}
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
            {/* Topic Input */}
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
              {/* Mode Selector */}
              <div>
                <label className="block text-label text-[var(--text-secondary)] mb-2">MODE</label>
                <div className="flex bg-[var(--bg-surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-1">
                  <button 
                    type="button"
                    onClick={() => setNewMode('Offline')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[6px] text-sm font-medium transition-colors ${newMode === 'Offline' ? 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    <UsersIcon className="w-4 h-4" /> Offline
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewMode('Online')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[6px] text-sm font-medium transition-colors ${newMode === 'Online' ? 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    <MonitorPlay className="w-4 h-4" /> Online
                  </button>
                </div>
              </div>

              {/* Duration Input */}
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
      ) : !activeSession ? (
        /* Empty State */
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
        /* Student List */
        <div className="card p-0 overflow-hidden flex flex-col h-[600px] border border-[var(--border-strong)]">
          {/* Card Header & Controls */}
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

          {/* Scrollable List */}
          <div className="overflow-y-auto flex-1 p-2">
            {filteredStudents.map((student) => {
              const isPresent = currentPresentIds.has(student.id);
              return (
                <div 
                  key={student.id} 
                  onClick={() => handleToggle(student.id)}
                  className={`flex items-center justify-between h-[56px] px-4 mx-2 rounded-[var(--radius-md)] cursor-pointer transition-colors border-b border-[var(--border-subtle)] last:border-0 ${
                    isPresent ? 'bg-[var(--accent-glow-soft)]' : 'hover:bg-[var(--bg-surface-raised)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Custom Dark Checkbox */}
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
                    <span className="pill pill-neutral w-12 justify-center">{student.branch}</span>
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

      {/* Sticky Action Bar - ONLY show when marking attendance (not creating and session exists) */}
      {!isCreatingSession && activeSession && (
        <div className="fixed bottom-0 left-[260px] right-0 p-6 bg-gradient-to-t from-[var(--bg-canvas)] to-transparent pointer-events-none z-20">
          <div className="max-w-[1440px] mx-auto pointer-events-auto">
            <div className="card py-4 px-6 flex items-center justify-between border border-[var(--border-strong)] shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="text-body-lg font-medium">
                  <span className="text-[var(--success-fg)]">{currentPresentIds.size} Present</span>
                  <span className="text-[var(--text-tertiary)] mx-2">•</span>
                  <span className="text-[var(--danger-fg)]">{MOCK_STUDENTS.length - currentPresentIds.size} Absent</span>
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
