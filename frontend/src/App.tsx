import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import LoadingScreen from './components/common/LoadingScreen';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import DashboardMain from './components/dashboard/DashboardMain';
import ReportForm from './components/reports/ReportForm';
import ReportList from './components/reports/ReportList';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  return user && token ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  return !user && !token ? <>{children}</> : <Navigate to="/dashboard" />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
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
                <PrivateRoute>
                  <Layout>
                    <ReportForm />
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;