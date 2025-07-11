import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MoreHorizontal, Edit, Ban, Trash2 } from 'lucide-react';

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

  // Delete user mutation - Updated to work with RLS
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // First delete the profile record which will cascade to related tables
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Profile deletion error:', profileError);
        throw new Error(`Failed to delete user profile: ${profileError.message}`);
      }

      // Then delete the auth user (admin only operation)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('Auth deletion error:', authError);
        throw new Error(`Failed to delete user account: ${authError.message}`);
      }
    },
    onSuccess: () => {
      toast({ title: 'User deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
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

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: '24855h' // Effectively permanent ban
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'User deactivated successfully' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error deactivating user', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

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
    if (targetUser.id === currentUser?.id) return false; // Can't manage self
    return true; // Admin check is handled at page level
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) onPageChange(currentPage - 1);
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-accent'}
              />
            </PaginationItem>
            
            {getVisiblePages().map((page, index) => (
              <PaginationItem key={index}>
                {page === '...' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(page as number);
                    }}
                    isActive={currentPage === page}
                    className="hover:bg-accent"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) onPageChange(currentPage + 1);
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-accent'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <>
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
                {canManageUser(userData) ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => onEditRole(userData)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Role
                      </DropdownMenuItem>
                      {userData.id !== currentUser?.id && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deactivateUserMutation.mutate(userData.id)}
                            className="text-orange-600"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteUserMutation.mutate(userData.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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
      {renderPagination()}
    </>
  );
};

export default UsersTable;
