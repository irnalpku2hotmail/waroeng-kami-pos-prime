
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Shield, Save, RefreshCw } from 'lucide-react';

type UserRole = 'admin' | 'manager' | 'staff' | 'cashier' | 'buyer';

const PermissionManagement = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('staff');
  const queryClient = useQueryClient();

  const resources = [
    'dashboard',
    'pos',
    'products',
    'categories',
    'inventory',
    'orders',
    'purchases',
    'returns',
    'suppliers',
    'customers',
    'credit-management',
    'users',
    'user-locations',
    'point-exchange',
    'points-rewards',
    'flash-sales',
    'expenses',
    'reports',
    'settings'
  ];

  const roles = [
    { value: 'admin' as UserRole, label: 'Admin' },
    { value: 'manager' as UserRole, label: 'Manager' },
    { value: 'staff' as UserRole, label: 'Staff' },
    { value: 'cashier' as UserRole, label: 'Cashier' }
  ];

  // Fetch permissions for selected role
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['role-permissions', selectedRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', selectedRole);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedRole
  });

  // Create a map of resource permissions
  const permissionMap = permissions.reduce((acc, perm) => {
    acc[perm.resource] = {
      can_create: perm.can_create,
      can_read: perm.can_read,
      can_update: perm.can_update,
      can_delete: perm.can_delete
    };
    return acc;
  }, {} as Record<string, any>);

  // Update permission mutation
  const updatePermission = useMutation({
    mutationFn: async ({ resource, permission, value }: { 
      resource: string; 
      permission: string; 
      value: boolean 
    }) => {
      const existingPerm = permissions.find(p => p.resource === resource);
      
      if (existingPerm) {
        // Update existing permission
        const { error } = await supabase
          .from('role_permissions')
          .update({ [permission]: value })
          .eq('id', existingPerm.id);
        
        if (error) throw error;
      } else {
        // Create new permission record with explicit typing
        const basePermission = {
          role: selectedRole,
          resource,
          can_create: false,
          can_read: false,
          can_update: false,
          can_delete: false
        };
        
        // Use explicit type mapping instead of dynamic property assignment
        switch (permission) {
          case 'can_create':
            basePermission.can_create = value;
            break;
          case 'can_read':
            basePermission.can_read = value;
            break;
          case 'can_update':
            basePermission.can_update = value;
            break;
          case 'can_delete':
            basePermission.can_delete = value;
            break;
        }

        const { error } = await supabase
          .from('role_permissions')
          .insert([basePermission]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', selectedRole] });
      toast({
        title: 'Permission Updated',
        description: 'Permission has been updated successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handlePermissionChange = (resource: string, permission: string, value: boolean) => {
    updatePermission.mutate({ resource, permission, value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Permission Management</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['role-permissions', selectedRole] })}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {roles.find(r => r.value === selectedRole)?.label}
            </Badge>
            <span className="text-lg">Permissions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-4 font-semibold text-sm text-gray-600 border-b pb-2">
                <div>Resource</div>
                <div className="text-center">Create</div>
                <div className="text-center">Read</div>
                <div className="text-center">Update</div>
                <div className="text-center">Delete</div>
              </div>
              
              {resources.map((resource) => {
                const permissions = permissionMap[resource] || {
                  can_create: false,
                  can_read: false,
                  can_update: false,
                  can_delete: false
                };
                
                return (
                  <div key={resource} className="grid grid-cols-5 gap-4 items-center py-3 border-b last:border-b-0">
                    <div className="font-medium capitalize">
                      {resource.replace('-', ' ')}
                    </div>
                    
                    <div className="flex justify-center">
                      <Switch
                        checked={permissions.can_create}
                        onCheckedChange={(value) => 
                          handlePermissionChange(resource, 'can_create', value)
                        }
                        disabled={updatePermission.isPending}
                      />
                    </div>
                    
                    <div className="flex justify-center">
                      <Switch
                        checked={permissions.can_read}
                        onCheckedChange={(value) => 
                          handlePermissionChange(resource, 'can_read', value)
                        }
                        disabled={updatePermission.isPending}
                      />
                    </div>
                    
                    <div className="flex justify-center">
                      <Switch
                        checked={permissions.can_update}
                        onCheckedChange={(value) => 
                          handlePermissionChange(resource, 'can_update', value)
                        }
                        disabled={updatePermission.isPending}
                      />
                    </div>
                    
                    <div className="flex justify-center">
                      <Switch
                        checked={permissions.can_delete}
                        onCheckedChange={(value) => 
                          handlePermissionChange(resource, 'can_delete', value)
                        }
                        disabled={updatePermission.isPending}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionManagement;
