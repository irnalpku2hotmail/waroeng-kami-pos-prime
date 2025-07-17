
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { Store, Phone, Mail, MapPin } from 'lucide-react';

const StoreInfo = () => {
  const { data: settings } = useStoreSettings();

  if (!settings) return null;

  return (
    <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600">
      {settings.store_name?.name && (
        <div className="flex items-center space-x-1">
          <Store className="h-4 w-4" />
          <span>{settings.store_name.name}</span>
        </div>
      )}
      {settings.store_phone?.phone && (
        <div className="flex items-center space-x-1">
          <Phone className="h-4 w-4" />
          <span>{settings.store_phone.phone}</span>
        </div>
      )}
      {settings.store_email?.email && (
        <div className="flex items-center space-x-1">
          <Mail className="h-4 w-4" />
          <span>{settings.store_email.email}</span>
        </div>
      )}
    </div>
  );
};

export default StoreInfo;
