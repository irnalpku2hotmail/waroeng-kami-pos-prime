
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Monitor, Smartphone, Tablet, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SessionManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Mock session data since Supabase doesn't expose session details directly
  const { data: sessions } = useQuery({
    queryKey: ['user-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // This would typically come from a backend service that tracks sessions
      return [
        {
          id: '1',
          device_type: 'desktop',
          browser: 'Chrome',
          ip_address: '192.168.1.1',
          location: 'Jakarta, Indonesia',
          last_active: new Date().toISOString(),
          is_current: true
        }
      ];
    },
    enabled: !!user
  });

  const refreshSession = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Session Refreshed',
        description: 'Your session has been successfully refreshed'
      });
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleRefreshSession = async () => {
    setRefreshing(true);
    try {
      await refreshSession.mutateAsync();
    } finally {
      setRefreshing(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Session Management
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshSession}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Session
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions?.map((session: any) => (
              <TableRow key={session.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(session.device_type)}
                    <div>
                      <div className="font-medium">
                        {String(session.browser || 'Unknown Browser')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {String(session.ip_address || '')}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {String(session.location || 'Unknown Location')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(session.last_active), 'MMM dd, yyyy HH:mm')}
                  </div>
                </TableCell>
                <TableCell>
                  {session.is_current ? (
                    <Badge className="bg-green-100 text-green-800">Current</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">Active</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {!session.is_current && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <LogOut className="h-3 w-3" />
                      Revoke
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SessionManagement;
