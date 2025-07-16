
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Settings, Shield, Edit, Trash2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface Permission {
  id: string;
  role: UserRole;
  resource: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

const PermissionManagement = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [newResource, setNewResource] = useState('');
  
  const queryClient = useQueryClient();

  const roles: UserRole[] = ['admin', 'manager', 'staff', 'cashier', 'buyer'];
  const resources = ['products', 'categories', 'users', 'orders', 'reports', 'settings'];

  // Fetch permissions
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['role-permissions', selectedRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', selectedRole)
        .order('resource');

      if (error) throw error;
      return data as Permission[];
    }
  });

  // Create permission mutation
  const createPermission = useMutation({
    mutationFn: async (permission: {
      role: UserRole;
      resource: string;
      can_create: boolean;
      can_read: boolean;
      can_update: boolean;
      can_delete: boolean;
    }) => {
      const { error } = await supabase
        .from('role_permissions')
        .insert(permission);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({ title: 'Berhasil', description: 'Permission berhasil dibuat' });
      setIsCreateDialogOpen(false);
      setNewResource('');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Update permission mutation
  const updatePermission = useMutation({
    mutationFn: async (permission: Partial<Permission> & { id: string }) => {
      const { error } = await supabase
        .from('role_permissions')
        .update(permission)
        .eq('id', permission.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({ title: 'Berhasil', description: 'Permission berhasil diupdate' });
      setIsEditDialogOpen(false);
      setEditingPermission(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Delete permission mutation
  const deletePermission = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({ title: 'Berhasil', description: 'Permission berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleCreatePermission = () => {
    if (!newResource) return;

    createPermission.mutate({
      role: selectedRole,
      resource: newResource,
      can_create: false,
      can_read: true,
      can_update: false,
      can_delete: false
    });
  };

  const handleEditPermission = (permission: Permission) => {
    setEditingPermission(permission);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePermission = () => {
    if (!editingPermission) return;

    updatePermission.mutate(editingPermission);
  };

  const handleDeletePermission = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus permission ini?')) {
      deletePermission.mutate(id);
    }
  };

  const togglePermission = (permission: Permission, type: 'can_create' | 'can_read' | 'can_update' | 'can_delete') => {
    updatePermission.mutate({
      id: permission.id,
      [type]: !permission[type]
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <CardTitle>Manajemen Permission Role</CardTitle>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Permission
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Permission Baru</DialogTitle>
                <DialogDescription>
                  Tambahkan permission baru untuk role {selectedRole}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="resource">Resource</Label>
                  <Select value={newResource} onValueChange={setNewResource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {resources.map((resource) => (
                        <SelectItem key={resource} value={resource}>
                          {resource}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreatePermission}>
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Role Selector */}
          <div className="flex items-center gap-4">
            <Label>Pilih Role:</Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{role}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Permissions Table */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead className="text-center">Create</TableHead>
                  <TableHead className="text-center">Read</TableHead>
                  <TableHead className="text-center">Update</TableHead>
                  <TableHead className="text-center">Delete</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">
                      <Badge variant="secondary">{permission.resource}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={permission.can_create}
                        onCheckedChange={() => togglePermission(permission, 'can_create')}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={permission.can_read}
                        onCheckedChange={() => togglePermission(permission, 'can_read')}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={permission.can_update}
                        onCheckedChange={() => togglePermission(permission, 'can_update')}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={permission.can_delete}
                        onCheckedChange={() => togglePermission(permission, 'can_delete')}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPermission(permission)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePermission(permission.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Permission</DialogTitle>
              <DialogDescription>
                Edit permission untuk resource {editingPermission?.resource}
              </DialogDescription>
            </DialogHeader>
            {editingPermission && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Create Permission</Label>
                  <Switch
                    checked={editingPermission.can_create}
                    onCheckedChange={(checked) => 
                      setEditingPermission({ ...editingPermission, can_create: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Read Permission</Label>
                  <Switch
                    checked={editingPermission.can_read}
                    onCheckedChange={(checked) => 
                      setEditingPermission({ ...editingPermission, can_read: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Update Permission</Label>
                  <Switch
                    checked={editingPermission.can_update}
                    onCheckedChange={(checked) => 
                      setEditingPermission({ ...editingPermission, can_update: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Delete Permission</Label>
                  <Switch
                    checked={editingPermission.can_delete}
                    onCheckedChange={(checked) => 
                      setEditingPermission({ ...editingPermission, can_delete: checked })
                    }
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleUpdatePermission}>
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PermissionManagement;
