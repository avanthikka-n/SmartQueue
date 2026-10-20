import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Public & Customer Pages
import OrganizationSelectorPage from './pages/public/OrganizationSelectorPage.jsx';
import SelectServicePage from './pages/customer/SelectServicePage.jsx';
import TokenStatusPage from './pages/customer/TokenStatusPage.jsx';
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';
import BookAppointmentPage from './pages/customer/BookAppointmentPage.jsx';
import FeedbackPage from './pages/customer/FeedbackPage.jsx';
import PublicDisplayPage from './pages/public/PublicDisplayPage.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import FacilityManagement from './pages/admin/FacilityManagement.jsx';
import DepartmentManagement from './pages/admin/DepartmentManagement.jsx';
import ServiceManagement from './pages/admin/ServiceManagement.jsx';
import CounterManagement from './pages/admin/CounterManagement.jsx';
import StaffManagement from './pages/admin/StaffManagement.jsx';
import AppointmentManagement from './pages/admin/AppointmentManagement.jsx';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard.jsx';
import FeedbackManagement from './pages/admin/FeedbackManagement.jsx';

// Staff Pages
import StaffLoginPage from './pages/staff/StaffLoginPage.jsx';
import StaffDashboard from './pages/staff/StaffDashboard.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public & Customer Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/organizations" element={<OrganizationSelectorPage />} />
          <Route path="/select-service" element={<SelectServicePage />} />
          <Route path="/token/:id" element={<TokenStatusPage />} />
          <Route path="/appointment/:serviceId" element={<BookAppointmentPage />} />
          <Route path="/customer/dashboard" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN']}>
              <CustomerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/feedback/:tokenId" element={<FeedbackPage />} />
          <Route path="/display/:organizationId/:departmentId" element={<PublicDisplayPage />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['ORGANIZATION_ADMIN', 'SUPER_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/facilities" element={
            <ProtectedRoute allowedRoles={['ORGANIZATION_ADMIN', 'SUPER_ADMIN']}>
              <FacilityManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/departments" element={
            <ProtectedRoute allowedRoles={['ORGANIZATION_ADMIN', 'SUPER_ADMIN']}>
              <DepartmentManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/services" element={
            <ProtectedRoute allowedRoles={['ORGANIZATION_ADMIN', 'SUPER_ADMIN']}>
              <ServiceManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/counters" element={
            <ProtectedRoute allowedRoles={['ORGANIZATION_ADMIN', 'SUPER_ADMIN']}>
              <CounterManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/staff" element={
            <ProtectedRoute allowedRoles={['ORGANIZATION_ADMIN', 'SUPER_ADMIN']}>
              <StaffManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/appointments" element={
            <ProtectedRoute allowedRoles={['ORGANIZATION_ADMIN', 'SUPER_ADMIN']}>
              <AppointmentManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['ORGANIZATION_ADMIN', 'SUPER_ADMIN']}>
              <AnalyticsDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/feedback" element={
            <ProtectedRoute allowedRoles={['ORGANIZATION_ADMIN', 'SUPER_ADMIN']}>
              <FeedbackManagement />
            </ProtectedRoute>
          } />

          {/* Staff Routes */}
          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route path="/staff/dashboard" element={
            <ProtectedRoute allowedRoles={['STAFF', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN']}>
              <StaffDashboard />
            </ProtectedRoute>
          } />
          <Route path="/staff/queue" element={
            <ProtectedRoute allowedRoles={['STAFF', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN']}>
              <StaffDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-slate-800">404</h1>
                <p className="text-slate-600 mt-2">Page under construction or not found.</p>
                <a href="/" className="inline-block mt-4 text-brand-600 font-semibold hover:underline">Return Home</a>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
