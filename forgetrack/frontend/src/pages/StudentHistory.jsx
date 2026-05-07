import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function StudentHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch all students for search
  useEffect(() => {
    async function fetchStudents() {
      const { data } = await supabase.from('students').select('*').order('name');
      setStudents(data || []);
    }
    fetchStudents();
  }, []);

  // 2. Fetch history for selected student
  useEffect(() => {
    async function fetchHistory() {
      if (!selectedStudent) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          date,
          topic,
          session_type,
          duration_hours,
          attendance!inner (
            present
          )
        `)
        .eq('attendance.student_id', selectedStudent.id)
        .order('date', { ascending: false });

      if (data) {
        setSessionHistory(data.map(s => ({
          ...s,
          status: s.attendance[0]?.present ? 'Present' : 'Absent'
        })));
      }
      setLoading(false);
    }
    fetchHistory();
  }, [selectedStudent]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.usn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = useMemo(() => {
    if (sessionHistory.length === 0) return { rate: 0, present: 0, total: 0 };
    const present = sessionHistory.filter(s => s.status === 'Present').length;
    const total = sessionHistory.length;
    return {
      rate: Math.round((present / total) * 100),
      present,
      total
    };
  }, [sessionHistory]);

  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const session = sessionHistory.find(s => s.date === dateStr);
      if (session) {
        days.push(session.status.toLowerCase());
      } else {
        days.push('none');
      }
    }
    return days;
  }, [sessionHistory]);

  return (
    <div className="w-full relative pb-24">
      {/* Search Combobox Header */}
      <header className="mb-12">
        <h1 className="text-h1 mb-6">Student History</h1>
        
        <div className="relative w-full max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Search by student name or USN..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="w-full bg-[var(--bg-surface-inset)] border border-[var(--border-default)] rounded-xl py-4 pl-12 pr-12 text-[15px] text-[var(--text-primary)] focus:border-[var(--accent-glow)] focus:outline-none transition-all shadow-sm"
            />
            <button 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {isDropdownOpen && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[var(--bg-surface-raised)] border border-[var(--border-default)] rounded-xl shadow-raised z-30 overflow-hidden">
              <div className="max-h-[300px] overflow-y-auto p-2">
                {filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student);
                      setSearchQuery("");
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-surface-inset)] transition-colors text-left"
                  >
                    <div>
                      <div className="text-body font-medium">{student.name}</div>
                      <div className="text-caption font-mono text-[var(--text-tertiary)]">{student.usn}</div>
                    </div>
                    <span className="pill pill-neutral text-micro">{student.branch_code}</span>
                  </button>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="p-4 text-center text-[var(--text-tertiary)] text-body">
                    No students found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {isDropdownOpen && (
          <div className="fixed inset-0 z-20" onClick={() => setIsDropdownOpen(false)}></div>
        )}
      </header>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[var(--accent-glow)] animate-spin mb-4" />
          <p className="text-body text-[var(--text-secondary)]">Fetching student history...</p>
        </div>
      ) : selectedStudent ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
            
            <div className="hero-card flex flex-col justify-between">
              <div>
                <h2 className="text-display-sm font-display font-bold mb-2">{selectedStudent.name}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-body-lg font-mono text-[var(--text-tertiary)]">{selectedStudent.usn}</span>
                  <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]"></span>
                  <span className="text-body text-[var(--text-secondary)]">{selectedStudent.branch_code}</span>
                  <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]"></span>
                  <span className="text-body text-[var(--text-secondary)]">{selectedStudent.batch}</span>
                </div>
              </div>

              <div className="mt-12">
                <div className="text-label text-[var(--text-tertiary)] mb-2">OVERALL ATTENDANCE</div>
                <div className="flex items-baseline gap-3">
                  <span className={`text-display-md font-display font-bold tabular-nums tracking-tight ${stats.rate >= 75 ? 'text-[var(--success-fg)]' : 'text-[var(--danger-fg)]'}`}>
                    {stats.rate}%
                  </span>
                  <span className="text-body text-[var(--text-tertiary)] font-medium">
                    ({stats.present} of {stats.total} sessions)
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex justify-between items-center mb-8">
                <div className="text-label text-[var(--text-tertiary)]">ATTENDANCE HISTORY (LAST 28 DAYS)</div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-[4px] bg-[var(--success-bg)] border border-[var(--success-border)]"></div>
                    <span className="text-micro text-[var(--text-tertiary)]">PRESENT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-[4px] bg-[var(--danger-bg)] border border-[var(--danger-border)]"></div>
                    <span className="text-micro text-[var(--text-tertiary)]">ABSENT</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-3 mb-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-micro text-[var(--text-tertiary)] w-8">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-3">
                {heatmapDays.map((status, i) => {
                  let classes = "w-8 h-8 rounded-[6px] transition-all ";
                  if (status === 'present') classes += "bg-[var(--success-bg)] border border-[var(--success-border)] hover:bg-[var(--success-border)]";
                  else if (status === 'absent') classes += "bg-[var(--danger-bg)] border border-[var(--danger-border)] hover:bg-[var(--danger-border)]";
                  else classes += "bg-[var(--bg-surface-inset)]";

                  if (i === 27) classes += " shadow-[0_0_0_2px_rgba(99,102,241,0.5)]";

                  return <div key={i} className={classes} title={status}></div>;
                })}
              </div>
            </div>

          </div>

          <div className="card p-0 overflow-hidden">
            <div className="p-6 border-b border-[var(--border-subtle)]">
              <h3 className="text-h3 font-display">Session Log</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-4 pl-6 font-body font-medium text-[12px] uppercase tracking-[0.02em] text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">Date</th>
                    <th className="text-left p-4 font-body font-medium text-[12px] uppercase tracking-[0.02em] text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">Topic</th>
                    <th className="text-left p-4 font-body font-medium text-[12px] uppercase tracking-[0.02em] text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">Type</th>
                    <th className="text-left p-4 font-body font-medium text-[12px] uppercase tracking-[0.02em] text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">Duration</th>
                    <th className="text-right p-4 pr-6 font-body font-medium text-[12px] uppercase tracking-[0.02em] text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionHistory.map((session) => (
                    <tr key={session.id} className="hover:bg-[var(--bg-surface-raised)] transition-colors group">
                      <td className="p-4 pl-6 text-body font-mono text-[var(--text-secondary)] border-b border-[var(--border-subtle)] group-last:border-0 whitespace-nowrap">
                        {session.date}
                      </td>
                      <td className="p-4 text-body text-[var(--text-primary)] border-b border-[var(--border-subtle)] group-last:border-0">
                        {session.topic}
                      </td>
                      <td className="p-4 border-b border-[var(--border-subtle)] group-last:border-0">
                        <span className="text-caption text-[var(--text-secondary)] bg-[var(--bg-surface-inset)] px-2 py-1 rounded-[4px] border border-[var(--border-default)] capitalize">
                          {session.session_type}
                        </span>
                      </td>
                      <td className="p-4 text-body text-[var(--text-secondary)] border-b border-[var(--border-subtle)] group-last:border-0">
                        {session.duration_hours}h
                      </td>
                      <td className="p-4 pr-6 text-right border-b border-[var(--border-subtle)] group-last:border-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold tabular-nums border ${
                          session.status === 'Present' 
                            ? 'bg-[var(--success-bg)] text-[var(--success-fg)] border-[var(--success-border)]'
                            : 'bg-[var(--danger-bg)] text-[var(--danger-fg)] border-[var(--danger-border)]'
                        }`}>
                          {session.status === 'Present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {sessionHistory.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-[var(--text-tertiary)] text-body">
                        No session attendance records found for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card py-24 flex flex-col items-center justify-center text-center border-dashed border-[var(--border-strong)] bg-transparent">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-raised)] flex items-center justify-center mb-6">
            <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
          </div>
          <h2 className="text-h2 mb-2">Find a Student</h2>
          <p className="text-body text-[var(--text-secondary)] max-w-sm">
            Search for a student by name or USN using the field above to view their complete attendance history.
          </p>
        </div>
      )}

    </div>
  );
}
