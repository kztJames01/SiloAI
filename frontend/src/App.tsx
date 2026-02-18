import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useUiStore, UserRole } from './lib/store';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TemplatesPage from './pages/TemplatesPage';
import WorkflowEditorPage from './pages/WorkflowEditorPage';
import ExecutionsPage from './pages/ExecutionsPage';
import ExecutionDetailPage from './pages/ExecutionDetailPage';
import ProfilePage from './pages/ProfilePage';
import FieldPage from './pages/FieldPage';
import SafetyDashboardPage from './pages/SafetyDashboardPage';
import { AISettingsPage } from './pages/AISettingsPage';
import IntegrationsPage from './pages/IntegrationsPage';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

function RoleGate({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}) {
  const { role } = useUiStore();

  if (!allowedRoles.includes(role)) {
    return <Navigate to={role === 'field' ? '/field' : '/workflows'} replace />;
  }

  return <>{children}</>;
}

function App() {
  const { checkAuth, isLoading } = useAuthStore();
  const { role } = useUiStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Standalone Workflow Editor - No Dashboard Layout */}
      <Route
        path="/workflows/new"
        element={
          <ProtectedRoute>
            <RoleGate allowedRoles={['admin']}>
              <WorkflowEditorPage />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflows/:id"
        element={
          <ProtectedRoute>
            <RoleGate allowedRoles={['admin']}>
              <WorkflowEditorPage />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      {/* Dashboard Layout Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={role === 'field' ? '/field' : '/workflows'} replace />} />
        <Route
          path="field"
          element={
            <RoleGate allowedRoles={['field']}>
              <FieldPage />
            </RoleGate>
          }
        />
        <Route
          path="workflows"
          element={
            <RoleGate allowedRoles={['admin']}>
              <DashboardPage />
            </RoleGate>
          }
        />
        <Route
          path="templates"
          element={
            <RoleGate allowedRoles={['admin']}>
              <TemplatesPage />
            </RoleGate>
          }
        />
        <Route
          path="safety"
          element={
            <RoleGate allowedRoles={['admin']}>
              <SafetyDashboardPage />
            </RoleGate>
          }
        />
        <Route
          path="executions"
          element={
            <RoleGate allowedRoles={['admin']}>
              <ExecutionsPage />
            </RoleGate>
          }
        />
        <Route
          path="executions/:id"
          element={
            <RoleGate allowedRoles={['admin']}>
              <ExecutionDetailPage />
            </RoleGate>
          }
        />
        <Route
          path="ai-settings"
          element={
            <RoleGate allowedRoles={['admin']}>
              <AISettingsPage />
            </RoleGate>
          }
        />        <Route
          path="integrations"
          element={
            <RoleGate allowedRoles={['admin']}>
              <IntegrationsPage />
            </RoleGate>
          }
        />        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default App;
