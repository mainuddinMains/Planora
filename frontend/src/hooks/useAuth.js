import { useState, useEffect, createContext, useContext } from 'react';
import { getCurrentUser, logout as apiLogout } from '../api';

const AuthContext = createContext(null);
const DEV_BYPASS_KEY = 'planora_bypass_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    if (localStorage.getItem(DEV_BYPASS_KEY) === 'true') {
      setUser({
        id: 'dev-local-user',
        name: 'Local Dev User',
        email: 'dev@local.planora',
      });
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 4000);
      setLoading(false);
      return;
    }

    try {
      const data = await getCurrentUser();
      setUser(data.user);
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 4000);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await apiLogout();
    } finally {
      localStorage.removeItem(DEV_BYPASS_KEY);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, checkAuth, showWelcome }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
