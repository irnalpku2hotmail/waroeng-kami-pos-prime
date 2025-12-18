
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

const PresenceContext = createContext<{ onlineUsers: number }>({ onlineUsers: 0 });

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    if (!user) {
      setOnlineUsers(0);
      return;
    }

    console.log('Setting up presence tracking for user:', user.id);

    const channel = supabase.channel('online-users', {
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
        console.log('Presence sync - online users count:', count, 'state:', state);
        setOnlineUsers(count);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        const state = channel.presenceState();
        setOnlineUsers(Object.keys(state).length);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        const state = channel.presenceState();
        setOnlineUsers(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Presence channel subscribed, tracking user presence');
          const trackResult = await channel.track({ 
            user_id: user.id,
            online_at: new Date().toISOString(),
            email: user.email 
          });
          console.log('Track result:', trackResult);
          
          // Get initial state after tracking
          setTimeout(() => {
            const state = channel.presenceState();
            const count = Object.keys(state).length;
            console.log('Initial presence state after track:', count, state);
            if (count > 0) {
              setOnlineUsers(count);
            }
          }, 100);
        }
      });

    return () => {
      console.log('Cleaning up presence tracking');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  );
};
