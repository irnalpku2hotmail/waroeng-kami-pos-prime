
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePermissions = () => {
  const { user, profile } = useAuth();

  const { data: permissions = [] } = useQuery({
    queryKey: ['user-permissions', profile?.role],
    queryFn: async () => {
      if (!profile?.role) return [];
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', profile.role);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.role && profile?.role !== 'buyer'
  });

  const canAccessRoute = (resource: string, action: 'create' | 'read' | 'update' | 'delete' = 'read') => {
    // Buyers can't access admin routes
    if (profile?.role === 'buyer') return false;
    
    // Admins have full access
    if (profile?.role === 'admin') return true;
    
    // Check specific permissions
    const permission = permissions.find(p => p.resource === resource);
    if (!permission) return false;
    
    switch (action) {
      case 'create':
        return permission.can_create;
      case 'read':
        return permission.can_read;
      case 'update':
        return permission.can_update;
      case 'delete':
        return permission.can_delete;
      default:
        return permission.can_read;
    }
  };

  return {
    permissions,
    canAccessRoute,
    canCreate: (resource: string) => canAccessRoute(resource, 'create'),
    canRead: (resource: string) => canAccessRoute(resource, 'read'),
    canUpdate: (resource: string) => canAccessRoute(resource, 'update'),
    canDelete: (resource: string) => canAccessRoute(resource, 'delete'),
  };
};
