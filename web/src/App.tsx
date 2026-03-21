import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { FamilyProvider } from './context/FamilyContext';
import { PanelProvider } from './context/PanelContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FamilySetupPage } from './pages/FamilySetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlannerPage } from './pages/PlannerPage';
import { NeedlePage } from './pages/NeedlePage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FamilyProvider>
          <BrowserRouter>
            <PanelProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/family-setup"
                element={
                  <ProtectedRoute requireFamily={false}>
                    <FamilySetupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/planner" element={<PlannerPage />} />
                <Route path="/needle" element={<NeedlePage />} />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            </PanelProvider>
          </BrowserRouter>
        </FamilyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
