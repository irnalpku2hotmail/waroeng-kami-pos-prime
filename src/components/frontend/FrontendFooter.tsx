
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter, ArrowUp, Heart } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const FrontendFooter = () => {
  const { data: settings } = useSettings();

  const storeInfo = settings?.store_info || {};
  const contactInfo = settings?.contact_info || {};
  const socialMedia = settings?.social_media || {};

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
      </div>


      <div className="relative max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              {storeInfo.logo_url && (
                <img 
                  src={String(storeInfo.logo_url)} 
                  alt={String(storeInfo.name || 'Store')} 
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-500" 
                />
              )}
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {typeof storeInfo.name === 'string' ? storeInfo.name : 'Toko Online'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {typeof storeInfo.tagline === 'string' ? storeInfo.tagline : 'Toko Online Terpercaya'}
                </p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed text-justify">
              {typeof storeInfo.description === 'string' ? storeInfo.description : 'Toko online terpercaya dengan produk berkualitas dan pelayanan terbaik untuk kebutuhan Anda. Kami berkomitmen memberikan pengalaman belanja yang mudah, aman, dan menyenangkan.'}
            </p>
            
            {/* Social Media */}
            <div className="flex space-x-4">
              {socialMedia.facebook && (
                <a 
                  href={socialMedia.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group bg-gray-800 hover:bg-blue-600 p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                >
                  <Facebook className="h-5 w-5 group-hover:text-white" />
                </a>
              )}
              {socialMedia.instagram && (
                <a 
                  href={socialMedia.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group bg-gray-800 hover:bg-pink-600 p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                >
                  <Instagram className="h-5 w-5 group-hover:text-white" />
                </a>
              )}
              {socialMedia.twitter && (
                <a 
                  href={socialMedia.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group bg-gray-800 hover:bg-blue-400 p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                >
                  <Twitter className="h-5 w-5 group-hover:text-white" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-blue-400">Tautan Cepat</h3>
            <ul className="space-y-3">
              {[
                { label: 'Beranda', href: '#home' },
                { label: 'Produk', href: '#products' },
                { label: 'Kategori', href: '#categories' },
                { label: 'Flash Sale', href: '#flash-sale' },
                { label: 'Tentang Kami', href: '#about' },
                { label: 'Kontak', href: '#contact' }
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-blue-400">Hubungi Kami</h3>
            <div className="space-y-4">
              {typeof contactInfo.address === 'string' && contactInfo.address && (
                <div className="flex items-start gap-3 group">
                  <div className="bg-gray-800 p-2 rounded-lg group-hover:bg-blue-600 transition-colors">
                    <MapPin className="h-4 w-4 text-blue-400 group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {contactInfo.address}
                    </p>
                  </div>
                </div>
              )}
              
              {typeof contactInfo.phone === 'string' && contactInfo.phone && (
                <div className="flex items-center gap-3 group">
                  <div className="bg-gray-800 p-2 rounded-lg group-hover:bg-green-600 transition-colors">
                    <Phone className="h-4 w-4 text-green-400 group-hover:text-white" />
                  </div>
                  <a 
                    href={`tel:${contactInfo.phone}`}
                    className="text-gray-300 text-sm hover:text-green-400 transition-colors"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              )}
              
              {typeof contactInfo.email === 'string' && contactInfo.email && (
                <div className="flex items-center gap-3 group">
                  <div className="bg-gray-800 p-2 rounded-lg group-hover:bg-purple-600 transition-colors">
                    <Mail className="h-4 w-4 text-purple-400 group-hover:text-white" />
                  </div>
                  <a 
                    href={`mailto:${contactInfo.email}`}
                    className="text-gray-300 text-sm hover:text-purple-400 transition-colors"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              )}
              
              {typeof contactInfo.operating_hours === 'string' && contactInfo.operating_hours && (
                <div className="flex items-start gap-3 group">
                  <div className="bg-gray-800 p-2 rounded-lg group-hover:bg-orange-600 transition-colors">
                    <Clock className="h-4 w-4 text-orange-400 group-hover:text-white mt-0.5" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {contactInfo.operating_hours}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-12 bg-gray-700" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} {typeof storeInfo.name === 'string' ? storeInfo.name : 'Toko Online'}. Semua hak dilindungi.
            </p>
            <p className="text-gray-500 text-xs mt-1 flex items-center justify-center md:justify-start">
              Dibuat dengan <Heart className="h-3 w-3 mx-1 text-red-500" /> untuk memberikan pengalaman belanja terbaik
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <a href="#privacy" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
              Kebijakan Privasi
            </a>
            <a href="#terms" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
              Syarat & Ketentuan
            </a>
            <Button
              onClick={scrollToTop}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-400 hover:bg-blue-600 hover:text-white hover:border-blue-600"
            >
              <ArrowUp className="h-4 w-4 mr-1" />
              Ke Atas
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FrontendFooter;
