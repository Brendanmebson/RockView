// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import DashboardMain from './components/dashboard/DashboardMain';
import ReportForm from './components/reports/ReportForm';
import ReportList from './components/reports/ReportList';
import ReportDetail from './components/reports/ReportDetail';
import SettingsPage from './components/settings/SettingsPage';
import AdminPositionRequests from './components/admin/AdminPositionRequests';
import UserManagement from './components/admin/UserManagement';
import MessageList from './components/messages/MessageList';
import ComposeMessage from './components/messages/ComposeMessage';
import MessageDetail from './components/messages/MessageDetail';
import { AnimatePresence } from 'framer-motion';

const PrivateRoute: React.FC<{ 
  children: React.ReactNode;
  requiredRole?: string[];
}> = ({ children, requiredRole }) => {
  const { user, token } = useAuth();
  
  if (!user || !token) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && !requiredRole.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  return !user && !token ? <>{children}</> : <Navigate to="/dashboard" />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AnimatePresence mode="wait">
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Navigate to="/dashboard" />
                  </PrivateRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Layout>
                      <DashboardMain />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <PrivateRoute>
                    <Layout>
                      <ReportList />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/reports/new"
                element={
                  <PrivateRoute requiredRole={['cith_centre']}>
                    <Layout>
                      <ReportForm />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/reports/:id"
                element={
                  <PrivateRoute>
                    <Layout>
                      <ReportDetail />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Layout>
                      <SettingsPage />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/position-requests"
                element={
                  <PrivateRoute requiredRole={['admin']}>
                    <Layout>
                      <AdminPositionRequests />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <PrivateRoute requiredRole={['admin']}>
                    <Layout>
                      <UserManagement />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <PrivateRoute>
                    <Layout>
                      <MessageList />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/messages/compose"
                element={
                  <PrivateRoute>
                    <Layout>
                      <ComposeMessage />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/messages/:id"
                element={
                  <PrivateRoute>
                    <Layout>
                      <MessageDetail />
                    </Layout>
                  </PrivateRoute>
                }
              />
            </Routes>
          </AnimatePresence>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;