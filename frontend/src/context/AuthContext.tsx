import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { AuthContextType, User, CithCentre, AreaSupervisor, District } from '../types';

export interface AuthContextData extends AuthContextType {
  userCentre: CithCentre | null;
  userArea: AreaSupervisor | null;
  userDistrict: District | null;
  refreshUserContext: () => Promise<void>;
}
const AuthContext = createContext<AuthContextData | undefined>(undefined);

const SESSION_TIMEOUT = 30 * 60 * 1000;
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [userCentre, setUserCentre] = useState<CithCentre | null>(null);
  const [userArea, setUserArea] = useState<AreaSupervisor | null>(null);
  const [userDistrict, setUserDistrict] = useState<District | null>(null);
    const [lastActivity, setLastActivity] = useState<number>(Date.now());


   // Update last activity time
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  // Check if session is expired
  const isSessionExpired = useCallback(() => {
    const storedActivity = localStorage.getItem('lastActivity');
    const lastActivityTime = storedActivity ? parseInt(storedActivity) : Date.now();
    return Date.now() - lastActivityTime > SESSION_TIMEOUT;
  }, []);

  // Auto logout on session timeout
  const checkSessionTimeout = useCallback(() => {
    if (token && isSessionExpired()) {
      console.log('Session expired, logging out...');
      logout();
    }
  }, [token, isSessionExpired]);

  // Setup activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
      if (token) {
        updateActivity();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, activityHandler, true);
    });

    // Setup interval to check session timeout
    const intervalId = setInterval(checkSessionTimeout, ACTIVITY_CHECK_INTERVAL);

    return () => {
      // Cleanup
      events.forEach(event => {
        document.removeEventListener(event, activityHandler, true);
      });
      clearInterval(intervalId);
    };
  }, [token, updateActivity, checkSessionTimeout]);

  // Check existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken && !isSessionExpired()) {
        setToken(storedToken);
        try {
          await fetchUserProfile(storedToken);
          updateActivity();
        } catch (error) {
          console.error('Invalid stored token, clearing...');
          logout();
        }
      } else if (storedToken) {
        // Token exists but session expired
        console.log('Stored session expired, clearing...');
        logout();
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const fetchUserProfile = async (authToken?: string) => {
    try {
      // Use provided token or current token
      const tokenToUse = authToken || token;
      if (!tokenToUse) return;

      // Temporarily set token for API call if not already set
      if (authToken && !token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await api.get('/auth/profile');
      setUser(response.data);
      
      // Set user context based on role
      if (response.data.cithCentreId) {
        setUserCentre(response.data.cithCentreId);
        
        if (response.data.cithCentreId.areaSupervisorId) {
          setUserArea(response.data.cithCentreId.areaSupervisorId);
          
          if (response.data.cithCentreId.areaSupervisorId.districtId) {
            setUserDistrict(response.data.cithCentreId.areaSupervisorId.districtId);
          }
        }
      } else if (response.data.areaSupervisorId) {
        setUserArea(response.data.areaSupervisorId);
        
        if (response.data.areaSupervisorId.districtId) {
          setUserDistrict(response.data.areaSupervisorId.districtId);
        }
      } else if (response.data.districtId) {
        setUserDistrict(response.data.districtId);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  const refreshUserContext = async () => {
    if (token && !isSessionExpired()) {
      await fetchUserProfile();
      updateActivity();
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, ...userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      updateActivity();
      
      // Set up API authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', userData);
      const { token: newToken, ...user } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(user);
      updateActivity();
      
      // Set up API authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivity');
    setToken(null);
    setUser(null);
    setUserCentre(null);
    setUserArea(null);
    setUserDistrict(null);
    
    // Clear API authorization header
    delete api.defaults.headers.common['Authorization'];
  };

  const value: AuthContextData = {
    user,
    token,
    userCentre,
    userArea,
    userDistrict,
    login,
    register,
    logout,
    loading,
    refreshUserContext
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};