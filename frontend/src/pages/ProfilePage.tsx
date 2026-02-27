import { useQuery } from '@tanstack/react-query';
import { authApi, workflowApi, executionApi, integrationApi } from '../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { User, Mail, Calendar } from 'lucide-react';
import { useUiStore } from '../lib/store';

export default function ProfilePage() {
  const { role, setRole } = useUiStore();

  // Load user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await authApi.me();
      return response.data.user;
    },
  });

  // Load statistics
  const { data: workflowsData } = useQuery({
    queryKey: ['workflows-count'],
    queryFn: async () => {
      const response = await workflowApi.list();
      return response.data.workflows;
    },
  });

  const { data: executionsData } = useQuery({
    queryKey: ['executions-count'],
    queryFn: async () => {
      const response = await executionApi.list();
      return response.data.executions;
    },
  });

  const { data: integrationsData } = useQuery({
    queryKey: ['integrations-count'],
    queryFn: async () => {
      const response = await integrationApi.listUser();
      return response.data.userIntegrations;
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>View and update your profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                {profile?.name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">{profile?.name || 'User'}</h3>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                    <User className="h-4 w-4 mr-2" />
                    Name
                  </label>
                  <p className="text-sm text-foreground px-3 py-2 bg-muted rounded-md">
                    {profile?.name || 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </label>
                  <p className="text-sm text-foreground px-3 py-2 bg-muted rounded-md">
                    {profile?.email}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Member Since
                </label>
                <p className="text-sm text-foreground px-3 py-2 bg-muted rounded-md">
                  {profile?.createdAt ? formatDate(profile.createdAt) : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>Overview of your Silo activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-3xl font-bold text-primary">
                {workflowsData?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Workflows</p>
            </div>
            <div className="text-center p-4 bg-secondary/10 rounded-lg">
              <p className="text-3xl font-bold text-secondary">
                {executionsData?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Executions</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-foreground">
                {integrationsData?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Integrations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Access & View Mode</CardTitle>
          <CardDescription>Choose role-based interface and account security options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Interface Role</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as 'field' | 'admin')}
              className="w-full max-w-sm px-3 py-2 border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="field">Field Worker</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button variant="outline">Change Password</Button>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
