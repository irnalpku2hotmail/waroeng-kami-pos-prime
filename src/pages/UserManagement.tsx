
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Users, Plus, UserCheck, UserX, Shield, Settings } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

const UserManagement = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'staff' as UserRole,
    phone: '',
    address: ''
  });

  // Fetch users - moved before conditional return
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'admin' // Only run query if user is admin
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: data.full_name,
          role: data.role
        }
      });

      if (authError) throw authError;

      // Update profile with additional information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          role: data.role,
          phone: data.phone,
          address: data.address
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      return authData.user;
    },
    onSuccess: () => {
      toast({ title: 'User created successfully' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserData({
        email: '',
        password: '',
        full_name: '',
        role: 'staff',
        phone: '',
        address: ''
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error creating user', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: UserRole }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'User role updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error updating user role', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Only admins can access this page - moved after all hooks
  if (profile?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-600',
      manager: 'bg-blue-600',
      staff: 'bg-green-600',
      cashier: 'bg-yellow-600'
    };
    
    return <Badge className={colors[role] || 'bg-gray-600'}>{role}</Badge>;
  };

  const canManageUser = (targetUser: any) => {
    if (targetUser.id === user?.id) return false; // Can't manage self
    if (profile?.role === 'admin') return true;
    return false;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">User Management</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      value={userData.password}
                      onChange={(e) => setUserData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={userData.full_name}
                      onChange={(e) => setUserData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="User full name"
                    />
                  </div>
                  <div>
                    <Label>Role *</Label>
                    <Select value={userData.role} onValueChange={(value: UserRole) => setUserData(prev => ({ ...prev, role: value }))}>
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
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={userData.phone}
                    onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea
                    value={userData.address}
                    onChange={(e) => setUserData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="User address"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createUserMutation.mutate(userData)}
                  disabled={createUserMutation.isPending || !userData.email || !userData.password || !userData.full_name}
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === 'admin').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role === 'staff').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cashiers</CardTitle>
              <Settings className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {users.filter(u => u.role === 'cashier').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {userData.avatar_url && (
                          <img 
                            src={userData.avatar_url} 
                            alt={userData.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{userData.full_name}</div>
                          <div className="text-sm text-gray-500">{userData.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(userData.role)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{userData.phone}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">{userData.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(userData.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(userData.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {canManageUser(userData) && (
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                Edit Role
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Change User Role</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>User: {userData.full_name}</Label>
                                  <div className="text-sm text-gray-500">{userData.email}</div>
                                </div>
                                <div>
                                  <Label>Current Role</Label>
                                  <div className="mt-1">{getRoleBadge(userData.role)}</div>
                                </div>
                                <div>
                                  <Label>New Role</Label>
                                  <Select 
                                    defaultValue={userData.role}
                                    onValueChange={(value: UserRole) => {
                                      updateUserRoleMutation.mutate({ 
                                        userId: userData.id, 
                                        role: value 
                                      });
                                    }}
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
                            </DialogContent>
                          </Dialog>
                          
                          {userData.id !== user?.id && (
                            <Button size="sm" variant="destructive">
                              Deactivate
                            </Button>
                          )}
                        </div>
                      )}
                      {userData.id === user?.id && (
                        <Badge variant="outline">Current User</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UserManagement;
