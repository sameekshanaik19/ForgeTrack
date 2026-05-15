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
      if (data && data.length > 0) {
        setStudents(data);
      } else {
        const localStudents = localStorage.getItem('forge_students');
        if (localStudents) {
          setStudents(JSON.parse(localStudents));
          console.log('Using local students fallback');
        }
      }
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
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-h1">Student History</h1>
          {selectedStudent && (
            <button 
              onClick={() => setSelectedStudent(null)}
              className="text-sm font-bold text-[var(--accent-glow)] hover:underline flex items-center gap-2"
            >
              ← Back to Student List
            </button>
          )}
        </div>
        
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
            
            <div className="hero-card bg-[var(--bg-surface-raised)] border-[var(--border-strong)]">
              <div className="text-label text-[var(--text-tertiary)] mb-4">OVERALL</div>
              <div className="flex flex-col">
                <span className={`text-[64px] font-display font-bold leading-none ${stats.rate >= 75 ? 'text-[var(--success-fg)]' : 'text-pink-500'}`}>
                  {stats.rate.toFixed(1)}%
                </span>
                <span className="text-body text-[var(--text-tertiary)] mt-2 font-medium">
                  {stats.present} / {stats.total} PRESENT
                </span>
              </div>
            </div>

            <div className="card bg-[var(--bg-surface-raised)] border-[var(--border-strong)]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-h3 font-display">Heatmap</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-[3px] bg-[#4ade80]"></div>
                    <span className="text-micro text-[var(--text-tertiary)]">PRESENT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-[3px] bg-[#f43f5e]"></div>
                    <span className="text-micro text-[var(--text-tertiary)]">ABSENT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-[3px] bg-[#111827]"></div>
                    <span className="text-micro text-[var(--text-tertiary)]">NO CLASS</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div className="inline-grid grid-rows-3 grid-flow-col gap-1.5 min-w-max px-1">
                  {/* Day Labels */}
                  <div className="flex flex-col justify-between py-0.5 mr-3 text-[10px] text-[var(--text-tertiary)] font-bold">
                    <span>W</span><span>T</span><span>S</span>
                  </div>
                  
                  {/* Heatmap Grid (Approx 52 weeks) */}
                  {Array.from({ length: 156 }).map((_, i) => {
                    const dayIndex = 155 - i;
                    const d = new Date();
                    // We simulate history over the last ~5 months to match the visual
                    d.setDate(d.getDate() - dayIndex);
                    const dateStr = d.toISOString().split('T')[0];
                    const session = sessionHistory.find(s => s.date === dateStr);
                    
                    let color = "#111827"; // No Class
                    if (session) {
                      color = session.status === 'Present' ? "#4ade80" : "#f43f5e";
                    }

                    return (
                      <div 
                        key={i} 
                        className="w-[18px] h-[18px] rounded-[4px] transition-all hover:scale-110 cursor-help shadow-inner border border-white/5"
                        style={{ backgroundColor: color }}
                        title={dateStr}
                      ></div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-4 pl-10 pr-4 text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">
                  <span>SEP</span><span>OCT</span><span>NOV</span><span>DEC</span><span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span>
                </div>
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
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-h2 mb-1">Student Directory</h2>
              <p className="text-body text-[var(--text-secondary)]">Overview of all {students.length} students and their engagement.</p>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface-inset)]">
                    <th className="text-left p-4 pl-6 font-body font-medium text-[12px] uppercase tracking-[0.02em] text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">Student Details</th>
                    <th className="text-left p-4 font-body font-medium text-[12px] uppercase tracking-[0.02em] text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">USN / ID</th>
                    <th className="text-left p-4 font-body font-medium text-[12px] uppercase tracking-[0.02em] text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">Branch</th>
                    <th className="text-right p-4 pr-6 font-body font-medium text-[12px] uppercase tracking-[0.02em] text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr 
                      key={student.id} 
                      className="hover:bg-[var(--bg-surface-raised)] transition-colors group cursor-pointer"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <td className="p-4 pl-6 border-b border-[var(--border-subtle)] group-last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-glow-soft)] to-purple-500/20 flex items-center justify-center text-sm font-bold text-[var(--accent-glow)] uppercase">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-body font-bold text-[var(--text-primary)]">{student.name}</div>
                            <div className="text-caption text-[var(--text-tertiary)]">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-body font-mono text-[var(--text-secondary)] border-b border-[var(--border-subtle)] group-last:border-0">
                        {student.usn}
                      </td>
                      <td className="p-4 border-b border-[var(--border-subtle)] group-last:border-0">
                        <span className="pill pill-neutral">{student.branch_code}</span>
                      </td>
                      <td className="p-4 pr-6 text-right border-b border-[var(--border-subtle)] group-last:border-0">
                        <button className="text-[var(--accent-glow)] text-sm font-bold hover:underline">
                          View History →
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-12 text-center text-[var(--text-tertiary)] text-body">
                        No students found in the database. Go to Bulk Import to add some.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
