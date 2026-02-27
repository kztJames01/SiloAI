import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useUiStore, UserRole } from './lib/store';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TemplatesPage from './pages/TemplatesPage';
import WorkflowEditorPage from './pages/WorkflowEditorPage';
import ExecutionDetailPage from './pages/ExecutionDetailPage';
import ProfilePage from './pages/ProfilePage';
import FieldPage from './pages/FieldPage';
import SafetyDashboardPage from './pages/SafetyDashboardPage';
import IntegrationsPage from './pages/IntegrationsPage';
import AppExplorerPage from './pages/AppExplorerPage';
import AppDetailPage from './pages/AppDetailPage';
import OrganizationDashboardPage from './pages/OrganizationDashboardPage';
import DataStoragePage from './pages/DataStoragePage';
import AgentsPage from './pages/AgentsPage';
import AgentDetailPage from './pages/AgentDetailPage';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import WorkflowDashboardPage from './pages/WorkflowDashboardPage';

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
  const { role, isDark } = useUiStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Keep <html> class in sync with persisted dark preference
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

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

      {/* Agent detail / new — full-page layout (no sidebar) */}
      <Route
        path="/agents/new"
        element={
          <ProtectedRoute>
            <RoleGate allowedRoles={['admin']}>
              <AgentDetailPage />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agents/:id"
        element={
          <ProtectedRoute>
            <RoleGate allowedRoles={['admin']}>
              <AgentDetailPage />
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
          path="dashboard"
          element={
            <RoleGate allowedRoles={['admin']}>
              <DashboardPage />
            </RoleGate>
          }
        />
        <Route
          path="workflows"
          element={
            <RoleGate allowedRoles={['admin']}>
              <WorkflowDashboardPage />
            </RoleGate>
          }
        />
        <Route
          path="agents"
          element={
            <RoleGate allowedRoles={['admin']}>
              <AgentsPage />
            </RoleGate>
          }
        />
        <Route
          path="orgs"
          element={
            <RoleGate allowedRoles={['admin']}>
              <OrganizationDashboardPage />
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
          path="data-storage"
          element={
            <RoleGate allowedRoles={['admin']}>
              <DataStoragePage />
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
        <Route path="ai-settings" element={<Navigate to="/agents" replace />} />
        <Route
          path="integrations"
          element={
            <RoleGate allowedRoles={['admin']}>
              <AppExplorerPage />
            </RoleGate>
          }
        />
        <Route
          path="integrations/:provider"
          element={
            <RoleGate allowedRoles={['admin']}>
              <AppDetailPage />
            </RoleGate>
          }
        />
        <Route
          path="integrations/manage"
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
