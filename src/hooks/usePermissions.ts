
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

interface Permission {
  id: string;
  role: string;
  resource: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export const usePermissions = () => {
  const { profile } = useAuth();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['permissions', profile?.role],
    queryFn: async () => {
      if (!profile?.role) return [];
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        // Cast role to the Supabase enum type to satisfy the typed client
        .eq('role', profile.role as Database['public']['Enums']['user_role']);

      if (error) throw error;
      return data as Permission[];
    },
    enabled: !!profile?.role
  });

  const hasPermission = (resource: string, action: 'create' | 'read' | 'update' | 'delete') => {
    if (profile?.role === 'admin') return true;
    
    const permission = permissions.find(p => p.resource === resource);
    if (!permission) return false;

    switch (action) {
      case 'create': return permission.can_create;
      case 'read': return permission.can_read;
      case 'update': return permission.can_update;
      case 'delete': return permission.can_delete;
      default: return false;
    }
  };

  const canAccessRoute = (resource: string) => {
    return hasPermission(resource, 'read');
  };

  return {
    permissions,
    hasPermission,
    canAccessRoute,
    isLoading
  };
};
