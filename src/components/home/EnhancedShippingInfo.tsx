
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, RefreshCw, Truck, Zap, Shield } from 'lucide-react';
import locationPinImg from '@/assets/location-pin.png';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

const EnhancedShippingInfo = () => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['shipping-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['cod_settings', 'shipping_info']);
      if (error) throw error;
      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => { settingsMap[setting.key] = setting.value; });
      return settingsMap;
    }
  });

  const codSettings = settings?.cod_settings || {};
  const freeShippingMin = codSettings.min_order
    ? `Rp${Number(codSettings.min_order).toLocaleString('id-ID')}`
    : 'Rp100.000';

  useEffect(() => {
    const checkProfileLocation = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('latitude, longitude, address_text')
          .eq('id', user.id)
          .single();
        if (data?.latitude && data?.longitude) {
          setUserLocation({ latitude: data.latitude, longitude: data.longitude });
          setLocationAddress(data.address_text || null);
        }
      }
    };
    checkProfileLocation();
  }, [user]);

  const detectLocation = async () => {
    setIsLoading(true);
    if (!navigator.geolocation) { setIsLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || 'Lokasi terdeteksi';
          setLocationAddress(address);
          if (user) {
            await supabase.from('profiles').update({
              latitude, longitude,
              address_text: address,
              location_updated_at: new Date().toISOString()
            }).eq('id', user.id);
          }
          toast({ title: 'Lokasi Diperbarui', description: 'Lokasi pengiriman Anda telah diperbarui' });
        } catch { setLocationAddress('Lokasi terdeteksi'); }
        setIsLoading(false);
      },
      () => { setIsLoading(false); }
    );
  };

  // Truncate address for compact display
  const shortAddress = locationAddress
    ? locationAddress.length > 50 ? locationAddress.substring(0, 50) + '…' : locationAddress
    : null;

  return (
    <div className="mb-4">
      {/* Compact location bar */}
      <div className="flex items-center gap-2 bg-accent/50 rounded-xl px-3 py-2 mb-2 border border-border/50">
        <img src={locationPinImg} alt="Lokasi" className="h-6 w-6 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-primary leading-tight">Lokasi Anda</p>
          {shortAddress ? (
            <p className="text-xs text-foreground/70 truncate">{shortAddress}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Deteksi lokasi untuk info pengiriman</p>
          )}
        </div>
        <button
          onClick={detectLocation}
          disabled={isLoading}
          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors shrink-0 bg-primary/10 rounded-full px-2.5 py-1"
        >
          {isLoading ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <MapPin className="h-3 w-3" />
          )}
          {locationAddress ? 'Perbarui' : 'Deteksi'}
        </button>
      </div>

      {/* Compact shipping badges */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 bg-card rounded-lg px-3 py-1.5 border border-border/40 shrink-0">
          <Truck className="h-3.5 w-3.5 text-green-600" />
          <span className="text-[11px] font-medium text-foreground/80">1-3 Hari</span>
        </div>
        <div className="flex items-center gap-1.5 bg-card rounded-lg px-3 py-1.5 border border-border/40 shrink-0">
          <Zap className="h-3.5 w-3.5 text-purple-600" />
          <span className="text-[11px] font-medium text-foreground/80">Gratis Ongkir Min. {freeShippingMin}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-card rounded-lg px-3 py-1.5 border border-border/40 shrink-0">
          <Shield className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-[11px] font-medium text-foreground/80">COD</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedShippingInfo;
