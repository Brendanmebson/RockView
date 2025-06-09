// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import DashboardMain from './components/dashboard/DashboardMain';
import ReportList from './components/reports/ReportList';
import ReportForm from './components/reports/ReportForm';
import ReportDetail from './components/reports/ReportDetail';
import MessageList from './components/messages/MessageList';
import MessageDetail from './components/messages/MessageDetail';
import ComposeMessage from './components/messages/ComposeMessage';
import SettingsPage from './components/settings/SettingsPage';
import UserManagement from './components/admin/UserManagement';
import DistrictManagement from './components/admin/DistrictManagement';
import ZonalSupervisorManagement from './components/admin/ZonalSupervisorManagement';
import AreaSupervisorManagement from './components/admin/AreaSupervisorManagement';
import CithCentreManagement from './components/admin/CithCentreManagement';
import AdminPositionRequests from './components/admin/AdminPositionRequests';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { CssBaseline } from '@mui/material';

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><Layout><Navigate to="/dashboard" replace /></Layout></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardMain /></Layout></ProtectedRoute>} />
              
              {/* Reports Routes */}
              <Route path="/reports" element={<ProtectedRoute><Layout><ReportList /></Layout></ProtectedRoute>} />
              <Route path="/reports/new" element={<ProtectedRoute roles={['cith_centre']}><Layout><ReportForm /></Layout></ProtectedRoute>} />
              <Route path="/reports/:id" element={<ProtectedRoute><Layout><ReportDetail /></Layout></ProtectedRoute>} />
              <Route path="/reports/:id/edit" element={<ProtectedRoute roles={['cith_centre']}><Layout><ReportForm /></Layout></ProtectedRoute>} />
              
              {/* Messages Routes */}
              <Route path="/messages" element={<ProtectedRoute><Layout><MessageList /></Layout></ProtectedRoute>} />
              <Route path="/messages/compose" element={<ProtectedRoute><Layout><ComposeMessage /></Layout></ProtectedRoute>} />
              <Route path="/messages/:id" element={<ProtectedRoute><Layout><MessageDetail /></Layout></ProtectedRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><Layout><UserManagement /></Layout></ProtectedRoute>} />
              <Route path="/admin/position-requests" element={<ProtectedRoute roles={['admin']}><Layout><AdminPositionRequests /></Layout></ProtectedRoute>} />
              <Route path="/districts" element={<ProtectedRoute roles={['admin']}><Layout><DistrictManagement /></Layout></ProtectedRoute>} />
              <Route path="/area-supervisors" element={<ProtectedRoute roles={['admin', 'district_pastor']}><Layout><AreaSupervisorManagement /></Layout></ProtectedRoute>} />
              <Route path="/cith-centres" element={<ProtectedRoute roles={['admin', 'district_pastor', 'area_supervisor']}><Layout><CithCentreManagement /></Layout></ProtectedRoute>} />
              <Route path="/zonal-supervisors" element={<ProtectedRoute roles={['admin', 'district_pastor']}><Layout><ZonalSupervisorManagement /></Layout></ProtectedRoute>} />


              {/* Settings Route */}
              <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;