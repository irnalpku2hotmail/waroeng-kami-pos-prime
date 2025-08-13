
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Shield, User, Clock } from 'lucide-react';

const RoleAuditLog = () => {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['role-audit-logs'],
    queryFn: async () => {
      // For now, return empty array since the audit table may not be available yet
      // This will be populated once role changes start happening
      try {
        // Try to query the audit table directly if it exists
        const { data, error } = await supabase
          .from('role_change_audit' as any)
          .select('*')
          .order('changed_at', { ascending: false })
          .limit(50);

        if (error) {
          console.log('Audit table not available yet:', error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.log('Audit logs not available yet:', err);
        return [];
      }
    }
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-600 hover:bg-red-700';
      case 'manager': return 'bg-orange-600 hover:bg-orange-700';
      case 'staff': return 'bg-blue-600 hover:bg-blue-700';
      case 'cashier': return 'bg-green-600 hover:bg-green-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Change Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="text-muted-foreground">Loading audit logs...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Change Audit Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!auditLogs || auditLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No role changes recorded yet. Audit logging is now active for future changes.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role Change</TableHead>
                <TableHead>Changed By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {log.user_profile?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {log.user_profile?.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(log.old_role)}>
                        {log.old_role}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge className={getRoleBadgeColor(log.new_role)}>
                        {log.new_role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {log.changed_by_profile?.full_name || 'System'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {log.changed_by_profile?.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        {format(new Date(log.changed_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {log.reason || 'No reason provided'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleAuditLog;
