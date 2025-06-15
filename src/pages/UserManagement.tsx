
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import UserStats from '@/components/user-management/UserStats';
import CreateUserDialog from '@/components/user-management/CreateUserDialog';
import EditRoleDialog from '@/components/user-management/EditRoleDialog';
import UsersTable from '@/components/user-management/UsersTable';
import { Shield } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const UserManagement = () => {
  const { user, profile } = useAuth();
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch users with pagination
  const { data: usersData } = useQuery({
    queryKey: ['users', currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return { data, count };
    },
    enabled: profile?.role === 'admin'
  });

  const users = usersData?.data || [];
  const usersCount = usersData?.count || 0;
  const totalPages = Math.ceil(usersCount / ITEMS_PER_PAGE);

  // Only admins can access this page
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

  const handleEditRole = (userData: any) => {
    setSelectedUser(userData);
    setEditRoleDialogOpen(true);
  };

  const handleUserUpdated = () => {
    setSelectedUser(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">User Management</h1>
          <CreateUserDialog />
        </div>

        <UserStats usersCount={usersCount} />

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersTable
              users={users}
              currentPage={currentPage}
              totalPages={totalPages}
              currentUser={user}
              onPageChange={setCurrentPage}
              onEditRole={handleEditRole}
            />
          </CardContent>
        </Card>

        <EditRoleDialog
          open={editRoleDialogOpen}
          onOpenChange={setEditRoleDialogOpen}
          selectedUser={selectedUser}
          onUserUpdated={handleUserUpdated}
        />
      </div>
    </Layout>
  );
};

export default UserManagement;
