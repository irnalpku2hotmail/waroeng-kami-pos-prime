
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface HomeFooterProps {
  storeInfo?: StoreInfo;
}

const HomeFooter = ({ storeInfo }: HomeFooterProps) => {
  const defaultStoreInfo = {
    name: 'Waroeng Kami',
    address: 'Jl. Contoh No. 123, Jakarta',
    phone: '+62 812-3456-7890',
    email: 'info@waroengkami.com'
  };

  // Helper function to safely extract string values from potentially object values
  const extractStringValue = (value: any, defaultValue: string): string => {
    if (!value) return defaultValue;
    
    if (typeof value === 'object' && value !== null) {
      // Check if it has common properties like name, email, address, phone
      if ('name' in value && typeof value.name === 'string') {
        return value.name;
      }
      if ('email' in value && typeof value.email === 'string') {
        return value.email;
      }
      if ('address' in value && typeof value.address === 'string') {
        return value.address;
      }
      if ('phone' in value && typeof value.phone === 'string') {
        return value.phone;
      }
      // If it's an object but doesn't have expected properties, return default
      return defaultValue;
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    // Convert any other type to string safely
    return String(value) || defaultValue;
  };

  const store = storeInfo ? {
    name: extractStringValue(storeInfo.name, defaultStoreInfo.name),
    address: extractStringValue(storeInfo.address, defaultStoreInfo.address),
    phone: extractStringValue(storeInfo.phone, defaultStoreInfo.phone),
    email: extractStringValue(storeInfo.email, defaultStoreInfo.email)
  } : defaultStoreInfo;

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">{store.name}</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">{store.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{store.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{store.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">Buka 24 Jam</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Menu Cepat</h3>
            <div className="space-y-2">
              <Link to="/" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Beranda
              </Link>
              <Link to="/products" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Produk
              </Link>
              <Link to="/categories" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Kategori
              </Link>
              <Link to="/about" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Tentang Kami
              </Link>
            </div>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Layanan</h3>
            <div className="space-y-2">
              <Link to="/help" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Bantuan
              </Link>
              <Link to="/contact" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Hubungi Kami
              </Link>
              <Link to="/faq" className="block text-gray-300 hover:text-white text-sm transition-colors">
                FAQ
              </Link>
              <Link to="/terms" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Syarat & Ketentuan
              </Link>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Ikuti Kami</h3>
            <div className="space-y-2">
              <a href="#" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Facebook
              </a>
              <a href="#" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Instagram
              </a>
              <a href="#" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Twitter
              </a>
              <a href="#" className="block text-gray-300 hover:text-white text-sm transition-colors">
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 {store.name}. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
