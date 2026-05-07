import { Search, Calendar, Activity, Users, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    attendanceRate: 0,
    activeStudents: 0,
    lastSessionDate: '--- --'
  });
  const [user, setUser] = useState({ email: 'loading...', display_name: 'User' });
  const [todaySession, setTodaySession] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // 1. Fetch Basic Stats
        const [sessionsRes, studentsRes, attendanceRes, lastSessionRes] = await Promise.all([
          supabase.from('sessions').select('*', { count: 'exact', head: true }),
          supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('attendance').select('present'),
          supabase.from('sessions').select('date').order('date', { ascending: false }).limit(1).maybeSingle()
        ]);

        const rate = attendanceRes.data?.length > 0 
          ? Math.round((attendanceRes.data.filter(a => a.present).length / attendanceRes.data.length) * 100) 
          : 0;

        let formattedDate = 'N/A';
        if (lastSessionRes.data?.date) {
          const date = new Date(lastSessionRes.data.date);
          formattedDate = date.toLocaleDateString('en-US', { month: 'SHORT', day: '2-digit' }).toUpperCase();
        }

        setStats({
          totalSessions: sessionsRes.count || 0,
          activeStudents: studentsRes.count || 0,
          attendanceRate: rate,
          lastSessionDate: formattedDate
        });

        // 2. Fetch Today's Session
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: sessionToday } = await supabase
          .from('sessions')
          .select('*')
          .eq('date', todayStr)
          .maybeSingle();
        
        setTodaySession(sessionToday);

        if (sessionToday) {
          const { data: attToday } = await supabase
            .from('attendance')
            .select('present')
            .eq('session_id', sessionToday.id);
          
          if (attToday) {
            setTodayAttendance({
              present: attToday.filter(a => a.present).length,
              total: studentsRes.count || 0
            });
          }
        }

        // 3. Fetch User Info
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();
          
          if (profile) {
            setUser(profile);
          } else {
            setUser({ email: authUser.email, display_name: authUser.email.split('@')[0], role: 'Mentor' });
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const initials = user.display_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

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
              <div className="text-body font-medium leading-tight">{user.email}</div>
              <div className="text-caption text-[var(--text-secondary)] capitalize">{user.role || 'Mentor'}</div>
            </div>
            <div className="w-10 h-10 rounded-full border border-[var(--border-default)] flex items-center justify-center text-body font-semibold bg-[var(--bg-surface-raised)]">
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mb-12">
        <h1 className="text-display-hero mb-3 tracking-[-0.03em] font-display font-bold">
          Welcome Back, {user.display_name.split(' ')[0]}
        </h1>
        <p className="text-body text-[var(--text-secondary)]">
          {loading ? "Loading metrics..." : `System status: Operational`}
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
            {loading ? "..." : stats.totalSessions}
          </div>
        </div>

        <div className="w-[1px] h-6 bg-[var(--border-subtle)]"></div>

        <div className="flex items-center gap-3">
          <div className="text-label text-[var(--text-tertiary)] tracking-widest uppercase flex items-center gap-2">
            <Activity className="w-4 h-4" />
            OVERALL ATTENDANCE %
          </div>
          <div className="text-display-sm font-semibold tabular-nums leading-none">
            {loading ? "..." : `${stats.attendanceRate}%`}
          </div>
        </div>

        <div className="w-[1px] h-6 bg-[var(--border-subtle)]"></div>

        <div className="flex items-center gap-3">
          <div className="text-label text-[var(--text-tertiary)] tracking-widest uppercase flex items-center gap-2">
            <Users className="w-4 h-4" />
            ACTIVE STUDENTS
          </div>
          <div className="text-display-sm font-semibold tabular-nums leading-none">
            {loading ? "..." : stats.activeStudents}
          </div>
        </div>

        <div className="w-[1px] h-6 bg-[var(--border-subtle)]"></div>

        <div className="flex items-center gap-3">
          <div className="text-label text-[var(--text-tertiary)] tracking-widest uppercase flex items-center gap-2">
            <Clock className="w-4 h-4" />
            LAST SESSION DATE
          </div>
          <div className="text-display-sm font-semibold leading-none">
            {loading ? "..." : stats.lastSessionDate}
          </div>
        </div>
      </section>

      {/* Progress Divider */}
      <div className="w-full h-2 bg-[var(--bg-surface-raised)] rounded-full mb-12 overflow-hidden">
        <div 
          className="h-full bg-[var(--accent-glow)] rounded-full transition-all duration-1000" 
          style={{ width: loading ? '0%' : `${stats.attendanceRate}%` }}
        ></div>
      </div>

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Session Card */}
        <div className="hero-card relative overflow-hidden">
          <div className="text-label text-[var(--text-tertiary)] mb-4">TODAY'S SESSION</div>
          <h2 className="text-display-md mb-6 max-w-sm font-display font-bold">
            {todaySession ? todaySession.topic : "No Session Scheduled"}
          </h2>
          <p className="text-body-lg text-[var(--text-secondary)] max-w-sm mb-12">
            {todaySession 
              ? `Mode: ${todaySession.session_type} • Duration: ${todaySession.duration_hours}h`
              : "Take a break, or prepare materials for the next class."}
          </p>
          
          {/* Background decoration for empty state */}
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
                {todaySession ? "Live" : "+ 0%"}
              </div>
            </div>
            <div className="flex items-baseline gap-2 font-display">
              <span className="text-display-hero font-bold">
                {todaySession ? todayAttendance.present : 0}
              </span>
              <span className="text-display-sm text-[var(--text-tertiary)] font-bold">
                / {todaySession ? todayAttendance.total : 0}
              </span>
            </div>
          </div>
          
          <div className="mt-16">
            <div className="text-label text-[var(--text-tertiary)] mb-4">
              {todaySession ? "ATTENDANCE STATUS" : "ABSENT STUDENTS"}
            </div>
            <div className="text-body text-[var(--text-secondary)]">
              {todaySession 
                ? `${Math.round((todayAttendance.present / todayAttendance.total) * 100 || 0)}% Participation rate for today.`
                : "No attendance data for today."}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
