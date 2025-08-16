
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Key, Activity, AlertTriangle, Lock } from 'lucide-react';
import RoleAuditLog from './RoleAuditLog';
import SecurityAuditLog from './SecurityAuditLog';
import SessionManagement from './SessionManagement';
import SecuritySettings from './SecuritySettings';
import { useAuth } from '@/contexts/AuthContext';

const EnhancedSecurityDashboard = () => {
  const { profile } = useAuth();

  // Security metrics (would be fetched from backend in real implementation)
  const securityMetrics = [
    {
      title: 'Active Sessions',
      value: '3',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Failed Login Attempts',
      value: '0',
      icon: AlertTriangle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Role Changes',
      value: '2',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Security Score',
      value: '95%',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the security dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-blue-600" />
        <h1 className="text-3xl font-bold">Enhanced Security Dashboard</h1>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {securityMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {metric.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Tabs */}
      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Role Changes
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <SecurityAuditLog />
        </TabsContent>

        <TabsContent value="roles">
          <RoleAuditLog />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionManagement />
        </TabsContent>

        <TabsContent value="settings">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedSecurityDashboard;
