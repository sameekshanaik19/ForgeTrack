import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

const BYPASS_KEY = 'forge_bypass_user';

function saveBypassUser(profile) {
  localStorage.setItem(BYPASS_KEY, JSON.stringify(profile));
}

function loadBypassUser() {
  try {
    const raw = localStorage.getItem(BYPASS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearBypassUser() {
  localStorage.removeItem(BYPASS_KEY);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // 1. Check if a bypass session was saved (survives page reloads)
      const saved = loadBypassUser();
      if (saved) {
        const mockUser = { id: saved.id, email: saved.email, user_metadata: {} };
        setUser(mockUser);
        setRole(saved.role);
        setProfile(saved);
        setLoading(false);
        return;
      }

      // 2. Fall back to real Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email);
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Don't override bypass session
      if (loadBypassUser()) return;
      setUser(session?.user ?? null);
      if (session) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId, email) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        return;
      }
      setRole(data.role);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error.message);
    }
  };

  const signIn = async (email, password) => {
    // EMERGENCY BYPASS FOR MENTORS — persisted to localStorage
    if ((email === 'nischay@theboringpeople.in' || email === 'varun@theboringpeople.in') &&
        (password === 'password123' || password === 'password')) {
      
      const isVarun = email.includes('varun');
      const bypassId = isVarun ? '00000000-0000-0000-0000-000000000002' : '00000000-0000-0000-0000-000000000001';
      const bypassProfile = {
        id: bypassId,
        email,
        role: 'mentor',
        display_name: isVarun ? 'Varun' : 'Nischay B K'
      };
      const mockUser = { id: bypassId, email, user_metadata: {} };

      saveBypassUser(bypassProfile); // Persist so page reloads don't log out
      setUser(mockUser);
      setRole('mentor');
      setProfile(bypassProfile);
      return { user: mockUser };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    clearBypassUser();
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setProfile(null);
  };

  const value = { user, role, profile, loading, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
