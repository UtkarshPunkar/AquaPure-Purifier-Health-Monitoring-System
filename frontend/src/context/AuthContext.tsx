import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<void>;
  signUp: (name: string, email: string, pass: string, otp?: string, organizationName?: string) => Promise<void>;
  updateProfile: (name: string, organizationName?: string) => Promise<void>;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const getTokenFromStorage = (): string | null => {
  return (
    localStorage.getItem('smart_water_token') ||
    sessionStorage.getItem('smart_water_token') ||
    localStorage.getItem('aquapure_auth_token')
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getTokenFromStorage());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const activeToken = getTokenFromStorage();
    if (activeToken) {
      try {
        const u = await api.getMe();
        const userData = u.user || u;
        setUser(userData);
        if (localStorage.getItem('smart_water_token')) {
          localStorage.setItem('smart_water_user', JSON.stringify(userData));
        } else if (sessionStorage.getItem('smart_water_token')) {
          sessionStorage.setItem('smart_water_user', JSON.stringify(userData));
        }
      } catch (err) {
        const savedUser =
          localStorage.getItem('smart_water_user') || sessionStorage.getItem('smart_water_user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            logout();
          }
        } else {
          logout();
        }
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email: string, pass: string, rememberMe = true) => {
    try {
      const res = await api.login(email, pass);
      const userObj = res.user || res;
      if (rememberMe) {
        localStorage.setItem('smart_water_token', res.token);
        localStorage.setItem('smart_water_user', JSON.stringify(userObj));
        sessionStorage.removeItem('smart_water_token');
        sessionStorage.removeItem('smart_water_user');
      } else {
        sessionStorage.setItem('smart_water_token', res.token);
        sessionStorage.setItem('smart_water_user', JSON.stringify(userObj));
        localStorage.removeItem('smart_water_token');
        localStorage.removeItem('smart_water_user');
      }
      setToken(res.token);
      setUser(userObj);
    } catch (err: any) {
      if (err.response && err.response.data) {
        throw err;
      }
      // Offline fallback only if server is completely down
      const cleanEmail = email.trim().toLowerCase();
      const isTechHead = cleanEmail === 'utkarshpunkar7@gmail.com';
      const mockUser: User = {
        id: `usr-${Date.now()}`,
        name: isTechHead ? 'Utkarsh Punkar' : 'Campus Member',
        email: cleanEmail,
        role: isTechHead ? 'TECHNICAL_HEAD' : 'VIEWER',
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
    otp?: string,
    organizationName = 'S.B. Jain Campus'
  ) => {
    try {
      const res = await api.signup({
        name,
        email,
        password: pass,
        otp,
        organizationName,
      });
      const userObj = res.user || res;
      localStorage.setItem('smart_water_token', res.token);
      localStorage.setItem('smart_water_user', JSON.stringify(userObj));
      setToken(res.token);
      setUser(userObj);
    } catch (err: any) {
      if (err.response && err.response.data) {
        throw err;
      }
      const cleanEmail = email.trim().toLowerCase();
      const isTechHead = cleanEmail === 'utkarshpunkar7@gmail.com';
      const mockUser: User = {
        id: `usr-${Date.now()}`,
        name: name || (isTechHead ? 'Utkarsh Punkar' : 'Campus Member'),
        email: cleanEmail,
        role: isTechHead ? 'TECHNICAL_HEAD' : 'VIEWER',
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

  const updateProfile = async (name: string, organizationName?: string) => {
    const res = await api.updateProfile({ name, organizationName });
    if (res.user) {
      setUser(res.user);
      if (localStorage.getItem('smart_water_token')) {
        localStorage.setItem('smart_water_user', JSON.stringify(res.user));
      } else if (sessionStorage.getItem('smart_water_token')) {
        sessionStorage.setItem('smart_water_user', JSON.stringify(res.user));
      }
    }
  };

  const changePassword = async (newPassword: string, currentPassword?: string) => {
    await api.changePassword({ newPassword, currentPassword });
  };

  const logout = () => {
    localStorage.removeItem('smart_water_token');
    localStorage.removeItem('smart_water_user');
    localStorage.removeItem('aquapure_auth_token');
    sessionStorage.removeItem('smart_water_token');
    sessionStorage.removeItem('smart_water_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signUp,
        updateProfile,
        changePassword,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
