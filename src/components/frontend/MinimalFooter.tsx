
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const MinimalFooter = () => {
  const { data: settings } = useSettings();

  const storeInfo = settings?.store_info || {};
  const socialMedia = settings?.social_media || {};
  const storeName = settings?.store_name?.name || 'LAPAU.ID';

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1a1a1a] text-white mt-16">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Social Media Icons */}
        <div className="flex justify-center items-center gap-8 mb-8">
          {socialMedia.facebook && (
            <a 
              href={socialMedia.facebook} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-gray-400 transition-colors"
            >
              <Facebook className="h-6 w-6" fill="currentColor" />
            </a>
          )}
          {socialMedia.twitter && (
            <a 
              href={socialMedia.twitter} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-gray-400 transition-colors"
            >
              <Twitter className="h-6 w-6" fill="currentColor" />
            </a>
          )}
          {socialMedia.instagram && (
            <a 
              href={socialMedia.instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-gray-400 transition-colors"
            >
              <Instagram className="h-6 w-6" />
            </a>
          )}
          {socialMedia.youtube && (
            <a 
              href={socialMedia.youtube} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-gray-400 transition-colors"
            >
              <Youtube className="h-6 w-6" fill="currentColor" />
            </a>
          )}
          {/* Default icons if no social media configured */}
          {!socialMedia.facebook && !socialMedia.twitter && !socialMedia.instagram && !socialMedia.youtube && (
            <>
              <a href="#" className="text-white hover:text-gray-400 transition-colors">
                <Facebook className="h-6 w-6" fill="currentColor" />
              </a>
              <a href="#" className="text-white hover:text-gray-400 transition-colors">
                <Twitter className="h-6 w-6" fill="currentColor" />
              </a>
              <a href="#" className="text-white hover:text-gray-400 transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-white hover:text-gray-400 transition-colors">
                <Youtube className="h-6 w-6" fill="currentColor" />
              </a>
            </>
          )}
        </div>

        {/* Description Text */}
        <p className="text-center text-gray-400 text-sm leading-relaxed mb-10 max-w-2xl mx-auto">
          {typeof storeInfo.description === 'string' && storeInfo.description
            ? storeInfo.description
            : `${storeName} berkomitmen untuk menyediakan produk berkualitas dengan harga terbaik. Kami telah melayani pelanggan sejak ${currentYear} dan terus berkembang menjadi salah satu toko online terpercaya. Seluruh konten di situs ini dilindungi hak cipta dan merupakan milik ${storeName}.`}
        </p>

        {/* Stylized Store Name Logo */}
        <div className="flex justify-center mb-8">
          <h2 
            className="text-5xl md:text-6xl font-bold tracking-tight"
            style={{
              fontFamily: "'Brush Script MT', 'Segoe Script', 'Bradley Hand', cursive",
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {storeName}
          </h2>
        </div>

        {/* Location/Country */}
        <p className="text-center text-gray-500 text-sm">
          Indonesia | Rp
        </p>
      </div>

      {/* Bottom copyright bar - optional thin line */}
      <div className="border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <p className="text-center text-gray-600 text-xs">
            &copy; {currentYear} {storeName}. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default MinimalFooter;
