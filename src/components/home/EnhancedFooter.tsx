
import React from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from 'lucide-react';

const EnhancedFooter = () => {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Toko Kami</h3>
            <p className="text-gray-300 mb-4">
              Toko online terpercaya dengan produk berkualitas dan pelayanan terbaik untuk Anda.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Hubungi Kami</h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <MapPin className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="text-sm">Jl. Contoh No. 123, Jakarta</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Phone className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="text-sm">+62 812-3456-7890</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Mail className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="text-sm">info@toko-kami.com</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Clock className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="text-sm">Senin - Minggu: 08:00 - 22:00</span>
              </div>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Layanan Pelanggan</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Cara Berbelanja</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Metode Pembayaran</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Pengiriman</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Pengembalian & Tukar</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">FAQ</a></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Tentang Kami</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Profil Perusahaan</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Karir</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Kemitraan</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Syarat & Ketentuan</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Kebijakan Privasi</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 Toko Kami. Semua hak dilindungi undang-undang.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default EnhancedFooter;
