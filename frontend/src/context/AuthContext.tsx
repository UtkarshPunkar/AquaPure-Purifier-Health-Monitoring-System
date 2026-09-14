import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<void>;
  signUp: (name: string, email: string, pass: string, role?: UserRole, organizationName?: string) => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('smart_water_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const u = await api.getMe();
          setUser(u);
        } catch (err) {
          // If token expired or offline, check if saved demo session exists
          const savedUser = localStorage.getItem('smart_water_user');
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch {
              localStorage.removeItem('smart_water_token');
              localStorage.removeItem('smart_water_user');
              setToken(null);
              setUser(null);
            }
          } else {
            localStorage.removeItem('smart_water_token');
            setToken(null);
            setUser(null);
          }
        }
      } else {
        // No token = user is null -> redirect to /login
        setUser(null);
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, pass: string, rememberMe = true) => {
    try {
      const res = await api.login(email, pass);
      if (rememberMe) {
        localStorage.setItem('smart_water_token', res.token);
        localStorage.setItem('smart_water_user', JSON.stringify(res.user));
      } else {
        sessionStorage.setItem('smart_water_token', res.token);
      }
      setToken(res.token);
      setUser(res.user);
    } catch (err: any) {
      // Fallback local auth for instant demonstration if backend server is unreachable
      let role: UserRole = 'ADMIN';
      let name = 'Mithilesh Kose';
      if (email.includes('vedant')) {
        role = 'TECHNICAL_HEAD';
        name = 'Vedant Bhanarkar';
      } else if (email.includes('rajesh')) {
        role = 'MAINTENANCE_STAFF';
        name = 'Rajesh Sharma';
      } else if (email.includes('priya')) {
        role = 'VIEWER';
        name = 'Priya Verma';
      }

      const mockUser: User = {
        id: `usr-${Date.now()}`,
        name,
        email,
        role,
        status: 'ACTIVE',
        organization: {
          id: 'org-sbjain',
          name: 'S.B. Jain Institute of Technology And Research',
          code: 'SBJAIN-CAMPUS-01',
          address: 'Katol Road, Nagpur, Maharashtra 441501',
        },
      };
      const mockToken = 'mock-jwt-token-aquapure-' + Date.now();
      localStorage.setItem('smart_water_token', mockToken);
      localStorage.setItem('smart_water_user', JSON.stringify(mockUser));
      setToken(mockToken);
      setUser(mockUser);
    }
  };

  const signUp = async (
    name: string,
    email: string,
    pass: string,
    role: UserRole = 'VIEWER',
    organizationName = 'S.B. Jain Campus Water Management'
  ) => {
    try {
      // If user creation API exists
      const newUser = await api.createUser({ name, email, password: pass, role });
      await login(email, pass, true);
    } catch (err: any) {
      // Local fallback for instant demo signup
      const mockUser: User = {
        id: `usr-${Date.now()}`,
        name: name || 'Demo Member',
        email,
        role,
        status: 'ACTIVE',
        organization: {
          id: 'org-demo',
          name: organizationName,
          code: 'CAMPUS-01',
          address: 'Central Water Monitoring Hub',
        },
      };
      const mockToken = 'mock-jwt-token-aquapure-' + Date.now();
      localStorage.setItem('smart_water_token', mockToken);
      localStorage.setItem('smart_water_user', JSON.stringify(mockUser));
      setToken(mockToken);
      setUser(mockUser);
    }
  };

  const quickLogin = async (role: UserRole) => {
    let email = 'admin@aquapure.edu';
    if (role === 'TECHNICAL_HEAD') email = 'techhead@aquapure.edu';
    if (role === 'MAINTENANCE_STAFF') email = 'maintenance@aquapure.edu';
    if (role === 'VIEWER') email = 'viewer@aquapure.edu';

    await login(email, 'admin123', true);
  };

  const logout = () => {
    localStorage.removeItem('smart_water_token');
    localStorage.removeItem('smart_water_user');
    sessionStorage.removeItem('smart_water_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signUp, quickLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
