
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'] | 'buyer';

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: any;
  onUserUpdated: () => void;
}

const EditRoleDialog = ({ open, onOpenChange, selectedUser, onUserUpdated }: EditRoleDialogProps) => {
  const queryClient = useQueryClient();

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-600',
      manager: 'bg-blue-600',
      staff: 'bg-green-600',
      cashier: 'bg-yellow-600'
    };
    
    return <Badge className={colors[role] || 'bg-gray-600'}>{role}</Badge>;
  };

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: UserRole }) => {
      // Remove 'buyer' as it's not a valid role in the database
      const validRole = role === 'buyer' ? 'staff' : role;
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: validRole })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'User role updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
      onUserUpdated();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error updating user role', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const handleUpdateRole = (role: UserRole) => {
    if (selectedUser) {
      updateUserRoleMutation.mutate({ 
        userId: selectedUser.id, 
        role: role 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
        </DialogHeader>
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <Label>User: {selectedUser.full_name}</Label>
              <div className="text-sm text-gray-500">{selectedUser.email}</div>
            </div>
            <div>
              <Label>Current Role</Label>
              <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
            </div>
            <div>
              <Label>New Role</Label>
              <Select 
                defaultValue={selectedUser.role}
                onValueChange={(value: UserRole) => handleUpdateRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditRoleDialog;
