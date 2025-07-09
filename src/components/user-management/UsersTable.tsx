
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MoreHorizontal, Edit, Trash2, UserX } from 'lucide-react';
import PaginationComponent from '@/components/PaginationComponent';
import { useState } from 'react';

interface UsersTableProps {
  users: any[];
  currentPage: number;
  totalPages: number;
  currentUser: any;
  onPageChange: (page: number) => void;
  onEditRole: (user: any) => void;
}

const UsersTable = ({ users, currentPage, totalPages, currentUser, onPageChange, onEditRole }: UsersTableProps) => {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('Deleting user with ID:', userId);
      
      // First delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Profile deletion error:', profileError);
        throw new Error(`Failed to delete user profile: ${profileError.message}`);
      }

      console.log('Profile deleted successfully');
      return { success: true };
    },
    onSuccess: () => {
      toast({ 
        title: 'Success',
        description: 'User has been deleted successfully' 
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      console.error('Delete user error:', error);
      toast({ 
        title: 'Error deleting user', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

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

  const canManageUser = (targetUser: any) => {
    if (targetUser.id === currentUser?.id) return false; // Can't manage self
    return true; // Admin check is handled at page level
  };

  const handleDeleteClick = (user: any) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                    <div className="text-sm">{userData.phone || '-'}</div>
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {userData.address || '-'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(userData.created_at).toLocaleDateString('id-ID')}
                </TableCell>
                <TableCell>
                  {new Date(userData.updated_at).toLocaleDateString('id-ID')}
                </TableCell>
                <TableCell className="text-right">
                  {canManageUser(userData) ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onEditRole(userData)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Role
                        </DropdownMenuItem>
                        {userData.id !== currentUser?.id && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(userData)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Badge variant="outline">Current User</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          itemsPerPage={10}
          totalItems={users.length * totalPages}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <strong>{userToDelete?.full_name}</strong>'s account and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersTable;
