import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WhatsAppFloatingButtonProps {
  className?: string;
}

const WhatsAppFloatingButton = ({ className }: WhatsAppFloatingButtonProps) => {
  const { data: settings } = useSettings();
  
  // Extract phone number from settings
  const phoneNumber = typeof settings?.store_phone === 'object' 
    ? settings?.store_phone?.phone 
    : settings?.store_phone;

  // Format phone number for WhatsApp (remove spaces, dashes, and ensure country code)
  const formatPhoneForWhatsApp = (phone: string | undefined): string => {
    if (!phone) return '';
    
    // Remove all non-numeric characters except +
    let formatted = phone.replace(/[^\d+]/g, '');
    
    // If starts with 0, replace with 62 (Indonesia country code)
    if (formatted.startsWith('0')) {
      formatted = '62' + formatted.slice(1);
    }
    
    // Remove + if present
    formatted = formatted.replace('+', '');
    
    return formatted;
  };

  const formattedPhone = formatPhoneForWhatsApp(phoneNumber);

  // Don't render if no phone number is set
  if (!formattedPhone) {
    return null;
  }

  const handleClick = () => {
    const message = encodeURIComponent('Halo, saya ingin bertanya tentang produk di toko Anda.');
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  return (
    <Button
      onClick={handleClick}
      className={cn(
        "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40",
        "bg-[#25D366] hover:bg-[#128C7E] text-white",
        "flex items-center justify-center",
        "transition-all duration-300 hover:scale-110",
        className
      )}
      size="icon"
      aria-label="Chat via WhatsApp"
    >
      <MessageCircle className="h-7 w-7 fill-current" />
    </Button>
  );
};

export default WhatsAppFloatingButton;
