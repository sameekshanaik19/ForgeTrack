import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export function Login() {
  const [activeTab, setActiveTab] = useState('student');
  const [email, setEmail] = useState('');
  const [usn, setUsn] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      let loginEmail = email.trim();
      let loginPassword = password;

      if (activeTab === 'student') {
        const cleanUsn = usn.trim().toLowerCase();
        loginEmail = `${cleanUsn}@forge.local`;
        loginPassword = usn.trim(); // USN is the password for students
      }

      console.log('Attempting login for:', loginEmail);
      await signIn(loginEmail, loginPassword);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-accent-glow/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-3xl p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-accent-glow to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-accent-glow/20">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-display font-bold text-fg-primary tracking-tight">ForgeTrack</h1>
            <p className="text-fg-tertiary mt-2 uppercase text-xs font-bold tracking-widest">Internal System</p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 bg-surface-inset p-1 rounded-xl mb-8 border border-border-default">
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'student' ? 'bg-surface-raised text-fg-primary shadow-lg' : 'text-fg-tertiary hover:text-fg-secondary'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mentor')}
              className={`py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'mentor' ? 'bg-surface-raised text-fg-primary shadow-lg' : 'text-fg-tertiary hover:text-fg-secondary'
              }`}
            >
              Mentor
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-danger-bg border border-danger-border rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-danger w-5 h-5 shrink-0" />
              <p className="text-sm text-danger font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {activeTab === 'student' ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-fg-secondary uppercase tracking-wider ml-1">University Seat Number (USN)</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary group-focus-within:text-accent-glow transition-colors w-5 h-5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4SH24CS001"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value)}
                    className="w-full bg-surface-inset border border-border-default rounded-xl pl-12 pr-4 py-3.5 text-fg-primary focus:outline-none focus:border-accent-glow focus:ring-4 focus:ring-accent-glow/10 transition-all font-mono"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-fg-secondary uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary group-focus-within:text-accent-glow transition-colors w-5 h-5" />
                    <input
                      type="email"
                      required
                      placeholder="mentor@theforge.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface-inset border border-border-default rounded-xl pl-12 pr-4 py-3.5 text-fg-primary focus:outline-none focus:border-accent-glow focus:ring-4 focus:ring-accent-glow/10 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-fg-secondary uppercase tracking-wider ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary group-focus-within:text-accent-glow transition-colors w-5 h-5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface-inset border border-border-default rounded-xl pl-12 pr-4 py-3.5 text-fg-primary focus:outline-none focus:border-accent-glow focus:ring-4 focus:ring-accent-glow/10 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-fg-primary hover:bg-white text-void font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-6 shadow-xl shadow-white/5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-void/20 border-t-void rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
        <p className="text-center mt-8 text-sm text-fg-tertiary">
          Need access? Contact program admin.
        </p>
      </div>
    </div>
  );
}
