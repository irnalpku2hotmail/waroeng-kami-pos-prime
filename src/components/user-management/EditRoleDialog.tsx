
import { useState } from 'react';
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

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-600',
      manager: 'bg-blue-600',
      staff: 'bg-green-600',
      cashier: 'bg-yellow-600'
    };
    
    return <Badge className={colors[role] || 'bg-gray-600'}>{String(role || '')}</Badge>;
  };

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: UserRole }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role: role })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'User role updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
      onUserUpdated();
      setSelectedRole('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error updating user role', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const handleUpdateRole = () => {
    if (selectedUser && selectedRole) {
      updateUserRoleMutation.mutate({ 
        userId: selectedUser.id, 
        role: selectedRole as UserRole
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
              <Label>User: {String(selectedUser.full_name || '')}</Label>
              <div className="text-sm text-gray-500">{String(selectedUser.email || '')}</div>
            </div>
            <div>
              <Label>Current Role</Label>
              <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
            </div>
            <div>
              <Label>New Role</Label>
              <Select 
                value={selectedRole}
                onValueChange={(value: UserRole) => setSelectedRole(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateRole}
                disabled={!selectedRole || selectedRole === selectedUser.role}
              >
                Update Role
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditRoleDialog;
