import { Search } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="w-full">
      {/* Top Header */}
      <header className="flex justify-between items-center mb-16">
        <div className="text-body text-[var(--text-primary)]">
          <span className="text-[var(--text-secondary)]">Overview / </span>Dashboard
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-[var(--bg-surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:border-[var(--accent-glow)] focus:outline-none transition-colors placeholder:text-[var(--text-tertiary)]"
            />
          </div>
          
          <div className="flex items-center gap-3 pl-6 border-l border-[var(--border-subtle)]">
            <div className="text-right">
              <div className="text-body font-medium leading-tight">nischay@theboringpeople.in</div>
              <div className="text-caption text-[var(--text-secondary)]">Mentor</div>
            </div>
            <div className="w-10 h-10 rounded-full border border-[var(--border-default)] flex items-center justify-center text-body font-semibold bg-[var(--bg-surface-raised)]">
              N
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mb-12">
        <h1 className="text-display-hero mb-3 tracking-[-0.03em] font-display font-bold">
          Welcome Back, Nischay
        </h1>
        <p className="text-body text-[var(--text-secondary)]">
          Last login: Today at 09:41 AM
        </p>
      </section>

      {/* Metrics Strip */}
      <section className="flex flex-wrap items-center gap-y-4 gap-x-8 mb-6">
        <div className="flex items-center gap-3">
          <div className="text-label text-[var(--text-tertiary)] tracking-widest uppercase flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            TOTAL SESSIONS
          </div>
          <div className="text-display-sm font-semibold tabular-nums leading-none">0</div>
        </div>

        <div className="w-[1px] h-6 bg-[var(--border-subtle)]"></div>

        <div className="flex items-center gap-3">
          <div className="text-label text-[var(--text-tertiary)] tracking-widest uppercase flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            OVERALL ATTENDANCE %
          </div>
          <div className="text-display-sm font-semibold tabular-nums leading-none">82%</div>
        </div>

        <div className="w-[1px] h-6 bg-[var(--border-subtle)]"></div>

        <div className="flex items-center gap-3">
          <div className="text-label text-[var(--text-tertiary)] tracking-widest uppercase flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            ACTIVE STUDENTS
          </div>
          <div className="text-display-sm font-semibold tabular-nums leading-none">0</div>
        </div>

        <div className="w-[1px] h-6 bg-[var(--border-subtle)]"></div>

        <div className="flex items-center gap-3">
          <div className="text-label text-[var(--text-tertiary)] tracking-widest uppercase flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            LAST SESSION DATE
          </div>
          <div className="text-display-sm font-semibold leading-none">NOV 04</div>
        </div>
      </section>

      {/* Progress Divider */}
      <div className="w-full h-2 bg-[var(--bg-surface-raised)] rounded-full mb-12 overflow-hidden">
        <div className="h-full bg-[var(--border-strong)] rounded-full w-[25%]"></div>
      </div>

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Session Card */}
        <div className="hero-card relative overflow-hidden">
          <div className="text-label text-[var(--text-tertiary)] mb-4">TODAY'S SESSION</div>
          <h2 className="text-display-md mb-6 max-w-sm font-display font-bold">No Session Scheduled</h2>
          <p className="text-body-lg text-[var(--text-secondary)] max-w-sm mb-12">
            Take a break, or prepare materials for the next class.
          </p>
          
          {/* Background decoration for empty state */}
          <div className="absolute -bottom-8 -right-8 opacity-[0.03] text-white">
            <svg width="240" height="240" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
        </div>

        {/* Today's Attendance Card */}
        <div className="hero-card flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="text-label text-[var(--text-tertiary)]">TODAY'S ATTENDANCE</div>
              <div className="pill pill-neutral text-micro border-[var(--border-subtle)]">+ 0%</div>
            </div>
            <div className="flex items-baseline gap-2 font-display">
              <span className="text-display-hero font-bold">0</span>
              <span className="text-display-sm text-[var(--text-tertiary)] font-bold">/ 0</span>
            </div>
          </div>
          
          <div className="mt-16">
            <div className="text-label text-[var(--text-tertiary)] mb-4">ABSENT STUDENTS</div>
            {/* Empty absent list */}
          </div>
        </div>
      </div>

    </div>
  );
}
