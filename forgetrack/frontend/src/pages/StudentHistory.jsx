import { useState, useMemo } from 'react';
import { Search, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';

// Mock Data
const MOCK_STUDENTS = [
  { id: 1, name: "Aarav Patel", usn: "4SH24CS001", branch: "AI", batch: "Batch 2024" },
  { id: 2, name: "Vihaan Sharma", usn: "4SH24CS002", branch: "EC", batch: "Batch 2024" },
  { id: 3, name: "Vivaan Kumar", usn: "4SH24CS003", branch: "IS", batch: "Batch 2024" },
];

const MOCK_SESSIONS = [
  { id: 1, date: "2026-05-06", topic: "8-Layer AI Application Stack", mode: "Offline", duration: "2.0", status: "Present" },
  { id: 2, date: "2026-05-04", topic: "Advanced RAG Pipelines", mode: "Online", duration: "1.5", status: "Absent" },
  { id: 3, date: "2026-05-02", topic: "Vector Databases Deep Dive", mode: "Offline", duration: "3.0", status: "Present" },
  { id: 4, date: "2026-04-29", topic: "Agentic Workflows Overview", mode: "Online", duration: "2.0", status: "Present" },
  { id: 5, date: "2026-04-26", topic: "LLM Fine-tuning Basics", mode: "Offline", duration: "2.5", status: "Present" },
];

// Generate exactly 28 days for a 4-week heatmap
const generateHeatmapDays = () => {
  const days = [];
  // Hardcode some patterns to match the mock sessions above
  for (let i = 0; i < 28; i++) {
    if (i === 27) days.push('present'); // Today
    else if (i === 25) days.push('absent'); // May 4
    else if (i === 23) days.push('present'); // May 2
    else if (i === 20) days.push('present'); // Apr 29
    else if (i === 17) days.push('present'); // Apr 26
    else if (i % 7 === 0 || i % 7 === 6) days.push('none'); // Weekends
    else days.push('none');
  }
  return days;
};

export function StudentHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(MOCK_STUDENTS[0]); // Default to Aarav for demo

  const filteredStudents = MOCK_STUDENTS.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.usn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const heatmapDays = useMemo(() => generateHeatmapDays(), []);

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

          {/* Dropdown Results */}
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
                    <span className="pill pill-neutral text-micro">{student.branch}</span>
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
        
        {/* Click outside overlay to close dropdown */}
        {isDropdownOpen && (
          <div className="fixed inset-0 z-20" onClick={() => setIsDropdownOpen(false)}></div>
        )}
      </header>

      {/* Main Content Area */}
      {selectedStudent ? (
        <div className="space-y-6">
          {/* 2-Up Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
            
            {/* Left Card: Student Profile & Hero Metric */}
            <div className="hero-card flex flex-col justify-between">
              <div>
                <h2 className="text-display-sm font-display font-bold mb-2">{selectedStudent.name}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-body-lg font-mono text-[var(--text-tertiary)]">{selectedStudent.usn}</span>
                  <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]"></span>
                  <span className="text-body text-[var(--text-secondary)]">{selectedStudent.branch}</span>
                  <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]"></span>
                  <span className="text-body text-[var(--text-secondary)]">{selectedStudent.batch}</span>
                </div>
              </div>

              <div className="mt-12">
                <div className="text-label text-[var(--text-tertiary)] mb-2">OVERALL ATTENDANCE</div>
                <div className="flex items-baseline gap-3">
                  <span className="text-display-md font-display font-bold tabular-nums text-[var(--success-fg)] tracking-tight">
                    80.0%
                  </span>
                  <span className="text-body text-[var(--text-tertiary)] font-medium">
                    (4 of 5 sessions)
                  </span>
                </div>
              </div>
            </div>

            {/* Right Card: Heatmap Grid */}
            <div className="card">
              <div className="flex justify-between items-center mb-8">
                <div className="text-label text-[var(--text-tertiary)]">ATTENDANCE HISTORY</div>
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

              {/* Grid implementation */}
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

                  // Highlight today (last day in array)
                  if (i === 27) classes += " shadow-[0_0_0_2px_rgba(99,102,241,0.5)]";

                  return <div key={i} className={classes} title={status}></div>;
                })}
              </div>
            </div>

          </div>

          {/* Full Width Table */}
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
                  {MOCK_SESSIONS.map((session) => (
                    <tr key={session.id} className="hover:bg-[var(--bg-surface-raised)] transition-colors group">
                      <td className="p-4 pl-6 text-body font-mono text-[var(--text-secondary)] border-b border-[var(--border-subtle)] group-last:border-0 whitespace-nowrap">
                        {session.date}
                      </td>
                      <td className="p-4 text-body text-[var(--text-primary)] border-b border-[var(--border-subtle)] group-last:border-0">
                        {session.topic}
                      </td>
                      <td className="p-4 border-b border-[var(--border-subtle)] group-last:border-0">
                        <span className="text-caption text-[var(--text-secondary)] bg-[var(--bg-surface-inset)] px-2 py-1 rounded-[4px] border border-[var(--border-default)]">
                          {session.mode}
                        </span>
                      </td>
                      <td className="p-4 text-body text-[var(--text-secondary)] border-b border-[var(--border-subtle)] group-last:border-0">
                        {session.duration}h
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
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
