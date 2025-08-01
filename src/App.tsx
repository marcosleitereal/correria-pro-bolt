import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import ProofSection from './components/ProofSection';
import TestimonialsSection from './components/TestimonialsSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import PricingPage from './components/PricingPage';
import SuccessPage from './components/SuccessPage';
import DashboardPage from './components/dashboard/DashboardPage';
import PrivateLayout from './components/layout/PrivateLayout';
import RunnersPage from './components/runners/RunnersPage';
import GroupsPage from './components/groups/GroupsPage';
import TrainingWizardPage from './components/training/TrainingWizardPage';
import TrainingEditPage from './components/training/TrainingEditPage';
import RunnerHistoryPage from './components/runners/RunnerHistoryPage';
import SettingsPage from './components/settings/SettingsPage';
import AdminRoute from './components/auth/AdminRoute';
import AdminDashboard from './components/admin/AdminDashboard';
import AnalyticsPage from './components/admin/AnalyticsPage';
import CheckoutSuccessPage from './components/checkout/CheckoutSuccessPage';
import TrainingStylesPage from './components/training/TrainingStylesPage';
import ProfilePage from './components/profile/ProfilePage';
import PublicFeedbackPage from './components/feedback/PublicFeedbackPage';
import NotificationsPage from './components/notifications/NotificationsPage';
import TermsOfServicePage from './components/legal/TermsOfServicePage';
import PrivacyPolicyPage from './components/legal/PrivacyPolicyPage';
import CookiePolicyPage from './components/legal/CookiePolicyPage';
import CancellationPolicyPage from './components/legal/CancellationPolicyPage';
import AcceptableUsePolicyPage from './components/legal/AcceptableUsePolicyPage';
import NotFoundPage from './components/NotFoundPage';
import InstallPrompt from './components/PWAComponents/InstallPrompt';
import UpdatePrompt from './components/PWAComponents/UpdatePrompt';
import OfflineBanner from './components/PWAComponents/OfflineBanner';

// Landing Page Component
const LandingPage: React.FC = () => (
  <div className="pt-16">
    <HeroSection />
    <FeaturesSection />
    <ProofSection />
    <TestimonialsSection />
    <CTASection />
    <Footer />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <>
                <Navbar />
                <LandingPage />
              </>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/pricing" element={
              <>
                <PricingPage />
              </>
            } />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            
            {/* Public Feedback Route - Must be before 404 */}
            <Route path="/feedback/:token" element={<PublicFeedbackPage />} />
            
            {/* Legal Routes */}
            <Route path="/termos-de-uso" element={<TermsOfServicePage />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
            <Route path="/politica-de-cookies" element={<CookiePolicyPage />} />
            <Route path="/politica-de-cancelamento" element={<CancellationPolicyPage />} />
            <Route path="/politica-de-uso-aceitavel" element={<AcceptableUsePolicyPage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <PrivateLayout>
                <DashboardPage />
              </PrivateLayout>
            } />
            <Route path="/runners" element={
              <PrivateLayout>
                <RunnersPage />
              </PrivateLayout>
            } />
            <Route path="/groups" element={
              <PrivateLayout>
                <GroupsPage />
              </PrivateLayout>
            } />
            <Route path="/dashboard/generate-training" element={
              <PrivateLayout>
                <TrainingWizardPage />
              </PrivateLayout>
            } />
            <Route path="/dashboard/training/:id/edit" element={
              <PrivateLayout>
                <TrainingEditPage />
              </PrivateLayout>
            } />
            <Route path="/runners/:runnerId/history" element={
              <PrivateLayout>
                <RunnerHistoryPage />
              </PrivateLayout>
            } />
            <Route path="/settings" element={
              <PrivateLayout>
                <SettingsPage />
              </PrivateLayout>
            } />
            <Route path="/training-styles" element={
              <PrivateLayout>
                <TrainingStylesPage />
              </PrivateLayout>
            } />
            <Route path="/profile" element={
              <PrivateLayout>
                <ProfilePage />
              </PrivateLayout>
            } />
            <Route path="/notifications" element={
              <PrivateLayout>
                <NotificationsPage />
              </PrivateLayout>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/analytics" element={
              <AdminRoute>
                <PrivateLayout>
                  <AnalyticsPage />
                </PrivateLayout>
              </AdminRoute>
            } />
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <PrivateLayout>
                  <AdminDashboard />
                </PrivateLayout>
              </AdminRoute>
            } />
            
            {/* 404 Page - Must be LAST */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster position="top-right" richColors closeButton />
          
          {/* PWA Components */}
          <InstallPrompt />
          <UpdatePrompt />
          <OfflineBanner />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;