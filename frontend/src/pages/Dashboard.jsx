import { Search, Calendar, Activity, Users, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Read from localStorage synchronously — no waiting
function getLocalStats() {
  try {
    const raw = localStorage.getItem('forge_dashboard_stats');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
  } catch { return 'N/A'; }
}

export function Dashboard() {
  const { profile } = useAuth();

  // Initialize stats IMMEDIATELY from localStorage (no loading delay)
  const localStats = getLocalStats();
  const [stats, setStats] = useState({
    totalSessions: localStats?.totalSessions || 0,
    attendanceRate: localStats?.attendanceRate || 0,
    activeStudents: localStats?.activeStudents || 0,
    lastSessionDate: localStats?.lastSessionDate ? formatDate(localStats.lastSessionDate) : '--- --'
  });
  const [todaySession, setTodaySession] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, total: 0 });
  const [loading, setLoading] = useState(!localStats); // Only show loading if no local data

  useEffect(() => {
    // Always re-read localStorage on mount (in case import just happened)
    const cached = getLocalStats();
    if (cached) {
      setStats({
        totalSessions: cached.totalSessions || 0,
        activeStudents: cached.activeStudents || 0,
        attendanceRate: cached.attendanceRate || 0,
        lastSessionDate: formatDate(cached.lastSessionDate)
      });
      setLoading(false);
    }

    // Also try Supabase in background
    (async () => {
      try {
        const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
        const { count: sessCount } = await supabase.from('sessions').select('*', { count: 'exact', head: true });
        const { data: attData } = await supabase.from('attendance').select('present');
        const { data: lastSess } = await supabase.from('sessions').select('date').order('date', { ascending: false }).limit(1).maybeSingle();

        if (sCount > 0 || sessCount > 0) {
          const rate = attData?.length > 0
            ? Math.round((attData.filter(a => a.present).length / attData.length) * 100)
            : 0;
          setStats({
            totalSessions: sessCount || 0,
            activeStudents: sCount || 0,
            attendanceRate: rate,
            lastSessionDate: formatDate(lastSess?.date)
          });
        }

        // Today's session
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: sessionToday } = await supabase.from('sessions').select('*').eq('date', todayStr).maybeSingle();
        setTodaySession(sessionToday);
        if (sessionToday) {
          const { data: attToday } = await supabase.from('attendance').select('present').eq('session_id', sessionToday.id);
          if (attToday) setTodayAttendance({ present: attToday.filter(a => a.present).length, total: sCount || 0 });
        }
      } catch (e) {
        console.warn('DB fetch failed, using localStorage data:', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="w-full">
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
              <div className="text-body font-medium leading-tight">{profile?.email || 'mentor@forge.local'}</div>
              <div className="text-caption text-[var(--text-secondary)] capitalize">{profile?.role || 'Mentor'}</div>
            </div>
            <div className="w-10 h-10 rounded-full border border-[var(--border-default)] flex items-center justify-center text-body font-semibold bg-[var(--bg-surface-raised)] uppercase">
              {profile?.display_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </header>

      <section className="mb-12">
        <h1 className="text-display-hero mb-3 tracking-[-0.03em] font-display font-bold">
          Welcome Back, {profile?.display_name?.split(' ')[0] || 'Mentor'}
        </h1>
        <p className="text-body text-[var(--text-secondary)]">
          {loading ? 'Loading...' : `System status: Operational • ${stats.activeStudents} Students Tracked`}
        </p>
      </section>

      {/* Metrics Strip */}
      <section className="flex flex-wrap items-center gap-y-4 gap-x-8 mb-6">
        <div className="flex items-center gap-3">
          <div className="text-label text-[var(--text-tertiary)] tracking-widest uppercase flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            TOTAL SESSIONS
          </div>
          <div className="text-display-sm font-semibold tabular-nums leading-none">
            {stats.totalSessions}
          </div>
        </div>

        <div className="w-[1px] h-6 bg-[var(--border-subtle)]"></div>

        <div className="flex items-center gap-3">
          <div className="text-label text-[var(--text-tertiary)] tracking-widest uppercase flex items-center gap-2">
            <Activity className="w-4 h-4" />
            OVERALL ATTENDANCE %
          </div>
          <div className="text-display-sm font-semibold tabular-nums leading-none">
            {stats.attendanceRate}%
          </div>
        </div>

        <div className="w-[1px] h-6 bg-[var(--border-subtle)]"></div>

        <div className="flex items-center gap-3">
          <div className="text-label text-[var(--text-tertiary)] tracking-widest uppercase flex items-center gap-2">
            <Users className="w-4 h-4" />
            ACTIVE STUDENTS
          </div>
          <div className="text-display-sm font-semibold tabular-nums leading-none">
            {stats.activeStudents}
          </div>
        </div>

        <div className="w-[1px] h-6 bg-[var(--border-subtle)]"></div>

        <div className="flex items-center gap-3">
          <div className="text-label text-[var(--text-tertiary)] tracking-widest uppercase flex items-center gap-2">
            <Clock className="w-4 h-4" />
            LAST SESSION DATE
          </div>
          <div className="text-display-sm font-semibold leading-none">
            {stats.lastSessionDate}
          </div>
        </div>
      </section>

      {/* Progress Divider */}
      <div className="w-full h-2 bg-[var(--bg-surface-raised)] rounded-full mb-12 overflow-hidden">
        <div 
          className="h-full bg-[var(--accent-glow)] rounded-full transition-all duration-1000" 
          style={{ width: `${stats.attendanceRate}%` }}
        ></div>
      </div>

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Session Card */}
        <div className="hero-card relative overflow-hidden">
          <div className="text-label text-[var(--text-tertiary)] mb-4">TODAY'S SESSION</div>
          <h2 className="text-display-md mb-6 max-w-sm font-display font-bold">
            {todaySession ? todaySession.topic : 'No Session Scheduled'}
          </h2>
          <p className="text-body-lg text-[var(--text-secondary)] max-w-sm mb-12">
            {todaySession 
              ? `Mode: ${todaySession.session_type} • Duration: ${todaySession.duration_hours}h`
              : 'Take a break, or prepare materials for the next class.'}
          </p>
          <div className="absolute -bottom-8 -right-8 opacity-[0.03] text-white">
            <Calendar size={240} />
          </div>
        </div>

        {/* Today's Attendance Card */}
        <div className="hero-card flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="text-label text-[var(--text-tertiary)]">TODAY'S ATTENDANCE</div>
              <div className="pill pill-neutral text-micro border-[var(--border-subtle)]">
                {todaySession ? 'Live' : '+ 0%'}
              </div>
            </div>
            <div className="flex items-baseline gap-2 font-display">
              <span className="text-display-hero font-bold">
                {todaySession ? todayAttendance.present : stats.activeStudents > 0 ? stats.activeStudents : 0}
              </span>
              <span className="text-display-sm text-[var(--text-tertiary)] font-bold">
                / {stats.activeStudents || 0}
              </span>
            </div>
          </div>
          
          <div className="mt-16">
            <div className="text-label text-[var(--text-tertiary)] mb-4">
              OVERALL ATTENDANCE RATE
            </div>
            <div className="text-body text-[var(--text-secondary)]">
              {stats.activeStudents > 0 
                ? `${stats.attendanceRate}% average across ${stats.activeStudents} students and ${stats.totalSessions} sessions.`
                : 'Import a spreadsheet to see attendance data.'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
