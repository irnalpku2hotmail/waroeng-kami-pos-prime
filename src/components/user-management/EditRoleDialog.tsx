
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: any;
  onUserUpdated: () => void;
}

const EditRoleDialog = ({ open, onOpenChange, selectedUser, onUserUpdated }: EditRoleDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');

  // Reset form when dialog opens with new user
  useEffect(() => {
    if (selectedUser && open) {
      setSelectedRole(selectedUser.role);
    }
  }, [selectedUser, open]);

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-600 hover:bg-red-700',
      manager: 'bg-blue-600 hover:bg-blue-700',
      staff: 'bg-green-600 hover:bg-green-700',
      cashier: 'bg-yellow-600 hover:bg-yellow-700',
      buyer: 'bg-purple-600 hover:bg-purple-700'
    };
    
    return (
      <Badge className={`${colors[role] || 'bg-gray-600'} text-white border-0`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getRoleDescription = (role: string) => {
    const descriptions: Record<string, string> = {
      admin: 'Full system access, can manage users and all features',
      manager: 'Can manage inventory, sales, and reports',
      staff: 'Can manage products, customers, and transactions',
      cashier: 'Can process sales and manage customers',
      buyer: 'Can browse products and make purchases'
    };
    return descriptions[role] || '';
  };

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: UserRole }) => {
      console.log('Updating user role:', { userId, role });
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: role })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Role update error:', error);
        throw error;
      }

      console.log('Role updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Success',
        description: `User role has been updated to ${data.role}` 
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
      onUserUpdated();
      setSelectedRole('');
    },
    onError: (error: any) => {
      console.error('Error updating user role:', error);
      toast({ 
        title: 'Error updating user role', 
        description: error.message || 'Failed to update user role',
        variant: 'destructive' 
      });
    }
  });

  const handleUpdateRole = () => {
    if (selectedUser && selectedRole && selectedRole !== selectedUser.role) {
      updateUserRoleMutation.mutate({ 
        userId: selectedUser.id, 
        role: selectedRole as UserRole
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedRole('');
  };

  if (!selectedUser) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            {selectedUser.avatar_url && (
              <img 
                src={selectedUser.avatar_url} 
                alt={selectedUser.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <div className="font-medium">{selectedUser.full_name}</div>
              <div className="text-sm text-gray-500">{selectedUser.email}</div>
            </div>
          </div>

          {/* Current Role */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Role</Label>
            <div className="flex items-center space-x-3">
              {getRoleBadge(selectedUser.role)}
              <span className="text-sm text-gray-600">
                {getRoleDescription(selectedUser.role)}
              </span>
            </div>
          </div>

          {/* New Role Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">New Role</Label>
            <Select 
              value={selectedRole}
              onValueChange={(value: UserRole) => setSelectedRole(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">
                  <div className="flex items-center space-x-2">
                    <span>Buyer</span>
                    <span className="text-xs text-gray-500">- Can browse and purchase</span>
                  </div>
                </SelectItem>
                <SelectItem value="cashier">
                  <div className="flex items-center space-x-2">
                    <span>Cashier</span>
                    <span className="text-xs text-gray-500">- Can process sales</span>
                  </div>
                </SelectItem>
                <SelectItem value="staff">
                  <div className="flex items-center space-x-2">
                    <span>Staff</span>
                    <span className="text-xs text-gray-500">- Can manage products</span>
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex items-center space-x-2">
                    <span>Manager</span>
                    <span className="text-xs text-gray-500">- Can manage inventory</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center space-x-2">
                    <span>Admin</span>
                    <span className="text-xs text-gray-500">- Full system access</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {selectedRole && selectedRole !== selectedUser.role && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-900">New role:</span>
                  {getRoleBadge(selectedRole)}
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {getRoleDescription(selectedRole)}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRole}
              disabled={!selectedRole || selectedRole === selectedUser.role || updateUserRoleMutation.isPending}
            >
              {updateUserRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoleDialog;
