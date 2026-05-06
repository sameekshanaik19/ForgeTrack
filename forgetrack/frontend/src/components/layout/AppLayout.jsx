import { Sidebar } from './Sidebar';

export function AppLayout({ children }) {
  return (
    <div className="flex h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] font-body overflow-hidden">
      <Sidebar />
      <main className="flex-1 relative overflow-y-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] cosmic-glow pointer-events-none z-0"></div>
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-8 lg:px-12 pt-8 pb-12 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
