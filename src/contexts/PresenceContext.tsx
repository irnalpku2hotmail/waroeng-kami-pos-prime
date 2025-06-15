
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

const PresenceContext = createContext<{ onlineUsers: number }>({ onlineUsers: 0 });

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`online-users-${new Date().getTime()}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setOnlineUsers(count);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  );
};
