import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  BookOpen, 
  Upload, 
  LogOut 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Overview', items: [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Activity', items: [
    { name: 'Mark Attendance', path: '/attendance', icon: CheckSquare },
    { name: 'Student History', path: '/history', icon: Users },
    { name: 'Materials', path: '/materials', icon: BookOpen },
  ]},
  { label: 'Data', items: [
    { name: 'Upload CSV', path: '/upload', icon: Upload },
  ]},
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-[260px] flex-shrink-0 flex flex-col h-screen border-r border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
      {/* Logo Area */}
      <div className="h-[72px] flex items-center px-6 border-b border-[var(--border-subtle)]">
        <div className="w-6 h-6 rounded bg-gradient-to-tr from-[var(--accent-glow)] to-purple-400 mr-3"></div>
        <span className="font-display font-bold text-lg text-[var(--text-primary)]">ForgeTrack</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        {navItems.map((group, i) => (
          <div key={i}>
            <h3 className="text-label text-[var(--text-tertiary)] mb-3 px-2">{group.label}</h3>
            <ul className="space-y-1">
              {group.items.map((item, j) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <li key={j}>
                    <Link
                      to={item.path}
                      className={`flex items-center h-11 px-3 rounded-[var(--radius-lg)] transition-colors ${
                        isActive
                          ? 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] relative'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--accent-glow)] rounded-l-[var(--radius-lg)]"></div>
                      )}
                      <item.icon className="w-5 h-5 mr-3" strokeWidth={1.75} />
                      <span className="text-body font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-[var(--border-subtle)]">
        <button
          className="w-full flex items-center h-11 px-3 rounded-[var(--radius-lg)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" strokeWidth={1.75} />
          <span className="text-body font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
