import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { AuthContextType, User, CithCentre, AreaSupervisor, District } from '../types';

export interface AuthContextData extends AuthContextType {
  userCentre: CithCentre | null;
  userArea: AreaSupervisor | null;
  userDistrict: District | null;
  refreshUserContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

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
  const [loading, setLoading] = useState(false);
  const [userCentre, setUserCentre] = useState<CithCentre | null>(null);
  const [userArea, setUserArea] = useState<AreaSupervisor | null>(null);
  const [userDistrict, setUserDistrict] = useState<District | null>(null);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
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
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const refreshUserContext = async () => {
    if (token) {
      await fetchUserProfile();
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
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setUserCentre(null);
    setUserArea(null);
    setUserDistrict(null);
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